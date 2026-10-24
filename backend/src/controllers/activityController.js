const Activity = require("../models/Activity");
const { queueStatus } = require("../config/mq");

// GET /api/activities?limit=20
// Trạng thái queue RabbitMQ + các sự kiện worker đã xử lý gần nhất
async function getActivities(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const [queue, items] = await Promise.all([
      queueStatus(),
      Activity.find().sort({ processed_at: -1 }).limit(limit),
    ]);
    res.json({ queue, items });
  } catch (err) {
    next(err);
  }
}

module.exports = { getActivities };
