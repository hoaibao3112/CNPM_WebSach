/**
 * Global Error Handler Middleware
 * Đặt cuối cùng trong middleware chain: app.use(errorHandler);
 */
import logger from '../utils/logger.js';

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  // Log error
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
      stack: err.stack,
      body: req.body
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${err.message}`);
  }

  // Response
  const response = {
    success: false,
    status,
    message: err.message || 'Lỗi server nội bộ'
  };

  // Chỉ show details & stack khi development
  if (process.env.NODE_ENV === 'development') {
    response.details = err.details || null;
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
