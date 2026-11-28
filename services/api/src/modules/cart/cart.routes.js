import { Router } from 'express';
import { z } from 'zod';
import validate from '../../middlewares/validate.js';
import { objectId } from '../../lib/schemas.js';
import * as cart from './cart.service.js';

const router = Router();

const itemBody = z.object({
  productId: objectId,
  variantId: objectId,
  qty: z.coerce.number().int().min(1, 'Số lượng tối thiểu là 1').max(99, 'Số lượng tối đa là 99'),
});

router.get('/', async (req, res) => {
  res.json(await cart.getCart(req));
});

router.post('/items', validate({ body: itemBody }), async (req, res) => {
  res.status(201).json(await cart.addItem(req, res, req.valid.body));
});

router.patch('/items', validate({ body: itemBody }), async (req, res) => {
  res.json(await cart.setItemQty(req, req.valid.body));
});

router.delete(
  '/items/:productId/:variantId',
  validate({ params: z.object({ productId: objectId, variantId: objectId }) }),
  async (req, res) => {
    res.json(await cart.removeItem(req, req.valid.params));
  },
);

export default router;
