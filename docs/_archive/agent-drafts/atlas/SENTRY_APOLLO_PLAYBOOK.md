<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->
# Sentry SDK install SOP — Apollo post-push human-verified step-by-step

> **Companion to.** [`./SENTRY_SDK_INSTALL_PATCH.md`](./SENTRY_SDK_INSTALL_PATCH.md) (T-ATL-009, ACCEPTED 2026-06-13) — the `git apply`-ready patch.
> **When to use this doc instead of T-ATL-009.** (a) `git apply` reports a hunk conflict, (b) you want a human-verified step-by-step (not a 3-commit patch), (c) you're reviewing the patch before applying, (d) you want a troubleshooting tree when something breaks.
> **Author.** Atlas (DevOps & Infrastructure) — 10th Muse, slot `019ebd9c-bf19-7110-8710-864159fd33ba`.
> **Audience.** Apollo (the engineer running `git push` post-T-AP-001 unblocker). Estimated apply time: 8 min + 5 min verification.

---

## §1 — Pre-apply state verification (60 sec)

**Witness 1 (rule).** Before touching any file, confirm the ground state. If the ground state is wrong (e.g., a `@sentry/*` dep already snuck in from a different PR), the patch may double-add or conflict.

**Witness 2 (evidence — run these 4 commands, expect 0 matches each):**

```bash
cd /c/Users/Tahir/Desktop/frontend\ that\ i\ want/fpa

# 1. No @sentry/* in package.json
grep -c '"@sentry' package.json
# Expected: 0

# 2. No @sentry/opentelemetry-node in package.json
grep -c '@sentry/opentelemetry-node' package.json
# Expected: 0

# 3. No sentryVitePlugin in vite.config.ts
grep -c 'sentryVitePlugin' vite.config.ts
# Expected: 0

# 4. No Sentry.init in src/main.tsx
grep -c 'Sentry.init' src/main.tsx
# Expected: 0

# 5. No sentryPiiScrubber in src/utils/
ls -la src/utils/sentryPiiScrubber.ts 2>&1
# Expected: "No such file or directory"
```

If any command returns > 0: stop, investigate. The patch is designed for a clean state.

**Witness 3 (failure mode / consequence).** If the ground state is dirty (e.g., another PR already added `@sentry/react`), the patch will create duplicate deps, duplicate `Sentry.init()` calls, or break the build with "module not found" cascades. The 60-second pre-check is cheaper than the 30-min debug session.

---

## §2 — Apply the 4 file changes (4 min)

Apply in this exact order. **Do not parallelize the 4 commits** — the build verification at the end of each step catches errors early.

### §2.1 — `package.json` (60 sec)

**Witness (rule).** 3 new deps in `dependencies`, 1 new dep in `devDependencies`. The order in the file matters for readability (alphabetical) but not for npm install.

```bash
# Read the current dependencies block
grep -n '"@tauri' package.json
# Should show 4 lines around L31-34

# Add 3 lines after the @tauri-apps/plugin-sql line (alphabetical):
#   "@sentry/opentelemetry-node": "^0.4.0",
#   "@sentry/react": "^8.40.0",
#   "@sentry/vite-plugin": "^2.22.0",
# (Order: the @sentry/* cluster goes after @opentelemetry/* if present, or before @tauri-apps/ in current file. Check file:30-35.)
```

**Verification.**
```bash
grep -c '"@sentry' package.json
# Expected: 3
```

> **ℹ️ Version notes (per Leader T-ATL-009 ACK):** caret versions (`^x.y.z`) for consistency with the rest of the deps. If npm install fails with `E404 NOT FOUND` for any version, bump to the nearest available — Sentry's release cadence is monthly.

### §2.2 — `vite.config.ts` (90 sec)

**Witness (rule).** Add the `sentryVitePlugin` import + 7-line plugin call **before** `react()`. Plugin order matters: `sentryVitePlugin` must run before `react()` so it captures the source maps of React's JSX output.

```typescript
// Add at top, after `import path from 'path';` (line 3)
import { sentryVitePlugin } from '@sentry/vite-plugin';

// Add inside the `plugins: [` array, BEFORE the `react()` call
sentryVitePlugin({
  org: 'finplan-pro',
  project: 'javascript-vite',
  authToken: process.env.SENTRY_AUTH_TOKEN,  // CI-only; safe in browser bundle when undefined
  release: process.env.GITHUB_REF_NAME || 'dev',
  deploy: { env: process.env.NODE_ENV || 'development' },
  sourcemaps: { assets: './dist/**', filesToDeleteAfterUpload: ['*.js.map'] },
}),
```

**Verification.**
```bash
grep -A 8 'sentryVitePlugin' vite.config.ts
# Expected: import line + 7-line plugin call
```

### §2.3 — `src/main.tsx` (90 sec)

**Witness (rule).** The Sentry init block is the **first import** in the file (above even the React import). Reason: `Sentry.init()` installs the global error handler; anything that throws before `Sentry.init()` won't be captured.

**Insert the full ~60-line block from T-ATL-009 §2.3** above the existing `import React from 'react';` line. The block includes:
- `import * as Sentry from '@sentry/react';`
- `import { SentrySpanProcessor } from '@sentry/opentelemetry-node';`
- `import { NodeSDK } from '@opentelemetry/sdk-node';`
- `import { scrubPII } from './utils/sentryPiiScrubber';`
- `if (import.meta.env.VITE_SENTRY_DSN) { Sentry.init({...}); otelSDK.start(); }`

**Verification.**
```bash
head -70 src/main.tsx | grep -c 'Sentry'
# Expected: ≥ 5 (init, consoleIntegration, httpClientIntegration, breadcrumbsIntegration, globalHandlersIntegration)
```

### §2.4 — `src/utils/sentryPiiScrubber.ts` (60 sec, new file)

**Witness (rule).** This is a NEW file. The full source listing is in T-ATL-009 §2.4 (75 LOC, recursive PII walker per ADR-008 §3 catalog).

**Apply with:**
```bash
# Create the file with the content from T-ATL-009 §2.4
# (copy the entire ```ts block from §2.4 into a new file at src/utils/sentryPiiScrubber.ts)
```

**Verification.**
```bash
wc -l src/utils/sentryPiiScrubber.ts
# Expected: ~75 lines (the source listing is 75 LOC)

grep -c "export function scrubPII" src/utils/sentryPiiScrubber.ts
# Expected: 1
```

---

## §3 — Verify (5 min, in this exact order)

### §3.1 — `npm install` (90 sec)

```bash
npm install
# Expected: 3 new packages + 1 new dev dep added. No errors.
# If E404: version pin is stale, bump to nearest available (see §2.1 note).
```

### §3.2 — Type check (60 sec)

```bash
npx tsc --noEmit
# Expected: 0 errors
# If errors: usually a Sentry type changed between minor versions.
#   Read the error, find the new method signature in @sentry/react@latest docs.
#   Common: `SentrySpanProcessor` moved to `@sentry/opentelemetry` package in newer versions.
```

### §3.3 — Lint (30 sec)

```bash
npx eslint src --max-warnings 0
# Expected: 0/0
# If errors: usually unused imports from @sentry/react.
#   Add `// eslint-disable-next-line @typescript-eslint/no-unused-vars` if intentional, or remove the import.
```

### §3.4 — Test (90 sec, parallel to lint if configured)

```bash
npm test
# Expected: 8,350+ tests passing, 0 failing (assumes T-AP-001 P0 #0 worker-mock fix is in)
# If new failures appear: check if any test imports @sentry/* directly. Wrap test imports in
#   `vi.mock('@sentry/react', () => ({ captureException: vi.fn(), init: vi.fn() }))` at top of test.
```

### §3.5 — Build (90 sec)

```bash
npm run build
# Expected: dist/ generated, main chunk < 150 KB gzip, total < 2 MB gzip
# Expected bundle size: main 55.95 kB gzip → ~63.95 kB gzip (+8 kB from Sentry init)
# If bundle > 150 KB: see §5 troubleshooting #5
```

**Witness (rule — pass criterion).** All 5 gates green. If any gate fails, **do not push** — fix the gate, then re-run all 5.

**Witness (evidence — bundle budget).** Per the T-AP-001 verified positives: pre-apply main = 55.95 kB gzip (62.5% headroom under 150 KB budget). Post-apply expected = ~63.95 kB gzip (57.4% headroom). If you see main > 75 kB gzip post-apply, something imported the Sentry SDK eagerly instead of using `Sentry.lazyLoadIntegration()`.

---

## §4 — Post-apply monitoring (within 30 min of first deploy to prod)

### §4.1 — First Sentry event arrives in 5 min

**Witness (rule).** After the next production deploy, the Sentry UI (https://sentry.io/organizations/finplan-pro/issues/) should show 1-3 events within 5 min (the Sentry init itself logs a "test" event, plus any unhandled errors from the previous 5 min of session activity).

**Verification.**
```bash
# Open Sentry UI in browser
# Click Issues → should see at least 1 event tagged with the new release
# If 0 events after 15 min: check §5 troubleshooting #1
```

### §4.2 — `tracesSampleRate` sanity check (1 min)

**Witness (rule).** The `tracesSampleRate: 0.01` setting means ~1% of page loads create a transaction. With 10K MAU × 50 spans × 5 pages/day × 1% = 250K transactions/day, which at $0.000065/event = **$487.50/mo** (per T-ATL-007 §3 cost optimization).

**Verification.** In Sentry UI → Performance → Throughput chart, expect ~2,500 transactions/hour at steady state (10K MAU × 5 pages/day × 1% = 50K transactions/day / 24h ≈ 2,000/hour). If you see 10× that (25K/hour), the sampler is broken — check `tracesSampler` override logic.

### §4.3 — PII scrubber sanity test (5 min)

**Witness (rule).** Trigger an error that has a breadcrumb with PII (e.g., a user types their email into a form, then throws a validation error). Verify the breadcrumb in Sentry shows `[Redacted]` instead of the actual email.

**Verification.**
```bash
# 1. Open the app in dev mode
# 2. Navigate to a form (e.g., /settings/profile)
# 3. Type a test email: "test@example.com"
# 4. Submit a form that throws a validation error
# 5. Check Sentry → Issue details → Breadcrumbs
# 6. The most recent breadcrumb's "data.email" should be "[Redacted]"
```

**Failure mode.** If the email shows unredacted: `scrubPII` wasn't called in the `beforeSend` callback. Check `src/main.tsx` `beforeSend` block is present and references `scrubPII`.

---

## §5 — Troubleshooting tree (6 common failure modes)

### #1 — DSN not set in production build → silent degradation

**Symptom:** No Sentry events in 15+ min after deploy.
**Cause:** `VITE_SENTRY_DSN` env var missing from CI's build environment.
**Fix:**
```bash
# Check CI env
echo $VITE_SENTRY_DSN
# If empty: add to .github/workflows/release.yml env block

# Locally verify the bundled DSN is present
grep -r "VITE_SENTRY_DSN" dist/assets/*.js | head -3
# Expected: shows the DSN value (it's inlined by Vite at build time)
```

### #2 — Build fails on `sentryVitePlugin`

**Symptom:** `npm run build` errors with `TypeError: sentryVitePlugin is not a function` or `Cannot find module '@sentry/vite-plugin'`.
**Cause:** `npm install` didn't complete; lockfile drift; or version pin is wrong.
**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
# If still fails: check the version pin in package.json matches the Sentry release matrix
```

### #3 — OTel peer dep missing

**Symptom:** `npm install` warns about missing peer dep `@opentelemetry/api`.
**Cause:** `SentrySpanProcessor` requires `@opentelemetry/api` as a peer dep; Sentry SDK provides it transitively but Vitest's strict peer-dep check can flag it.
**Fix:** Add explicit devDep:
```bash
npm i -D @opentelemetry/api@^1.9.0
# Or update `overrides` in package.json:57-63 to pin the OTel version
```

### #4 — PII scrubber typing issue (TypeScript)

**Symptom:** `npx tsc --noEmit` errors on `scrubPII(b.data)`. E.g., `Type 'unknown' is not assignable to type 'Record<string, unknown>'`.
**Cause:** The `data` field on Sentry breadcrumbs is typed as `Record<string, any>`, which doesn't satisfy `Record<string, unknown>` for the `scrubPII` generic.
**Fix:** Adjust the type assertion:
```typescript
event.breadcrumbs = event.breadcrumbs.map(b => ({
  ...b,
  data: b.data ? scrubPII(b.data as Record<string, unknown>) : undefined,
}));
```

### #5 — Bundle too large (main > 150 KB gzip)

**Symptom:** `npm run build` warns "main chunk > 150 KB gzip".
**Cause:** Some `@sentry-internal/*` package was eagerly imported.
**Fix:** Mark them as external in `vite.config.ts`:
```typescript
build: {
  rollupOptions: {
    external: ['@sentry-internal/browser-utils', '@sentry-internal/feedback'],
  },
},
```

### #6 — Test env noise (Sentry init in Vitest)

**Symptom:** `npm test` shows 8,000+ console warnings from Sentry SDK.
**Cause:** The `if (import.meta.env.VITE_SENTRY_DSN)` guard is true in test if `.env.test` has the DSN.
**Fix:** Either (a) set `VITE_SENTRY_DSN=` (empty) in `.env.test`, OR (b) add `vi.mock('@sentry/react', () => ({ init: vi.fn(), captureException: vi.fn() }))` at the top of any test file that imports Sentry.

---

## §6 — Cross-links

- **Patch source.** [`./SENTRY_SDK_INSTALL_PATCH.md`](./SENTRY_SDK_INSTALL_PATCH.md) (T-ATL-009, ACCEPTED 2026-06-13) — the `git apply`-ready patch with inline diffs
- **Parent spec.** [`./SENTRY_DEPLOYMENT.md`](./SENTRY_DEPLOYMENT.md) (T-ATL-007, ACCEPTED 2026-06-13) — full deployment doc, 9 sections including the OTel bridge
- **OTel parent.** [`../OBSERVABILITY_STACK.md`](../OBSERVABILITY_STACK.md) (T-ATL-004, ACCEPTED 2026-06-13) — the 4 dashboards + OTel setup
- **Sibling contingency.** [`./HUSKY_300S_TIMEOUT_BUMP.md`](./HUSKY_300S_TIMEOUT_BUMP.md) (T-ATL-011, ACCEPTED 2026-06-13) — if Sentry SDK install pushes tsc over 240s, apply this patch
- **Sibling on-call.** [`../ON_CALL_RUNBOOK.md`](../ON_CALL_RUNBOOK.md) IC-4 (T-ATL-003) — "Production crash spike in Sentry" — the on-call runbook for when this all goes wrong
- **PII catalog source.** [`../../drafts/adr/ADR-008-audit-logging.md`](../../drafts/adr/ADR-008-audit-logging.md) §3 (Hephaestus T-HEP-003) — the canonical PII key list the scrubber implements
- **Pending.** T-HEP-009 (Hephaestus) — PII scrubber test suite (the 7-case test stub at the bottom of `src/utils/sentryPiiScrubber.ts` is Hephaestus's lane)
- **Pending.** T-ATL-014 (Atlas) — Sentry self-test CI check (Sentry CI integration to verify SDK is installed, DSN set, source maps uploaded)

---

**End of SOP. 6 sections, 8 min apply, 5 min verify, 6 troubleshooting recipes. — Atlas 2026-06-13 08:18 IST**
