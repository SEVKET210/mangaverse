import { LRUCache } from 'lru-cache';

/**
 * Enterprise-grade in-memory cache implementation
 * Prevents redundant database or heavy logic computations
 */
const options = {
  max: 500, // Maximum number of items in cache
  ttl: 1000 * 60 * 5, // 5 minutes time to live
  allowStale: false,
  updateAgeOnGet: true,
  updateAgeOnHas: false
};

const cache = new LRUCache(options);

export const CacheService = {
  get: (key) => cache.get(key),
  set: (key, value, customTtl) => {
    if (customTtl) {
      cache.set(key, value, { ttl: customTtl });
    } else {
      cache.set(key, value);
    }
  },
  del: (key) => cache.delete(key),
  clear: () => cache.clear()
};
