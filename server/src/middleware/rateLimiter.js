import rateLimit from 'express-rate-limit';
import { AppError, ERROR_CODES } from '../utils/errors.js';

/**
 * Create a rate limiter with standardized error response
 */
const createLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
    max: options.max || 100,
    message: {
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMITED,
        message: options.message || 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    skip: (req, res) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
    handler: (req, res, next, options) => {
      throw new AppError(
        ERROR_CODES.RATE_LIMITED,
        options.message || 'Too many requests, please try again later',
        429
      );
    },
  });
};

// ============================================
// AUTH LIMITERS (Strict)
// ============================================

/** Login attempts: 5 per 15 minutes */
export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again in 15 minutes',
});

/** Registration attempts: 3 per 15 minutes */
export const registerLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many registration attempts, please try again in 15 minutes',
});

/** Password reset / sensitive auth: 2 per hour */
export const sensitiveAuthLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 2,
  message: 'Too many requests, please try again in an hour',
});

// ============================================
// API LIMITERS (Moderate)
// ============================================

/** General API: 100 per 15 minutes (existing global) */
export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests, please try again later',
});

/** Message sending: 30 per minute */
export const messageLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many messages sent, please slow down',
});

/** Location updates: 10 per minute */
export const locationLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many location updates, please wait',
});

/** Nearby user scans: 10 per minute */
export const scanLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many scans, please wait before scanning again',
});

/** Connection requests: 20 per minute */
export const connectionLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many connection requests, please slow down',
});

/** Profile updates: 10 per 5 minutes */
export const profileLimiter = createLimiter({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: 'Too many profile updates, please wait',
});

// ============================================
// SOCKET LIMITERS (Connection-based)
// ============================================

/** Per-socket event rate limiting */
// Shared across all socket events so cleanup can run safely
const userLimits = new Map(); // `${userId}:${eventName}` -> { count, resetTime }

export const socketEventLimiter = (eventName, maxPerMinute = 30) => {
  return (socket, next) => {
    const userId = socket.userId;
    const key = `${userId}:${eventName}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    if (!userLimits.has(key)) {
      userLimits.set(key, { count: 0, resetTime: now + windowMs });
    }

    const limit = userLimits.get(key);

    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + windowMs;
    }

    limit.count++;

    if (limit.count > maxPerMinute) {
      const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
      return next(new Error(`RATE_LIMITED:${eventName}:${retryAfter}`));
    }

    next();
  };
};

/** Cleanup old entries periodically */
setInterval(() => {
  const now = Date.now();
  for (const [userId, limit] of userLimits.entries()) {
    if (now > limit.resetTime + 60000) { // Keep 1 min extra
      userLimits.delete(userId);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

/** Batch location updates: 30 batches per minute (background sync) */
export const batchLocationLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many batch location updates, please wait',
});

// ============================================
// EXPORT ALL LIMITERS
// ============================================

export const limiters = {
  login: loginLimiter,
  register: registerLimiter,
  sensitiveAuth: sensitiveAuthLimiter,
  api: apiLimiter,
  message: messageLimiter,
  location: locationLimiter,
  scan: scanLimiter,
  connection: connectionLimiter,
  profile: profileLimiter,
  batchLocation: batchLocationLimiter,
  socketEvent: socketEventLimiter,
};