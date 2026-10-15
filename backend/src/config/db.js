const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/drink_db";
const MAX_RETRIES = Number(process.env.MONGO_MAX_RETRIES) || 10;
const RETRY_DELAY_MS = Number(process.env.MONGO_RETRY_DELAY_MS) || 3000;

// Ẩn mật khẩu khi in connection string ra log
function maskUri(uri) {
  return uri.replace(/\/\/([^:/@]+):([^@]+)@/, "//$1:****@");
}

// Trong Docker, container DB có thể chưa sẵn sàng ngay khi backend khởi động
// nên thử kết nối lại vài lần trước khi bỏ cuộc.
async function connectDB() {
  for (let attempt = 1; ; attempt++) {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
      return;
    } catch (err) {
      if (attempt >= MAX_RETRIES) throw err;
      console.warn(
        `MongoDB connection failed (${attempt}/${MAX_RETRIES}) to ${maskUri(MONGO_URI)}: ${err.message}. Retrying in ${RETRY_DELAY_MS}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

module.exports = { connectDB, MONGO_URI };
