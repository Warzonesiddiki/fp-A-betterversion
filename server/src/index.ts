import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { runMigrations } from './db/migrate.js';
import authRouter from './routes/auth.js';
import auditRouter from './routes/audit.js';
import { authMiddleware } from './middleware/auth.js';
import { auditRequestMiddleware } from './middleware/auditMiddleware.js';
import { authLimiter, generalLimiter } from './middleware/rateLimit.js';

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

// Security headers
app.use(helmet());

// CORS — allow the Vite dev server
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  })
);

// JSON body parsing
app.use(express.json({ limit: '10mb' }));

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Auth — public routes (register, login, refresh, logout)
// Rate-limited to 10 requests per 15 minutes to prevent brute-force attacks
app.use('/api/auth', authLimiter, authRouter);

// Audit log routes — require authentication + Admin/Manager role
app.use('/api/audit', generalLimiter, auditRouter);

// Protected resource stubs — all require authentication
// Each stub returns 501 Not Implemented until the full route is built out.
// Rate-limited to 100 requests per 15 minutes per IP.
function stubRouter(name: string) {
  const router = express.Router();
  router.use(generalLimiter);
  router.use(authMiddleware);
  router.use(auditRequestMiddleware);
  router.all('*', (_req, res) => {
    res.status(501).json({ error: `${name} API not yet implemented` });
  });
  return router;
}

app.use('/api/budgets', stubRouter('Budgets'));
app.use('/api/gl', stubRouter('GL'));
app.use('/api/forecasts', stubRouter('Forecasts'));
app.use('/api/scenarios', stubRouter('Scenarios'));
app.use('/api/reports', stubRouter('Reports'));
app.use('/api/entities', stubRouter('Entities'));
app.use('/api/export', stubRouter('Export'));

// ---------------------------------------------------------------------------
// 404 Catch-All
// ---------------------------------------------------------------------------

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

try {
  console.log('[server] Running migrations...');
  runMigrations();
} catch (err) {
  console.error('[server] Migration failed:', err);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`[server] FinPlan Pro API running on http://localhost:${PORT}`);
  console.log(`[server] Health check: http://localhost:${PORT}/api/health`);
});

export default app;
