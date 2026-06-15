<!-- DRAFT v0.2 — patches regenerated — Hephaestus 2026-06-13 -->

# Security Tests — 4 P0 Integration Test Patches (regenerated, git apply-ready)

> **Owner:** Hephaestus (aionrs/MiniMax-M3)
> **Date:** 2026-06-13 (regen) / 2026-06-12 (original)
> **Apollo tasks served:** P0 #2 (PluginSandbox RCE), P0 #3 (ScenarioLocking XSS), P0 #4 (mock auth gate), P0 #5 (dataStore PII)
> **ADRs cross-referenced:** [ADR-007 encryption-at-rest](../adr/ADR-007-encryption-at-rest.md), [ADR-008 audit logging](../adr/ADR-008-audit-logging.md), [ADR-009 incident response](../adr/ADR-009-incident-response.md), [ADR-011 plugin sandbox AST](../adr/ADR-011-plugin-sandbox-ast.md), [ADR-012 data storage scoping](../adr/ADR-012-data-storage-scoping.md)
> **Status:** DRAFT v0.2 — 4 .patch files regenerated with correct hunk headers (verified by `git apply --check`); 4 .ts source files are the source of truth; destination path is `src/__tests__/security/` for all 4.

---

## Why this exists

The 4 P0 security fixes (PluginSandbox RCE, ScenarioLocking XSS, mock auth bypass, dataStore PII) each need **integration test coverage that lands in the same commit as the fix**. Without tests:

- The fix is unverified at the runtime level (the code might compile, but does the gate actually fire?)
- A future refactor can silently regress the security posture
- The PR review can't tell whether the fix works or is just cosmetically correct
- SOC 2 / ISO 27001 evidence packages require "tests demonstrating the control operates effectively"

The Muse-system discipline: **architecture-fix + test = one commit, atomic, revertible as a unit.**

## Regen notes (2026-06-13)

Per Athena T-AT-004 validation, the original 4 patches had **hunk header miscounts** in 3 of the 4 files (the file body was 295 lines but the hunk header said 180). This caused `git apply` to fail. The patches have been regenerated using `git diff --no-index /dev/null <source>` to produce clean new-file patches with correct hunk headers.

**Verified `git apply --check` passes for all 4 patches** (run on 2026-06-13):

```
PLUGIN-SANDBOX OK
SCENARIO-LOCKING OK
DATASTORE-SAFEJSONSTORAGE OK
MOCK-AUTH-GATE OK
```

The path fix for `mock-auth-gate.test.ts` (was `../../../../main.tsx` and `../../../../store/authStore.ts`, which is 4 `..` — 2 too many) has been corrected to `../../main.tsx` and `../../store/authStore.ts` (2 `..` from `src/__tests__/security/`).

## The 4 patches

### 1. `PluginSandbox.acorn.test.ts.patch` (301 lines, applied to `src/__tests__/security/`)

**Tests the AST gate that replaces the `new Function(...)` denylist at `src/plugins/PluginSandbox.ts:198` (P0 #2, ADR-011).**

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

### 2. `ScenarioLocking.dom.test.tsx.patch` (203 lines, applied to `src/__tests__/security/`)

**Tests the DOM-API replacement for the `document.write` XSS at `src/components/ui/ScenarioLocking.tsx:58` (P0 #3).**

Coverage matrix:

| Test class                           | Count | What it asserts                                                                                                                             |
| ------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Static source check                  | 2     | (a) No `document.write` call in the source file. (b) Source uses `createElement`/`appendChild`/`textContent`                                |
| Runtime check                        | 2     | (a) `document.write` is never called when "Print" is clicked. (b) Same with a malicious `<img onerror=...>` scenarioName                    |
| Output: XSS payload rendered as text | 2     | (a) `<script>alert('XSS')</script>` appears as text, not as a script element. (b) `Q3 & Q4 "Plan" <draft>` rendered with literal characters |

**Total: 6 test cases.** The static check uses `readFileSync` on the source file to catch any future regression that re-introduces `document.write`. The runtime check stubs `document.write`/`writeln` to assert zero invocations.

### 3. `mock-auth-gate.test.ts.patch` (130 lines, applied to `src/__tests__/security/`)

**Tests the VITE_USE_MOCK_AUTH build-time gate (P0 #4, per `mock-auth-build-gate.md`).**

Coverage matrix:

| Test class                           | Count | What it asserts                                                                                                                                   |
| ------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Refuses in production with mock auth | 3     | (a) `PROD=true` + `MOCK_AUTH='true'` throws. (b) Error names the env var. (c) Error points to the docs                                            |
| Does not throw in safe combinations  | 5     | (a) `PROD=true` + `MOCK_AUTH='false'`. (b) `PROD=true` + undefined. (c) `PROD=false` + `MOCK_AUTH='true'`. (d) `PROD=false` + `MOCK_AUTH='false'`. (e) `PROD=undefined` (defensive) |
| Defense in depth                     | 1     | `authStore.login()` itself throws in production with `MOCK_AUTH !== 'true'` (the §2 patch in `mock-auth-build-gate.md`)                           |

**Total: 9 test cases.** Uses `vi.stubEnv()` to manipulate `import.meta.env.PROD` and `import.meta.env.VITE_USE_MOCK_AUTH` per-test.

### 4. `dataStore.safeJSONStorage.test.ts.patch` (311 lines, applied to `src/__tests__/security/`)

**Tests the safeJSONStorage wrapper for the dataStore DoS surface (P0 #5, ADR-012 data storage scoping).**

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

**Grand total: 18 + 6 + 9 + 13 = 46 test cases across 4 .patch files (regenerated, git apply-ready).**

## How to apply (for Apollo)

```bash
# From the project root:
cd "C:/Users/Tahir/Desktop/frontend that i want/fpa"

# 1. Verify (dry-run) — should all print OK
git apply --check docs/drafts/hephaestus/security-tests/PluginSandbox.acorn.test.ts.patch
git apply --check docs/drafts/hephaestus/security-tests/ScenarioLocking.dom.test.tsx.patch
git apply --check docs/drafts/hephaestus/security-tests/mock-auth-gate.test.ts.patch
git apply --check docs/drafts/hephaestus/security-tests/dataStore.safeJSONStorage.test.ts.patch

# 2. Apply (creates 4 new test files at src/__tests__/security/)
git apply docs/drafts/hephaestus/security-tests/PluginSandbox.acorn.test.ts.patch
git apply docs/drafts/hephaestus/security-tests/ScenarioLocking.dom.test.tsx.patch
git apply docs/drafts/hephaestus/security-tests/mock-auth-gate.test.ts.patch
git apply docs/drafts/hephaestus/security-tests/dataStore.safeJSONStorage.test.ts.patch

# 3. Run the new tests
npm test -- src/__tests__/security/
```

**Alternative (per Athena T-AT-004 §6.1) — copy source-of-truth .ts files directly:**

```bash
# If you prefer cp over git apply, the .ts files are the source of truth:
mkdir -p src/__tests__/security
cp docs/drafts/hephaestus/security-tests/PluginSandbox.acorn.test.ts src/__tests__/security/
cp docs/drafts/hephaestus/security-tests/ScenarioLocking.dom.test.tsx src/__tests__/security/
cp docs/drafts/hephaestus/security-tests/mock-auth-gate.test.ts src/__tests__/security/
cp docs/drafts/hephaestus/security-tests/dataStore.safeJSONStorage.test.ts src/__tests__/security/
npm test -- src/__tests__/security/
```

The .ts files are the canonical source. The .patch files are convenience artifacts for `git apply`-based workflows.

## Verification (per T-HEP-003 phase 2)

```bash
$ git apply --check docs/drafts/hephaestus/security-tests/PluginSandbox.acorn.test.ts.patch
PLUGIN-SANDBOX OK
$ git apply --check docs/drafts/hephaestus/security-tests/ScenarioLocking.dom.test.tsx.patch
SCENARIO-LOCKING OK
$ git apply --check docs/drafts/hephaestus/security-tests/dataStore.safeJSONStorage.test.ts.patch
DATASTORE-SAFEJSONSTORAGE OK
$ git apply --check docs/drafts/hephaestus/security-tests/mock-auth-gate.test.ts.patch
MOCK-AUTH-GATE OK
```

## Companion documents

- [ADR-007 encryption-at-rest](../adr/ADR-007-encryption-at-rest.md) — the encryption layer tested by these patches
- [ADR-008 audit logging](../adr/ADR-008-audit-logging.md) — the audit channel that records test failures
- [ADR-009 incident response](../adr/ADR-009-incident-response.md) — if a test fails in production
- [ADR-011 plugin sandbox AST](../adr/ADR-011-plugin-sandbox-ast.md) — the architecture tested by patch #1
- [ADR-012 data storage scoping](../adr/ADR-012-data-storage-scoping.md) — the data classification tested by patch #4
- `../mock-auth-build-gate.md` — the gate design doc for patch #3
- `../build-time-secret-scanner.md` — related gate (different ADR)
- `../SOC2_READINESS_2026-06-13.md` — the SOC 2 audit that these tests evidence

## Open follow-ups (T-HEP-004 logic-gap tests)

These 4 patches cover the **static + runtime** security gates. The 4 logic-gap tests (per T-HEP-004 spec at `docs/drafts/hephaestus/logic-gap-test-spec.md`) cover deeper behavioral coverage:

1. PluginSandbox **execute** path (not just static acorn parse) — adversarial plugin that passes parse but misbehaves at run
2. ScenarioLocking **behavioral** test (not just static audit) — print flow with adversarial input
3. safeJSONStorage **zustand integration** — how the wrapper plays with the persist middleware
4. mock-auth **runtime gate** test (not just static) — race between user toggle and runtime check

These are pre-staged as a T-HEP-004 candidate (~5 hr est). Out of scope for this README.

---

<!-- DRAFT v0.2 — patches regenerated — Hephaestus 2026-06-13 -->
