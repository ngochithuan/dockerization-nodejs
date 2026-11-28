import { Router } from 'express';
import { instance } from '../../middlewares/servedBy.js';
import { mongoReady } from '../../config/db.js';
import { redisReady } from '../../config/redis.js';
import { brokerReady } from '../../lib/broker.js';

const router = Router();

router.get('/', async (_req, res) => {
  const checks = { mongo: mongoReady(), redis: await redisReady(), rabbitmq: brokerReady() };
  const ok = Object.values(checks).every(Boolean);
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', instance, checks });
});

export default router;
