// ============================================================
// Futbolpedia — In-Memory Cache Layer
// ============================================================
// Caches API responses for a configurable TTL (default 10 min).
// If the live API fails, stale cache entries can still be served.
// ============================================================

class Cache {
  /**
   * @param {number} ttl  Time-to-live in milliseconds (default 600 000 = 10 min)
   */
  constructor(ttl = 10 * 60 * 1000) {
    this.store = new Map();
    this.ttl = ttl;
  }

  /**
   * Retrieve a cached value if it exists and has not expired.
   * @param {string} key
   * @returns {*|null}
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      // Expired — don't delete so getStale() can still use it
      return null;
    }
    return entry.data;
  }

  /**
   * Store a value in the cache.
   * @param {string} key
   * @param {*} data
   */
  set(key, data) {
    this.store.set(key, {
      data,
      expiry: Date.now() + this.ttl,
      storedAt: Date.now(),
    });
  }

  /**
   * Return the cached value even if it has expired.
   * Useful as a fallback when the upstream API is down.
   * @param {string} key
   * @returns {*|null}
   */
  getStale(key) {
    const entry = this.store.get(key);
    return entry ? entry.data : null;
  }

  /**
   * Delete a single key.
   */
  delete(key) {
    this.store.delete(key);
  }

  /**
   * Flush all entries.
   */
  clear() {
    this.store.clear();
  }

  /**
   * Number of entries currently stored (including expired).
   */
  get size() {
    return this.store.size;
  }

  /**
   * Purge all entries whose TTL has passed.
   * Call periodically if memory is a concern.
   */
  prune() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiry) this.store.delete(key);
    }
  }
}

// Export a singleton — every module shares the same cache instance
module.exports = new Cache();
