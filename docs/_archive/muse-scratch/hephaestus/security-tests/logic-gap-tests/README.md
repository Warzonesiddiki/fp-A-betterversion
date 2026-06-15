<!-- DRAFT v0.1 — Hephaestus 2026-06-13 -->

# Logic-Gap Tests — 4 behavioral test files (T-HEP-004)

> **Owner:** Hephaestus (aionrs/MiniMax-M3)
> **Date:** 2026-06-13
> **Spec:** `docs/drafts/hephaestus/logic-gap-test-spec.md` (184L)
> **Companion:** `../README.md` (the 4 P0 patches)
> **Status:** DRAFT v0.1 — 4 .ts source files + 4 .patch files (all `git apply --check` PASS)

---

## Why this exists

The 4 P0 security tests (in `../`) cover the **static + runtime gate** layer: the AST allowlist, the DOM API, the build-time env var, and the safe-JSON wrapper. They ensure the gates exist and fire when the bad input arrives.

The 4 logic-gap tests (here) cover the **deeper behavioral surface** that the static + runtime tests cannot reach:

| Gap | Why the P0 test misses it | What this test catches |
|---|---|---|
| 1. PluginSandbox **execute** path | `PluginSandbox.acorn.test.ts` only checks `validatePluginCode` (parse-time). The `executeSandboxed` runtime path (different code, different failure modes) is untested. | A plugin that passes parse but throws at runtime, infinite loops, async race, or mutated the api object |
| 2. ScenarioLocking **behavioral** | `ScenarioLocking.dom.test.tsx` checks the source text + that `document.write` is never called. It does not exercise the click → window.open → DOM tree → callback chain. | A real XSS via scenarioName rendered as live script; missing callback fires; wrong DOM tree |
| 3. safeJSONStorage **zustand integration** | `dataStore.safeJSONStorage.test.ts` tests the wrapper in isolation. As a zustand `persist` middleware adapter, the failure modes differ (rehydration race, mid-setState failure, type-contract mismatch). | A corrupt blob that poisons the store on rehydrate; a setItem quota error that crashes `setState` |
| 4. mock-auth **runtime gate** | `mock-auth-gate.test.ts` checks the static source + the `isMockAuthEnabled()` export. It does not exercise `useAuthStore.getState().loginMock()`. | The runtime check at `authStore.ts:228-234` actually throwing; the brute-force counter; the right error messages |

## The 4 test files

### 1. `PluginSandbox.execute.test.ts` (93L, 8 cases)

| # | Case | What it asserts |
|---|---|---|
| 1 | api.formula.registerFunction | PluginAPI is callable from inside the sandbox; registration persists |
| 2 | Return value | `return 42;` wraps to `{ success: true, value: 42 }` |
| 3 | Throws | `throw new Error('boom');` wraps to `{ success: false, error: 'boom' }` |
| 4 | Async | `return await Promise.resolve(7)` is awaited |
| 5 | Same api reference | User code sees the EXACT api object passed to executeSandboxed (not a copy) |
| 6 | Lexical scope isolation | `const` from one invocation is not visible in the next |
| 7 | Timeout | `timeout: 10` kills an infinite loop |
| 8 | validatePluginCode gate | A script that fails the AST allowlist is rejected pre-execute |

### 2. `ScenarioLocking.behavioral.test.tsx` (205L, 7 cases)

| # | Case | What it asserts |
|---|---|---|
| 1 | window.open | Lock button calls `window.open(..., '_blank')` |
| 2 | createElement (not document.write) | Opened window builds DOM via createElement, document.write is never called |
| 3 | onLockToggle id+true | Callback receives `(scenarioId, true)` on lock click |
| 4 | onLockToggle id+false | Callback receives `(scenarioId, false)` on re-click of a locked scenario |
| 5 | Scenario name in print | DOM contains the scenario name as text (including special chars `<`, `>`, `&`) |
| 6 | XSS as text | `<script>...</script>` in scenario name renders as text, not as a script element; `window.__pwned` is undefined |
| 7 | Metric values | The revenue, expenses, etc. appear in the print window |

### 3. `safeJSONStorage.zustand.test.ts` (139L, 5 cases)

| # | Case | What it asserts |
|---|---|---|
| 1 | Rehydration | A zustand store with `persist(safeJSONStorage(memoryStorage))` rehydrates from prior writes |
| 2 | Fresh storage | New storage leaves the store with its initial state |
| 3 | Corrupt JSON | Storage with `{not valid JSON` does not poison the store — it falls back to initial state |
| 4 | setItem throws | A `QuotaExceededError` from setItem is caught — the store still functions, subsequent writes work |
| 5 | Type contract | The wrapped storage satisfies the `PersistStorage` type contract |

### 4. `mock-auth.runtime.test.ts` (110L, 4 cases)

| # | Case | What it asserts |
|---|---|---|
| 1 | DEV — no PROD throw | In DEV (vitest default), `loginMock` does not throw the PROD message |
| 2 | VITE_USE_MOCK_AUTH=true | `loginMock` returns a User with a non-empty token |
| 3 | VITE_USE_MOCK_AUTH unset | `loginMock` throws "Mock authentication is disabled" (not the PROD message) |
| 4 | Brute-force lockout | 5 failed attempts → 6th throws a lockout message |

**Documented limitation:** the PROD path (`authStore.ts:229`) is a build-time constant. Vitest cannot stub it. The PROD throw is verified by the static check in `../mock-auth-gate.test.ts`.

**Grand total: 8 + 7 + 5 + 4 = 24 test cases across 4 .patch files, all `git apply --check` PASS.**

## How to apply (for Apollo)

```bash
# From the project root:
cd "C:/Users/Tahir/Desktop/frontend that i want/fpa"

# 1. Verify (dry-run) — all 4 should print OK
git apply --check docs/drafts/hephaestus/security-tests/logic-gap-tests/PluginSandbox.execute.test.ts.patch
git apply --check docs/drafts/hephaestus/security-tests/logic-gap-tests/ScenarioLocking.behavioral.test.tsx.patch
git apply --check docs/drafts/hephaestus/security-tests/logic-gap-tests/safeJSONStorage.zustand.test.ts.patch
git apply --check docs/drafts/hephaestus/security-tests/logic-gap-tests/mock-auth.runtime.test.ts.patch

# 2. Apply (creates 4 new test files at src/__tests__/security/logic-gap/)
git apply docs/drafts/hephaestus/security-tests/logic-gap-tests/PluginSandbox.execute.test.ts.patch
git apply docs/drafts/hephaestus/security-tests/logic-gap-tests/ScenarioLocking.behavioral.test.tsx.patch
git apply docs/drafts/hephaestus/security-tests/logic-gap-tests/safeJSONStorage.zustand.test.ts.patch
git apply docs/drafts/hephaestus/security-tests/logic-gap-tests/mock-auth.runtime.test.ts.patch

# 3. Run the new tests
npm test -- src/__tests__/security/logic-gap/
```

**Alternative (per Athena T-AT-004 §6.1) — copy source-of-truth .ts files directly:**

```bash
mkdir -p src/__tests__/security/logic-gap
cp docs/drafts/hephaestus/security-tests/logic-gap-tests/PluginSandbox.execute.test.ts src/__tests__/security/logic-gap/
cp docs/drafts/hephaestus/security-tests/logic-gap-tests/ScenarioLocking.behavioral.test.tsx src/__tests__/security/logic-gap/
cp docs/drafts/hephaestus/security-tests/logic-gap-tests/safeJSONStorage.zustand.test.ts src/__tests__/security/logic-gap/
cp docs/drafts/hephaestus/security-tests/logic-gap-tests/mock-auth.runtime.test.ts src/__tests__/security/logic-gap/
npm test -- src/__tests__/security/logic-gap/
```

## Verification (per T-HEP-003 phase 4)

```
$ git apply --check docs/drafts/hephaestus/security-tests/logic-gap-tests/PluginSandbox.execute.test.ts.patch
EXECUTE OK
$ git apply --check docs/drafts/hephaestus/security-tests/logic-gap-tests/ScenarioLocking.behavioral.test.tsx.patch
BEHAVIORAL OK
$ git apply --check docs/drafts/hephaestus/security-tests/logic-gap-tests/safeJSONStorage.zustand.test.ts.patch
ZUSTAND OK
$ git apply --check docs/drafts/hephaestus/security-tests/logic-gap-tests/mock-auth.runtime.test.ts.patch
RUNTIME OK
```

## Cross-references

- **Spec:** `docs/drafts/hephaestus/logic-gap-test-spec.md` (the design rationale)
- **Companion README:** `../README.md` (the 4 P0 patches)
- **SOC 2 audit:** `../../SOC2_READINESS_2026-06-13.md` — these tests are evidence for CC6.1.9, CC6.6, CC6.8, CC7.1
- **ADRs:**
  - ADR-007 (encryption-at-rest) — Gap 3 tests the storage layer that encryption will wrap
  - ADR-008 (audit logging) — Gap 4 tests the auth events that audit will log
  - ADR-011 (plugin sandbox AST) — Gap 1 tests the execute path of the AST allowlist
  - ADR-012 (data storage scoping) — Gap 3 tests the data classification contract

## Future work (out of scope for this README)

- E2E tests for the same 4 surfaces in Playwright (5 critical user paths, per T-MN-003 TESTING.md)
- Property-based tests (fast-check) for the safeJSONStorage wrapper (corruption resilience, all edge cases)
- Snapshot tests for ScenarioLocking print DOM (catches visual regressions)
- Mutation tests for PluginSandbox (verify the tests would actually catch an AST bypass)

---

<!-- DRAFT v0.1 — Hephaestus 2026-06-13 -->
