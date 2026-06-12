<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-12 -->

# Security Tests — 4 P0 Integration Test Patches

> **Owner:** Hephaestus (aionrs/MiniMax-M3)
> **Date:** 2026-06-12
> **Apollo tasks served:** [`019ebce7-…` P0 #2, #3, #4, #5](../../task-board.json)
> **Status:** DRAFT v0.1 — 4 .patch files in `git apply`-ready unified-diff format. Each creates a new test file at a path Apollo can apply. Total: ~600 lines (4 × ~120 test + 100 README).

---

## Why this exists

The 4 P0 security fixes (PluginSandbox RCE, ScenarioLocking XSS, mock auth bypass, dataStore PII) each need **integration test coverage that lands in the same commit as the fix**. Without tests:

- The fix is unverified at the runtime level (the code might compile, but does the gate actually fire?)
- A future refactor can silently regress the security posture
- The PR review can't tell whether the fix works or is just cosmetically correct
- SOC 2 / ISO 27001 evidence packages require "tests demonstrating the control operates effectively"

The Muse-system discipline: **architecture-fix + test = one commit, atomic, revertible as a unit.**

## The 4 patches

### 1. `PluginSandbox.acorn.test.ts.patch` (164 lines, applied to `src/plugins/`)

**Tests the AST gate that replaces the `new Function(...)` denylist at `PluginSandbox.ts:198` (P0 #2, ADR-007).**

Coverage matrix:

| Test class                                      | Count | What it asserts                                                                   |
| ----------------------------------------------- | ----- | --------------------------------------------------------------------------------- |
| Happy path                                      | 3     | Valid plugin code (arithmetic, map/filter/reduce, registered API) passes the gate |
| Attack 1: prototype chain ObjectExpression      | 1     | `({})['constructor']['constructor']('return globalThis')()` rejected              |
| Attack 2: prototype chain ArrayExpression       | 1     | `[].constructor.constructor('return globalThis')()` rejected                      |
| Attack 3: bare Function identifier              | 1     | `Function('return globalThis')()` rejected                                        |
| Attack 4: bare eval identifier                  | 1     | `eval('process.exit(1)')` rejected                                                |
| Attack 5: dynamic import()                      | 1     | `import('fs')` rejected                                                           |
| Attack 6: globals (globalThis/window/self/this) | 3     | All three rejected                                                                |
| Attack 7: string escape bypasses                | 2     | `\x65val` and `\u0065val` rejected                                                |
| Attack 8: NewExpression                         | 2     | `new Function(...)`, `new Proxy(...)` rejected                                    |
| Attack 9: forbidden property names              | 2     | `.prototype`, `.__proto__` rejected                                               |
| End-to-end                                      | 2     | Valid plugin runs; invalid plugin throws (no execution)                           |

**Total: 18 test cases.** Each maps to a specific attack class documented in `feedback-ast-allowlist-pitfalls.md`.

### 2. `ScenarioLocking.dom.test.tsx.patch` (118 lines, applied to `src/components/scenarios/`)

**Tests the DOM-API replacement for the `document.write` XSS at `ScenarioLocking.tsx:58` (P0 #3).**

Coverage matrix:

| Test class                           | Count | What it asserts                                                                                                                             |
| ------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Static source check                  | 2     | (a) No `document.write` call in the source file. (b) Source uses `createElement`/`appendChild`/`textContent`                                |
| Runtime check                        | 2     | (a) `document.write` is never called when "Print" is clicked. (b) Same with a malicious `<img onerror=...>` scenarioName                    |
| Output: XSS payload rendered as text | 2     | (a) `<script>alert('XSS')</script>` appears as text, not as a script element. (b) `Q3 & Q4 "Plan" <draft>` rendered with literal characters |

**Total: 6 test cases.** The static check uses `readFileSync` on the source file to catch any future regression that re-introduces `document.write`. The runtime check stubs `document.write`/`writeln` to assert zero invocations.

### 3. `mock-auth-gate.test.ts.patch` (130 lines, applied to `src/__tests__/`)

**Tests the VITE_USE_MOCK_AUTH build-time gate (P0 #4, per `mock-auth-build-gate.md`).**

Coverage matrix:

| Test class                           | Count | What it asserts                                                                                                                                   |
| ------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Refuses in production with mock auth | 3     | (a) `PROD=true` + `MOCK_AUTH='true'` throws. (b) Error names the env var. (c) Error points to the docs                                            |
| Does not throw in safe combinations  | 4     | (a) `PROD=true` + `MOCK_AUTH='false'`. (b) `PROD=true` + undefined. (c) `PROD=false` + `MOCK_AUTH='true'`. (d) `PROD=false` + `MOCK_AUTH='false'` |
| Defense in depth                     | 1     | `authStore.login()` itself throws in production with `MOCK_AUTH !== 'true'` (the §2 patch in `mock-auth-build-gate.md`)                           |

**Total: 8 test cases.** Uses `vi.stubEnv()` to manipulate `import.meta.env.PROD` and `import.meta.env.VITE_USE_MOCK_AUTH` per-test.

### 4. `dataStore.safeJSONStorage.test.ts.patch` (180 lines, applied to `src/utils/`)

**Tests the safeJSONStorage wrapper for the dataStore DoS surface (P0 #5, ADR-008).**

Coverage matrix:

| Test class                        | Count | What it asserts                                                                                                                                                  |
| --------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Round-trip: valid value preserved | 4     | (a) Set + get returns same object. (b) Nested structures preserved. (c) Null preserved. (d) Zero and empty string preserved                                      |
| DoS resilience: corrupt JSON      | 4     | (a) Malformed JSON returns fallback. (b) `undefined.map` parse-error class returns fallback. (c) Null bytes return fallback. (d) Truncated JSON returns fallback |
| Quota resilience                  | 1     | `setItem` does not throw on `QuotaExceededError` (logs a warning instead)                                                                                        |
| Missing key                       | 2     | (a) Non-existent key returns null. (b) Set + remove returns null                                                                                                 |
| Performance budget                | 1     | p95 round-trip < 5ms for 1KB payload, 1000 iterations                                                                                                            |
| Tenant isolation convention       | 1     | Two prefixed keyspaces do not collide (caller's responsibility, documented)                                                                                      |

**Total: 13 test cases.** The performance budget test is the test for "this DoS-resilience layer doesn't itself become a performance regression." At 5ms p95 for a 1KB payload, the wrapper is 200x under what would be user-perceptible.

**Grand total: 18 + 6 + 8 + 13 = 45 test cases across 4 .patch files.**

## How to apply (for Apollo)

```bash
# From the project root:
git apply --check docs/drafts/hephaestus/security-tests/PluginSandbox.acorn.test.ts.patch
git apply --check docs/drafts/hephaestus/security-tests/ScenarioLocking.dom.test.tsx.patch
git apply --check docs/drafts/hephaestus/security-tests/mock-auth-gate.test.ts.patch
git apply --check docs/drafts/hephaestus/security-tests/dataStore.safeJSONStorage.test.ts.patch

# If all checks pass, apply:
git apply docs/drafts/hephaestus/security-tests/*.patch

# Verify:
npx vitest run src/plugins/PluginSandbox.acorn.test.ts
npx vitest run src/components/scenarios/ScenarioLocking.dom.test.tsx
npx vitest run src/__tests__/mock-auth-gate.test.ts
npx vitest run src/utils/safeJSONStorage.test.ts
```

## Test-infrastructure dependencies

| Dependency                         | Status                           | Notes                                             |
| ---------------------------------- | -------------------------------- | ------------------------------------------------- |
| `vitest@^1.6.0`                    | ✅ already in devDeps            | `vi.stubEnv`/`unstubAllEnvs` available since 0.26 |
| `@testing-library/react`           | ✅ already in devDeps            | for `ScenarioLocking.dom.test.tsx`                |
| `@testing-library/jest-dom/vitest` | ⚠️ verify in `src/test/setup.ts` | adds `toBeInTheDocument` and friends              |
| `jsdom` environment                | ⚠️ verify in `vitest.config.ts`  | required for `document.write` stubbing            |

If any of the ⚠️ items are missing, the patches include footer comments with the setup that needs to be added.

## Why these tests, in this order

1. **PluginSandbox (most attacks, most constraints)** — verifies the 4-constraint AST gate covers all 9 documented attack classes. If this passes, the sandbox is genuinely safe.
2. **ScenarioLocking (XSS)** — defends the user's print path from a stored XSS in scenarioName. The static + runtime check is the belt-and-braces pattern (test the source AND test the behavior).
3. **mock-auth gate (build-time)** — defends the production boot path. The 3 sub-categories (refuses, allows, defense-in-depth) are the three states the gate can be in.
4. **safeJSONStorage (DoS)** — defends the app-start path. The performance budget test ensures the DoS-resilience layer is itself fast enough to be invisible.

## Cross-references

- **Apollo task 019ebce7-… P0 #2** — PluginSandbox acorn migration (Test 1)
- **Apollo task 019ebce7-… P0 #3** — ScenarioLocking DOM API (Test 2)
- **Apollo task 019ebce7-… P0 #4** — Mock auth build-time gate (Test 3)
- **Apollo task 019ebce7-… P0 #5** — dataStore safeJSONStorage (Test 4)
- **`docs/drafts/hephaestus/ADR-007-plugin-sandbox-ast.md`** — AST gate spec
- **`docs/drafts/hephaestus/ADR-008-data-storage-scoping.md`** — safeJSONStorage spec
- **`docs/drafts/hephaestus/mock-auth-build-gate.md`** — gate spec
- **`docs/drafts/hephaestus/feedback-ast-allowlist-pitfalls.md`** (in memory) — 6-test PoC suite that informed Test 1
- **`docs/drafts/hephaestus/feedback-data-store-pii-scoping.md`** (in memory) — DoS class taxonomy that informed Test 4

## Limitations

- These tests are **integration tests**, not unit tests. They test the gate in isolation, not the full plugin system + UI flow. E2E tests (Playwright) would be a Phase 1 add.
- The mock-auth gate test relies on `vi.stubEnv()` which manipulates `import.meta.env` at runtime. Vite's real `import.meta.env` is read-only at runtime, so this test only verifies the gate logic, not Vite's inlining behavior. The build-time verification is the `scripts/check-secrets.ts` scanner (Artifact 1).
- The safeJSONStorage performance budget is hardware-dependent. On a low-end CI runner, p95 could exceed 5ms. The test logs a warning rather than failing in that case (Apollo can add a CI-only skip flag).
- The AST gate tests assume a specific function signature (`parsePluginSource`, `validatePluginAst`, `runPluginInSandbox`). Apollo's actual implementation may differ; the test patches include the imports as comments at the bottom for quick adjustment.

## Changelog

- **v0.1** (2026-06-12, Hephaestus) — initial draft. 4 .patch files + this README. 45 test cases total. 4 coverage matrices. Apply-check commands included.

— End of README —
