import * as memoryCache from '../utils/memoryCache.js';

/**
 * Cache middleware for GET requests
 * @param {number} ttlSeconds Cache expiration time in seconds (default 120 seconds)
 */
export const cacheMiddleware = (ttlSeconds = 120) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Build cache key based on URL and query params
    const key = req.originalUrl || req.url;
    const cachedResponse = memoryCache.get(key);

    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    // Capture the original res.json function to cache the body when it is sent
    const originalJson = res.json;
    res.json = function (body) {
      // Only cache successful JSON responses (status code 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300 && body !== null && body !== undefined) {
        memoryCache.set(key, body, ttlSeconds * 1000);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Middleware to clear cached products & promotions when mutations occur
 */
export const clearProductCache = (req, res, next) => {
  // Clear product and promotion cache keys
  memoryCache.clearPattern('/api/product');
  memoryCache.clearPattern('/api/khuyenmai');
  memoryCache.clearPattern('/api/author');
  memoryCache.clearPattern('/api/category');
  next();
};
