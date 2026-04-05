/**
 * Logger Utility - Thay thế console.log trong production
 * Sử dụng: import logger from '../utils/logger.js';
 *          logger.info('message');
 *          logger.error('message', error);
 */

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') return LOG_LEVELS.warn;
  return LOG_LEVELS.debug;
};

const timestamp = () => new Date().toISOString();

const formatMessage = (level, message, meta) => {
  const ts = timestamp();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

const logger = {
  error(message, meta) {
    if (currentLevel() >= LOG_LEVELS.error) {
      console.error(formatMessage('error', message, meta));
    }
  },

  warn(message, meta) {
    if (currentLevel() >= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message, meta));
    }
  },

  info(message, meta) {
    if (currentLevel() >= LOG_LEVELS.info) {
      console.log(formatMessage('info', message, meta));
    }
  },

  debug(message, meta) {
    if (currentLevel() >= LOG_LEVELS.debug) {
      console.log(formatMessage('debug', message, meta));
    }
  }
};

export default logger;
