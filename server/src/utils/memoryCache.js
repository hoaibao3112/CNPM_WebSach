const cache = new Map();

/**
 * Get cached item
 * @param {string} key 
 * @returns {any|null}
 */
export const get = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }
  return cached.value;
};

/**
 * Set item in cache
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlMs Time to live in milliseconds (default 2 minutes)
 */
export const set = (key, value, ttlMs = 120000) => {
  cache.set(key, {
    value,
    expiry: Date.now() + ttlMs
  });
};

/**
 * Delete key(s) matching a substring/pattern
 * @param {string} pattern 
 */
export const clearPattern = (pattern) => {
  console.log(`[Cache] Clearing cache keys matching pattern: ${pattern}`);
  let count = 0;
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      count++;
    }
  }
  if (count > 0) {
    console.log(`[Cache] Successfully cleared ${count} cache keys for pattern: ${pattern}`);
  }
};

/**
 * Clear all cached items
 */
export const clearAll = () => {
  console.log('[Cache] Clearing entire cache');
  cache.clear();
};
