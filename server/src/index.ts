import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import { runMigrations } from './db/migrate.js';
import { resolveTrustProxy } from './config/env.js';
import { validate } from './middleware/validate.js';
import authRouter from './routes/auth.js';
import auditRouter from './routes/audit.js';
import budgetsRouter from './routes/budgets.js';
import glRouter from './routes/gl.js';
import forecastsRouter from './routes/forecasts.js';
import scenariosRouter from './routes/scenarios.js';
import reportsRouter from './routes/reports.js';
import entitiesRouter from './routes/entities.js';
import exportRouter from './routes/export.js';
import periodsRouter from './routes/periods.js';
import commandsRouter from './routes/commands.js';
// Wave 3 (lane R24): server-held-key NVIDIA NIM proxy — the browser never
// touches NIM credentials; see server/src/routes/ai.ts for the contract.
import aiRouter from './routes/ai.js';
import { authMiddleware, requireRole } from './middleware/auth.js';
import { auditRequestMiddleware } from './middleware/auditMiddleware.js';
import { authLimiter, generalLimiter } from './middleware/rateLimit.js';
// SECURITY FIX (M-05): Wire IncidentResponse into the server for incident tracking.
import { IncidentResponse } from './services/IncidentResponse.js';

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const IS_PRODUCTION = (process.env.NODE_ENV ?? 'development') === 'production';

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

// Security headers with explicit CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for CSS-in-JS
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'same-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: IS_PRODUCTION ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  })
);

// CORS — allow the Vite dev server in dev, locked origin in production
app.use(
  cors({
    origin: IS_PRODUCTION
      ? (process.env.CORS_ORIGIN ?? 'https://finplan.app')
      : (process.env.CORS_ORIGIN ?? 'http://localhost:5173'),
    credentials: true,
  })
);

// JSON body parsing — strict limit for hostile internet
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// SEC-3: trust proxy (config-driven)
// ---------------------------------------------------------------------------
// Behind a reverse proxy / load balancer, Express must trust the proxy chain
// for req.ip to reflect the real client — rate limiting and lockout key on
// it. Unset TRUST_PROXY keeps the Express default; see resolveTrustProxy()
// for the accepted forms ("true"|"false"|hops|"ip, ip").
const trustProxy = resolveTrustProxy(process.env.TRUST_PROXY);
if (trustProxy !== undefined) {
  app.set('trust proxy', trustProxy);
}

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Request auditing (N-0011 follow-on defect)
// ---------------------------------------------------------------------------
//
// `auditRequestMiddleware` was imported but NEVER mounted, so no server-side
// request was ever audited despite the audit service, routes and tests all
// existing. Wiring the server into CI surfaced it as an unused-import warning.
// It must run before the API routers so authenticated mutations are recorded.
app.use('/api', auditRequestMiddleware);

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
// Rate-limited to 30 requests per 15 minutes per IP.

app.use('/api/budgets', generalLimiter, budgetsRouter);
app.use('/api/gl', generalLimiter, glRouter);
app.use('/api/forecasts', generalLimiter, forecastsRouter);
app.use('/api/scenarios', generalLimiter, scenariosRouter);
app.use('/api/reports', generalLimiter, reportsRouter);
app.use('/api/entities', generalLimiter, entitiesRouter);
app.use('/api/export', generalLimiter, exportRouter);
app.use('/api/periods', generalLimiter, periodsRouter);

// F-04 spike: authoritative command boundary (typed envelope, idempotency,
// base revisions, trusted-actor scope, typed errors, audit evidence).
app.use('/api/v1', generalLimiter, commandsRouter);

// Wave 3 (lane R24): AI NIM proxy — JWT-gated inside the router; per-tenant
// limiting is applied by the router itself on top of the IP limiter here.
app.use('/api/ai', generalLimiter, aiRouter);

// ---------------------------------------------------------------------------
// Incident Response — wired (SECURITY FIX M-05), zod-validated (SEC-5)
// ---------------------------------------------------------------------------

/** SEC-5: strict input contract for incident creation. */
const CreateIncidentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).optional(),
  reporter: z.string().max(255).optional(),
  affectedSystems: z.array(z.string().max(255)).max(100).optional(),
  affectedUsers: z.number().int().min(0).optional(),
  tags: z.array(z.string().min(1).max(64)).max(50).optional(),
});

app.get(
  '/api/incidents',
  authMiddleware,
  requireRole('Admin', 'FP&A_Manager', 'compliance', 'data-protection-officer'),
  (_req, res) => {
    try {
      const ir = IncidentResponse.getInstance();
      res.json({ incidents: ir.listIncidents() });
    } catch (err) {
      console.error('[server] Incident fetch error:', err);
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  }
);

app.post(
  '/api/incidents',
  authMiddleware,
  requireRole('Admin', 'FP&A_Manager', 'compliance', 'data-protection-officer'),
  validate(CreateIncidentSchema),
  (req, res) => {
    try {
      const body = req.validated as z.infer<typeof CreateIncidentSchema>;
      const ir = IncidentResponse.getInstance();
      const incident = ir.createIncident({
        title: body.title,
        description: body.description ?? 'Created via server endpoint',
        severity: (body.severity ?? 'MEDIUM') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO',
        reporter: req.user?.email ?? 'system',
        affectedSystems: body.affectedSystems ?? [],
        affectedUsers: body.affectedUsers ?? 0,
        tags: body.tags ?? ['server-triggered'],
      });
      res.status(201).json({ incident });
    } catch (err) {
      console.error('[server] Incident creation error:', err);
      res.status(500).json({ error: 'Failed to create incident' });
    }
  }
);

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
