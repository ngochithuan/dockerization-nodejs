import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import { parseVnDay } from '../../lib/util.js';
import productRoutes from './products.routes.js';
import userRoutes from './users.routes.js';
import orderRoutes from './orders.routes.js';
import discountRoutes from './discounts.routes.js';
import { advancedDashboard, simpleDashboard } from './dashboard.service.js';

// Admin API — role enforced server-side on every route.
const router = Router();
router.use(requireAdmin);

router.get('/dashboard', async (_req, res) => {
  res.json(await simpleDashboard());
});

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
router.get(
  '/analytics',
  validate({
    query: z
      .object({
        period: z.enum(['year', 'quarter', 'month', 'week', 'custom']).default('year'),
        from: day.optional(),
        to: day.optional(),
      })
      .refine((q) => q.period !== 'custom' || (q.from && q.to && q.from <= q.to), {
        message: 'Chọn ngày bắt đầu và kết thúc hợp lệ',
        path: ['from'],
      }),
  }),
  async (req, res) => {
    const { period, from, to } = req.valid.query;
    res.json(
      await advancedDashboard({
        period,
        from: from ? parseVnDay(from) : undefined,
        to: to ? parseVnDay(to) : undefined,
      }),
    );
  },
);

router.use(productRoutes);
router.use(userRoutes);
router.use(orderRoutes);
router.use(discountRoutes);

export default router;
