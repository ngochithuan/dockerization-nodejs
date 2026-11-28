import crypto from 'node:crypto';
import { Router } from 'express';
import env, { googleEnabled } from '../../config/env.js';
import { setAuthCookie } from '../../middlewares/auth.js';
import { mergeGuestCart } from '../cart/cart.service.js';
import { loginWithGoogle } from './auth.service.js';

// Google OAuth 2.0 (authorization-code flow). Stateless: the anti-CSRF `state` lives in a
// short-lived httpOnly cookie, so any api replica can handle the callback.
const router = Router();
const STATE_COOKIE = 'g_state';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

const fail = (res, reason) => res.redirect(`/login?error=${reason}`);

router.get('/', (_req, res) => {
  if (!googleEnabled) return fail(res, 'google_disabled');
  const state = crypto.randomBytes(24).toString('base64url');
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/api/auth/google',
  });
  const params = new URLSearchParams({
    client_id: env.google.clientId,
    redirect_uri: env.google.callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  res.redirect(`${AUTH_URL}?${params}`);
});

router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const expected = req.cookies?.[STATE_COOKIE];
  res.clearCookie(STATE_COOKIE, { path: '/api/auth/google' });
  if (
    !googleEnabled ||
    typeof code !== 'string' ||
    typeof state !== 'string' ||
    !expected ||
    state !== expected
  ) {
    return fail(res, 'google_state');
  }
  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.google.clientId,
        client_secret: env.google.clientSecret,
        redirect_uri: env.google.callbackUrl,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return fail(res, 'google_token');
    const { access_token: accessToken } = await tokenRes.json();
    const infoRes = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!infoRes.ok) return fail(res, 'google_profile');
    const profile = await infoRes.json();
    if (!profile.email || profile.email_verified === false) return fail(res, 'google_email');

    const user = await loginWithGoogle(profile);
    setAuthCookie(res, user);
    await mergeGuestCart(req, res, user._id);
    res.redirect(user.role === 'admin' ? '/admin' : '/');
  } catch (err) {
    if (err.code === 'ACCOUNT_BANNED') return fail(res, 'banned');
    console.error('[api] google oauth error', err.message);
    fail(res, 'google_failed');
  }
});

export default router;
