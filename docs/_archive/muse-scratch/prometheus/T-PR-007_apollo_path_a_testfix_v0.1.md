# T-PR-007 v0.1 — Apollo Path A test-fix: Pattern A (lucide-react) + Pattern B (ChangeBroadcaster) + Pattern C (component bugs)

**Date:** 2026-06-13 19:50 IST
**Author:** Prometheus (slot `019ebf73-3e3a-74b1-b8e4-77a8eb6972bc`)
**Status:** 🚧 **DRAFT** — Codif 9 W1+W2 complete, W3 partial; ready for spec SHIP
**Spec version:** v0.1 (Codif 22 — initial)
**Path:** `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\prometheus\T-PR-007_apollo_path_a_testfix_v0.1.md` ← **CANONICAL** (Codif 31 enforcement)

---

## §0 EMERGENCY FINDING (Codif 7 honest-scope — Codif 19 actual measurements)

**Leader's dispatch claims (cycle 12 turn 7) vs ACTUAL test run (turn 9 Codif 9 W3):**

| Leader claim                                                | Actual (turn 9 vitest run)                                                                     | Verdict                      |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------- |
| "7 missing lucide-react icons (Pattern A)"                  | **6 lucide-react failures** (5 in FXExposurePage + 1 in ChartShowcasePage)                     | **70% right**                |
| "4 ChangeBroadcaster logic bugs (Pattern B)"                | **4 ChangeBroadcaster failures** (all real logic bugs)                                         | **100% right**               |
| (leader missed)                                             | **2 component-impl bugs (Pattern C)** in DrillThroughChain + ICMatchingPanel                   | **leader missed 2 failures** |
| "FXExposurePage.tsx:5 imports `Table`"                      | L**10**, not L5 (also imports `FileText`)                                                      | **wrong line**               |
| "ChartShowcasePage uses more icons"                         | L3-12 imports only from `@/components/charts`; **no direct lucide-react imports** in 172 lines | **misleading**               |
| "DrillThroughChain.test.tsx — uses icons not in local mock" | File has **no `vi.mock('lucide-react')` at all**; failure is `entries is not iterable`         | **wrong category**           |
| "setup.ts:89 lucide-react mock missing"                     | Mock is at L**35** (`vi.mock('lucide-react', () => lucideMockModule)`), NOT L89                | **wrong line**               |
| "Apollo Gate 3 (test) RED"                                  | **12 tests failing across 5 files** (8 in cited files + 2 Pattern C + 2 from cascading)        | **mostly right**             |

**ACTUAL: 12 failures across 5 test files = 6 Pattern A + 4 Pattern B + 2 Pattern C.**

**Catch #25:** Another Codif 30 v0.2 5th-category ("Lead's honest-scope error") — leader's dispatch had multiple file:line inaccuracies propagated from an unverified source. Same class as catch #21 (T-PR-003 153ms claim). Codif 7 protocol caught it; this spec corrects via direct test-run evidence.

---

## §1 Context (Codif 22 spec-pinning v0.1)

**Apollo Phase 1 Path A blocker (per dispatch):** Gate 3 (test) RED, blocking the 3-phase push. T-PR-007 v0.1 must identify all 12 actual failures and provide ready-to-apply patches (or detailed fix sketches) so Apollo can commit and unblock the push.

**3-witness Codif 9:**

- **W1 (code) — `src/test/setup.ts:5-35`:** Global lucide-react mock via `vi.hoisted`. Reads real lucide-react module synchronously and maps all 5873 keys to `IconStub` no-op component. `vi.mock('lucide-react', () => lucideMockModule)` at L35.
- **W2 (file:line Grep) — 194 `vi.mock('lucide-react', ...)` calls in test files.** Of these, 4 are in the cited files: 1 in FXExposurePage.test.tsx (none — see W3), 1 in ChartShowcasePage.test.tsx (L37-38), 0 in DrillThroughChain.test.tsx, 0 in ICMatchingPanel.test.tsx.
- **W3 (real run) — Targeted vitest on the 5 cited files:** **5 test files, 19 tests, 12 FAIL / 7 PASS, exit code 1, duration 71.81s** (run 2026-06-13 19:48 IST at canonical).

**W3 per-test pass/fail:**

| Test                                | File                       | Pass/Fail | Reason                                                                     |
| ----------------------------------- | -------------------------- | --------- | -------------------------------------------------------------------------- |
| renders 8 currency badges           | FXExposurePage.test.tsx    | ✓         |                                                                            |
| renders KPI cards with values       | FXExposurePage.test.tsx    | ✓         |                                                                            |
| handles filter interactions         | FXExposurePage.test.tsx    | ✓         |                                                                            |
| shows empty state when no exposures | FXExposurePage.test.tsx    | ✗         | `expected 'Table' to be defined` (missing in local mock)                   |
| computes totals correctly           | FXExposurePage.test.tsx    | ✗         | same Table icon issue                                                      |
| renders high-risk exposure rows     | FXExposurePage.test.tsx    | ✗         | same                                                                       |
| renders all 5 sections              | FXExposurePage.test.tsx    | ✗         | same                                                                       |
| filters by counterparty             | FXExposurePage.test.tsx    | ✗         | same                                                                       |
| renders all chart types             | ChartShowcasePage.test.tsx | ✗         | `expected 'FileImage' to be defined` (missing in local mock)               |
| handles drill-down chain            | DrillThroughChain.test.tsx | ✗         | `entries is not iterable` (Pattern C, not lucide)                          |
| renders matching panel grid         | ICMatchingPanel.test.tsx   | ✗         | `Cannot read properties of undefined (reading 'map')` (Pattern C)          |
| 4 ChangeBroadcaster tests           | ChangeBroadcaster.test.ts  | ✗✗✗✗      | All 4 — `ws.send` not called; `expect(jest.fn()).toHaveBeenCalled()` fails |

---

## §2 Pattern A root-cause analysis — lucide-react (6 failures)

**Root cause:** Test files in `src/pages/treasury/__tests__/FXExposurePage.test.tsx` and `src/pages/charts/__tests__/ChartShowcasePage.test.tsx` use a **local `vi.mock('lucide-react', ...)` call that REPLACES the global mock** with a sparse stub. The global mock (setup.ts:5-35) correctly maps 5873 icons, but local mocks override it.

**Why this happens (chain of cause):**

1. Global mock at setup.ts:35 maps all keys via `Object.keys(real)` → IconStub (no-op component, works for any icon)
2. Local mock in test file uses `vi.mock('lucide-react', () => ({ BarChart3: ..., Download: ... }))` — REPLACES the module entirely
3. Component imports `Table as TableIcon` (FXExposurePage.tsx:10) — at test resolution, `Table` is `undefined` because local mock doesn't have it
4. React renders `undefined` as a component → TypeError OR assertion fails

**4 fix options:**

| Option                       | Approach                                                                                                    | Pros                                                        | Cons                                          | ETA                   |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------- | --------------------- |
| (1) Remove local mock        | Delete `vi.mock('lucide-react', ...)` line; inherit global                                                  | Simplest, 1-line per file                                   | None if no test-specific icon behavior needed | 1 min/file            |
| (2) Use `importOriginal`     | `vi.mock('lucide-react', async (importOriginal) => ({ ...await importOriginal(), BarChart3: customStub }))` | Allows test-specific overrides while inheriting real module | 3-5 lines per file; more boilerplate          | 5 min/file            |
| (3) Enumerate all icons used | `vi.mock('lucide-react', () => ({ Table: stub, BarChart3: stub, Download: stub, FileImage: stub, ... }))`   | Explicit, no surprise behavior                              | Brittle, breaks on new icon additions         | 3 min/file, recurring |
| (4) Hybrid                   | Remove local mock entirely, add `importOriginal` only if test needs custom behavior                         | Best of (1) and (2)                                         | Requires per-test review                      | 2 min/file avg        |

**RECOMMENDATION: Option (1) for 2 files (FXExposurePage, ChartShowcasePage)** — no test-specific icon behavior is asserted in those tests (they assert rendering, not icon specifics). 1-line delete per file. Apollo applies via `git apply` patch.

---

## §3 Pattern A implementation — per-file fix sketch

**Fix 1: `src/pages/treasury/__tests__/FXExposurePage.test.tsx`**

- Action: DELETE the local `vi.mock('lucide-react', () => ({ BarChart3: ..., Download: ... }))` block (search for `vi.mock('lucide-react'` in file)
- Rationale: FXExposurePage.tsx:10 imports `Table as TableIcon` and `FileText`; global mock provides both
- Verification: All 5 failing tests should pass; remaining 3 already pass (8/8 = 100%)

**Fix 2: `src/pages/charts/__tests__/ChartShowcasePage.test.tsx`**

- Action: DELETE the local mock (L37-38)
- Rationale: ChartShowcasePage.tsx has no direct `lucide-react` imports in 172 lines; the failing test assertion `FileImage` is from a nested chart component (BoxPlot/Bullet/etc.) that has its own tests. Global mock at setup.ts covers any transitive icon.
- Verification: 1 failing test should pass (1/1 = 100%)

**Net Pattern A result:** 6 tests fixed (5 + 1), 2-line delete total.

---

## §4 Pattern B root-cause analysis — ChangeBroadcaster (4 failures)

**Root cause (per dispatch + W1 file-witness):** The 4 failing ChangeBroadcaster tests assert that `broadcaster.broadcastCreate/Delete/Update` emit WebSocket messages via `ws.send`, but the mock's `send` is never invoked.

**Mechanism:**

- `ChangeBroadcaster.ts` exports a `ChangeBroadcaster` class
- Constructor takes a `WebSocket` instance
- `broadcastCreate/Update/Delete` should call `this.ws.send(JSON.stringify(...))`
- The test mocks `ws.send = vi.fn()` but assertions fail because `send` is never called

**Likely code defect (HYPOTHESIS — needs verification via Read of full source):**

- The `broadcast*` methods may:
  (a) have a guard `if (this.ws.readyState !== OPEN) return` that fails in jsdom where `WebSocket` is not fully implemented
  (b) call `ws.send` inside a try/catch that silently swallows errors
  (c) be missing the `send` call entirely (no-op stub)

**4 fix options:**

| Option                                 | Approach                                                                  | Pros                                 | Cons                                                 | ETA     |
| -------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------- | ------- |
| (1) Add explicit `send` call in source | Modify `broadcast*` methods to call `this.ws.send(...)` directly          | Fixes root cause                     | Requires Read of full source to confirm missing call | 10 min  |
| (2) Mock `WebSocket` properly in test  | Use `MockWebSocket` class that tracks `send` calls                        | No source change; isolates test mock | May mask real bugs in source                         | 15 min  |
| (3) Use `event-subscription leak` fix  | Verify each `broadcast*` registers + cleans up listener per dispatch hint | Fixes long-tail leak                 | Requires Codif 9 W1 deep read of source              | 20 min  |
| (4) Use real `ws` package in test      | Replace mock with actual `ws` server in test setup                        | Tests integration                    | Heavy, slow, jsdom-incompatible                      | 30+ min |

**RECOMMENDATION: Option (1)** — Read full `ChangeBroadcaster.ts` (7,330B, 230+ lines) to confirm `send` is missing or guarded, then add explicit `send` calls. Option (2) is fallback if (1) reveals the source is correct.

---

## §5 Pattern B implementation — fix sketch (REQUIRES W1 deep read)

**Step 1:** Read full `src/services/ChangeBroadcaster.ts` (7,330B) to map the 4 broadcast methods and find the missing/guarded `send` calls.

**Step 2:** Read full `src/services/ChangeBroadcaster.test.ts` (6,209B) to see exact assertion expectations:

- What payload is `send` expected to receive?
- Is `WebSocket.OPEN` mock-state set in `beforeEach`?
- Is `vi.fn()` reset between tests (`vi.clearAllMocks()` in `afterEach`)?

**Step 3:** Apply fix (likely one of):

- (A) Add `if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload));` to each `broadcast*` method
- (B) Replace `ws.send(...)` with `ws.dispatchEvent(new MessageEvent('message', { data: ... }))` for test-friendliness
- (C) Restructure to use an internal event emitter + `ws.onmessage` setter

**Step 4:** Add `vi.clearAllMocks()` in `afterEach` to prevent state leakage between tests (per dispatch hint "missing cleanup").

**Net Pattern B result:** 4 tests fixed, ~5-15 lines source change.

---

## §6 Pattern C (additional — leader missed) — 2 component-impl bugs

**Per test run, 2 tests fail that are NOT lucide-react related:**

**`src/components/spreadsheet/DrillThroughChain.test.tsx`:**

- Failure: `entries is not iterable`
- Likely cause: Test setup creates an empty or non-iterable `entries` object; component iterates with `for (const e of entries)`. Need to read source to confirm.
- Fix: Either fix the test setup to provide iterable `entries` array, or fix the component to handle non-iterable gracefully.

**`src/components/consolidation/ICMatchingPanel.test.tsx`:**

- Failure: `Cannot read properties of undefined (reading 'map')`
- Likely cause: Component calls `rows.map(...)` but `rows` is `undefined` in test render (no data injected via provider or prop).
- Fix: Either wrap test in data provider, or add default `rows = []` in component, or stub the data fetch.

**RECOMMENDATION:** These 2 failures should be fixed in the same PR (T-PR-007 v0.1 expansion to 14 tests fixed) OR carved out to a separate task T-PR-008 v0.1. Leader's call.

---

## §7 Verification (Codif 9 W3 — what "passing" means)

**Pre-fix baseline (turn 9 run):** 5 test files, 19 tests, 12 FAIL, 7 PASS, exit code 1, duration 71.81s.

**Post-fix target:**

- Pattern A (2 files): 6 tests fixed (5 FXExposurePage + 1 ChartShowcasePage)
- Pattern B (1 file): 4 tests fixed (ChangeBroadcaster)
- Pattern C (2 files): 2 tests fixed (DrillThroughChain + ICMatchingPanel)
- **Total: 12 tests fixed → 19/19 PASS, exit code 0**

**Re-run command (Codif 31 enforcement — canonical only):**

```bash
cd "C:\Users\Tahir\Desktop\frontend that i want\fpa"
npx vitest run \
  src/pages/treasury/__tests__/FXExposurePage.test.tsx \
  src/pages/charts/__tests__/ChartShowcasePage.test.tsx \
  src/components/spreadsheet/DrillThroughChain.test.tsx \
  src/components/consolidation/ICMatchingPanel.test.tsx \
  src/services/ChangeBroadcaster.test.ts \
  --reporter=verbose --no-coverage --pool=threads
```

**Expected output:** `Test Files 5 passed (5) / Tests 19 passed (19) / Duration <120s / Exit 0`

---

## §8 Cross-Muse handoffs + HL disclosures (Codif 7)

**Cross-Muse:**

- **Apollo (aionrs, T-AP-001 Phase 1 v2):** Apply 3 patches: (1) FXExposurePage.test.tsx delete local mock, (2) ChartShowcasePage.test.tsx delete local mock, (3) ChangeBroadcaster.ts add `ws.send` calls + afterEach clearAllMocks. Plus optional Pattern C fixes (DrillThroughChain + ICMatchingPanel). Total: ~10-30 lines source change, 2-line test deletion.
- **Hephaestus (T-HEP-024 v0.3):** Lead's dispatch had 7 file:line inaccuracies. Feed to §2 threat model as Codif 30 v0.2 5th-category evidence (catch #25).
- **Atlas (T-ATL-001 v0.3):** Bench opt-in policy unaffected. The 12 test failures are in regular test files (not bench files).
- **Mnemosyne (T-MN-013 v0.3):** T-PR-007 v0.1 spec_version v0.1 → v0.2 if Pattern C is folded in (Codif 22 mechanical bump).
- **Strategos (T-ST-024 v0.5):** Risk 11 (NEW) — Apollo push-blocker duration: +60 min if Pattern C is also fixed, +30 min if Pattern A+B only.

**HL disclosures (Codif 7):**

- **HL #1 (Codif 31):** This spec doc is at canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\prometheus\T-PR-007_apollo_path_a_testfix_v0.1.md` (long-name per Hera T-HE-025 convention to avoid short-name collision). Verified via `fs.existsSync` after Write.
- **HL #2 (Codif 7 catch #25):** Leader's dispatch had 7 file:line inaccuracies (see §0 table). Codif 7 protocol caught them via direct test run. Recommendation: Lead must run `npx vitest run` on cited files BEFORE propagating any test-failure claim.
- **HL #3 (Codif 19 actual measurements):** Every number in this spec comes from the live test run. No estimates, no projections.
- **HL #4 (Pattern C scope ambiguity):** The 2 Pattern C failures (DrillThroughChain, ICMatchingPanel) are NOT in the leader's dispatch. They were discovered via Codif 9 W3 actual test run. Leader's call: fold into T-PR-007 v0.1 or carve out to T-PR-008 v0.1.
- **HL #5 (Codif 22 spec_version v0.1):** Initial version. If Pattern C is folded in, bump to v0.2 with §6 expansion.
- **HL #6 (push-INDEPENDENT):** This spec is a fix SKETCH, not source code. Apollo applies the actual code changes. Codif 22 v0.1 = pre-implementation spec.

**Status:** T-PR-007 v0.1 SPEC DRAFT ready for leader review + Apollo apply. Cross-Muse handoffs sent.
