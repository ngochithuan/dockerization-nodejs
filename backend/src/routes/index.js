const express = require("express");
const drinkRoutes = require("./drinkRoutes");

const router = express.Router();

router.use("/drinks", drinkRoutes);

module.exports = router;
