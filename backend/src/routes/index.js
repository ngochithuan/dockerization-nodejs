const os = require("os");
const express = require("express");
const mongoose = require("mongoose");
const drinkRoutes = require("./drinkRoutes");

const router = express.Router();

// GET /api/health — dùng cho Docker healthcheck và kiểm tra container nào đang phục vụ
router.get("/health", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "ok" : "degraded",
    database: dbConnected ? "connected" : "disconnected",
    hostname: os.hostname(),
    uptime: Math.round(process.uptime()),
  });
});

router.use("/drinks", drinkRoutes);

module.exports = router;
