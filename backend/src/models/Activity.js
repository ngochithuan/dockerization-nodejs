const mongoose = require("mongoose");

// Nhật ký do service worker ghi sau khi xử lý xong một sự kiện từ RabbitMQ.
// Backend chỉ đọc collection này để hiển thị; worker là bên duy nhất ghi.
const activitySchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // drink.created | drink.updated | drink.deleted
    drink_id: String,
    drink_name: String,
    message: String,
    published_by: String, // hostname container backend đã gửi sự kiện
    published_at: Date,
    processed_by: String, // hostname container worker đã xử lý
    processed_at: Date,
  },
  { versionKey: false, collection: "activities" }
);

module.exports = mongoose.model("Activity", activitySchema);
