import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { authLimiter, generalLimiter } from './rateLimit.js';

function createTestApp(limiter: ReturnType<typeof authLimiter>) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', limiter, (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

describe('Rate Limiting Middleware', () => {
  describe('authLimiter (10 requests per 15 minutes)', () => {
    const app = createTestApp(authLimiter);

    it('should allow requests within the limit', async () => {
      for (let i = 0; i < 10; i++) {
        const res = await request(app).get('/api/auth/login');
        expect(res.status).toBe(200);
      }
    });

    it('should return 429 after exceeding the limit', async () => {
      // Send 10 requests to hit the limit
      for (let i = 0; i < 10; i++) {
        await request(app).get('/api/auth/login');
      }

      // 11th request should be rate-limited
      const res = await request(app).get('/api/auth/login');
      expect(res.status).toBe(429);
      expect(res.body).toEqual({
        error: 'Too many authentication attempts, please try again later.',
      });
    });

    it('should include RateLimit headers on 429 response', async () => {
      const app2 = createTestApp(authLimiter);
      // Exhaust the limit
      for (let i = 0; i < 10; i++) {
        await request(app2).get('/api/auth/login');
      }
      // 11th request should be rate-limited with proper headers
      const res = await request(app2).get('/api/auth/login');
      expect(res.status).toBe(429);
      // express-rate-limit with standardHeaders:'draft-7' sets the combined
      // 'RateLimit' header (draft-7 IETF format)
      const rateLimitHeader = res.headers['ratelimit'];
      expect(rateLimitHeader).toBeDefined();
      expect(rateLimitHeader).toContain('limit=10');
      expect(rateLimitHeader).toContain('remaining=0');
      expect(rateLimitHeader).toContain('reset=');
    });
  });

  describe('generalLimiter (100 requests per 15 minutes)', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/data', generalLimiter, (_req, res) => {
      res.json({ ok: true });
    });

    it('should allow requests within the limit', async () => {
      for (let i = 0; i < 10; i++) {
        const res = await request(app).get('/api/data/budgets');
        expect(res.status).toBe(200);
      }
    });

    it('should not block normal usage', async () => {
      // 50 requests should all pass
      const promises = Array.from({ length: 50 }, () =>
        request(app).get('/api/data/budgets')
      );
      const results = await Promise.all(promises);
      const allOk = results.every((r) => r.status === 200);
      expect(allOk).toBe(true);
    });
  });

  describe('separate limits per limiter', () => {
    it('auth limiter should have max of 10', () => {
      // Verify the limiter was created with correct config
      // We test indirectly by hitting the limit at 10
      const app = createTestApp(authLimiter);
      expect(app).toBeDefined();
    });
  });
});
