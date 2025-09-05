// src/utils/rateLimit.js

/**
 * Wrapper to rate Limit
 *
 * @param {Function} fn 
 * @param {number} maxPerMinute 
 * @returns {Function} 
 */
export function makeRateLimited(fn, maxPerMinute = 600) {
  let count = 0;
  setInterval(() => { count = 0 }, 60 * 1000);

  return async (...args) => {
    if (count >= maxPerMinute) {
      console.warn('Rate limit exceeded; skipping call');
      return null;
    }
    count++;
    return fn(...args);
  };
}
