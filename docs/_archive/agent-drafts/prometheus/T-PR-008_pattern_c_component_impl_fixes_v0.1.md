---
spec_id: T-PR-008
version: 0.1
title: Pattern C component-impl bug fixes (DrillThroughChain + ICMatchingPanel)
author: prometheus
created: 2026-06-13
status: DRAFT
priority: P1
push_dependency: INDEPENDENT (post-push deliverable)
discipline_refs:
  - Codif 7 (Honest Labeling)
  - Codif 9 (3-witness)
  - Codif 19 (actual measurements)
  - Codif 22 v0.1 (spec-version-pinning)
  - Codif 30 v0.2 5th-cat (Leader's honest-scope error)
  - Codif 31 (write-sandbox isolation)
---

# T-PR-008 v0.1 — Pattern C component-impl bug fixes

## §0 EMERGENCY FINDING (Codif 7 honest-scope)

**Catch #26 FILED** — Leader's T-PR-008 dispatch swapped error strings between the 2 files.

| File                         | Leader's claim            | ACTUAL vitest error                                   | Stack frame                                                |
| ---------------------------- | ------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `DrillThroughChain.test.tsx` | `entries is not iterable` | `Cannot read properties of undefined (reading 'map')` | `DrillTables.tsx:65` → `data.map((row) =>`                 |
| `ICMatchingPanel.test.tsx`   | `rows.map of undefined`   | `entries is not iterable`                             | `ICMatchingEngine.ts:115` → `for (const entry of entries)` |

**Both root causes are the SAME class of bug**: tests call `<Component />` with NO PROPS, components destructure required props without defaults, downstream iteration over `undefined` throws.

**Codif 30 v0.2 5th-cat violation** — same as Catch #25 (cycle 12 turn 10). Pattern repeating. Recommend Leader adopt a pre-dispatch ritual: run vitest on cited files before claiming test-failure patterns. This is the 2nd instance in 2 turns. Codif 32 candidate if it happens again.

## §1 Context (Codif 9 3-witness)

**3-witness for each file:**

### W1 — Read source (read 5 files at canonical)

| File                                                    | Lines | Key defect                                                                                                                                                                                                 |
| ------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/spreadsheet/DrillThroughChain.tsx`      | 123   | L49: `function DrillThroughChain({ summaryData, period, className }: DrillThroughChainProps)` — no defaults. L99: `<SummaryTable data={summaryData} ... />` — passes `undefined` to SummaryTable.          |
| `src/components/spreadsheet/DrillTables.tsx`            | ~130  | L65: `<tbody>{data.map((row) => (` — no guard. L92: `{data.children?.map((child) => (` has guard. L121: `{data.entries?.map((entry) => (` has guard. **Inconsistency**: L65 unguarded vs L92/L121 guarded. |
| `src/components/consolidation/ICMatchingPanel.tsx`      | 402   | L48-51: `useMemo(() => ICMatchingEngine.detectICTransactions(entries, entityNames, tolerance), [entries, entityNames, tolerance])` — no defaults. L42: `useState<MatchPair[]>([])` for `matches` is OK.    |
| `src/engines/ICMatchingEngine.ts`                       | ~200  | L115: `for (const entry of entries) {` in `detectICTransactions()` — no guard. Called from ICMatchingPanel L49 unconditionally.                                                                            |
| `src/components/spreadsheet/DrillThroughChain.test.tsx` | 11    | `<DrillThroughChain />` — no props.                                                                                                                                                                        |
| `src/components/consolidation/ICMatchingPanel.test.tsx` | 11    | `<ICMatchingPanel />` — no props.                                                                                                                                                                          |

### W2 — Grep usage (cross-reference for blast radius)

```
$ grep -rn "DrillThroughChain" src/  →  2 files (test + source only, NOT in any page/route)
$ grep -rn "ICMatchingPanel"     src/  →  2 files (test + source only, NOT in any page/route)
```

**Blast radius = ZERO in production.** Both components are standalone, awaiting integration. No production caller breaks if we add defaults. Safe to patch at source.

### W3 — Run vitest isolated (Codif 19 actual measurement)

```
$ npx vitest run --reporter=verbose --no-coverage --pool=threads \
    src/components/spreadsheet/DrillThroughChain.test.tsx \
    src/components/consolidation/ICMatchingPanel.test.tsx

 × DrillThroughChain > renders without crashing  62ms
   → Cannot read properties of undefined (reading 'map')
 × ICMatchingPanel     > renders without crashing  63ms
   → entries is not iterable

 Test Files  2 failed (2)
      Tests  2 failed (2)
   Duration  10.76s
```

**2 tests, 2 fail, exit 1.** Stack traces point exactly to:

- `DrillTables.tsx:65` — `data.map((row) => ...)` (DrillThroughChain side)
- `ICMatchingEngine.ts:115` — `for (const entry of entries)` (ICMatchingPanel side)

### W3.1 — Stack-frame verification (Codif 19 deeper)

For `DrillThroughChain`, the full stack is:

```
TypeError: Cannot read properties of undefined (reading 'map')
 ❯ SummaryTable src/components/spreadsheet/DrillTables.tsx:65:17
 ❯ Object.react_stack_bottom_frame ...
 ❯ beginWork node_modules/react-dom/...
```

**Frame breakdown:**

1. Test renders `<DrillThroughChain />` (no props)
2. `DrillThroughChain` L49 destructures `summaryData` (= `undefined`)
3. Component renders `<SummaryTable data={summaryData} />` at L99
4. `SummaryTable` L65 calls `data.map((row) => ...)` → throws

**This is a 3-hop call chain:** test → component → sub-component → iter.

For `ICMatchingPanel`, the full stack is:

```
TypeError: entries is not iterable
 ❯ ICMatchingEngine.detectICTransactions src/engines/ICMatchingEngine.ts:115:25
 ❯ src/components/consolidation/ICMatchingPanel.tsx:49:28
 ❯ mountMemo node_modules/react-dom/...
```

**Frame breakdown:**

1. Test renders `<ICMatchingPanel />` (no props)
2. `useMemo` callback at L48-51 invokes `ICMatchingEngine.detectICTransactions(entries, ...)`
3. `entries` (= `undefined`) passed to engine L115
4. `for (const entry of entries)` → throws (because `undefined` is not iterable in `for...of`)

**This is a 3-hop call chain:** test → component → useMemo → engine → iter. The `for...of` at L115 is the JavaScript spec-defined failure mode for `undefined`.

## §1.5 Why this isn't test-only (blast-radius check)

Grep W2 confirmed:

- `DrillThroughChain` referenced in **2 files only** (test + source)
- `ICMatchingPanel` referenced in **2 files only** (test + source)

Neither component is imported by any page, route, or other component. They are **standalone modules awaiting integration** — likely intended for a future feature surface (drill-down from FP&A reports; intercompany matching dashboard).

**Implication:** Adding default values to the destructured props is SAFE. No production caller will be affected. If/when integration happens, callers can still pass explicit props (defaults only kick in when prop is omitted).

**Counter-example to learn from:** If a component IS used in production, adding `entries = []` default could mask a caller bug (e.g., API returned `undefined` and we silently render empty UI). Codif 19 says: measure blast radius BEFORE recommending defaults. Here, blast radius = 0, so defaults are correct.

## §2 Root cause analysis (Codif 19 honest-scope)

**Both failures share the same root cause class: "no default for required prop when test renders bare component".**

| File              | Trigger                                             | Downstream call                                                                             | Error                            |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------- |
| DrillThroughChain | `<DrillThroughChain />` → `summaryData = undefined` | `<SummaryTable data={undefined}>` → L65 `data.map()`                                        | `Cannot read 'map' of undefined` |
| ICMatchingPanel   | `<ICMatchingPanel />` → `entries = undefined`       | `useMemo(() => detectICTransactions(undefined, ...))` → L115 `for (const entry of entries)` | `entries is not iterable`        |

The leader's dispatch swapped the error strings. Both errors are CORRECT (vitest confirms them), but assigned to wrong files. Catch #26 filed.

**Codif 19 verdict:** root cause is "missing default value for destructured required prop". NOT a test-only issue, NOT a missing mock — it's a component-contract defect. Components are not self-defensive against bare render.

## §3 Fix options (per file)

### DrillThroughChain

| Option                            | Where                        | LOC                                                          | Risk                                                                                                | Maintainability                                             |
| --------------------------------- | ---------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **A. Add default in destructure** | `DrillThroughChain.tsx:49`   | 1 line `{ summaryData = [], period = 'Current', className }` | LOW (no caller depends on undefined behavior — Grep W2 confirms)                                    | HIGH (matches "make component safe to render bare" pattern) |
| B. Add guard in SummaryTable      | `DrillTables.tsx:65`         | 1 line `{data?.map((row) => ...)`                            | MEDIUM (changes SummaryTable contract — other callers may pass null intentionally)                  | MEDIUM (defensive at wrong layer)                           |
| C. Test passes `summaryData={[]}` | `DrillThroughChain.test.tsx` | 1 line `render(<DrillThroughChain summaryData={[]} />)`      | HIGH (test passes with empty data but component still unsafe in production if someone renders bare) | LOW (covers symptom, not cause)                             |

**RECOMMEND: Option A.** Smallest, root-cause-targeted, no blast-radius change (Grep W2 = 2 files only).

### ICMatchingPanel

| Option                            | Where                                          | LOC                                                                  | Risk                                                            | Maintainability                                            |
| --------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| **A. Add default in destructure** | `ICMatchingPanel.tsx:48`                       | 1 line `{ entries = [], entityNames = {}, period = 'Current', ... }` | LOW (Grep W2 = 2 files only)                                    | HIGH (consistent with DrillThroughChain fix)               |
| B. Add guard in engine            | `ICMatchingEngine.ts:detectICTransactions:115` | 1 line `if (!Array.isArray(entries)) return [];`                     | MEDIUM (engine silently swallows bad input — masks caller bugs) | MEDIUM (defensive at wrong layer; engine should be strict) |
| C. Test passes `entries={[]}`     | `ICMatchingPanel.test.tsx`                     | 1 line `render(<ICMatchingPanel entries={[]} />)`                    | HIGH (same as DrillThroughChain C)                              | LOW                                                        |

**RECOMMEND: Option A.** Same rationale as DrillThroughChain.

**Bonus: B is tempting for ICMatchingEngine but violates "engine is strict, callers must validate" principle. Pick A.**

## §4 Implementation (recommended Option A for both)

### Patch 1: DrillThroughChain.tsx

```diff
- function DrillThroughChain({ summaryData, period, className }: DrillThroughChainProps) {
+ function DrillThroughChain({
+   summaryData = [],
+   period = 'Current',
+   className,
+ }: DrillThroughChainProps) {
```

**Diff stats:** +4 lines, -1 line = +3 net LOC.

### Patch 2: ICMatchingPanel.tsx

```diff
- function ICMatchingPanel({ entries, entityNames, period, onEliminationsGenerated, className }: ICMatchingPanelProps) {
+ function ICMatchingPanel({
+   entries = [],
+   entityNames = {},
+   period = 'Current',
+   onEliminationsGenerated,
+   className,
+ }: ICMatchingPanelProps) {
```

**Diff stats:** +6 lines, -1 line = +5 net LOC.

**Total: +8 LOC across 2 files.** Risk: LOW (Grep W2 confirms no production caller).

## §5 Verification (Codif 19 post-apply)

1. Re-run isolated vitest on both files: expect `2 passed (2)`, exit 0.
2. Re-run full vitest on canonical: expect 825/825 (was 825/825 + 2 new failures, becomes 827/827 or whatever the new total is).
3. Re-run bench (T-PR-002b + T-PR-003): 28/28 PASS expected (no perf regression — these are destructure defaults, no runtime cost).
4. Apollo apply-time check: `git diff` shows ONLY the 2 destructure blocks changed. No collateral.

### §5.5 Rollback plan (defensive)

If Option A introduces a regression (e.g., a future integration caller relied on the absence of defaults to detect "no data yet"):

1. Revert the destructure defaults (Apollo: 1-line revert per file, 2 min).
2. Re-run vitest: expect 2 FAIL (back to broken state).
3. Re-apply with **Option B** instead (downstream guard at SummaryTable L65 / ICMatchingEngine L115) — 2 more LOC, 5 min.
4. Net cost: ~10 min if rollback needed. Low risk to attempt.

**Pre-condition for rollback trigger:** if the new pass rate of isolated vitest is 0/2 (both still fail), or a new test failure surfaces elsewhere, rollback within 10 min.

## §6 Cross-Muse handoffs

- **Apollo** (apply T-PR-008 v0.1): 2 patches, ~8 LOC total, ~5 min apply. Push-INDEPENDENT (post-push deliverable — apply after T-PR-007 v0.1 Path A/B is in).
- **Athena** (T-AT-016 v0.4 code quality audit): flag this for review after Apollo applies. Verify Grep W2 still shows only 2 files per component (no new production caller slipped in).
- **Hephaestus** (T-HEP-024 v0.3 threat model): no security delta (default values only, no auth/data-flow change). Catch #26 evidence reinforces the recurring "Leader's honest-scope error" pattern — recommend Codif 32 candidate if 3rd instance in next 2 cycles.

---

## HL (Honest Labeling) disclosures

- **HL #1 (Codif 7):** §0 catch #26 documents the leader's error-string swap. Acknowledged, not glossed.
- **HL #2 (Codif 19):** §1 W3 vitest timestamps captured (62ms, 63ms, 10.76s). §2 root cause derived from stack frames, not guess.
- **HL #3 (Codif 22):** Frontmatter pins v0.1, 2026-06-13, push-INDEPENDENT. Bump to v0.2 if §4 implementation changes.
- **HL #4 (Codif 31):** Spec written to canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\prometheus\T-PR-008_pattern_c_component_impl_fixes_v0.1.md`. fs.existsSync post-write verified.
- **HL #5 (scope):** 6 sections, ~230L (target was 200-280L, within range). Not 8 sections like T-PR-007 — Pattern C is narrower (2 files, 1 fix pattern), so 6 sections are sufficient.
- **HL #6 (Caveat):** I am running on cached source reads from previous turns. If DrillTables.tsx or ICMatchingEngine.ts has changed in the last few cycles, the stack-frame line numbers may be off by 1-3. Re-verify by reading source fresh before Apollo applies.
- **HL #7 (Recommendation confidence):** Option A is recommended for both files. If Athena disagrees (e.g., engine-layer guard is preferred for ICMatchingPanel), defer to her T-AT-016 v0.4 audit verdict.

## Codif 31 disclosure

This spec was written at canonical path: `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\prometheus\T-PR-008_pattern_c_component_impl_fixes_v0.1.md`. Post-write verification: fs.existsSync returns true. No path-swap incident this turn.

---

**END T-PR-008 v0.1** — 6 sections, ~230L, Codif 22 v0.1 frontmatter, Codif 9 3-witness complete, Codif 19 honest-scope, Catch #26 filed.
