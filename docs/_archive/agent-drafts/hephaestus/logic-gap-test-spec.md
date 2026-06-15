<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-13 -->

# Logic-Gap Test Files — Design Spec (T-HEP-004 candidate)

**Date:** 2026-06-13
**Author:** Hephaestus (Security & Data Integrity)
**Source:** Athena's T-AT-004 validation of the 4 security test files (D-007)
**Goal:** Close the 4 logic gaps Athena identified, with ready-to-cp test files that Apollo can stage post-push.

---

## §0 — Why this spec exists

Athena validated my 4 security test files and gave 3 of 4 an "EXCELLENT" on logic. The 1 with a path bug (mock-auth-gate) got "GOOD-WITH-FIX." The deliverable is solid.

But Athena also flagged 4 **logic gaps** — areas where the tests verify the static shape of a security control but don't exercise the runtime path. Static audits catch "does the code look right"; logic tests catch "does the code BEHAVE right when actually called."

This spec designs the 4 closing tests. When approved (as T-HEP-004 or similar), I'll write the 4 test files and stage them in `docs/drafts/hephaestus/security-tests/logic-gap-tests/`.

---

## §1 — Gap 1: `PluginSandbox.executeSandboxed` execute path

**Current coverage** (in `PluginSandbox.acorn.test.ts`):
- ✅ `validatePluginCode` — 4 positive + 4 node-type + 4 identifier + 2 size/parse = 14 cases
- ⚠ `executeSandboxed` — only 2 cases (literal `eval(` string + a simple safe script)

**Gap:** The 2 existing cases don't cover:
- PluginAPI integration (the `api` arg is passed through correctly to user code)
- Error path (what happens when user code throws at runtime)
- Return-value wrapping (success.value, success.error, success.success fields)
- Resource limits (timeout? recursion? infinite loop?)
- Multiple invocations of the same sandboxed code (state isolation)

**Proposed test file:** `PluginSandbox.execute.test.ts` (~150L, 8 cases)

### Test cases

1. **PluginAPI is callable from inside the sandbox** — register a function via `api.formula.registerFunction`, then call it from sandboxed code; verify the registration persisted.
2. **Return value is wrapped in SandboxResult.success=true** — run `return 42;`; assert `{ success: true, value: 42 }`.
3. **Runtime exception is wrapped in SandboxResult.success=false with the error message** — run `throw new Error('boom');`; assert `{ success: false, error: 'boom' }`.
4. **Async user code is awaited** — run `return await Promise.resolve(7);`; assert result has `value: 7`.
5. **The PluginAPI passed to executeSandboxed is the SAME object the user code sees** — verify by reading a property the user code sets and that the test wrote before execution.
6. **Timeout / infinite loop — TBD** — depends on whether executeSandboxed has a timeout config. If yes, test it; if no, mark BLOCKED with a recommendation to add one.
7. **Two invocations share the same api but not the same lexical scope** — each invocation has its own `const` bindings (no leakage across calls).
8. **The `options` parameter (sandboxTimeoutMs, etc.) is honored** — negative test: pass a tiny timeout and verify a long-running script is killed.

### Blockers

- **Timeout config:** Need to verify `SandboxOptions` actually has a `sandboxTimeoutMs` field. If not, cases 6 and 8 are BLOCKED and we ship with 6 cases.
- **PluginAPI type:** The minimal API mock from `PluginSandbox.acorn.test.ts` (formula, dashboards, export, import) needs to be reused or moved to a shared fixture file.

---

## §2 — Gap 2: `ScenarioLocking` behavioral test

**Current coverage** (in `ScenarioLocking.dom.test.tsx`):
- ✅ 3 static source audits (no `document.write`, uses DOM API, no `document.write` in hot spots)
- ⚠ 2 runtime cases — only one actually fires a click; the assertion is weak (`expect(openSpy).toHaveBeenCalled()`)

**Gap:** The click test doesn't verify:
- The opened window's URL/target
- The opened window's content (the print-friendly scenario data)
- The `onLockToggle` callback fires
- The `isLocked` state transitions correctly
- The export handler runs when `onExport` is provided

**Proposed test file:** `ScenarioLocking.behavioral.test.tsx` (~180L, 7 cases)

### Test cases

1. **Clicking the lock button opens a new window with `_blank` target** — verify `window.open` was called with `''` URL and `'_blank'` target.
2. **The opened window's document is built via createElement (not document.write)** — intercept the mock window's `document.createElement` calls; verify the element tree matches expectations.
3. **`onLockToggle` is called with `(scenarioId, true)` when the button is clicked** — verify the callback args.
4. **`onLockToggle` is called with `(scenarioId, false)` when re-clicking a locked scenario** — toggle round-trip.
5. **The print window contains the scenario name in its body** — read `mockPrintWindow.document.body.textContent`; assert the scenario name appears.
6. **`onExport` is called when the export button is clicked** — find the export button (different from lock), click it, verify callback.
7. **The `isLocked: true` state prevents re-toggling without confirmation** — depends on the component's actual UX. If no confirmation flow, mark BLOCKED and add to a separate "future UX" backlog.

### Blockers

- **Print window DOM structure:** The component builds the print window with `doc.createElement('html')` + nested elements. The test must mirror the exact structure to assert on it. Need to read the source one more time to confirm the tree shape (the test file's `stubMetrics` already does this for props, but the DOM tree is separate).
- **Button disambiguation:** The component has 2 buttons (lock toggle + export). The test uses `buttons[0]` which is fragile. Better: use `getByRole('button', { name: /lock|export/i })` to disambiguate. Will do this in the rewrite.

---

## §3 — Gap 3: `safeJSONStorage` zustand integration

**Current coverage** (in `dataStore.safeJSONStorage.test.ts`):
- ✅ 13 cases — wrapper behavior in isolation (round-trip, getItem failure, setItem failure, observability, pass-through, perf, integration with masterStorage-shaped input)

**Gap:** The "integration" case is a type-level check (`const writeResult: PersistStorage = wrapped;`). It doesn't actually create a zustand store and verify rehydration works end-to-end.

**Proposed test file:** `safeJSONStorage.zustand.test.ts` (~120L, 5 cases)

### Test cases

1. **A zustand store with `persist(safeJSONStorage(memoryStorage))` rehydrates successfully on mount** — create a store with an initial value, persist it, re-create the store from the same memory, verify the initial value is restored.
2. **`setItem` failures during `persist.setState` are caught and don't crash the store** — wrap a store with safeJSONStorage over a quota-exceeded storage; trigger a state update; verify the store still functions and the next setItem attempt is tried.
3. **`getItem` returning null (no prior state) leaves the store with its initial state** — fresh storage, no prior writes; mount a zustand store; verify the initial state is the default.
4. **`getItem` returning invalid JSON leaves the store with its initial state (not the corrupt value)** — pre-populate storage with `{not valid JSON`; mount a zustand store; verify it starts with the default value, not the corrupt string.
5. **`partialize` exclusion of class instances works through the wrapper** — store contains a class instance (e.g., a `Date` or a `Map`); partialize excludes it; round-trip; verify the excluded field is the default, not the serialized form.

### Blockers

- **None significant.** zustand's persist middleware is well-documented. The test will need `vi.mock('@/utils/workerPool')` if the integration uses masterStorage, but for the isolated cases the in-memory storage is sufficient.

---

## §4 — Gap 4: `mock-auth` runtime gate

**Current coverage** (in `mock-auth-gate.test.ts`):
- ✅ 8 cases — 3 main.tsx static + 2 authStore static + 2 functional (isMockAuthEnabled export + return value) + 2 negative (no JWT_SECRET leak, no template-interp throw)

**Gap:** The functional tests cover `isMockAuthEnabled` but NOT `useAuthStore.getState().loginMock()`. The runtime check at `authStore.ts:228-234` is verified by static source check only. The functional path (calling loginMock in DEV vs PROD) is untested.

**Proposed test file:** `mock-auth.runtime.test.ts` (~100L, 4 cases)

### Test cases

1. **In DEV (vitest default), `useAuthStore.getState().loginMock(validCreds)` does NOT throw the PROD message** — verify it either returns a User (if VITE_USE_MOCK_AUTH is set) or throws a different message (if not set).
2. **When `VITE_USE_MOCK_AUTH === 'true'`, loginMock returns a User with a non-empty token** — positive path; verifies the mock auth flow actually works in DEV.
3. **When `VITE_USE_MOCK_AUTH` is unset, loginMock throws "Mock authentication is disabled" (NOT the PROD message)** — guards against accidental flip of the error message.
4. **The `bruteForce` lockout (5 attempts → lockout) is enforced** — call loginMock 6 times with bad creds; verify the 6th throws the lockout message.

### Blockers

- **PROD-path test:** `import.meta.env.PROD === true` cannot be stubbed in vitest (build-time constant). The PROD throw at `authStore.ts:228-234` remains verified by static source check only. **Documented limitation, not a blocker.**
- **VITE_USE_MOCK_AUTH stubbing:** `vi.stubEnv` works for `process.env` and `import.meta.env` in vitest 4.x with vite config. The test should work; if it doesn't, the test is BLOCKED and the runtime path is documented as untestable.
- **bruteForce state:** The lockout state lives in the zustand store; calling loginMock 6 times should increment the counter and trigger the lockout. Need to verify the counter resets between tests (via `useAuthStore.setState({ bruteForce: { ... } })` or similar).

---

## §5 — Summary table

| Gap | File | Cases | Effort | Blockers |
|---|---|---|---|---|
| 1 | `PluginSandbox.execute.test.ts` | 8 | ~1.5 hrs | Timeout config (cases 6, 8) |
| 2 | `ScenarioLocking.behavioral.test.tsx` | 7 | ~1.5 hrs | Print-window DOM tree, button disambiguation |
| 3 | `safeJSONStorage.zustand.test.ts` | 5 | ~1 hr | None significant |
| 4 | `mock-auth.runtime.test.ts` | 4 | ~45 min | PROD path untestable (documented limit) |
| **Total** | **4 files** | **24 cases** | **~5 hrs** | 3 cases BLOCKED in worst case (1, 2) |

**File locations (when shipped):**
- `docs/drafts/hephaestus/security-tests/logic-gap-tests/PluginSandbox.execute.test.ts`
- `docs/drafts/hephaestus/security-tests/logic-gap-tests/ScenarioLocking.behavioral.test.tsx`
- `docs/drafts/hephaestus/security-tests/logic-gap-tests/safeJSONStorage.zustand.test.ts`
- `docs/drafts/hephaestus/security-tests/logic-gap-tests/mock-auth.runtime.test.ts`

---

## §6 — Three-Witness verification

For every gap identified:

| Gap | Witness 1 (source) | Witness 2 (test) | Witness 3 (Athena) |
|---|---|---|---|
| 1 execute path | `src/plugins/PluginSandbox.ts:194, 293` | `PluginSandbox.acorn.test.ts` execute describe has 2 cases | T-AT-004 report §"PluginSandbox execute path" |
| 2 behavioral | `src/components/ui/ScenarioLocking.tsx:99-110` | `ScenarioLocking.dom.test.tsx` runtime describe has 1 weak assertion | T-AT-004 report §"ScenarioLocking behavioral test" |
| 3 zustand integration | `src/utils/storage/safeJSONStorage.ts:17-46` | `dataStore.safeJSONStorage.test.ts` integration describe is type-level only | T-AT-004 report §"safeJSONStorage zustand integration" |
| 4 runtime gate | `src/store/authStore.ts:228-234` | `mock-auth-gate.test.ts` functional describe tests isMockAuthEnabled only | T-AT-004 report §"mock-auth runtime gate" |

---

## §7 — Why I'm writing this spec instead of waiting

Per D-007 (no-idle-agents) and the Leader's standing directive, I can't just sit and wait. T-HEP-003 is not in the system. T-HEP-004 is not in the system. The 4 logic gaps are Hephaestus-lane work with high value (closes real test coverage holes).

This spec:
- Is a planning doc, not a generated artifact (no test code yet)
- Gives Leader a concrete proposal to evaluate for T-HEP-004
- Documents the 4 gaps in a single place (Athena's report is in 4 separate locations)
- Can be referenced verbatim when the test files are written

If Leader signals "yes, do this," I'll write the 4 test files (estimated ~5 hours, 24 cases). If Leader redirects to a different task, this spec is shelved and I pick up the new task.

---

// AUDIT: 2026-06-13 — Hephaestus
// - 4 logic gaps documented with: source line, current test coverage, proposed test cases
// - 7 sections, 1 summary table
// - 3-witness rule applied per gap
// - Pre-staged design doc, awaiting Leader approval to proceed
// - D-007 compliant: not idle, useful work product, not unprompted artifact generation
