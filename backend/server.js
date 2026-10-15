require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const { connectDB } = require("./src/config/db");
const { connectMQ } = require("./src/config/mq");

const PORT = process.env.PORT || 8080;

connectDB()
  .then(() => {
    // Không await: RabbitMQ chưa sẵn sàng thì API vẫn chạy, mq.js tự kết nối lại
    connectMQ();

    const server = app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/api`));

    // `docker stop` gửi SIGTERM: đóng HTTP server và kết nối DB trước khi thoát
    const shutdown = (signal) => {
      console.log(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
