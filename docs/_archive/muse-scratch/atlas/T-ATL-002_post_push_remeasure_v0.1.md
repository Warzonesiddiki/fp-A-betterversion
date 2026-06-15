# T-ATL-002 v0.1 — Post-Push 5-Gate Re-Measurement at Canonical (Green Arc Capture)

**Date:** 2026-06-13 (cycle 12 wave 2 turn 12+ — TBD on Apollo completion)
**Owner:** Atlas (slot 019ec100-8712)
**Status:** **PRE-STAGED TEMPLATE** — sections only, actual numbers PENDING Apollo patch application
**Path:** `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\atlas\T-ATL-002_post_push_remeasure_v0.1.md`
**Codifications:** Codif 7 (Honest Labeling), Codif 9 (3-witness), Codif 11 v0.2 (honest-scope), Codif 19 (TENTATIVE markers), Codif 22 v0.1 (spec-version-pinning), Codif 31 (Muse write-sandbox isolation)

---

## Codif 22 v0.1 Spec-Version-Pinning Frontmatter

```yaml
spec_version: 0.1
parent_spec: T-ATL-001 v0.4 (canonical 5-gate re-measurement, SHIPPED 2026-06-13 turn 10)
pin_date: 2026-06-13
pin_owner: Atlas (slot 019ec100-8712)
execution_trigger: Apollo patch completion (T-PR-007 v0.2 + T-PR-009 v0.1 + vite.config.ts:45 tsc fix + cubeMigration 12×30s timeout fix)
eta_template: 15 min (template only) + 30 min (execution with actual numbers)
depends_on:
  - T-PR-007 v0.2 (Apollo — 3 atomic patches: setup.ts i18n +24 LOC, NLQChat selector, AllocationJournalTable selector)
  - T-PR-009 v0.1 (Apollo — vite.config.ts:45 tsc error fix)
  - cubeMigration.test.ts timeout fix (Apollo — 12 tests × 30s = 360s budget consumption)
blocks:
  - T-MN-013 v0.3 (Mnemosyne — needs post-push green-arc data for §1 Codif 31 evidence)
  - T-HEP-024 v0.2 (Hephaestus — needs post-push gate state for §2 Codif 31 attack-surface)
  - T-ST-024 v0.5 (Strategos — needs post-push 5-of-5 for §3 Y2 board pack ship readiness re-anchor)
expected_outcome: 3/5 → 5/5 green arc captured, with TENTATIVE markers on Gate 3 if cubeMigration fix is partial
```

---

## §0 Codif 19 Honest-Scope (PRE-EXECUTION)

**This v0.1 is a PRE-STAGED TEMPLATE.** All measurements in §3 are PLACEHOLDERS (`[TBD: actual number]`) and will be filled in only AFTER Apollo's 4 patch families are applied and pushed to canonical `origin/main`.

**Scope boundary (Codif 11 v0.2):**

- IN-scope: 5-gate re-measurement at canonical (`C:\Users\Tahir\Desktop\frontend that i want\fpa\`) AFTER Apollo patches
- IN-scope: capture the 3/5 → 5/5 green-arc transition with 3-witness verification (D-002)
- OUT-of-scope: Apollo's actual patch content (Apollo owns T-PR-007 v0.2, T-PR-009 v0.1, vite.config.ts:45, cubeMigration)
- OUT-of-scope: Hera's Pattern D regression test (T-HE-025 follow-up, separate work)
- OUT-of-scope: Mnemosyne T-MN-013 v0.3 codif-registry update (consumes this report as input)

**TENTATIVE markers (Codif 19, will be resolved at execution):**

- Gate 3 (test) result is TENTATIVE — depends on whether Apollo's cubeMigration fix is (a) full 12-test, (b) partial 6-8 test, or (c) mocked. Pre-fix budget consumption is 360s; post-fix is projected 150-180s.
- Gate 1 (tsc) is TENTATIVE — depends on whether Apollo applies the 1-line `process.env.VITE_SENTRY_RELEASE ? { name: ... } : undefined` fix exactly as proposed in T-ATL-001 v0.4 §3.
- Gates 2, 4, 5 (lint, build, bundle-check) are projected PASS based on v0.4 baseline (these are independent of Apollo's patches).

**Honest Labeling (Codif 7) commitment at execution:**

- Every claim will have 3-witness verification (Glob ABSOLUTE + `git log --oneline -5` + Read gate-output)
- TENTATIVE markers retained on any partial measurement
- Source file:line citations for every Apollo patch reference

---

## §1 Pre-Push Baseline Cross-Reference (T-ATL-001 v0.4)

**Baseline gate state at canonical BEFORE Apollo patches (v0.4 §1, 2026-06-13 turn 10):**

| Gate               | Pre-Push Status | Failure Detail                                                                            | Apollo Patch Required                                                         |
| ------------------ | --------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **1 tsc**          | FAIL            | `vite.config.ts:45,13` TS2322 — `release: process.env.VITE_SENTRY_RELEASE` not assignable | T-PR-009 v0.1 (1-line fix)                                                    |
| **2 lint**         | PASS            | 0 warnings, 0 errors                                                                      | None                                                                          |
| **3 test**         | FAIL            | cubeMigration 360s timeout (60% budget) + 4 other file failures (17 tests)                | cubeMigration timeout fix + investigate Underwriting/Production/Churn/wcag-aa |
| **4 build**        | PASS            | 4.90s, 6100 KiB precache                                                                  | None                                                                          |
| **5 bundle-check** | PASS            | main 57KB gzip, total 1678KB gzip                                                         | None                                                                          |

**Pre-push 3-of-5 PASS state is the green-arc starting point for v0.1.** Target: capture transition to 5-of-5 PASS after Apollo's 4 patch families land.

**v0.4 bench opt-in policy is already applied at canonical (T-ATL-001 v0.4 §2):**

- `vite.config.ts:240-247` test.exclude extended to 6 entries (2 original + 4 bench-related)
- `package.json:13-14` test:bench + test:bench:ci scripts added
- 6 bench test files excluded from default `npm run test` (3 `*.benchmark.test.ts` + 3 `*.bench.test.ts`)
- 6 helper lib files (`*.benchmark.ts`) were never picked up — no change needed

**v0.4 3-retraction is also already applied (Codif 31 B.5):**

- "89.181s bench wall-time" → retracted, actual is 5.32ms (Prometheus T-PR-003 v0.2 re-run)
- "153ms / 100ms threshold" → retracted, actual is 5.40ms canonical (1.5% within noise)
- "6 critical deletions" → retracted, canonical is healthy (HEAD 67b5b689, all 6 files present)

---

## §2 Apollo Patch Summary (TBD — pending Apollo's 4 patch families)

**Patch family 1: T-PR-007 v0.2 (3 atomic commits)**

### 2.1 setup.ts i18n initialization (24 LOC)

- **File:** `src/test/setup.ts` (canonical)
- **Change:** Add i18n init block (24 LOC) — prevents test failures from missing i18n context
- **Lines affected:** TBD (Apollo to specify at SHIP)
- **Witness 1 (Glob):** `[TBD: actual absolute path verified at execution]`
- **Witness 2 (git log):** `[TBD: commit hash from Apollo's atomic push]`
- **Witness 3 (Read):** `[TBD: diff hunks from `git show <hash> -- src/test/setup.ts`]`

### 2.2 NLQChat selector fix (1 line)

- **File:** `src/components/NLQChat/NLQChat.test.tsx` (canonical)
- **Change:** Fix selector to match updated DOM (1 line)
- **Lines affected:** TBD
- **Witness 1/2/3:** TBD

### 2.3 AllocationJournalTable selector fix (1 line)

- **File:** `src/components/AllocationJournalTable/AllocationJournalTable.test.tsx` (canonical)
- **Change:** Fix selector to match updated DOM (1 line)
- **Lines affected:** TBD
- **Witness 1/2/3:** TBD

**Patch family 2: T-PR-009 v0.1 (vite.config.ts:45 tsc fix)**

### 2.4 Sentry release type guard (1 line)

- **File:** `vite.config.ts` (canonical, line 45)
- **Change:** `release: process.env.VITE_SENTRY_RELEASE ? { name: process.env.VITE_SENTRY_RELEASE } : undefined`
- **Lines affected:** 1 (line 45)
- **Witness 1 (Glob):** `C:\Users\Tahir\Desktop\frontend that i want\fpa\vite.config.ts`
- **Witness 2 (git log):** `[TBD: commit hash]`
- **Witness 3 (Read):** `[TBD: actual line content post-patch]`

**Patch family 3: cubeMigration 12×30s timeout fix**

### 2.5 cubeMigration.test.ts timeout resolution

- **File:** `src/test/cubeMigration.test.ts` (canonical)
- **Change:** Apollo selects ONE of: (a) increase testTimeout to 60s for migration suite, (b) mock migration store to avoid real persistence, (c) refactor to async + longer timeout
- **Selected option:** `[TBD: Apollo's choice at SHIP]`
- **Lines affected:** TBD
- **Witness 1/2/3:** TBD

**Patch family 4: Test failure investigation (4 files, 17 tests)**

### 2.6 UnderwritingDashboard, ProductionDashboard, ChurnDashboard, wcag-aa

- **Status:** Apollo investigating — may or may not be in scope for the same push
- **Action:** Atlas will document the post-fix state in §3 Gate 3 row

---

## §3 5-Gate Re-Measurement (TBD — actual numbers post-Apollo)

**Witness protocol (D-002 3-witness, same as v0.4):**

```
Per gate:
  Witness 1: Glob ABSOLUTE path to verify file presence
  Witness 2: git log --oneline -5 to confirm HEAD context
  Witness 3: Read gate-output (tsc/lint/test/build/bundle-check) for ACTUAL numbers
```

### Gate 1 — TypeScript Compiler (tsc)

- **Command:** `npx tsc --noEmit`
- **Pre-push baseline:** FAIL (TS2322 at vite.config.ts:45)
- **Expected post-Apollo:** PASS (T-PR-009 v0.1 fix applied)
- **Actual exit code:** `[TBD]`
- **Actual error count:** `[TBD]`
- **Actual error details:** `[TBD]`
- **Status:** `[TBD: PASS / FAIL / PARTIAL]`
- **TENTATIVE marker:** `[TBD: resolve at execution]`

### Gate 2 — ESLint

- **Command:** `npm run lint`
- **Pre-push baseline:** PASS (0 warnings, 0 errors)
- **Expected post-Apollo:** PASS (no Apollo patch touches lint-relevant code)
- **Actual exit code:** `[TBD]`
- **Actual warning count:** `[TBD]`
- **Actual error count:** `[TBD]`
- **Status:** `[TBD: PASS / FAIL]`

### Gate 3 — Vitest (test)

- **Command:** `npm run test` (bench excluded per v0.4 §2 policy)
- **Pre-push baseline:** FAIL (timeout at 590s, cubeMigration 360s + 4 other files 17 tests failed)
- **Expected post-Apollo:** PASS (T-PR-007 v0.2 selector fixes + cubeMigration timeout fix)
- **Actual exit code:** `[TBD]`
- **Actual test count:** `[TBD: total / passed / failed]`
- **Actual wall-time:** `[TBD: seconds]`
- **Per-file breakdown:**
  - cubeMigration.test.ts: `[TBD: 51 / passed / failed / timeouts]`
  - UnderwritingDashboard.test.tsx: `[TBD: 6 / passed / failed]`
  - ProductionDashboard.test.tsx: `[TBD: 8 / passed / failed]`
  - ChurnDashboard.test.tsx: `[TBD: 6 / passed / failed]`
  - wcag-aa.test.tsx: `[TBD: 17 / passed / failed]`
  - All other test files: `[TBD: aggregate pass rate]`
- **Status:** `[TBD: PASS / FAIL / PARTIAL]`
- **TENTATIVE marker:** `[TBD: resolve at execution — if cubeMigration is partial (option b mock), retain TENTATIVE on Gate 3]`

### Gate 4 — Build (Vite production build)

- **Command:** `npm run build`
- **Pre-push baseline:** PASS (4.90s, 6100 KiB precache)
- **Expected post-Apollo:** PASS (no Apollo patch touches build config beyond what T-PR-009 v0.1 fixes)
- **Actual exit code:** `[TBD]`
- **Actual wall-time:** `[TBD: seconds]`
- **Actual precache size:** `[TBD: KiB]`
- **Status:** `[TBD: PASS / FAIL]`

### Gate 5 — Bundle-check

- **Command:** `node scripts/bundle-check.js`
- **Pre-push baseline:** PASS (main 57KB gzip, total 1678KB gzip)
- **Expected post-Apollo:** PASS (no Apollo patch changes bundle composition)
- **Actual exit code:** `[TBD]`
- **Actual main bundle:** `[TBD: KB raw → KB gzip]`
- **Actual total bundle:** `[TBD: KB raw → KB gzip]`
- **Status:** `[TBD: PASS / FAIL]`

### Summary Table (TBD — fill at execution)

| Gate           | Pre-Push | Post-Apollo Target | Actual Post-Apollo | Δ       |
| -------------- | -------- | ------------------ | ------------------ | ------- |
| 1 tsc          | FAIL     | PASS               | `[TBD]`            | `[TBD]` |
| 2 lint         | PASS     | PASS               | `[TBD]`            | `[TBD]` |
| 3 test         | FAIL     | PASS               | `[TBD]`            | `[TBD]` |
| 4 build        | PASS     | PASS               | `[TBD]`            | `[TBD]` |
| 5 bundle-check | PASS     | PASS               | `[TBD]`            | `[TBD]` |
| **TOTAL**      | **3/5**  | **5/5**            | `[TBD]`            | `[TBD]` |

---

## §4 Green Arc Capture (3/5 → 5/5)

**Pre-push state (T-ATL-001 v0.4 §1):** 3/5 PASS (lint, build, bundle-check) — 2/5 FAIL (tsc, test)

**Post-Apollo target state:** 5/5 PASS

**Green arc transition narrative (TBD — fill at execution):**

- Gate 1 (tsc): FAIL → `[TBD: PASS / FAIL]` via T-PR-009 v0.1 1-line fix
- Gate 3 (test): FAIL → `[TBD: PASS / FAIL / PARTIAL]` via T-PR-007 v0.2 selector fixes + cubeMigration timeout fix

**Witness 1 (Glob ABSOLUTE):** `[TBD: verify all 4 Apollo patch files at canonical path]`
**Witness 2 (git log):** `[TBD: 4 atomic commits visible in HEAD history]`
**Witness 3 (Read gate-output):** `[TBD: actual gate output captured]`

**If 5/5 achieved:** SHIP as SUCCESS, all downstream Muse work (Mnemosyne, Hephaestus, Strategos) unblocked.
**If 4/5 (Gate 3 partial):** SHIP as PARTIAL with TENTATIVE markers, document cubeMigration partial state, defer full green arc to T-ATL-002 v0.2.
**If 3/5 or worse:** Codif 11 v0.2 honest-scope flag — re-measure methodology or Apollo patch application is flawed. STOP and ASK Leader.

---

## §5 Cross-Muse Handoffs (TBD — fill at execution)

**To Mnemosyne T-MN-013 v0.3 (ONBOARDING.md v0.3 — Codif 30 v0.2 + Codif 31):**

- §1 of T-MN-013 v0.3 should include Codif 31 full text + cycle 12 catches (#22 Hera, #23 Hera, #24 Prometheus, #25 Atlas) as evidence — REFERENCE: T-ATL-001 v0.4 §6
- §1 of T-MN-013 v0.3 should include D-008 protocol (3-step verification: pwd, git remote -v, ASK Leader if ambiguity) — REFERENCE: T-ATL-001 v0.4 §5
- **[NEW for v0.1]:** §1 of T-MN-013 v0.3 should reference T-ATL-002 v0.1 as Codif 31 worked example (3/5 → 5/5 green arc captured via 4 Apollo patches)
- **[NEW for v0.1]:** §1 of T-MN-013 v0.3 should reference bench opt-in policy v0.1 as Codif 7 honest-labeling example (default test fast, bench opt-in via test:bench script)

**To Hephaestus T-HEP-024 v0.2 (Codif 30 v0.2 + Codif 31 attack-surface):**

- §2 of T-HEP-024 v0.2 should add Codif 31 attack-surface analysis (Muse write-sandbox bypass) — REFERENCE: T-ATL-001 v0.4 §6
- **[NEW for v0.1]:** §2 of T-HEP-024 v0.2 should add T-PR-007 v0.2 + T-PR-009 v0.1 as Codif 31 worked example (Apollo's patches at canonical, not wrong-path)

**To Strategos T-ST-024 (Y2 board pack v0.5):**

- §6 risk register: add "WCAG 2.1.1 keyboard pattern compliance" row (severity MEDIUM, mitigation Apollo post-push 6-7h) — REFERENCE: T-ATL-001 v0.4 §4
- §3 ship readiness: re-anchor to canonical `[TBD: post-Apollo gate state]` (was 3/5 at v0.4 SHIP, target 5/5 at v0.1 SHIP)

**To Hera T-HE-025 follow-up (Pattern D regression test):**

- Action: Add `__tests__/a11y/pattern-d-keyboard.test.ts` covering ARIA widget role → WAI-ARIA APG keyboard handler mapping — REFERENCE: T-ATL-001 v0.4 §4
- **[NEW for v0.1]:** Confirm wcag-aa.test.tsx Gate 3 status — if wcag-aa is the only failing test file in Gate 3, Hera may need to defer to a separate push (T-HE-027 candidate)

---

## §6 Codif 19 Self-Assessment (TBD — fill at SHIP)

**Codif 7 (Honest Labeling) checklist:**

- ✅ No "fabrication" labels without 3-witness verification at canonical
- ✅ TENTATIVE markers on partial measurements (Gate 3 conditional on cubeMigration fix)
- ✅ Source file:line citations for every Apollo patch reference
- ✅ Pre-staged template clearly marked as TEMPLATE (not SHIPPED) until §3 §4 filled with actual numbers

**Codif 9 (3-witness) checklist:**

- ✅ Witness protocol declared in §3 (Glob ABSOLUTE + git log + Read gate-output)
- ⏳ All 15 witnesses (3 per gate × 5 gates) to be filled at execution

**Codif 11 v0.2 (honest-scope) checklist:**

- ✅ IN-scope / OUT-of-scope declared in §0
- ✅ Apollo patch content marked as Apollo's responsibility (not Atlas's)
- ✅ Pre-staged template explicitly marked as not-yet-executed

**Codif 19 (TENTATIVE markers) checklist:**

- ✅ Gate 1 marked TENTATIVE (depends on T-PR-009 v0.1 exact application)
- ✅ Gate 3 marked TENTATIVE (depends on cubeMigration fix option chosen)
- ✅ Gates 2, 4, 5 marked as projected PASS (not TENTATIVE — high confidence from v0.4 baseline)

**Codif 22 v0.1 (spec-version-pinning) checklist:**

- ✅ Frontmatter block declares spec_version, parent_spec, depends_on, blocks
- ✅ ETA declared: 15 min template + 30 min execution
- ✅ Execution trigger declared: Apollo patch completion

**Codif 31 (Muse write-sandbox isolation) checklist:**

- ✅ Path declared as canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\` (NOT finplan-pro)
- ✅ 3-witness verification protocol (D-008) referenced in §0
- ✅ All Apollo patch file references will be verified at canonical path at execution

---

**TEMPLATE PRE-STAGED. Atlas (slot 019ec100-8712). Codif 7 + 9 + 11 v0.2 + 19 + 22 v0.1 + 31 compliant.**

**Execution trigger:** Apollo patch completion (T-PR-007 v0.2 + T-PR-009 v0.1 + vite.config.ts:45 + cubeMigration).
**Execution ETA:** 30 min from Apollo SHIP-COMPLETE.
**SHIP target:** 5/5 green arc with all §3 placeholders replaced by actual numbers.

**Cross-references:**

- Parent spec: `docs/drafts/atlas/T-ATL-001_v0.4_canonical_remeasure.md` (SHIPPED 2026-06-13 turn 10)
- Memory CURRENT entry: `atlas-codif-31-canonical-repo-path-disclosure-2026-06-13.md`
- Memory CURRENT entry: `atlas-t-atl-001-v04-canonical-remeasure-2026-06-13.md`
- Apollo patch docs (TBD): `docs/drafts/apollo/T-PR-007_v0.2_*.md`, `docs/drafts/apollo/T-PR-009_v0.1_*.md`
- Hera T-HE-025 Pattern D: `docs/drafts/hera/T-HE-025_pattern_d_keyboard_sweep_v0.1.md` (Codif 32 CANDIDATE source)
- Mnemosyne T-MN-013 v0.3: `docs/drafts/mnemosyne/T-MN-013_onboarding_v0.3.md` (downstream consumer)
- Hephaestus T-HEP-024 v0.2: `docs/drafts/hephaestus/T-HEP-024_codif30_attack_surface_v0.2.md` (downstream consumer)
- Strategos T-ST-024 v0.5: `docs/drafts/strategos/T-ST-024_y2_board_pack_v0.5.md` (downstream consumer)
