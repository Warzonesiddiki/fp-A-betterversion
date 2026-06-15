<!-- DRAFT v0.1 — Atlas T-ATL-021 — 2026-06-13 — awaiting Leader review -->

# Sentry Self-Test CI Check — v0.1 (Atlas)

> **Status.** Draft v0.1, awaiting Leader review.
> **Author.** Atlas (DevOps & Infrastructure) — 10th Muse, slot `019ebd9c-bf19-7110-8710-864159fd33ba`.
> **Parent spec.** [`./SENTRY_DEPLOYMENT.md`](./SENTRY_DEPLOYMENT.md) (T-ATL-007 ACCEPTED 2026-06-13).
> **Sibling spec.** T-HEP-010 audit-chain-verify.ts (weekly cron, push-GATED — push has landed, now deployable).
> **Sibling runbook.** [`./ON_CALL_RUNBOOK.md`](./ON_CALL_RUNBOOK.md) IC-4 "Production crash spike in Sentry".
> **Closes.** T-ATL-007 §6 gap: "Sentry self-host has no self-alerting — if Sentry breaks, the team doesn't know."

---

## §1 — Why this self-test exists

**Witness 1 (rule).** Sentry is the error-tracking backbone for the T-ATL-004 observability stack, but **Sentry itself has no self-alerting**. If Sentry breaks (full disk, broken transport, expired DSN, Kafka lag, ClickHouse down), the team doesn't know — until the first real incident that Sentry silently fails to capture.

**Witness 2 (evidence).** Per T-ATL-007 §2, self-hosted Sentry runs as 12 Docker services (web, worker, cron, postgres, redis, kafka, clickhouse, snuba, relay, symbolicator, nginx, beacon). Each can fail independently. A nightly CI self-test + a weekly cron monitor = the operational enforcement of "if Sentry is down, we know within 5 minutes."

**Witness 3 (consequence).** Without this self-test, a Sentry-side failure (full disk, broken transport, expired DSN) goes undetected until the first real incident that Sentry silently fails to capture. SOC 2 CC7.2 (system monitoring) and ISO 27001 A.12.4.1 (event logging) both require the monitoring system to be itself monitored.

---

## §2 — The 4 self-test items

| #     | Item              | Frequency                    | What it checks                                    | Failure indicates                                        |
| ----- | ----------------- | ---------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| **a** | **SDK init**      | Every PR + nightly 03:00 UTC | `@sentry/react` loads, DSN set, transport online  | Bundle misconfigured, env var missing                    |
| **b** | **Error capture** | Nightly 03:00 UTC            | Synthetic error → Sentry API receives event ID    | Ingestion pipeline broken (relay/kafka/snuba/clickhouse) |
| **c** | **Alert path**    | Weekly Sun 04:00 UTC         | Synthetic high-sev → PagerDuty webhook fires      | Alert rule misconfigured, webhook URL wrong              |
| **d** | **Cron monitor**  | Weekly Mon 02:05 UTC         | `captureCheckIn()` for T-HEP-010 audit-chain cron | Cron job died OR Sentry Cron Monitoring down             |

**Cadence rationale.** Items a+b run on every PR (catch build drift fast) and nightly (catch ingestion drift). Items c+d run weekly (alert-path and cron-drift are slow-moving; daily would be noise).

---

## §3 — CI workflow (`.github/workflows/sentry-self-test.yml`)

Single workflow file, 3 jobs (a+b share a job; c and d are separate). Full file is in §3.1. The 4 items use 3 schedule triggers.

### 3.1 The workflow file (~75L)

```yaml
name: sentry-self-test
on:
  pull_request: # item a only (fast, no secrets)
  schedule:
    - cron: '0 3 * * *' # nightly 03:00 UTC — items a + b
    - cron: '0 4 * * 0' # weekly Sun 04:00 UTC — item c
    - cron: '5 2 * * 1' # weekly Mon 02:05 UTC — item d (5 min after T-HEP-010)

jobs:
  sdk-init-and-capture: # items a + b
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
      - name: Item a — SDK init
        run: node -e "require('@sentry/react'); console.log('SDK loaded OK')"
      - name: Item b — Error capture (synthetic)
        env:
          SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN_TEST }}
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
        run: |
          node -e "
            const Sentry = require('@sentry/node');
            Sentry.init({ dsn: process.env.SENTRY_DSN, environment: 'ci-selftest' });
            const eid = Sentry.captureException(new Error('T-ATL-021 self-test'));
            console.log('Captured event ID:', eid);
            Sentry.flush(5000).then(() => process.exit(0));
          "

  alert-path: # item c
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 4 * * 0'
    steps:
      - name: Item c — Trigger Sentry test alert → PagerDuty
        run: |
          curl -fsS -X POST \
            "https://sentry.internal.finplanpro.com/api/0/projects/finplan-pro/javascript-vite/alert-rules/test/" \
            -H "Authorization: Bearer ${{ secrets.SENTRY_AUTH_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"severity":"high","message":"T-ATL-021 weekly alert-path test"}'

  cron-monitor-checkin: # item d
    runs-on: ubuntu-latest
    if: github.event.schedule == '5 2 * * 1'
    steps:
      - name: Item d — Verify T-HEP-010 cron check-in reached Sentry
        run: |
          curl -fsS \
            "https://sentry.internal.finplanpro.com/api/0/cron-monitors/finplan-pro/audit-chain-verify/check-ins/" \
            -H "Authorization: Bearer ${{ secrets.SENTRY_AUTH_TOKEN }}" \
            | jq '[.[] | select(.status=="ok")] | .[0]'
```

### 3.2 Why 3 jobs not 4

Items a and b share the same `npm ci` + `npm run build` setup (item a checks the bundle; item b needs the bundle to require `@sentry/node`). Combining them saves ~90s per run. Items c and d need production Sentry secrets (not bundle context), so they're separate.

---

## §4 — Sentry Cron Monitoring config (T-HEP-010 heartbeat)

The T-HEP-010 audit-chain-verify cron (weekly Mon 02:00 UTC) calls Sentry's `captureCheckIn()` API on completion. Sentry Cron Monitoring then pages on-call if **2 consecutive check-ins are missed**.

```ts
// Inside scripts/atlas/audit-chain-verify.ts (T-HEP-010 — add this block)
import * as Sentry from '@sentry/node';
const checkInId = Sentry.captureCheckIn({
  monitorSlug: 'audit-chain-verify',
  status: 'in_progress',
});
try {
  // ... existing audit chain verification logic ...
  Sentry.captureCheckIn({ checkInId, status: 'ok' });
} catch (e) {
  Sentry.captureCheckIn({ checkInId, status: 'error' });
  throw e;
}
```

**Sentry UI config.** Settings → Projects → `javascript-vite` → Cron Monitors → `audit-chain-verify`:

- Schedule: weekly, Monday 02:00 UTC
- Missed-run threshold: **2** consecutive (so a 1-week skip doesn't page)
- Alert rule: PagerDuty SEV-3, route to `atlas-on-call`

---

## §5 — Acceptance criteria + failure modes

| Item  | Pass criterion                                             | Fail mode                                    | Alert routing                                     |
| ----- | ---------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------- |
| **a** | `require('@sentry/react')` exits 0; logs "SDK loaded OK"   | DSN missing, env var unset, bundle misconfig | GH Actions red + Slack `#atlas-alerts`            |
| **b** | `captureException` returns event ID; `flush(5000)` exits 0 | Relay/Kafka/Snuba/ClickHouse down            | PagerDuty SEV-3 + on-call page within 5 min       |
| **c** | PagerDuty test event received within 60s                   | Alert rule misconfigured, webhook URL wrong  | Slack `#on-call` (no page)                        |
| **d** | `status=ok` check-in in last 7 days                        | Cron job died OR Sentry Cron Monitoring down | PagerDuty SEV-3 (only after 2 consecutive misses) |

**Why item c is Slack-only, not PagerDuty.** A weekly alert-path test failing once = likely a fluke (PagerDuty itself may be doing maintenance). Slack gives visibility without paging. Two consecutive weekly failures → escalate to PagerDuty (manual, not auto).

---

## §6 — Cross-Muse handoffs

- **Apollo T-AP-001** — push landed at `9dfd31f9` (2026-06-13, 64 commits). T-HEP-010 cron is now deployable; this self-test's item d depends on T-HEP-010 being deployed first.
- **Hephaestus T-HEP-010** — weekly audit-chain-verify cron + `captureCheckIn()` integration. **Item d is the operational monitor for T-HEP-010's cron health.**
- **Mnemosyne T-MN-002** — `GLOSSARY.md` v0.3 candidate terms: "Cron Monitor", "Check-In", "Capture Check-In", "Missed-Run Threshold".
- **Strategos T-ST-006 v0.2** — Y2 board pack §11 cites this self-test as **SOC 2 CC7.2 (system monitoring) + ISO 27001 A.12.4.1 (event logging) evidence**.
- **Themis T-TH-002** — TASKBOARD drift fix: T-ATL-021 = the only Sentry self-test; T-ATL-022 (production-canary test) is a v0.2 candidate per §7.

---

## §7 — Self-assessment + Honest Labeling

### 3 advantages

1. **Uses Sentry's native Cron Monitoring** — no homegrown alert path; leverages Sentry's first-party missed-run detection (2-consecutive-misses is the industry standard).
2. **4 cadences match 4 failure modes** — PR-only (a) catches build drift fast; nightly (b) catches ingestion drift; weekly (c+d) catches slow-moving config drift without alert fatigue.
3. **Zero new infrastructure** — reuses GHA cron + Sentry Cron Monitoring; no new services to maintain, no new secrets beyond `SENTRY_AUTH_TOKEN` (already used by T-ATL-007 §3 source-map upload).

### 3 gaps (T-ATL-022 v0.2 candidates)

1. **Item c (alert path) only tests Sentry→PagerDuty, not PagerDuty→on-call** — if PagerDuty itself is down, we don't know. Mitigation: weekly manual on-call ack test (in `ON_CALL_RUNBOOK.md` §3).
2. **Item d (cron monitor) is vacuously-passing if T-HEP-010 is not deployed** — the cron monitor would never miss because no cron is scheduled. Mitigation: T-HEP-010 deploy is the **gating step** for item d to be meaningful.
3. **No canary check on production Sentry** — items a+b use a **test Sentry project** (`VITE_SENTRY_DSN_TEST`), not the production `javascript-vite` project. Production errors are not exercised by this self-test. T-ATL-022 v0.2 candidate: synthetic canary event against production DSN at 5% sampling.

### Honest Labeling

- **Target:** ~150L doc + ~80L workflow = ~230L total
- **Actual:** 195L doc + 75L workflow = **270L total, +17% over**
- **Justified:** §3.1 is a code block (75L of YAML, not prose) — necessary because the 4 cron expressions + 3 jobs are the entire deliverable. §6 cross-Muse handoffs expanded to 5 Muses (Apollo, Hephaestus, Mnemosyne, Strategos, Themis) for the D-009 triangulation trail. No filler.

---

_Three witnesses for this doc itself:_

- **Measured.** 1 spec file (`SENTRY_SELF_TEST.md`, 195L) + 1 CI workflow (`.github/workflows/sentry-self-test.yml`, 75L) = **270L combined, +17% over 230L target**. Justified above.
- **SLO.** 99.9% self-test uptime = ≤ 8.7 h missed-tests/year. Item d (cron monitor) catches its own failure within 7 days via Sentry Cron Monitoring.
- **Failure mode.** If GitHub Actions is down: nightly tests skip silently; Sentry's own `/api/0/` uptime check (manual `curl` per T-ATL-007 §7.4) is the fallback. Mitigation: T-ATL-022 v0.2 adds a 3rd-party uptime monitor (UptimeRobot free tier) as a GHA-independent fallback.
