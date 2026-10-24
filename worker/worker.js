// Notification worker: service tách riêng khỏi backend, giao tiếp với backend
// hoàn toàn qua RabbitMQ (bất đồng bộ).
//
//   backend --(publish drink.*)--> [queue drink_events] --(consume)--> worker --> MongoDB (activities)
//
// Backend không chờ worker: API trả kết quả ngay, worker xử lý sau.
// Worker tắt thì tin nhắn nằm chờ trong queue; worker bật lại sẽ xử lý tiếp, không mất sự kiện.
// Chạy nhiều bản sao worker thì RabbitMQ chia tin cho từng bản (competing consumers).
require("dotenv").config();
const os = require("os");
const amqp = require("amqplib");
const mongoose = require("mongoose");

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/drink_db";
const QUEUE = "drink_events";
// Giả lập công việc tốn thời gian (gửi thông báo cho nhân viên quầy, email...)
const PROCESS_DELAY_MS = Number(process.env.PROCESS_DELAY_MS ?? 2000);
const RETRY_DELAY_MS = 3000;
const HOST = os.hostname();

const Activity = mongoose.model(
  "Activity",
  new mongoose.Schema(
    {
      type: { type: String, required: true },
      drink_id: String,
      drink_name: String,
      message: String,
      published_by: String,
      published_at: Date,
      processed_by: String,
      processed_at: Date,
    },
    { versionKey: false, collection: "activities" }
  )
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const price = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

function describe(event) {
  const d = event.data || {};
  switch (event.type) {
    case "drink.created":
      return `Báo quầy pha chế: món mới "${d.name}" (${d.category}, ${price.format(d.price)})`;
    case "drink.updated":
      return `Báo quầy pha chế: cập nhật "${d.name}" (${d.status === "Còn" ? "còn hàng" : "tạm hết"}, ${price.format(d.price)})`;
    case "drink.deleted":
      return `Báo quầy pha chế: ngừng bán "${d.name}"`;
    default:
      return `Sự kiện không xác định: ${event.type}`;
  }
}

async function connectWithRetry(name, connect) {
  for (;;) {
    try {
      return await connect();
    } catch (err) {
      console.warn(`[${HOST}] ${name} not ready (${err.message}), retrying in ${RETRY_DELAY_MS}ms...`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

async function main() {
  await connectWithRetry("MongoDB", () => mongoose.connect(MONGO_URI));
  console.log(`[${HOST}] MongoDB connected`);

  const connection = await connectWithRetry("RabbitMQ", () => amqp.connect(RABBITMQ_URL));
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });
  // Mỗi worker chỉ nhận 1 tin chưa xử lý xong tại một thời điểm -> tin được chia đều giữa các worker
  await channel.prefetch(1);
  console.log(`[${HOST}] Waiting for messages on queue "${QUEUE}"`);

  // Mất kết nối RabbitMQ: thoát để Docker khởi động lại container (restart policy)
  connection.on("close", () => {
    console.error(`[${HOST}] RabbitMQ connection closed, exiting`);
    process.exit(1);
  });

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    let event;
    try {
      event = JSON.parse(msg.content.toString());
    } catch {
      console.error(`[${HOST}] Invalid message, dropped`);
      channel.nack(msg, false, false);
      return;
    }

    console.log(`[${HOST}] Received ${event.type} "${event.data?.name}" from backend ${event.publishedBy}`);
    try {
      await sleep(PROCESS_DELAY_MS);
      await Activity.create({
        type: event.type,
        drink_id: event.data?.id,
        drink_name: event.data?.name,
        message: describe(event),
        published_by: event.publishedBy,
        published_at: event.publishedAt,
        processed_by: HOST,
        processed_at: new Date(),
      });
      // Chỉ xác nhận (ack) sau khi xử lý xong: worker chết giữa chừng thì RabbitMQ giao tin cho worker khác
      channel.ack(msg);
      console.log(`[${HOST}] Done ${event.type} "${event.data?.name}"`);
    } catch (err) {
      console.error(`[${HOST}] Failed to process ${event.type}: ${err.message}, requeue`);
      await sleep(RETRY_DELAY_MS);
      channel.nack(msg, false, true);
    }
  });

  // `docker stop` gửi SIGTERM: đóng kết nối, tin chưa ack sẽ được trả lại queue
  const shutdown = async (signal) => {
    console.log(`[${HOST}] ${signal} received, shutting down...`);
    connection.removeAllListeners("close");
    await connection.close().catch(() => {});
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error(`[${HOST}] Worker crashed:`, err);
  process.exit(1);
});
