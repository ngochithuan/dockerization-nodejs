import AppError from '../lib/AppError.js';

// Rejects any request whose body, query or params contain keys that could be interpreted
// as MongoDB operators (`$gt`, `$where`, ...) or dotted paths. Zod schemas validate shapes
// afterwards; this is a defence-in-depth layer against NoSQL injection.
function hasDangerousKey(value, depth = 0) {
  if (depth > 10 || value === null || typeof value !== 'object') return false;
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.')) return true;
    if (hasDangerousKey(value[key], depth + 1)) return true;
  }
  return false;
}

export default function sanitize(req, _res, next) {
  if (hasDangerousKey(req.body) || hasDangerousKey(req.query) || hasDangerousKey(req.params)) {
    return next(AppError.badRequest('Dữ liệu chứa ký tự không được phép', undefined, 'UNSAFE_INPUT'));
  }
  next();
}
