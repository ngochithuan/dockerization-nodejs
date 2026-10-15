const os = require("os");
const amqp = require("amqplib");

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const QUEUE = "drink_events";
const RETRY_DELAY_MS = 3000;

let channel = null;

// Kết nối RabbitMQ; nếu chưa sẵn sàng thì thử lại, không làm sập backend
async function connectMQ() {
  for (;;) {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });
      console.log(`RabbitMQ connected, queue "${QUEUE}" ready`);

      // Mất kết nối (RabbitMQ restart...) -> tự kết nối lại
      connection.on("close", () => {
        console.warn("RabbitMQ connection closed, reconnecting...");
        channel = null;
        setTimeout(connectMQ, RETRY_DELAY_MS);
      });
      connection.on("error", (err) => console.error("RabbitMQ error:", err.message));
      return;
    } catch (err) {
      console.warn(`RabbitMQ not ready (${err.message}), retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

// Gửi 1 sự kiện vào queue. Lỗi MQ không được làm hỏng request chính.
function publish(type, data) {
  if (!channel) {
    console.warn(`RabbitMQ unavailable, event "${type}" not published`);
    return false;
  }
  const message = { type, data, publishedAt: new Date().toISOString(), publishedBy: os.hostname() };
  return channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(message)), {
    persistent: true, // tin nhắn được lưu xuống đĩa
    contentType: "application/json",
  });
}

module.exports = { connectMQ, publish, QUEUE };
