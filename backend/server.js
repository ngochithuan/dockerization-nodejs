require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const { connectDB } = require("./src/config/db");
const { connectMQ } = require("./src/config/mq");

const PORT = process.env.PORT || 8080;
// Khi bị dừng (scale xuống, rolling update), vẫn phục vụ thêm một lúc để Nginx kịp
// hỏi lại DNS (resolver valid=5s) và ngừng gửi request mới tới bản sao này -> không lỗi 502
const SHUTDOWN_DELAY_MS = Number(process.env.SHUTDOWN_DELAY_MS ?? 6000);

connectDB()
  .then(() => {
    // Không await: RabbitMQ chưa sẵn sàng thì API vẫn chạy, mq.js tự kết nối lại
    connectMQ();

    const server = app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/api`));

    // `docker stop` gửi SIGTERM: chờ SHUTDOWN_DELAY_MS, rồi đóng HTTP server và kết nối DB
    let stopping = false;
    const shutdown = (signal) => {
      if (stopping) return;
      stopping = true;
      console.log(`${signal} received, draining for ${SHUTDOWN_DELAY_MS}ms before shutdown...`);
      setTimeout(() => {
        // Ngừng nhận kết nối nhưng chưa thoát: Docker Compose chỉ xóa container khỏi DNS khi nó thoát hẳn,
        // trong lúc đó Nginx nhận "connection refused" ngay và gửi lại cho bản sao khác
        // (thay vì chờ timeout tới IP đã mất rồi trả 502)
        server.close();
        setTimeout(async () => {
          await mongoose.disconnect().catch(() => {});
          process.exit(0);
        }, SHUTDOWN_DELAY_MS);
      }, SHUTDOWN_DELAY_MS);
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
