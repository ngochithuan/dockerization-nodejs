import { Router } from 'express';
import { z } from 'zod';
import validate from '../../middlewares/validate.js';
import { clearAuthCookie, requireAuth, setAuthCookie } from '../../middlewares/auth.js';
import { forgotLimiter, loginLimiter, registerLimiter } from '../../middlewares/rateLimit.js';
import { address, email, fullName, password } from '../../lib/schemas.js';
import { googleEnabled } from '../../config/env.js';
import User from '../../models/User.js';
import { mergeGuestCart } from '../cart/cart.service.js';
import * as auth from './auth.service.js';

const router = Router();

router.get('/config', (_req, res) => res.json({ googleEnabled }));

router.get('/me', async (req, res) => {
  if (!req.auth) return res.json({ user: null });
  const user = await User.findById(req.auth.id);
  res.json({ user: user ? user.toProfile() : null });
});

// Registration: e-mail, full name and shipping address ONLY. No password —
// the user receives a "set your password" link by e-mail.
router.post(
  '/register',
  registerLimiter,
  validate({ body: z.object({ email, fullName, address }) }),
  async (req, res) => {
    await auth.register(req.valid.body);
    res.status(201).json({
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để đặt mật khẩu cho tài khoản.',
    });
  },
);

router.post(
  '/login',
  loginLimiter,
  validate({ body: z.object({ email, password: z.string().min(1, 'Vui lòng nhập mật khẩu').max(72) }) }),
  async (req, res) => {
    const user = await auth.login(req.valid.body);
    setAuthCookie(res, user);
    await mergeGuestCart(req, res, user._id);
    res.json({ user: user.toProfile() });
  },
);

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

router.post('/forgot-password', forgotLimiter, validate({ body: z.object({ email }) }), async (req, res) => {
  await auth.requestPasswordReset(req.valid.body.email);
  res.json({ message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.' });
});

const tokenSchema = z.string().min(20).max(200);

router.get('/reset-password/:token', validate({ params: z.object({ token: tokenSchema }) }), async (req, res) => {
  res.json(await auth.checkToken(req.valid.params.token));
});

router.post(
  '/reset-password',
  forgotLimiter,
  validate({ body: z.object({ token: tokenSchema, password }) }),
  async (req, res) => {
    const user = await auth.resetPassword(req.valid.body);
    setAuthCookie(res, user);
    await mergeGuestCart(req, res, user._id);
    res.json({ user: user.toProfile() });
  },
);

router.post(
  '/change-password',
  requireAuth,
  validate({
    body: z.object({ currentPassword: z.string().max(72).optional(), newPassword: password }),
  }),
  async (req, res) => {
    await auth.changePassword(req.auth.id, req.valid.body);
    res.json({ message: 'Đã cập nhật mật khẩu' });
  },
);

export default router;
