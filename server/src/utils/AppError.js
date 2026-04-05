/**
 * AppError - Custom Error class với HTTP status code
 * Sử dụng: throw new AppError('Sản phẩm không tồn tại', 404);
 */

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
