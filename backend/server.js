require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const { connectDB } = require("./src/config/db");
const { connectMQ } = require("./src/config/mq");

const PORT = process.env.PORT || 8080;

const SHUTDOWN_DELAY_MS = Number(process.env.SHUTDOWN_DELAY_MS ?? 6000);

connectDB()
  .then(() => {
    connectMQ();

    const server = app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/api`));

    let stopping = false;
    const shutdown = (signal) => {
      if (stopping) return;
      stopping = true;
      console.log(`${signal} received, draining for ${SHUTDOWN_DELAY_MS}ms before shutdown...`);
      setTimeout(() => {
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
