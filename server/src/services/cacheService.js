/**
 * In-Memory Cache Service
 * Simple caching for frequently accessed data
 */

const NodeCache = require('node-cache');

// TTL: 5 minutes, check period: 2 minutes
const cache = new NodeCache({
    stdTTL: 300,
    checkperiod: 120,
    useClones: false // Better performance, but be careful with mutations
});

const cacheService = {
    /**
     * Get cached value
     */
    get: (key) => cache.get(key),

    /**
     * Set cached value
     */
    set: (key, value, ttl) => cache.set(key, value, ttl),

    /**
     * Delete cached value
     */
    del: (key) => cache.del(key),

    /**
     * Delete multiple keys by pattern
     */
    delByPattern: (pattern) => {
        const keys = cache.keys().filter(k => k.includes(pattern));
        keys.forEach(k => cache.del(k));
        return keys.length;
    },

    /**
     * Flush all cache
     */
    flush: () => cache.flushAll(),

    /**
     * Get cache stats
     */
    stats: () => cache.getStats(),

    /**
     * Wrapper for caching async functions
     * @param {string} key - Cache key
     * @param {Function} fn - Async function to execute if cache miss
     * @param {number} ttl - Time to live in seconds (default: 300)
     */
    wrap: async (key, fn, ttl = 300) => {
        const cached = cache.get(key);
        if (cached !== undefined) {
            return cached;
        }

        const result = await fn();
        cache.set(key, result, ttl);
        return result;
    },

    /**
     * Cache keys for common queries
     */
    keys: {
        allDonors: 'donors:all',
        donorsByBloodGroup: (bg) => `donors:bloodGroup:${bg}`,
        bloodRequests: (status) => `requests:${status}`,
        hospitals: 'hospitals:all',
        bloodBanks: 'bloodBanks:all'
    }
};

module.exports = cacheService;
