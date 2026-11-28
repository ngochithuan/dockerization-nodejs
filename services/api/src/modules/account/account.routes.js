import { Router } from 'express';
import { z } from 'zod';
import validate from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { address, fullName, objectId } from '../../lib/schemas.js';
import User from '../../models/User.js';
import AppError from '../../lib/AppError.js';

// The logged-in customer's own profile and address book. Every query is scoped to
// req.auth.id, so users can never read or modify another user's data (IDOR-safe).
const router = Router();
router.use(requireAuth);

async function me(req) {
  const user = await User.findById(req.auth.id);
  if (!user) throw AppError.unauthorized();
  return user;
}

router.get('/', async (req, res) => {
  res.json({ user: (await me(req)).toProfile() });
});

router.patch('/', validate({ body: z.object({ fullName }) }), async (req, res) => {
  const user = await me(req);
  user.fullName = req.valid.body.fullName;
  await user.save();
  res.json({ user: user.toProfile() });
});

// ---- Addresses ----
const addressBody = address.extend({ isDefault: z.boolean().optional().default(false) });

function applyDefault(user, addr, makeDefault) {
  if (makeDefault || user.addresses.length === 1) {
    user.addresses.forEach((a) => {
      a.isDefault = a._id.equals(addr._id);
    });
  }
}

router.get('/addresses', async (req, res) => {
  res.json({ items: (await me(req)).addresses });
});

router.post('/addresses', validate({ body: addressBody }), async (req, res) => {
  const user = await me(req);
  if (user.addresses.length >= 10) throw AppError.badRequest('Tối đa 10 địa chỉ', undefined, 'ADDRESS_LIMIT');
  const { isDefault, ...data } = req.valid.body;
  user.addresses.push(data);
  const created = user.addresses[user.addresses.length - 1];
  applyDefault(user, created, isDefault);
  await user.save();
  res.status(201).json({ items: user.addresses });
});

router.put(
  '/addresses/:id',
  validate({ params: z.object({ id: objectId }), body: addressBody }),
  async (req, res) => {
    const user = await me(req);
    const addr = user.addresses.id(req.valid.params.id);
    if (!addr) throw AppError.notFound('Không tìm thấy địa chỉ');
    const { isDefault, ...data } = req.valid.body;
    addr.set(data);
    applyDefault(user, addr, isDefault);
    await user.save();
    res.json({ items: user.addresses });
  },
);

router.post('/addresses/:id/default', validate({ params: z.object({ id: objectId }) }), async (req, res) => {
  const user = await me(req);
  const addr = user.addresses.id(req.valid.params.id);
  if (!addr) throw AppError.notFound('Không tìm thấy địa chỉ');
  applyDefault(user, addr, true);
  await user.save();
  res.json({ items: user.addresses });
});

router.delete('/addresses/:id', validate({ params: z.object({ id: objectId }) }), async (req, res) => {
  const user = await me(req);
  const addr = user.addresses.id(req.valid.params.id);
  if (!addr) throw AppError.notFound('Không tìm thấy địa chỉ');
  const wasDefault = addr.isDefault;
  addr.deleteOne();
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save();
  res.json({ items: user.addresses });
});

export default router;
