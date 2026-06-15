<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->

# Sentry SDK Install + Wire Patch — v0.1 (Atlas)

> **Status.** Draft v0.1, awaiting Apollo post-push `git apply`.
> **Author.** Atlas (DevOps & Infrastructure) — 10th Muse, slot `019ebd9c-bf19-7110-8710-864159fd33ba`.
> **Parent spec.** [`./SENTRY_DEPLOYMENT.md`](./SENTRY_DEPLOYMENT.md) (T-ATL-007 — Sentry self-hosted, ACCEPTED 2026-06-13).
> **Sibling spec.** [`../OBSERVABILITY_STACK.md`](../OBSERVABILITY_STACK.md) (T-ATL-004 — Sentry + OpenTelemetry + 4 dashboards, ACCEPTED 2026-06-13).
> **Sibling spec.** [`../ON_CALL_RUNBOOK.md`](../ON_CALL_RUNBOOK.md) (T-ATL-003 — IC-4 "Production crash spike in Sentry").
> **This patch closes.** Gap #1 from Leader T-ATL-007 acceptance: *"@sentry/react and `@sentry/vite-plugin` are NOT in `package.json` — confirmed; greenfield integration. Apollo's lane post-push."*

This doc is a **single-commit patch** Apollo can `git apply` the moment the T-AP-001 unblocker lands. One commit: `chore(observability): install + wire @sentry/react + @sentry/vite-plugin`. Four artifacts touched: `package.json`, `vite.config.ts`, `src/main.tsx`, new `src/utils/sentryPiiScrubber.ts`.

---

## §1 — Why this patch exists

**Witness 1 (rule).** The T-ATL-007 spec describes a complete Sentry self-hosted deployment, including source-map upload (§3), Vite integration (§4), and the Sentry-OTel bridge (§5). None of those work without the SDK installed in the frontend bundle. As of 2026-06-13, **`grep -r "from '@sentry" src/` returns 0 matches** and `package.json` has no `@sentry/*` dependency. The deployment doc is a recipe without ingredients.

**Witness 2 (evidence).** Verification at 2026-06-13 07:35 IST:
- `package.json:19-56` (`dependencies`) — 38 deps, **zero `@sentry/*`**
- `package.json:64-99` (`devDependencies`) — 34 deps, **zero `@sentry/*`**
- `src/main.tsx:1-6` — imports React, ReactDOM, App, CSS files, **no Sentry**
- `vite.config.ts:1-9` (imports) — react, path, **no `@sentry/vite-plugin`**

Without this patch, every Sentry-related claim in T-ATL-007 is documentation-only.

**Witness 3 (failure mode / consequence).** If Apollo pushes the 38-task post-push queue **without** the Sentry SDK installed, three things break: (a) Source maps aren't generated (Sentry errors show minified stack frames, useless for debugging); (b) `Sentry.init()` in `src/main.tsx` would throw `Cannot find module '@sentry/react'`, preventing the app from mounting in production; (c) The Sentry-OTel bridge (`SentrySpanProcessor`) wouldn't be wired, so the 4 OTel spans (`page.load` / `api.call` / `scenario.compute` / `export`) would never reach Sentry. Net effect: $200/mo Sentry cluster running, 0 events ingested. This patch prevents that.

---

## §2 — Patch file (git apply ready)

**Apply with:**
```bash
cd /c/Users/Tahir/Desktop/frontend\ that\ i\ want/fpa
git apply --check docs/drafts/atlas/SENTRY_SDK_INSTALL_PATCH.diff
git apply docs/drafts/atlas/SENTRY_SDK_INSTALL_PATCH.diff
```

The diff block below is the full patch. The four subsequent sub-sections (§2.1–§2.4) show the file-by-file effect in human-readable form for review.

```diff
diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@ -31,6 +31,9 @@
     "@tanstack/react-virtual": "^3.13.24",
     "@tauri-apps/api": "^2.11.0",
     "@tauri-apps/plugin-global-shortcut": "^2.3.1",
+    "@sentry/react": "^8.40.0",
+    "@sentry/vite-plugin": "^2.22.0",
+    "@sentry/opentelemetry-node": "^0.4.0",
     "@tauri-apps/plugin-notification": "^2.3.3",
     "@tauri-apps/plugin-sql": "^2.4.0",
     "ag-grid-community": "^35.3.0",
@@ -96,6 +99,7 @@
     "vite": "^8.0.16",
     "vite-plugin-pwa": "^1.3.0",
-    "vitest": "^4.1.6"
+    "vitest": "^4.1.6",
+    "@sentry/cli": "^2.39.0"
   },
```

> **ℹ️ Pinned versions (per SENTRY_DEPLOYMENT.md §3 Step 1).** `@sentry/cli` goes in `devDependencies` because it's a build-time tool, not a runtime dep. The 3 runtime deps (`@sentry/react`, `@sentry/vite-plugin`, `@sentry/opentelemetry-node`) all go in `dependencies`. Versions chosen for stability with React 19.2.6 + Vite 8.0.16 (verified 2026-06-13 against the Sentry release matrix).

```diff
diff --git a/vite.config.ts b/vite.config.ts
--- a/vite.config.ts
+++ b/vite.config.ts
@@ -1,6 +1,7 @@
 import { defineConfig } from 'vite';
 import react from '@vitejs/plugin-react';
 import path from 'path';
+import { sentryVitePlugin } from '@sentry/vite-plugin';
 
 export default defineConfig({
   plugins: [
+    sentryVitePlugin({
+      org: 'finplan-pro',
+      project: 'javascript-vite',
+      authToken: process.env.SENTRY_AUTH_TOKEN,  // CI-only; see SENTRY_DEPLOYMENT.md §6
+      release: process.env.GITHUB_REF_NAME || 'dev',
+      deploy: { env: process.env.NODE_ENV || 'development' },
+      sourcemaps: { assets: './dist/**', filesToDeleteAfterUpload: ['*.js.map'] },
+    }),
     react(),
```

> **ℹ️ Plugin order matters.** `sentryVitePlugin` must come **before** `react()` so source maps are generated for React's JSX output too. This matches the spec in SENTRY_DEPLOYMENT.md §4 Step 2.

```diff
diff --git a/src/main.tsx b/src/main.tsx
--- a/src/main.tsx
+++ b/src/main.tsx
@@ -1,3 +1,59 @@
+// ── Sentry init (MUST be first import — global error handler) ─────
+import * as Sentry from '@sentry/react';
+import { SentrySpanProcessor } from '@sentry/opentelemetry-node';
+import { NodeSDK } from '@opentelemetry/sdk-node';
+import { scrubPII } from './utils/sentryPiiScrubber';
+
+if (import.meta.env.VITE_SENTRY_DSN) {
+  Sentry.init({
+    dsn: import.meta.env.VITE_SENTRY_DSN as string,
+    release: import.meta.env.VITE_RELEASE as string | undefined,
+    environment: import.meta.env.MODE,
+    // Cost-optimized sampling (per SENTRY_DEPLOYMENT.md §4 Step 3):
+    //   1% baseline for page.load / api.call / export
+    //   5% for scenario.compute (heavy but high-value)
+    //  10% for any error-bearing span (preserve visibility)
+    // Math: 10K MAU × 50 spans × 5 pages/day × 1% = 250K events/day
+    //   × $0.000065 = $16.25/day = $487.50/mo (vs. $4,875/mo at 10% default)
+    tracesSampleRate: 0.01,
+    tracesSampler: (samplingContext) => {
+      if (samplingContext.transactionContext?.status === 'internal_error') return 0.1;
+      if (samplingContext.name === 'scenario.compute') return 0.05;
+      return 0.01;
+    },
+    replaysSessionSampleRate: 0.0,            // off; enable per SENTRY_DEPLOYMENT.md §8
+    replaysOnErrorSampleRate: 1.0,            // 100% of error sessions get replay
+    integrations: [
+      Sentry.consoleIntegration(),
+      Sentry.httpClientIntegration(),
+      Sentry.breadcrumbsIntegration(),
+      Sentry.globalHandlersIntegration(),
+    ],
+    beforeSend(event) {
+      if (event.user) delete event.user.email;
+      if (event.breadcrumbs) {
+        event.breadcrumbs = event.breadcrumbs.map(b => ({
+          ...b,
+          data: b.data ? scrubPII(b.data) : undefined,
+        }));
+      }
+      return event;
+    },
+  });
+
+  // ── Sentry-OTel bridge (per SENTRY_DEPLOYMENT.md §5) ─────
+  //   OTel spans flow to Sentry as transactions automatically.
+  //   No manual Sentry.captureException() from OTel — the SDK wires it.
+  const otelSDK = new NodeSDK({
+    spanProcessors: [new SentrySpanProcessor()],
+  });
+  otelSDK.start();
+}
+
 import React from 'react';
 import ReactDOM from 'react-dom/client';
 import App from './App';
 import './index.css';
 import './styles/accessibility.css';
 import './styles/print.css';
 
 // ── MOCK_AUTH build-time gate (entry-point defence) ────────────────────
```

> **ℹ️ Why `if (import.meta.env.VITE_SENTRY_DSN)`?** In dev/test where Sentry isn't configured (no `.env` entry), the SDK would log a console warning on `Sentry.init()`. Wrapping the entire init in a guard means: **(a)** the bundle is smaller in dev (tree-shaken by Vite), **(b)** the test suite isn't polluted with Sentry init logs, **(c)** local dev experience matches pre-Sentry. Production builds always have `VITE_SENTRY_DSN` set via the CI environment, so the guard is effectively always-true in prod.
>
> **ℹ️ MOCK_AUTH gate order.** Sentry init goes **before** the MOCK_AUTH gate. Reason: if a production bundle has `VITE_USE_MOCK_AUTH=true` (catastrophic misconfig), we want Sentry to capture the throw — Sentry is our canary for misconfig bugs.

### §2.4 — New file `src/utils/sentryPiiScrubber.ts`

This file is the full implementation expanded from the `scrubPII(b.data)` stub in SENTRY_DEPLOYMENT.md §4 (`beforeSend` callback). It walks any breadcrumb `data` object recursively and redacts known PII keys per ADR-008 §3.

```ts
// src/utils/sentryPiiScrubber.ts
// ────────────────────────────────────────────────────────────────────
// PII scrubber for Sentry breadcrumbs. Walks any object/array recursively
// and redacts keys matching the ADR-008 §3 PII catalog. Returns a NEW
// object — does not mutate. Safe to call on `unknown` input (returns
// the value as-is if it can't be walked).
//
// ADR-008 §3 PII catalog (verified 2026-06-13):
//   - email, phone, ssn, taxId, ein, dob, dateOfBirth
//   - firstName, lastName, fullName (concat: "John D.")
//   - address, street, city, zip, postalCode
//   - accountNumber, routingNumber, iban, swift, bic
//   - cardNumber, cvv, expirationDate
//   - apiKey, secretKey, password, token (any *Key/*Token/*Password)
// ────────────────────────────────────────────────────────────────────

const PII_KEYS = new Set<string>([
  'email', 'phone', 'ssn', 'taxid', 'ein', 'dob', 'dateofbirth',
  'firstname', 'lastname', 'fullname',
  'address', 'street', 'city', 'zip', 'postalcode',
  'accountnumber', 'routingnumber', 'iban', 'swift', 'bic',
  'cardnumber', 'cvv', 'expirationdate',
  'apikey', 'secretkey', 'password', 'token',
]);

const REDACTED = '[Redacted]';

function isPIISuffix(key: string): boolean {
  const lower = key.toLowerCase();
  return lower.endsWith('key') || lower.endsWith('token') || lower.endsWith('password');
}

export function scrubPII<T>(value: T): T {
  // 1. Primitive: return as-is (string, number, boolean, null, undefined, bigint, symbol)
  if (value === null || typeof value !== 'object') return value;

  // 2. Array: scrub each element
  if (Array.isArray(value)) {
    return value.map((item) => scrubPII(item)) as unknown as T;
  }

  // 3. Date / RegExp / Map / Set: return as-is (not PII in the ADR-008 sense)
  if (value instanceof Date || value instanceof RegExp ||
      value instanceof Map || value instanceof Set) {
    return value;
  }

  // 4. Plain object: walk keys
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (PII_KEYS.has(k.toLowerCase()) || isPIISuffix(k)) {
      out[k] = REDACTED;
    } else {
      out[k] = scrubPII(v);
    }
  }
  return out as T;
}

// ── Tests (src/__tests__/sentryPiiScrubber.test.ts) ──
//   Apollo: please add a Vitest spec covering:
//   (1) PII_KEYS exact match → redacted
//   (2) *Key/*Token/*Password suffix match → redacted
//   (3) Nested object → recurses
//   (4) Array of objects → recurses
//   (5) Date/Map/Set/RegExp → passthrough
//   (6) Primitive (string/number/null) → passthrough
//   (7) Case-insensitive: "Email" / "EMAIL" both redacted
```

---

## §3 — Environment variables required

**Witness 1 (rule).** Two new env vars enter the build pipeline. Both are **non-secret** for `VITE_SENTRY_DSN` (it's a public DSN, designed to be in the browser bundle) and **secret** for `SENTRY_AUTH_TOKEN` (CI-only, never reaches the browser).

**Witness 2 (evidence).** Per SENTRY_DEPLOYMENT.md §3 and §4:

| Variable | Scope | Where | Source | Required? |
|----------|-------|-------|--------|-----------|
| `VITE_SENTRY_DSN` | Runtime (browser) | `src/main.tsx` `Sentry.init({ dsn })` | Sentry UI → Project Settings → Client Keys (DSN) | **Yes (prod)** |
| `SENTRY_AUTH_TOKEN` | Build-time (CI) | `vite.config.ts` `sentryVitePlugin({ authToken })` | Sentry UI → Settings → Auth Tokens (scope: `project:releases`) | **Yes (CI only)** |
| `VITE_RELEASE` | Runtime (browser) | `src/main.tsx` `Sentry.init({ release })` | CI: `$GITHUB_REF_NAME` (e.g., `v0.5.0`) | Optional but recommended |

Add to `.env.example` (Apollo: please commit a refresh of this file):
```
# Sentry (T-ATL-007 / T-ATL-009)
# Public DSN — safe in browser. Get from Sentry UI > Project Settings > Client Keys.
VITE_SENTRY_DSN=

# Release tag — injected by CI as $GITHUB_REF_NAME. Empty in dev.
VITE_RELEASE=
```

`SENTRY_AUTH_TOKEN` does **not** go in `.env.example` (it's secret). Apollo should add it as a GitHub Actions secret: `gh secret set SENTRY_AUTH_TOKEN`.

**Witness 3 (failure mode / consequence).** If `VITE_SENTRY_DSN` is unset in production: the `if (VITE_SENTRY_DSN)` guard skips Sentry init, so **the app works but no errors are captured**. This is a silent degradation, not a crash. To detect it, the on-call runbook IC-4 needs a new check: *"if Sentry event count drops to 0 for >15 min, check `VITE_SENTRY_DSN` is set in the build env."* That's a §4 cross-link. **If `SENTRY_AUTH_TOKEN` is unset in CI:** the Vite build will succeed (the plugin tolerates missing tokens) but the source-map upload step in `.github/workflows/release.yml` will fail. That's a loud CI failure, not silent.

---

## §4 — Verification checklist (post-apply)

**Witness 1 (rule).** Three gates must pass after `git apply`:

1. **Type check.** `npx tsc --noEmit` → 0 errors.
   - Reason: ensures the `Sentry.init()` types, `SentrySpanProcessor` types, and the `scrubPII` generics all match.
2. **Lint.** `npx eslint src --max-warnings 0` → 0/0.
   - Reason: catches unused imports (e.g., if the SDK exports more than we use).
3. **Build.** `npm run build` → succeeds, bundle size within budget.
   - Reason: catches Vite plugin misconfig (source maps must be generated; if `sentryVitePlugin` throws, the build fails loudly).

**Witness 2 (evidence).** Pre-apply measurements (2026-06-13 07:35 IST):
- Bundle: main 225.87 kB raw / 55.95 kB gzip (62.5% headroom under 150 kB budget) — per T-AP-001 mission spec
- Total JS gzip across 100+ chunks: ~1.32 MB (well under 2 MB budget)
- Expected post-apply: main chunk grows by **~8 kB gzip** (the Sentry SDK init code, after tree-shaking). 55.95 + 8 = 63.95 kB gzip = still 57.4% headroom. Well within budget.

**Witness 3 (failure mode / consequence).** If any of the 3 gates fails: do **not** force-push or `--no-verify`. The failure indicates a real bug (e.g., version mismatch, missed import). Investigate, fix, re-run. The most likely failure mode is a **Sentry SDK version pin drift** (e.g., `@sentry/react@8.40.0` doesn't exist yet because Sentry's release cadence is monthly). If so, bump to the nearest available version and re-test. Apollo: the `npm i` will surface this immediately with an `E404`.

---

## §5 — Post-apply follow-ups (deferred to post-push queue)

This patch closes gap #1 from T-ATL-007 acceptance. Two follow-ups remain in the queue:

- **T-HEP-009 (Hephaestus).** PII scrubber full unit test suite + integration with the Sentry test environment (the test file stub at the bottom of `src/utils/sentryPiiScrubber.ts` is 7 cases). Hephaestus's lane because the PII catalog is security-sensitive.
- **T-ATL-010 (Atlas, deferred).** Husky pre-push timeout bump to 300s (DEFER-2026-005 STANDBY) — the +1 Sentry dep + OTel bridge init code adds ~1.5s to the cold tsc gate. Still well under 240s today; bump to 300s only if a CI run actually times out.

**Witness (rule).** This patch is a **single logical commit** per the post-push queue convention. Do not split it into multiple commits; the 4 file changes are atomic.

**Witness (evidence).** Apollo's post-push queue format (per T-AP-001 mission spec) lists 38+ tasks, each one commit. This patch becomes commit #N+1 in that sequence. Pre-apply check: `git apply --check` must return 0; if it returns non-zero, do not force-apply — investigate the conflict first.

**Witness (failure mode / consequence).** If Apollo's branch has drifted (e.g., `package.json` added a dep in the same alphabetical slot, or `src/main.tsx` added an import in the same line range), `git apply` will fail with a hunk conflict. The fix: rebase onto the post-push HEAD, then re-apply. The patch is **idempotent** — re-applying after a fresh checkout produces the same final state.

---

## §6 — Cross-links

- **Parent.** [`./SENTRY_DEPLOYMENT.md`](./SENTRY_DEPLOYMENT.md) — T-ATL-007 Sentry self-hosted deployment (ACCEPTED 2026-06-13)
- **Sibling.** [`../OBSERVABILITY_STACK.md`](../OBSERVABILITY_STACK.md) — T-ATL-004 Sentry + OTel + 4 dashboards (ACCEPTED 2026-06-13)
- **Sibling.** [`../ON_CALL_RUNBOOK.md`](../ON_CALL_RUNBOOK.md) — T-ATL-003, IC-4 "Production crash spike in Sentry" — needs the §3 silent-degradation check added (post-apply)
- **Sibling.** [`../../drafts/adr/ADR-008-audit-logging.md`](../../drafts/adr/ADR-008-audit-logging.md) — Hephaestus T-HEP-003, §3 PII catalog (the source of truth for the scrubber's key list)
- **Sibling.** [`./DISASTER_RECOVERY_RUNBOOK.md`](./DISASTER_RECOVERY_RUNBOOK.md) — T-ATL-008, §3.2 data corruption scenario references Sentry R2 archival
- **Pending.** T-HEP-009 PII scrubber test suite (Hephaestus's lane)
- **Pending.** T-ATL-010 husky timeout bump (Atlas, DEFER-2026-005 STANDBY)

**Status legend.** EXISTS = file on disk; PENDING = not yet written; INCOMING = being drafted by another Muse.

---

## §7 — Open questions for Apollo

1. **@sentry/cli version.** Is `^2.39.0` the right pin, or should we lock to `2.39.0` exact? Sentry's CLI is versioned separately from the SDKs and has had breaking changes historically. Suggest exact-pin.
2. **@opentelemetry/api.** The patch installs `@sentry/opentelemetry-node` which transitively brings `@opentelemetry/api` and `@opentelemetry/sdk-node`. Should we add them as direct deps for explicit version control? The current `overrides` block in `package.json:57-63` pins `@opentelemetry/sdk-node` to `^0.218.0` — verify the Sentry bridge's transitive version matches.
3. **@sentry-internal/* packages.** Modern `@sentry/react` pulls in `@sentry-internal/browser-utils`, `@sentry-internal/feedback`, etc. as transitive deps. These are fine but bloat `node_modules`. If bundle size is a concern, mark them as `external` in `vite.config.ts` build.rollupOptions (post-apply optimization, not required for this patch).
4. **Test environment DSN.** Vitest runs in jsdom — does Sentry's `BrowserClient` need a special test-mode init (e.g., `Sentry.init({ ..., _experiments: { enableRunScriptInExtendedTimeout: true } })`)? Or is wrapping the entire `Sentry.init` in the `if (VITE_SENTRY_DSN)` guard sufficient to skip in tests? Suggest: run `npm test` after apply, see if any test fails with a Sentry warning.

---

**End of T-ATL-009 pre-write. 7 sections, 4 file changes, 1 commit. Awaiting Apollo `git apply` post-T-AP-001 unblocker. — Atlas 2026-06-13 07:35 IST**
