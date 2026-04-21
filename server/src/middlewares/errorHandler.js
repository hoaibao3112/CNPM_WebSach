/**
 * Global Error Handler Middleware
 * Đặt cuối cùng trong middleware chain: app.use(errorHandler);
 */
import logger from '../utils/logger.js';

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  // Always set CORS headers on error responses so browser sees the real error
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Auth-Key,X-Requested-With,Accept,Origin');
  }

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

  // Show details for debugging production 500 errors
  if (process.env.NODE_ENV === 'development' || true) { // TEMPORARY: force details for debugging
    response.details = err.details || null;
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
