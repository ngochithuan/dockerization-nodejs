import { ZodError } from 'zod';
import mongoose from 'mongoose';
import AppError from '../lib/AppError.js';

export function notFound(req, _res, next) {
  next(AppError.notFound(`Không tìm thấy đường dẫn ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
}

function normalise(err) {
  if (err instanceof AppError) return err;
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return AppError.badRequest('Dữ liệu không hợp lệ', details, 'VALIDATION_ERROR');
  }
  if (err instanceof mongoose.Error.CastError) {
    return AppError.badRequest('Định danh không hợp lệ', undefined, 'INVALID_ID');
  }
  if (err?.code === 11000) {
    return AppError.conflict('Dữ liệu đã tồn tại', 'DUPLICATE', err.keyValue);
  }
  if (err?.type === 'entity.parse.failed') {
    return AppError.badRequest('JSON không hợp lệ', undefined, 'INVALID_JSON');
  }
  if (err?.type === 'entity.too.large') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Dữ liệu gửi lên quá lớn');
  }
  return null;
}

export function errorHandler(err, req, res, _next) {
  const known = normalise(err);
  if (!known) console.error('[api] unhandled error', err);
  const e = known || new AppError(500, 'INTERNAL_ERROR', 'Đã có lỗi xảy ra, vui lòng thử lại sau');
  res.status(e.status).json({ error: { code: e.code, message: e.message, details: e.details ?? null } });
}
