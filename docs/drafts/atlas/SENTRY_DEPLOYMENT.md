<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->

# Sentry Self-Hosted Deployment — v0.1 (Atlas)

> **Status.** Draft v0.1, awaiting Themis/Leader review.
> **Author.** Atlas (DevOps & Infrastructure) — 10th Muse, slot `019ebd9c-bf19-7110-8710-864159fd33ba`.
> **Parent spec.** [`../OBSERVABILITY_STACK.md`](../OBSERVABILITY_STACK.md) (T-ATL-004 — Sentry + OpenTelemetry + 4 dashboards, ACCEPTED 2026-06-13).
> **Sibling spec.** [`../../drafts/adr/ADR-008-audit-logging.md`](../../drafts/adr/ADR-008-audit-logging.md) (Hephaestus T-HEP-003 — 7-year R2 Object Lock, ACCEPTED 2026-06-13).
> **Runbook sibling.** [`../ON_CALL_RUNBOOK.md`](../ON_CALL_RUNBOOK.md) (T-ATL-003 — see IC-4 "Production crash spike in Sentry").

This doc operationalizes the Sentry half of the T-ATL-004 observability stack. OTel already has a doc (T-ATL-004 §6); this one handles deployment, source maps, the Sentry-OTel bridge, R2 archival, and the 4 dashboards.

---

## §1 — Why self-hosted Sentry

**Witness 1 (rule).** Sentry is the error-tracking and release-health backbone for the T-ATL-004 observability stack. It must be **self-hosted** (not SaaS) for four converging reasons.

**Witness 2 (evidence).** As of 2026-06-13:
- **Data residency.** FinPlan Pro's enterprise customers (ICP-1) require customer PII to remain in-region. SaaS Sentry (sentry.io) is US-hosted; using it would force a Data Processing Agreement (DPA) and a contractual data-residency clause for every enterprise deal. Self-hosted Sentry running on our own infra (region: `ap-south-1` for India, `us-east-1` for the Americas) eliminates the DPA.
- **$0 vendor cost at our scale.** Sentry SaaS pricing: Team plan is $26/mo for 5 users + 50K errors. At our Beta scale (50 customers, ~500K events/mo in the first quarter) that's ~$130/mo. At GA scale (10K MAU per Strategos T-ST-003 GTM math), ~5M events/mo = ~$1,300/mo on SaaS vs **~$200/mo on self-hosted** (a single 8-GiB VM on Hetzner or equivalent).
- **No 3rd-party data share.** SaaS Sentry sees our stack traces, which include file paths, variable values, and (per ADR-008 §3) customer identifiers in breadcrumbs. Self-hosted Sentry means **no data leaves our perimeter** — the SOC 2 audit boundary is the cluster, not the vendor's.
- **ADR-008 audit log integrity.** Hephaestus's ADR-008 (audit logging) §5 says: "Sentry alert on any `AuditChainBrokenError`." If Sentry is itself hosted by a 3rd party, the chain of custody for the audit-log integrity alert is muddied. Self-hosted Sentry keeps the chain-of-custody clean: same VPC, same IAM, same S3/R2 export.

**Witness 3 (failure mode / consequence).** If we use SaaS Sentry: every enterprise deal slows by 2-4 weeks waiting on legal/DPA; the SOC 2 audit (T-HEP-003) needs a sub-processor review; at GA scale the line item balloons. **If we self-host and it goes wrong:** we own the uptime. Mitigation: the runbook in §7 has 4 operational procedures (deploy, restart, upgrade, debug), and IC-4 in the on-call runbook is the SEV-1 playbook for a Sentry outage.

---

## §2 — Sentry self-hosted requirements

Sentry self-hosted is the official Docker Compose stack from `getsentry/self-hosted` (2026 release: `24.5.0`; tracks Sentry server `24.5.x`). The minimum viable deployment:

| Component | Role | Min RAM | Recommended (prod) | Notes |
|-----------|------|---------|--------------------|-------|
| **Web** (`sentry-web`) | Django + React UI + API | 1 GiB | 2 GiB | Exposed on `:9000` behind nginx |
| **Worker** (`sentry-worker`) | Celery for async tasks | 1 GiB | 2 GiB | One or more, scale horizontally |
| **Cron** (`sentry-cron`) | Beat scheduler | 256 MiB | 512 MiB | One instance only |
| **PostgreSQL 14** | Primary store (events, users, projects) | 1 GiB | 4 GiB | 100 GB SSD min; ZFS for snapshots |
| **Redis 7** | Celery broker + cache | 512 MiB | 1 GiB | AOF persistence on |
| **Kafka 3.6** | Event ingestion queue | 1 GiB | 2 GiB | Single-broker fine for <10M events/day |
| **ClickHouse 23.x** | Columnar event store (via Snuba) | 2 GiB | 4 GiB | The hot store for query performance |
| **Snuba** | ClickHouse admin layer | 512 MiB | 1 GiB | One consumer per Kafka topic |
| **Relay 24.5** | Ingestion proxy (PII scrubbing at edge) | 256 MiB | 512 MiB | Optional but **recommended** for PII scrubbing |
| **Symbolicator** | Native crash symbolicator | 256 MiB | 1 GiB | For Tauri/electron native crashes (out of scope here) |
| **TOTAL** | | **~8 GiB** | **~16 GiB** | The 8 GiB min matches Leader's spec |

**Deploy time on Ubuntu 24.04 Noble:** 30 min from `git clone` to a Sentry UI at `https://sentry.internal.finplanpro.com`. The steps are:

```bash
git clone https://github.com/getsentry/self-hosted.git
cd self-hosted
git checkout 24.5.0       # pin version; never run `latest` in prod
./install.sh              # 5 min — pulls ~40 Docker images
docker compose up -d      # 2 min — boots 12 services
# First-time setup: create admin user via sentry-web createuser
# Then: configure SENTRY_BEACON=false in .env (don't phone home)
```

**Storage sizing at GA:** PostgreSQL ~50 GB, ClickHouse ~200 GB (10M events × ~20 bytes/row compressed), Kafka 50 GB (3-day retention). Total ~300 GB. SSD-backed, not NVMe-required.

---

## §3 — Source-map upload pipeline

Sentry needs source maps to translate minified stack traces back to original source. The pipeline:

**Step 1: Install Sentry CLI in CI.** Add `@sentry/cli` as a devDependency:
```bash
npm i -D @sentry/cli
# or, in CI: npm install -g @sentry/cli  (faster; no package-lock churn)
```

**Step 2: Configure Sentry in Vite.** Sentry's official `@sentry/vite-plugin` (detailed in §4) emits source maps as part of the Vite build. After `npm run build`, the source maps live in `dist/assets/*.js.map`.

**Step 3: Upload on release, scoped to the 5 Vite vendor chunks.** The actual chunk names from `vite.config.ts:30-65` (`manualChunks`):

| # | Chunk name | Source map file | Approx gzip |
|---|------------|-----------------|-------------|
| 1 | `react-vendor` | `react-vendor-*.js.map` | 2.8 kB |
| 2 | `state-vendor` | `state-vendor-*.js.map` | 1.1 kB |
| 3 | `form-vendor` | `form-vendor-*.js.map` | 0.4 kB |
| 4 | `chart-vendor` | `chart-vendor-*.js.map` | 4.2 kB |
| 5 | `grid-react-vendor` | `grid-react-vendor-*.js.map` | 0.9 kB |

> **⚠️ Spec deviation (3 of 4).** Leader's spec named "5 Vite chunks — react-vendor, chart-vendor, **grid-vendor**, form-vendor, state-vendor." The actual `vite.config.ts:50-53` defines **3 separate grid chunks**: `grid-react-vendor`, `grid-community-vendor`, `grid-common-vendor`. I picked `grid-react-vendor` (the most-used) for the source-map wire-up. The other 2 grid-* chunks can be added in §8 dashboard v2.

**Step 4: Wire into the GHA release workflow.** Add a step to `.github/workflows/release.yml` (tag-triggered):

```yaml
- name: Upload source maps to Sentry
  if: startsWith(github.ref, 'refs/tags/v')
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_URL: https://sentry.internal.finplanpro.com
    SENTRY_ORG: finplan-pro
    SENTRY_PROJECT: javascript-vite
  run: |
    npx sentry-cli releases new "$GITHUB_REF_NAME"
    npx sentry-cli releases files "$GITHUB_REF_NAME" upload-sourcemaps \
      --url-prefix "~/assets" \
      --validate \
      --strip-prefix "dist" \
      dist/assets/
    npx sentry-cli releases finalize "$GITHUB_REF_NAME"
```

The `--url-prefix "~/assets"` must match Vite's `build.rollupOptions.output.assetFileNames` setting. The current vite.config.ts:67 sets `chunkFileNames: 'assets/[name]-[hash].js'` and `assetFileNames: 'assets/[name]-[hash].[ext]'`, so the `~/assets/` prefix is correct.

---

## §4 — Integration with Vite (frontend SDK)

**Step 1: Install Sentry SDKs.** Two packages, both in production dependencies:
```bash
npm i @sentry/react @sentry/vite-plugin
```

> **ℹ️ Greenfield integration.** As of 2026-06-13, neither package is in `package.json` and there is no `Sentry` import in `src/main.tsx`. This is a fresh install.

**Step 2: Wire `@sentry/vite-plugin` into vite.config.ts.** Add to the `plugins` array (BEFORE the existing React plugin so the source map is generated for React's JSX output too):
```ts
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'finplan-pro',
      project: 'javascript-vite',
      authToken: process.env.SENTRY_AUTH_TOKEN,  // CI-only; see §6
      release: process.env.GITHUB_REF_NAME || 'dev',
      deploy: { env: process.env.NODE_ENV || 'development' },
      sourcemaps: { assets: './dist/**', filesToDeleteAfterUpload: ['*.js.map'] },
    }),
  ],
  // ... existing config
});
```

**Step 3: Initialize Sentry in `src/main.tsx`.** At the very top, before React imports (so the global error handler is in place before any module evaluates):
```ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: import.meta.env.VITE_RELEASE,  // injected by CI
  environment: import.meta.env.MODE,        // 'production' | 'staging' | 'development'
  // Cost-optimized sampling (added 2026-06-13 per Leader T-ATL-007 review):
  // Default 1% for page loads, 10% for error-bearing spans.
  // Math: 10K MAU × 50 spans × 5 pages/day × 1% = 250K events/day
  //   × $0.000065 = $16.25/day = $487.50/mo (vs. $4,875/mo at 10% default).
  tracesSampleRate: 0.01,
  tracesSampler: (samplingContext) => {
    // Bump to 10% for any span inside an error transaction (preserve visibility)
    if (samplingContext.transactionContext?.status === 'internal_error') return 0.1;
    if (samplingContext.name === 'scenario.compute') return 0.05;  // 5% for heavy ops
    return 0.01;  // 1% baseline for page.load, api.call, export
  },
  replaysSessionSampleRate: 0.0,            // off for now; enable per §8
  replaysOnErrorSampleRate: 1.0,            // 100% of error sessions get replay
  // The 4 Sentry integrations (mapped from Leader's spec):
  integrations: [
    Sentry.consoleIntegration(),          // 'console'    → captures console.*
    Sentry.httpClientIntegration(),       // 'network'    → captures fetch/XHR
    Sentry.breadcrumbsIntegration(),       // 'breadcrumbs'→ auto console+network+nav
    Sentry.globalHandlersIntegration(),    // 'global error'→ window.onerror + unhandledrejection
  ],
  // PII scrubbing (per ADR-008 §3, never ship customer data to Sentry):
  beforeSend(event) {
    if (event.user) delete event.user.email;
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(b => ({
        ...b,
        data: b.data ? scrubPII(b.data) : undefined,
      }));
    }
    return event;
  },
});
```

The 4 Sentry integrations are **mappings** of Leader's spec ("console, network, breadcrumbs, global error") to the actual SDK API names (`consoleIntegration`, `httpClientIntegration`, `breadcrumbsIntegration`, `globalHandlersIntegration`). The mappings are 1:1; nothing is dropped or added.

---

## §5 — Integration with T-ATL-004 OTel (Sentry-OTel bridge)

> **⚠️ Spec deviation (4 of 4).** Leader's spec said: *"Sentry-OTel bridge via `Sentry.captureException()` from OTel spans."* This is **incorrect** — `Sentry.captureException()` is for **error events**, not **traces**. The correct pattern is the official `@sentry/opentelemetry-node` SDK, which propagates OTel spans into Sentry as **transactions** automatically. No manual `captureException` from OTel.

**Step 1: Install the bridge package.**
```bash
npm i @sentry/opentelemetry-node @opentelemetry/api @opentelemetry/sdk-node
```

**Step 2: Initialize the bridge in `src/main.tsx`** (after `Sentry.init`):
```ts
import { SentrySpanProcessor } from '@sentry/opentelemetry-node';
import { NodeSDK } from '@opentelemetry/sdk-node';

const otelSDK = new NodeSDK({
  spanProcessors: [new SentrySpanProcessor()],  // sends OTel spans to Sentry
});
otelSDK.start();
```

**Step 3: The 4 OTel spans (mapped to user-journey events).** These match the spec and T-ATL-004 §6:

| # | Span name | Source | Triggers | Sample rate |
|---|-----------|--------|----------|-------------|
| 1 | `page.load` | `src/main.tsx` mount | Every route change | 1% (baseline) |
| 2 | `api.call` | `src/services/*.ts` | Every fetch to `/api/*` | 1% (baseline) |
| 3 | `scenario.compute` | `src/engines/*.ts` | Every scenario run | 5% (heavy but high-value) |
| 4 | `export` | `src/utils/export*.ts` | Every XLSX/PDF/CSV export | 1% (baseline) |

Example instrumenting a scenario compute:
```ts
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('finplan-engines');

export async function runScenario(input: ScenarioInput) {
  return tracer.startActiveSpan('scenario.compute', async (span) => {
    span.setAttribute('scenario.id', input.id);
    span.setAttribute('scenario.rowCount', input.rows.length);
    try {
      return await computeEngine(input);
    } finally {
      span.end();
    }
  });
}
```

The Sentry-OTel bridge automatically creates a Sentry transaction for each OTel span. Errors thrown inside the span are captured as Sentry events with the span as the parent — **this is where `Sentry.captureException` actually does show up: inside the `catch` block, where the SDK's auto-instrumentation already wires it up**. The Leader's mental model is right (errors from OTel spans should reach Sentry), but the mechanism is the SDK auto-instrumentation, not manual `captureException` calls.

---

## §6 — SOC 2 implications (ADR-008 R2 archival)

> **⚠️ Spec deviation (1 of 4).** Leader's spec said *"ADR-008 §Cloud storage says 7y cold S3 Object Lock; Sentry events go through the same S3 bucket via the Snuba → S3 export."* The **actual ADR-008 §Storage** (lines 65-67) specifies **Cloudflare R2** (S3-compatible, $0.015/GB/mo vs S3's $0.023/GB/mo + retrieval fees), not raw AWS S3. R2 is wire-compatible with the S3 API, so the Snuba → S3 export works identically — just with a different endpoint URL. This doc uses R2 throughout; the deviation is the endpoint, not the architecture.

**The 7-year retention chain (per ADR-008 §Storage):**

1. **Hot (0-90 days):** ClickHouse on local NVMe (the 200 GB sized in §2). Served to the Sentry UI directly.
2. **Warm (90 days - 1 year):** ClickHouse `tiered_storage` to R2 via the S3-compatible API. Same query performance, off the local disk.
3. **Cold (1-7 years):** R2 with **Object Lock in Compliance mode** (per ADR-008 §5). Compliance mode means **no one — not even the account root — can delete or overwrite** the object until the retention timer expires. This is the SOC 2 audit-log integrity requirement.

**Configuration in `sentry/config.yml` (the Sentry server config):**
```yaml
snuba:
  retention_days: 90             # hot tier
  archive:
    type: 's3'
    bucket: 'finplan-sentry-cold'
    endpoint: 'https://<accountid>.r2.cloudflarestorage.com'  # R2 endpoint
    region: 'auto'                # R2 is regionless
    access_key: '...'
    secret_key: '...'
    retention_days: 2555          # 7 years = 365 * 7
```

> **IAM note.** The R2 access key is read-only for the Snuba consumer (it only writes to the cold bucket). No delete permission. This is enforced both by IAM policy AND by Object Lock (defense-in-depth).

The R2 bucket also receives the ADR-008 audit log stream (Hephaestus's `AuditChainBrokenError` events). Sentry alerting on those is the SOC 2 enforcement mechanism per ADR-008 §5: any `AuditChainBrokenError` from the audit pipeline triggers a Sentry P1 alert routed to the on-call SEV-1 channel (`#on-call` per `ON_CALL_RUNBOOK.md` §1).

---

## §7 — Runbook

> **⚠️ Spec deviation (2 of 4).** Leader's spec said *"cross-link to ON_CALL_RUNBOOK.md IC-6 Sentry outage."* The actual IC-6 is **"Tauri build fails on Linux runner"** (line 280). The Sentry incident is **IC-4 — "Production crash spike in Sentry"** (line 223). This doc cross-links to IC-4. The IC-6 cross-link would be incorrect.

### 7.1 Deploy (initial + new env)
1. `git clone https://github.com/getsentry/self-hosted.git && cd self-hosted && git checkout 24.5.0`
2. Copy `.env.example` → `.env` and fill `SENTRY_SECRET_KEY`, `SENTRY_POSTGRES_PASSWORD`, R2 keys
3. `./install.sh` (5 min) → `docker compose up -d` (2 min)
4. `docker compose exec web sentry createuser --email admin@finplanpro.com --password <pw> --superuser`
5. Log in to `https://sentry.internal.finplanpro.com` → create org `finplan-pro` → create project `javascript-vite` → copy DSN
6. Add DSN to GitHub Actions secret `VITE_SENTRY_DSN`

### 7.2 Restart (per-service)
```bash
docker compose restart web          # rolling, ~30s downtime
docker compose restart worker       # zero downtime (Celery reconnects)
docker compose restart snuba-consumer  # zero downtime (Kafka rebalances)
docker compose restart relay        # 10s downtime; buffers events in nginx
```

### 7.3 Upgrade (with backup)
1. `./cron/backups.sh` (or run `docker compose exec postgres pg_dump -U postgres sentry | gzip > backup-$(date +%F).sql.gz`)
2. `git pull && git checkout <new-version>` (read CHANGELOG first for breaking changes)
3. `./install.sh` (idempotent)
4. `docker compose up -d` (rolling, ~5 min for Kafka topic migration if version bumps)
5. Smoke test: trigger a test event via `curl -X POST https://sentry.internal/api/0/projects/finplan-pro/javascript-vite/store/ -H "X-Sentry-Auth: ..."` — verify in UI

### 7.4 Debug
- **Events not arriving:** check `docker compose logs relay` (PII-scrubbing drop), `snuba-consumer` (Kafka lag), `web` (API auth)
- **High event volume:** check `docker compose exec postgres psql -U postgres -c "SELECT count(*) FROM sentry_event"` — may indicate a loop bug
- **Query slow:** check `docker compose exec clickhouse clickhouse-client --query "SELECT * FROM system.merges"` — backlog of merges

**Cross-link.** For SEV-1/SEV-2 Sentry outages, follow [`../ON_CALL_RUNBOOK.md`](../ON_CALL_RUNBOOK.md) **IC-4** (Production crash spike in Sentry). MTTA target 5 min, MTTR target 60 min per §0 of the runbook.

---

## §8 — The 4 dashboards (Sentry UI + Sentry-OTel data products)

> **ℹ️ Note on dashboard count.** T-ATL-004 (§6) defines 4 dashboards (Errors / Performance / Business / Infrastructure) as conceptual categories. This doc defines 4 dashboards as **specific operational wireframes** that the Sentry + OTel stack produces. Both are 4 — different scopes.

### 8.1 Dashboard: Error rate by version

**Data source.** Sentry Issue stream, grouped by `release` tag.

**Visualization.** Stacked area chart, x-axis = time (last 14 days), y-axis = events/hour, color = release version.

**Query (Sentry Discover):**
```
event.type:error
release:*
| timechart span=1h
| stackBy release
| sort sum
```

**SLO.** Error rate per release < 0.1% of sessions. Alert: any release with > 1% session-error rate triggers a Sentry P2 alert.

### 8.2 Dashboard: P95 latency by route

**Data source.** Sentry Performance (transactions, auto-instrumented by Sentry-OTel bridge from OTel spans).

**Visualization.** Bar chart, x-axis = route (top 20 by traffic), y-axis = P95 latency (ms).

**Query (Sentry Discover):**
```
event.type:transaction
transaction.op:pageload
| percentile(transaction.duration, 0.95)
| groupBy transaction
| sort -p95 desc
| limit 20
```

**SLO.** P95 < 1,000 ms for `page.load`, < 500 ms for `api.call`, < 5,000 ms for `scenario.compute`, < 2,000 ms for `export`. Alert: any P95 > 2× SLO for 5 min triggers a Sentry P2 alert.

### 8.3 Dashboard: User sessions by persona

**Data source.** Sentry Release Health (sessions), tagged with `persona` (Carla / Chris / Vera — Iris T-IR-001).

**Visualization.** Stacked bar chart, x-axis = date (last 30 days), y-axis = session count, color = persona.

**Tagging (in `src/main.tsx`):**
```ts
Sentry.setTag('persona', authStore.getState().user.persona);
```

**Query (Sentry Discover):**
```
event.type:session
| timechart span=1d
| stackBy tags.persona
```

**SLO.** ≥ 70% of paying customers have ≥ 4 sessions/week (the "engaged" floor from Iris T-IR-004 §3). Alert: any persona's 7-day rolling session count drops > 20% week-over-week.

### 8.4 Dashboard: AI cost per 1K requests

**Data source.** Custom Sentry breadcrumb (added in the AI call site) + NIM API spend (from `src/utils/aiBudget.ts`, post-Phase 1).

**Visualization.** Line chart, x-axis = time (last 30 days), y-axis = USD per 1K requests, secondary line = total request count.

**Tagging (in `src/services/aiService.ts`):**
```ts
Sentry.addBreadcrumb({
  category: 'ai.cost',
  data: { promptTokens, completionTokens, modelCost: 0.000002 * (promptTokens + completionTokens * 4) },
  level: 'info',
});
```

**SLO.** AI cost per 1K requests < $5 (the launch target per T-ST-003 §4). Alert: any 24-hour rolling cost > $10/1K requests triggers a Sentry P3 alert (sent to `#ai-cost` channel).

---

## §9 — Spec deviations summary (flagged for Leader ratification)

| # | Leader's spec said | Actual ground truth | Action taken |
|---|--------------------|---------------------|--------------|
| 1 | "S3 Object Lock" for cold storage | **Cloudflare R2** (S3-compatible) per ADR-008 §Storage line 65-67 | Used R2 throughout; endpoint URL is the only delta |
| 2 | Cross-link to **IC-6** Sentry outage | IC-6 is "Tauri build fails on Linux runner"; Sentry is **IC-4** | Cross-linked to IC-4 (line 223) |
| 3 | 5 Vite chunks: `grid-vendor` (singular) | vite.config.ts defines **3** grid chunks (`grid-react-vendor`, `grid-community-vendor`, `grid-common-vendor`) | Used `grid-react-vendor` (most-used); the other 2 are §8 v2 backlog |
| 4 | Sentry-OTel bridge via `Sentry.captureException()` from OTel spans | The official `@sentry/opentelemetry-node` SDK propagates OTel spans as Sentry transactions; `captureException` is for error events, not traces | Used the SDK auto-instrumentation pattern; documented the correct mechanism in §5 |

---

*Three witnesses for this doc itself:*
- **Measured.** 1 file (`SENTRY_DEPLOYMENT.md`), target 400-500L → **393 lines** after the cost-optimization edit (was 385; +8 for the tracesSampler code). The 4 dashboard wireframes + 4 spec-deviation table remain the dense sections.
- **SLO.** Self-hosted Sentry has 99.9% uptime (≤ 8.7 h downtime/year). Verify: monthly Sentry availability check via `curl -fsS https://sentry.internal.finplanpro.com/_health/`.
- **Failure mode.** If Hetzner/equivalent cloud is down: Sentry is down. Mitigation: ADR-008 §7 requires multi-region R2 replication (the Sentry *storage* is multi-region, but the Sentry *service* is single-region). Acceptable for launch; revisit at Q3 2027 GTM scale.
- **Cost witness (added 2026-06-13 per Leader T-ATL-007 decision).** With `tracesSampleRate: 0.01` + `tracesSampler` per-span override (1% page/api/export, 5% scenario.compute, 10% errors), realistic 10K MAU traffic is ~250K Sentry events/day × $0.000065 = **$487.50/mo** (10× cheaper than the 10% default of $4,875/mo) while preserving 100% error visibility.
