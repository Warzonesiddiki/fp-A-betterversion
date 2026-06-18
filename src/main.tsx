import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';
import './styles/accessibility.css';
import './styles/print.css';
import { registerSW } from './pwa';

// ── PWA service worker (must run before render) ─────────────────────────
registerSW();

// ── Sentry observability (self-hosted per T-ATL-007 Docker + R2 archive) ──
// Gated on VITE_SENTRY_DSN so dev/staging/CI run without Sentry.
// Browser-tracing + replay integrations are imported eagerly because
// @sentry/react is a runtime dep; they only activate when DSN is set.
// tracesSampleRate=0.1 (10% of transactions), replays only on error.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
  });
}

// ── F-CLIO-4 (CWE-778 Audit Completeness Gap) P1 — Clio T-FIX-04 v0.2 EXECUTION ──
// Idempotent GDPR event consumer subscription. Listens to Hades T-15
// (consentRegistry + rightsWorkflow + breachTimer) emit GDPR events and records
// them as `source: 'gdpr'` audit entries per GDPR Art. 5(2), 7, 15-17, 20, 21, 33.
// Dual-channel: window CustomEvent('gdpr', { detail: event }) + globalThis.__gdprEmit.
import { subscribeToGdprEvents } from '@/store/auditTrailGdprEvents';
subscribeToGdprEvents();

// ── MOCK_AUTH build-time gate (entry-point defence) ────────────────────
// Vite inlines `import.meta.env.VITE_USE_MOCK_AUTH` at build time.
// In a production bundle, if the var is set to 'true' the app MUST
// refuse to mount — mock auth signs JWTs with a hard-coded secret and
// would let anyone log in as Admin / CFO. The authStore has the same
// gate internally as belt-and-suspenders, but the entry-point throw
// is the loudest signal we can give in production.
if (
  import.meta.env.PROD === true &&
  (import.meta.env.VITE_USE_MOCK_AUTH === 'true' || import.meta.env.VITE_USE_MOCK_AUTH === '1')
) {
  throw new Error(
    'MOCK_AUTH MUST NOT BE ENABLED IN PRODUCTION — refusing to mount. ' +
      'Unset VITE_USE_MOCK_AUTH in the build environment.'
  );
}

// Set theme before render to prevent flash
const theme = localStorage.getItem('theme');
if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
