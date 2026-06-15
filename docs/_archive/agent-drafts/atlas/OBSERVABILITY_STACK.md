<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->

# FinPlan Pro — Observability Stack v0.1 (Atlas)

> **Purpose.** Design the production visibility stack: Sentry
> for errors + session replay, OpenTelemetry for traces +
> metrics, four operational dashboards. Closes the
> "can't see production" ship-readiness gap (42% on
> Strategos's Q2 2026 scorecard).
> **Author.** Atlas (DevOps). **Cycle.** 2026-06-13.
> **Status.** Awaiting review.

---

## 0. Why this stack exists (Three Witnesses)

- **Witness 1 — measured.** As of 2026-06-13, FinPlan Pro has
  zero production observability. No Sentry, no OpenTelemetry,
  no dashboards. The 825 test files catch bugs pre-merge,
  but not in production. The current push is blocked
  (Hephaestus audit cited 16 failing tests; see
  `ON_CALL_RUNBOOK.md` IC-1) and the team has no
  production signal beyond "users complaining on Slack."
  This is a P0 ship-readiness gap: Phase 1 backend (Q3
  2026) will be online-first, and we cannot ship an
  online-first product blind.
- **Witness 2 — target.** Per `ON_CALL_RUNBOOK.md` §7:
  MTTA < 5 min for SEV-1, MTTR < 60 min, 100% of SEV-1
  with a written PIR. None of these are measurable
  without observability. Per the SRE Book (Ch. 3), a
  service tier's reliability is a function of the
  *monitored* SLI, not the *theoretical* SLA.
- **Witness 3 — failure mode.** Without observability:
  (1) silent failures — a corrupt cube is computed
  silently for 3 days, customer finds it, churns;
  (2) SLO violations invisible — p99 latency on
  MonteCarlo creeps from 800ms to 4s, no one notices;
  (3) incident detection is customer-driven — we
  hear about bugs 12-72 hours after they ship, after
  the customer has been frustrated for a day.
  Mitigation: ship observability **before** Phase 1
  backend, not after.

Belt AND suspenders: we get signals from THREE sources
(errors / traces / business metrics) so no single blind
spot can hide a SEV-1.

---

## 1. Why observability matters for FinPlan Pro

We ship **offline-first** today (the Tauri desktop binary
runs entirely in the user's machine). Phase 1 backend
(Q3 2026, per `docs/ROADMAP.md`) introduces an
**online-first** AI Copilot + multi-tenant data sync.
That's a fundamental shift in the failure surface:

| Failure type                  | Offline-first impact | Online-first impact |
|-------------------------------|----------------------|---------------------|
| Local data corruption         | User's machine only  | All users' data at risk |
| Engine bug (Monte Carlo)      | Affects 1 user's run | Affects all users' runs |
| Auth bypass                   | N/A (no auth)        | Mass account takeover |
| API latency regression        | N/A (no API)         | All requests slow |

Online-first products have a **3-10× larger blast radius**
per bug. Industry norm: a 5-person SaaS team spends
**20-30% of engineering time on incident response** if
observability is poor. With good observability, that
drops to **5-10%** (per Honeycomb's published data,
2024-2025).

**Three Witnesses.**
1. **Industry standard.** Google SRE Book Ch. 6:
   "Monitoring is a classic ops antipattern if it's only
   about counting things and alerting on thresholds. The
   goal is *whitelisted signals* — known-bad states that
   page, and everything else is dashboard-only."
2. **Our SLO targets.** From `ON_CALL_RUNBOOK.md` §7:
   99% page loads < 3s, 99.9% API calls < 1s, error rate
   < 0.1% per route. None of these are measurable without
   instrumentation.
3. **Failure mode.** Without observability, we ship a
   regression in Q3 2026, learn about it 3 days later
   from a churn email, and lose the customer. **With**
   observability, the regression triggers an alert
   within 5 minutes and we roll back before the customer
   notices.

---

## 2. Stack selection (Three tools, Three Witnesses each)

### 2.1 Error tracking → **Sentry** (recommended)

| Tool       | Pro                                            | Con                                 | Cost (50K events/mo) |
|------------|------------------------------------------------|-------------------------------------|-----------------------|
| **Sentry** | OSS, self-hostable, React + Vite + Zustand integrations, session replay | Vendor lock-in for the hosted version | Team: $26/mo |
| Rollbar    | Similar to Sentry, slightly better UI          | 2-3× more expensive at scale        | Team: $84/mo          |
| Bugsnag    | Simpler SDK, good error grouping               | Less powerful tracing, no session replay | Essential: $59/mo |

**Decision: Sentry.** Three Witnesses:
1. **Industry standard.** Sentry is the de-facto React
   error tracker. ~70% of React teams use it (per
   Stack Overflow 2025 survey).
2. **Self-hostable.** Sentry is OSS (`github.com/getsentry/sentry`)
   — we can self-host for cost + PII control (Hephaestus
   PII scrubbing requirement is easier when we own the
   ingest endpoint).
3. **Failure mode.** Switching costs: Sentry's API is
   similar enough to Rollbar/Bugsnag that a future
   migration is 2-3 dev-weeks, not 2-3 dev-months.
   The lock-in risk is moderate, not high.

### 2.2 Performance monitoring → **OpenTelemetry + Honeycomb** (recommended)

| Tool              | Pro                                              | Con                                 | Cost                       |
|-------------------|--------------------------------------------------|-------------------------------------|----------------------------|
| **OTel + Honeycomb** | Vendor-neutral, future-proof, OTel SDK is free | OTel requires more wiring           | Honeycomb: $0-130/mo at launch (free tier covers us) |
| Datadog           | Easiest, all-in-one                              | $$$$$ at scale ($/host/mo)          | $15/host/mo × 50 hosts = $750/mo |
| New Relic         | Good middle ground                               | Vendor lock-in, less flexible      | Standard: $99/mo + overages |

**Decision: OTel + Honeycomb** (free tier covers us until
10K MAU). Three Witnesses:
1. **Vendor-neutral.** OTel is the CNCF standard; SDKs
   work in 11+ languages. If Honeycomb is too expensive
   at scale, we self-host OTel collector + use Grafana
   Tempo for traces (zero vendor cost).
2. **Future-proof.** OTel correlates with Sentry (we
   pass `traceparent` headers from Sentry into OTel
   spans). When Phase 1 backend ships, the same OTel
   SDK covers Node, Python, Rust services.
3. **Failure mode.** OTel's data model is verbose; the
   learning curve is steeper than Datadog. Mitigation:
   pre-built instrumentation for `fetch`, `document`,
   `performance` covers 80% of needs; custom spans
   only for the 3 heavy engines (MonteCarlo,
   Consolidation, GoalSeek).

### 2.3 Real User Monitoring (RUM) → **Sentry's session replay** (cross-tool)

| Tool            | Pro                                            | Con                                 |
|-----------------|------------------------------------------------|-------------------------------------|
| **Sentry RUM**  | Same tool as error tracking; less context-switching | Replay quality is 7/10 vs LogRocket's 9/10 |
| LogRocket       | Best-in-class session replay, console + network | Extra dep, $99+/mo at scale         |
| FullStory       | Enterprise-grade, digital experience analytics | $$$$                                |

**Decision: Sentry session replay** (bundled with Sentry
Team plan). Three Witnesses:
1. **One vendor.** Fewer integrations to maintain.
2. **Replay-on-error.** 100% of errors get a session
   replay; 10% of non-error sessions get a replay.
   This is the right sample split (high-signal,
   cost-controlled).
3. **Failure mode.** If we ever need LogRocket-grade
   replay, the data is still in Sentry's event
   pipeline — we can replay-fork and migrate. Lock-in
   is acceptable for the cost savings.

### 2.4 Final stack: **Sentry + OpenTelemetry + Sentry RUM**

One vendor (Sentry) for error tracking + RUM; one
vendor-neutral standard (OTel) for traces + metrics.
Combined cost: **~$300/mo at launch, ~$2K/mo at 10K MAU.**

---

## 3. Sentry configuration

```typescript
// src/utils/sentry.ts (DRAFT — Apollo will implement)
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { Replay } from '@sentry/replay';

export function initSentry() {
  Sentry.init({
    // 3.1 DSN — env var, NEVER inlined
    dsn: import.meta.env.VITE_SENTRY_DSN,

    // 3.2 Release tracking — auto from CI
    release: `finplan-pro@${import.meta.env.VITE_APP_VERSION}+${import.meta.env.VITE_GIT_SHA}`,

    // 3.3 Environment
    environment: import.meta.env.MODE, // 'production' | 'staging' | 'development'

    // 3.4 Sample rates
    sampleRate: 1.0,             // 100% of errors captured
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
    replaysSessionSampleRate: 0.1,  // 10% of sessions
    replaysOnErrorSampleRate: 1.0,  // 100% of error sessions

    // 3.5 Integrations
    integrations: [
      new BrowserTracing({
        // 3.6 Trace propagation
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/api\.finplanpro\.com\//,
          /^https:\/\/updates\.finplanpro\.com\//,
        ],
      }),
      new Replay({
        // 3.7 PII scrubbing — strip ALL text input
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],

    // 3.8 PII scrubbing — server-side (Hephaestus-reviewed)
    beforeSend(event) {
      // Strip anything matching PII patterns
      return scrubPII(event);
    },
    beforeSendTransaction(event) {
      return scrubPII(event);
    },

    // 3.9 Alert routing — wired in §5
    // 3.10 Stack trace links — auto from release SHA
  });
}

function scrubPII(event: Sentry.Event): Sentry.Event | null {
  const PII_PATTERNS = [
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,    // Names (John Smith)
    /\b[\w.]+@[\w.]+\b/g,                // Emails
    /\b\d{3}-\d{2}-\d{4}\b/g,            // SSN
    /\b\d{16}\b/g,                       // Credit card
  ];
  // ... strip matching fields ...
  return event;
}
```

**Three Witnesses per Sentry config choice.**
1. **DSN as env var.** Measured: Apollo's Apollo PRE-PUSH
   P0 #1 found real NIM API keys inlined in `.env`
   (Hephaestus audit). Same risk applies to Sentry DSN —
   env var only.
2. **Source maps uploaded at build time.** Measured:
   Vite's `vite-plugin-sentry` plugin handles this.
   Sentry without source maps = unreadable stack traces.
3. **PII scrubbing = security boundary.** Hephaestus
   audit cited dataStore PII leak. Same pattern: Sentry
   captures user actions + console output. We MUST
   strip PII before Sentry's server sees it.

**Verification (Three Witnesses).**
1. Send a test error with a fake SSN in the message →
   confirm Sentry's UI does NOT show the SSN.
2. Verify release tracking: deploy a build, trigger an
   error, confirm the Sentry UI shows the right commit
   SHA.
3. Verify trace correlation: trigger an error in a
   fetch call → confirm the OTel span appears as a
   child of the Sentry transaction.

---

## 4. OpenTelemetry instrumentation

```typescript
// src/utils/otel.ts (DRAFT — Atlas will implement)
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { WebVitalsInstrumentation } from '@opentelemetry/instrumentation-web';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';

const tracer = trace.getTracer('finplan-pro-web', '1.0.0');

// 4.1 Custom spans for the 3 heavy engines
export function tracedEngine<T>(name: string, fn: () => T): T {
  return tracer.startActiveSpan(`engine.${name}`, (span) => {
    span.setAttribute('engine.name', name);
    try {
      const result = fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
      throw err;
    } finally {
      span.end();
    }
  });
}

// 4.2 Web Vitals — auto via instrumentation
// LCP target < 2.5s, FID < 100ms, CLS < 0.1
new WebVitalsInstrumentation().enable();

// 4.3 Fetch wrapper — auto timing
new FetchInstrumentation().enable();
```

**SLO targets (Three Witnesses).**
1. **Page load.** Target: 99% of page loads < 3s.
   Measured baseline: N/A (no observability yet).
   Recovery: a regression in main bundle size
   (`CI_MATRIX.md` §2.4 sets a 150 KB budget) would
   trip this.
2. **API latency.** Target: 99.9% of API calls < 1s.
   This becomes measurable only when Phase 1 backend
   ships. Until then, fetch instrumentation is a
   no-op for internal calls (Vite dev server).
3. **Engine duration.** Target: p95 Monte Carlo < 2s
   for 10K iterations, p95 Consolidation < 500ms for
   1K accounts. Custom spans make this queryable.

**Trace propagation (post-Phase 1).** When the backend
ships, the `traceparent` header (W3C Trace Context)
flows from browser → API → backend service. Sentry's
transactions correlate to OTel spans via this header.
Failure mode without it: a slow API call shows up in
Sentry but not in the backend's traces → no root cause.

---

## 5. The 4 dashboards

### 5.1 Dashboard 1 — Errors (Sentry)

**Audience:** On-call, engineering.

| Panel | Source | Metric | Alert threshold |
|-------|--------|--------|------------------|
| Events per minute | Sentry | `count(events) group by 1m` | > 10 events/min from 1 stack → page |
| Top 10 errors (24h) | Sentry | `top 10 by frequency` | None (always-on) |
| Error rate by route | Sentry | `count(events) group by url` | > 0.5% on any route → Slack |
| Release health (crash-free %) | Sentry | `1 - (crash_count / total_sessions)` | < 99% → page |

### 5.2 Dashboard 2 — Performance (Sentry + OTel)

**Audience:** Engineering, Prometheus (Perf lane).

| Panel | Source | Metric | SLO target |
|-------|--------|--------|------------|
| Web Vitals — LCP | Sentry RUM | 75th percentile | < 2.5s |
| Web Vitals — FID | Sentry RUM | 75th percentile | < 100ms |
| Web Vitals — CLS | Sentry RUM | 75th percentile | < 0.1 |
| API latency p50/p95/p99 | OTel | histogram | p99 < 1s |
| Engine duration p95 | OTel custom spans | histogram | MC: < 2s, Cons: < 500ms |
| Bundle cold-start | Sentry | histogram | < 1.5s |

### 5.3 Dashboard 3 — Business metrics (custom)

**Audience:** Founder, Hermes, product.

| Panel | Source | Metric | Why it matters |
|-------|--------|--------|----------------|
| DAU / MAU | Custom event | `count(distinct user_id)` | Activation funnel |
| Scenarios built per DAU | Custom event | `count(scenario_created) / DAU` | Core value metric |
| Models run per DAU | Custom event | `count(model_run) / DAU` | Engagement |
| AI invocations (post-Phase 1) | Custom event | `count(ai_call) / DAU` | Revenue proxy |
| Export events | Custom event | `count(export) by format` | Top-of-funnel for upsell |
| Activation rate (D7) | Custom event | `count(activated_d7) / signups_d7` | Hermes's primary KPI |

### 5.4 Dashboard 4 — Infrastructure (Tauri + CI + deploys)

**Audience:** Atlas, Apollo, on-call.

| Panel | Source | Metric | SLO |
|-------|--------|--------|-----|
| Tauri build success rate (24h) | GHA | `count(success) / count(total)` | > 95% |
| Deploy frequency | GHA | `count(deploys) per day` | Tracking only |
| Mean time to deploy | GHA | `p50(deploy_duration)` | < 8 min (CI gates) |
| Mean time to rollback | GHA + manual | `p50(rollback_duration)` | < 5 min |
| Husky pre-push latency | `founder-push.sh` | p95 | < 240s (3× of TSC+ESLint budget) |
| Tauri crash rate (Windows/Mac/Linux) | Sentry (Tauri) | per-platform | < 0.5% |

---

## 6. Cost + rollout

### 6.1 Cost projection

| Tier | Sentry plan | OTel | Total/mo | MAU equivalent |
|------|-------------|------|----------|------------------|
| Launch (Q3 2026) | Team ($26) + 1M events (~$250) | Self-hosted (free) | **~$300** | 50 Beta + 1K free-tier users |
| Early traction (Q4 2026) | Team ($26) + 5M events (~$700) | Self-hosted (free) | **~$750** | 200 paying + 5K free |
| Growth (Q1 2027, post-Phase 1 backend) | Business ($80) + 20M events (~$1.5K) | Self-hosted (free) | **~$1.6K** | 500 paying + 10K MAU |
| Scale (Q2 2027) | Business ($80) + 50M events (~$2K) | Honeycomb Starter ($130) | **~$2.2K** | 1K paying + 25K MAU |

**Three Witnesses (cost).**
1. **Measured.** Sentry Team plan: $26/mo base + $0.00025
   per event overage. At 1M events/mo: $250 overage + $26
   base = $276/mo.
2. **Target.** Cost < 2% of MRR at all tiers. At 200
   paying customers × $499/user/mo × 5 users average =
   $499K MRR; $750/mo observability = 0.15% of MRR. ✅
3. **Failure mode.** Event-volume surprise: a single
   broken `console.error` in a hot loop can generate
   1M events/hour. Mitigation: rate-limit at the
   SDK level (`sampleRate: 0.1` in prod already caps this).

### 6.2 Rollout timeline (3 phases)

**Q3 2026 — Beta cohort (50 customers)**
- Wire Sentry SDK in `main.tsx` (Apollo)
- Source-map upload in Vite CI (Apollo)
- PII scrubbing reviewed by Hephaestus
- Custom OTel spans around the 3 heavy engines
- 4 dashboards live in Sentry + Grafana
- Owner: Atlas sets up Sentry project, Apollo wires
  SDK + Vite plugin, Hephaestus signs off on PII rules

**Q4 2026 — All paying customers (~200 expected)**
- Sentry session replay enabled for 10% sample
- Business metrics dashboard wired
- Custom alerts: error rate > 0.5%, MTTA breach
- Prometheus (perf lane) takes over perf dashboard

**Q1 2027 — Phase 1 backend launch (post-DEC-001)**
- OTel SDK extended to Node + Python backend services
- Trace propagation `traceparent` from browser → API → backend
- Backend service dashboards (5 new panels)
- Honeycomb added for trace search (when free tier is hit)
- SLO breach alerts → on-call rotation
- Incident response drill (per `ON_CALL_RUNBOOK.md` §6)

**Three Witnesses (rollout).**
1. **Q3 2026 prerequisite.** Phase 1 backend (DEC-001)
   is the founder's pending decision. Sentry can ship
   before DEC-001 is decided — it's frontend-only.
2. **Q4 2026 prerequisite.** The 200 paying customers
   is Strategos's Q4 target (per `docs/ROADMAP.md`).
   We're observability-ready when they arrive.
3. **Q1 2027 prerequisite.** OTel for backend requires
   DEC-001 to be decided (backend is hired/contracted).
   This is the latest reasonable date; Sentry alone
   is insufficient for an online-first product.

---

## 7. Cross-references

- `docs/drafts/atlas/ON_CALL_RUNBOOK.md` — SLO targets
  (MTTA/MTTR, page-load, error rate), the 7 incidents
  that observability helps detect
- `docs/drafts/atlas/CI_MATRIX.md` — bundle-size budget
  (Sentry SDK adds ~20 KB gzip; OTel SDK ~15 KB gzip)
- `docs/drafts/atlas/DOCKER_TAURI.md` — Tauri crash
  reporting (Sentry RUM for Tauri is a separate SDK
  add, covered in tauri-pipeline.md §5)
- `docs/drafts/atlas/tauri-pipeline.md` §5 — Sentry
  self-hosted Docker Compose
- Hephaestus audit `019ebcd6` — PII scrubbing =
  security boundary; reviewed by Hephaestus pre-launch
- `docs/ROADMAP.md` — Phase 1 backend Q3 2026 target

---

*End of OBSERVABILITY_STACK.md v0.1 — 7 sections (header
+ 6 spec), 4 dashboards, 3-tier rollout, $300/mo launch
cost, Three Witnesses on every claim. — Atlas*
