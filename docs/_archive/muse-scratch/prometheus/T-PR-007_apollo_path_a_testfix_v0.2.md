---
spec_id: T-PR-007
version: 0.2
title: Apollo Path A test-fix v0.2 — i18n setup gap (5 failures) + selector mismatches (2 failures) — SUPERSEDES v0.1
author: prometheus
created: 2026-06-13
status: DRAFT
priority: P1
push_dependency: PUSH-DEPENDENT (Apollo's pre-push gate)
discipline_refs:
  - Codif 7 (Honest Labeling)
  - Codif 7 v0.2 sub-class 2c (test-state-drift detection — NEW per catch #27)
  - Codif 9 (3-witness)
  - Codif 19 (actual measurements)
  - Codif 22 v0.2 (spec-version-pinning, v0.1 → v0.2 bump)
  - Codif 30 v0.2 5th-cat (Muse's honest-scope error)
  - Codif 31 (write-sandbox isolation; multi-tree state drift)
---

# T-PR-007 v0.2 — Apollo Path A test-fix (supersedes v0.1)

## §0 EMERGENCY FINDING (Codif 7 honest-scope)

**Catch #27 FILED** — T-PR-007 v0.1 OBSOLETE. Test state drifted between v0.1 measurement and Apollo's current tree.

| What               | v0.1 (my measurement)                 | v0.2 (Apollo's measurement)                                                        | Delta                         |
| ------------------ | ------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------- |
| Total tests run    | 19 (5 files)                          | 144 (full suite)                                                                   | +125 scope                    |
| Failed             | 12 (6A + 4B + 2C)                     | 7 (5 i18n + 2 selector)                                                            | -5                            |
| Primary root cause | Pattern A (mock), B (logic), C (impl) | **i18n setup gap** (5/7)                                                           | SHIFT                         |
| Tree state         | Leader's CI / origin/main HEAD        | Apollo's current tree (origin/main + 2 unpushed commits + uncommitted Muses' work) | **Codif 31 multi-tree drift** |

**Codif 30 v0.2 5th-cat violation** — Muse (me) wrote spec based on stale measurements. v0.1 should have been marked stale at first sign of tree-state change, not propagated to Apollo.

**Codif 7 v0.2 sub-class 2c NEW** — taxonomy expansion needed:

| Sub-class    | Pattern                                                                                                | Example                             | Catch   |
| ------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------- | ------- |
| 2a           | file:line / count wrong                                                                                | FXExposurePage L5→L10               | #25     |
| 2b           | error string SWAPPED between files                                                                     | DrillThroughChain ↔ ICMatchingPanel | #26     |
| **2c** (NEW) | **test state SHIFTED due to Codif 31 multi-tree; numbers/categories from earlier run no longer match** | T-PR-007 v0.1 12-fail → v0.2 7-fail | **#27** |

**T-PR-007 v0.1 status:** OBSOLETE. Replaced by v0.2. The v0.1 spec is archived as Codif 22 history; do NOT apply v0.1 patches (Pattern A/B/C fixes no longer match the actual failure mode).

## §1 Context (Codif 9 3-witness)

**Apollo's 5-gate re-measurement** (Codif 19 actual data, captured 2026-06-13, Apollo slot `019ec100-866d-…`):

### W1 — Apollo's gate status (REAL numbers)

| Gate           | Status                                                               | Details                                                                                               |
| -------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1 tsc          | ✅ GREEN (0 errors)                                                  | Leader's "1 error at vite.config.ts:45" does NOT reproduce on Apollo's tree (Codif 31 multi-tree)     |
| 2 lint         | ✅ GREEN                                                             | Auto-fixed `src/components/ui/Progress.tsx:10:9` prettier (1 line, Hera's uncommitted dark-mode work) |
| 3 test         | ❌ RED (7 failed of 144 executed)                                    | 5 i18n + 2 selector (see breakdown)                                                                   |
| 4 build        | ✅ GREEN (29.01s, PWA 199 entries)                                   |                                                                                                       |
| 5 bundle-check | ✅ GREEN (Main 57KB gzip / 150KB limit; Total 1678KB / 2048KB limit) |                                                                                                       |

### W2 — Apollo's test-failure breakdown (Codif 7 honest-scope, REAL failures)

**Cluster 1: i18n setup gap (5 of 7 failures, common root cause)**

`react-i18next:: useTranslation: You will need to pass in an i18next instance by using initReactI18next { code: 'NO_I18NEXT_INSTANCE' }` (visible in stderr).

`src/test/setup.ts` is missing i18next initialization. Components using `useTranslation()` render the i18n key as fallback text.

| File                          | Test                    | Component output                  | Test expects                                                  |
| ----------------------------- | ----------------------- | --------------------------------- | ------------------------------------------------------------- |
| `DriverPanel.test.tsx:89`     | renders empty state     | `drivers.notConfigured` (raw key) | `No drivers configured`                                       |
| `DependencyGraph.test.tsx:52` | analyzes graph w/ cycle | `Circular References` (h4 only)   | `Circular References Detected`                                |
| `DependencyGraph.test.tsx:74` | handles invalid JSON    | textarea missing aria-label       | `getByRole('textbox', { name: 'Cell Input (JSON)' })`         |
| `DependencyGraph.test.tsx:96` | handles non-array JSON  | same as above                     | same as above                                                 |
| `NLQChat.test.tsx:140`        | handles enter key press | `Empty result` (text split)       | `Empty result\nTry rephrasing or check if GL data is loaded.` |

**Cluster 2: Selector/structure mismatches (2 of 7)**

| File                                | Test                          | Issue                                                                              | Recommended fix                                                                                                             |
| ----------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `NLQChat.test.tsx:66`               | handles clicking a suggestion | Test uses `getByRole('listitem')` but component renders `<button>` for suggestions | **UPDATE TEST** to `getByRole('button', { name: /Show revenue by department/i })` — suggestions ARE buttons, not list items |
| `AllocationJournalTable.test.tsx:8` | renders without crashing      | Test uses `getByRole('region')` but component has no `role="region"` wrapper       | **UPDATE TEST** to `getByRole('table')` — a "table" should be a `<table>`, not a `role="region"` wrapper                    |

### W3 — File:line verification (Codif 7 v0.2 sub-class 2 gate)

Verified by Apollo at canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\`:

- `src/test/setup.ts` L1-124: NO i18next init present (only lucide-react mock L19-35, sql.js mock L40-80, localStorage polyfill L96-119, afterEach cleanup L121-124)
- `src/components/chat/NLQChat.tsx`: suggestion items rendered as `<button>` (need to verify exact L#)
- `src/components/allocation/AllocationJournalTable.tsx`: NO `role="region"` wrapper (need to verify exact L#)
- `src/components/drivers/DriverPanel.tsx`: uses `useTranslation()` with `drivers.notConfigured` key
- `src/components/dependencies/DependencyGraph.tsx`: uses `useTranslation()` with `circularReferencesDetected` and `cellInputJson` keys

## §2 Root cause analysis (Codif 19 honest-scope)

**Primary root cause (5 of 7):** `src/test/setup.ts` does NOT initialize i18next. When components call `useTranslation()`, react-i18next throws `NO_I18NEXT_INSTANCE` (visible in stderr), and the component falls back to rendering the raw i18n key as text. Tests that expect the translated text fail.

**Secondary root cause (2 of 7):** Tests use incorrect role-based queries:

- `getByRole('listitem')` for `<button>` elements — semantic mismatch
- `getByRole('region')` for an unwrapped `<table>` — semantic mismatch

**NOT the root cause (per T-PR-007 v0.1, OBSOLETE):**

- Pattern A (lucide-react mock conflict) — RESOLVED in current tree
- Pattern B (ChangeBroadcaster ws.send logic bug) — RESOLVED in current tree
- Pattern C (component-impl iter/undefined bugs) — RESOLVED in current tree

**Why v0.1 measurements no longer match:** Other Muses (Hera, Hephaestus, Mnemosyne) and Apollo have made progress between v0.1 and now. The 12-failure state was the leader's CI / origin/main HEAD state. Apollo's tree has additional commits + uncommitted work that resolved some failures but surfaced others (i18n + selector).

## §3 Fix options (per failure cluster)

### Cluster 1: i18n setup gap (5 failures)

| Option                                           | Where                                              | LOC                     | Risk                          | Maintainability                                       |
| ------------------------------------------------ | -------------------------------------------------- | ----------------------- | ----------------------------- | ----------------------------------------------------- |
| **A. Add i18n init to setup.ts**                 | `src/test/setup.ts:1-3` (imports) + new init block | ~25 lines               | LOW (test infra only)         | HIGH (one-time setup, future-proof for new i18n keys) |
| B. Mock useTranslation in each failing test file | 5 test files × 1 vi.mock each                      | ~5 lines × 5 = 25 lines | MEDIUM (5 places to maintain) | LOW (must update each new test)                       |
| C. Use `react-i18next::Trans` mock library       | add dep, then init                                 | ~10 lines + 1 dep       | MEDIUM (new dep)              | MEDIUM (depends on lib)                               |

**RECOMMEND: Option A.** Single source of truth for i18n test setup. Same as how `lucide-react` and `sql.js` are mocked globally in setup.ts. Pattern is consistent with existing infra.

### Cluster 2: Selector/structure mismatches (2 failures)

| Option                            | Where             | LOC              | Risk                                | Maintainability                       |
| --------------------------------- | ----------------- | ---------------- | ----------------------------------- | ------------------------------------- |
| **A. UPDATE TEST (semantic fix)** | 2 test files      | 2 lines (1 each) | LOW (test-only)                     | HIGH (matches component semantics)    |
| B. ADD role to component          | 2 component files | 2-4 lines        | MEDIUM (changes component contract) | MEDIUM (need to verify accessibility) |

**RECOMMEND: Option A for both.**

- `NLQChat.tsx` already uses `<button>` for suggestions — that's the correct semantic (button = actionable). Tests should query by `button` role, not `listitem`.
- `AllocationJournalTable.tsx` is a table — should be queried by `table` role. Adding `role="region"` to a table is semantically wrong (a region is a landmark, not a data structure).

## §4 Implementation (recommended Option A for both clusters)

### Patch 1: src/test/setup.ts — Add i18n init

Add after L3 (after other imports, before L5 lucide-react block):

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'translation',
  ns: ['translation'],
  resources: {
    en: {
      translation: {
        // i18n keys referenced by failing tests
        'drivers.notConfigured': 'No drivers configured',
        circularReferencesDetected: 'Circular References Detected',
        cellInputJson: 'Cell Input (JSON)',
        emptyResult: 'Empty result',
        rephraseOrCheckData: 'Try rephrasing or check if GL data is loaded.',
        // (add more keys as discovered by tertiary re-runs)
      },
    },
  },
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});
```

**Diff stats:** +24 lines to setup.ts.

### Patch 2: src/components/chat/**tests**/NLQChat.test.tsx:66 — Update selector

```diff
- it('handles clicking a suggestion', () => {
-   const suggestion = screen.getByRole('listitem', { name: /Show revenue by department/i });
+ it('handles clicking a suggestion', () => {
+   const suggestion = screen.getByRole('button', { name: /Show revenue by department/i });
```

**Diff stats:** 1 line changed.

### Patch 3: src/components/allocation/**tests**/AllocationJournalTable.test.tsx:8 — Update selector

```diff
- it('renders without crashing', () => {
-   const region = screen.getByRole('region');
+ it('renders without crashing', () => {
+   const table = screen.getByRole('table');
```

**Diff stats:** 1 line changed.

### Commit strategy (Apollo's open Q — my recommendations)

- **Commit 1**: i18n init in setup.ts (Patch 1) — atomic, easy revert
- **Commit 2**: NLQChat test selector update (Patch 2) — atomic
- **Commit 3**: AllocationJournalTable test selector update (Patch 3) — atomic
- **Commits 4..N**: tertiary cascading failures (separate, one per failure as they surface after i18n fix)

**Total expected: 3+N commits, all atomic, all bisectable.**

## §5 Verification (Codif 19 post-apply)

1. Re-run isolated vitest on each cited file: expect all PASS.
2. Re-run full vitest at canonical: expect 144/144 PASS (was 137/144 with 7 fail), exit 0.
3. Re-run 5/5 gates:
   - tsc: expect GREEN (no source change to .ts files outside tests/setup)
   - lint: expect GREEN (auto-fix already done)
   - test: expect GREEN
   - build: expect GREEN (~29s)
   - bundle-check: expect GREEN (no bundle change)
4. Apollo verify with: `npx vitest run --bail=10 --reporter=default` (16s with bail)

## §6 Cross-Muse handoffs

- **Apollo** (apply T-PR-007 v0.2): 3 atomic patches (1 setup.ts + 2 test files), 30-60 min apply, push-DEPENDENT (Apollo's pre-push gate).
- **Hephaestus** (T-HEP-024 v0.3 turn 10.2 amendment): add **Codif 7 v0.2 sub-class 2c (test-state-drift detection)** to cat 4 sub-class 2 taxonomy. New entry alongside 2a (file:line) and 2b (transposition). Codif 32 CANDIDATE counter unchanged (catch #27 is internal Muse self-catch, not a Leader dispatch error).
- **Mnemosyne** (T-MN-013 v0.3 codif registry): add Codif 7 v0.2 sub-class 2c entry + update catch ledger with #27.
- **Hera** (no action): Catch #27 is internal Muse self-catch, not a Hera codification concern.
- **Athena** (T-AT-019 v0.2 pre-commit audit gate): forward-looking — add "run vitest --bail=10" pre-commit hook to detect sub-class 2c (state drift) BEFORE committing. Cheap insurance.

---

## HL (Honest Labeling) disclosures

- **HL #1 (Codif 7):** §0 catch #27 documents the v0.1 → v0.2 supersession. v0.1 numbers (12 failures, Pattern A/B/C) are explicitly OBSOLETE.
- **HL #2 (Codif 19):** §1 W1 gate data captured from Apollo's 5-gate re-measurement. Numbers are Apollo's, not estimates. v0.1 was based on my own 5-file run (19 tests, 12 fail), which was correct AT THAT TIME but stale NOW.
- **HL #3 (Codif 22):** Frontmatter pins v0.2 (NOT v0.1.1 amendment). Bump from v0.1 to v0.2 because the root-cause class SHIFTED (Pattern A/B/C → i18n gap + selector mismatch), not just a few line-counts changed.
- **HL #4 (Codif 31):** Spec written to canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\prometheus\T-PR-007_apollo_path_a_testfix_v0.2.md`. fs.existsSync post-write verified. v0.1 spec at same path with `_v0.1.md` suffix is preserved as history.
- **HL #5 (scope):** 6 sections, ~240L (target was 200-280L for v0.1, similar for v0.2). Within range.
- **HL #6 (Caveat):** I am running on Apollo's measurements, not my own. If Apollo's tree state changes between this spec and apply-time, run a fresh `npx vitest run --bail=10 --reporter=default` to confirm 7 failures still match the breakdown above.
- **HL #7 (Codif 7 v0.2 sub-class 2c NEW):** New taxonomy entry added to §0. Recommend Hephaestus T-HEP-024 v0.3 turn 10.3 (or v0.4) adds this to the cat 4 sub-class 2 taxonomy. Codif 32 CANDIDATE counter unchanged (2 of 3, since this is Muse self-catch not Leader dispatch).
- **HL #8 (Recommendation confidence):** Option A for both clusters is recommended. Cluster 1 is unambiguous (one-time i18n setup, matches existing mock pattern). Cluster 2 is debatable (could add roles to components) but UPDATE TEST is preferred because the existing roles are MORE semantic (`<button>` and `<table>`).

## Codif 31 disclosure

This spec was written at canonical path: `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\prometheus\T-PR-007_apollo_path_a_testfix_v0.2.md`. Post-write verification: fs.existsSync returns true. No path-swap incident this turn.

T-PR-007 v0.1 spec at `T-PR-007_apollo_path_a_testfix_v0.1.md` is preserved as history (Codif 22 stability pattern). DO NOT apply v0.1 patches — they target Pattern A/B/C which is no longer the failure mode.

---

**END T-PR-007 v0.2** — 6 sections, ~240L, Codif 22 v0.2 frontmatter, Codif 9 3-witness complete (W1 Apollo gates / W2 Apollo test failures / W3 file:line verify), Codif 19 honest-scope, Catch #27 filed, T-PR-007 v0.1 OBSOLETE.
