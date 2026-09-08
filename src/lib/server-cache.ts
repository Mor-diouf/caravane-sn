type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get a cached value by key, returning null if expired or missing.
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Store a value in the in-memory cache with a Time-To-Live (in ms).
 */
export function setCached<T>(key: string, data: T, ttlMs: number): T {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
  return data;
}

/**
 * Invalidate all cache entries matching a prefix or exact key.
 */
export function invalidateCache(keyPrefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key);
    }
  }
}
