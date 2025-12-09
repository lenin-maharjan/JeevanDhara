/**
 * Rate Limiting Middleware
 * Protects API from abuse and DDoS attacks
 */

const rateLimit = require('express-rate-limit');

// General API rate limit - 100 requests per 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
    }
});

// Stricter limit for auth endpoints - 10 per hour
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        error: 'Too many authentication attempts',
        message: 'Please try again in an hour',
        retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Emergency/sensitive endpoints - 5 per minute
const emergencyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: {
        error: 'Rate limit exceeded',
        message: 'Please wait before making another emergency request',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Blood request creation - 3 per hour per user
const bloodRequestLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        error: 'Request limit reached',
        message: 'You can only create 3 blood requests per hour',
        retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    authLimiter,
    emergencyLimiter,
    bloodRequestLimiter
};
