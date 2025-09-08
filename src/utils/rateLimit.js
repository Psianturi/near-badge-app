// src/utils/rateLimit.js

/**
 * Wrapper to Rate Limit a function call.
 * This is a client-side safeguard to prevent sending too many requests in a short burst.
 *
 * @param {Function} fn The asynchronous function to rate limit.
 * @param {number} maxPerMinute The maximum number of calls allowed per minute.
 * @returns {Function} A new function that will enforce the rate limit.
 */
export function makeRateLimited(fn, maxPerMinute = 800) {
  // Array to store timestamps of recent calls
  const callTimestamps = [];

  return async (...args) => {
    const now = Date.now();
    
    // Remove timestamps older than one minute (60,000 milliseconds)
    while (callTimestamps.length > 0 && now - callTimestamps[0] > 60000) {
      callTimestamps.shift();
    }
    
    // Check if the number of calls in the last minute exceeds the limit
    if (callTimestamps.length >= maxPerMinute) {
      console.warn(`Rate limit of ${maxPerMinute}/min exceeded; skipping call.`);
      // Optionally, you can throw an error to give user feedback
      // throw new Error("Too many requests. Please try again in a moment.");
      return null;
    }

    // Add the current timestamp and execute the function
    callTimestamps.push(now);
    return fn(...args);
  };
}


const cache = new Map();

/**
 * Wrapper to cache the result of an async function.
 * @param {Function} fn The async function to cache.
 * @returns {Function} A new function that will use a cache.
 */
export function makeCached(fn) {
  return async (selector, contractId, method, args = {}, durationInSeconds = 60) => {
    const cacheKey = `${contractId}-${method}-${JSON.stringify(args)}`;
    const now = Date.now();
    
    if (cache.has(cacheKey)) {
      const cachedItem = cache.get(cacheKey);
      if (now < cachedItem.expiry) {
        console.log(`[CACHE HIT] Menggunakan data cache untuk: ${method}`);
        return cachedItem.data;
      }
    }

    console.log(`[CACHE MISS] Memanggil RPC untuk: ${method}`);
    const result = await fn(selector, contractId, method, args);
    

    if (result !== null) { 
      cache.set(cacheKey, {
        data: result,
        expiry: now + durationInSeconds * 1000,
      });
    }

    return result;
  };
}