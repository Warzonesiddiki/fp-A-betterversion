import rateLimit from 'express-rate-limit';

/**
 * General API rate limit: 100 requests per 15 minutes per IP.
 * Applied to all non-auth endpoints to prevent abuse.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: 'draft-7', // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    error: 'Too many requests, please try again later.',
  },
});

/**
 * Auth rate limit: 10 requests per 15 minutes per IP.
 * Applied to login, register, and refresh endpoints to prevent brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
});
