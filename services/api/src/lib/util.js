import crypto from 'node:crypto';

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function slugify(input) {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Random URL-safe token + its SHA-256 hash (only the hash is stored). */
export function createToken() {
  const token = crypto.randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export function paginate(page, limit, total) {
  return { page, pageSize: limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

// ---- Vietnam time helpers (UTC+7, no DST) ----
export const VN_TZ = 'Asia/Ho_Chi_Minh';
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Start of the Vietnam calendar day containing `date`, as a UTC Date. */
export function vnStartOfDay(date = new Date()) {
  const shifted = new Date(date.getTime() + VN_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - VN_OFFSET_MS);
}

/** Vietnam-local date parts of `date`. */
export function vnParts(date = new Date()) {
  const s = new Date(date.getTime() + VN_OFFSET_MS);
  return { y: s.getUTCFullYear(), m: s.getUTCMonth(), d: s.getUTCDate(), dow: s.getUTCDay() };
}

/** UTC Date for a Vietnam-local Y/M/D midnight. */
export function vnDate(y, m, d) {
  return new Date(Date.UTC(y, m, d) - VN_OFFSET_MS);
}

/** Parses 'YYYY-MM-DD' as a Vietnam-local midnight. */
export function parseVnDay(s) {
  const [y, m, d] = s.split('-').map(Number);
  return vnDate(y, m - 1, d);
}
