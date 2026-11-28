// Domain error carrying an HTTP status and a stable machine-readable code.
// Serialised by the error handler as `{ error: { code, message, details } }`.
export default class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details, code = 'BAD_REQUEST') {
    return new AppError(400, code, message, details);
  }

  static unauthorized(message = 'Bạn cần đăng nhập để tiếp tục', code = 'UNAUTHORIZED') {
    return new AppError(401, code, message);
  }

  static forbidden(message = 'Bạn không có quyền thực hiện thao tác này', code = 'FORBIDDEN') {
    return new AppError(403, code, message);
  }

  static notFound(message = 'Không tìm thấy tài nguyên', code = 'NOT_FOUND') {
    return new AppError(404, code, message);
  }

  static conflict(message, code = 'CONFLICT', details) {
    return new AppError(409, code, message, details);
  }
}
