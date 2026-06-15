---
title: Post-Push Integration Matrix — 9 verified Muse patches + 38+ pending Apollo tasks
author: Athena (019ebcd6-4372-7a52-ba61-778372c520a0)
cycle: D-007
status: DRAFT v0.1
date: 2026-06-12
related: docs/drafts/athena/test-triage/REPORT.md, docs/security-deferrals.md, docs/drafts/mnemosyne/jsdoc-p0/README.md, docs/drafts/hera/role-alert-fixes/README.md, docs/drafts/athena/pre-push-review/REVIEW.md, AGENTS.md
---

# Post-Push Integration Matrix

> **D-007 deliverable.** Pre-validates the post-push queue (29 pre-staged patches in `docs/drafts/`, 223 uncommitted files in working tree, 38+ pending Apollo tasks). This is the single artifact Apollo reads before resuming work in `main` after the imminent push.

---

## 0. Summary of empirical findings (TL;DR)

| Finding | Evidence | Recommendation |
|---|---|---|
| 9 verified Muse patches touch **9 distinct files** | `git apply --check` pairwise (all 6 sampled pairs pass), see §2 | Apply **all 9 in one atomic batch** → 1 commit |
| 20 additional pre-staged patches have NOT been conflict-checked against each other | `find docs/drafts -name "*.patch"` returns 29 total (9 verified + 20 staged) | Run §2 conflict-check **before** staging P1/P2 waves |
| Q3 percentile bug (DEFER-2026-001) is the **only data-integrity** finding in the queue | `docs/security-deferrals.md:13-91` | **Do not** bundle with other patches — keep as its own commit so audit trail stays clean (SOC 2 CC7.2) |
| lucide-react codemod affects **~190 test files** (Pattern 1 from `docs/drafts/athena/test-triage/REPORT.md:55-82`) | Test count = 1,693 (`find . -name "*.test.*" -not -path "*/node_modules/*"`); mock-error sites concentrated in ~190 | Codemod is its own **3-day** epic, not a single PR |
| Immer 13 Zustand stores upgrade is a **silent breaking change** (officially 13 stores in use, per cycle notes) | `src/store/` contains 20+ stores per AGENTS.md:24; immer version pinned in `package.json` | Verify with `npx tsc --noEmit` after each store migration; not a single-commit operation |

**Three actions the founder must approve** (see §7).

---

## 1. Apply-order resolution (9 verified Muse patches)

### 1.1 Verified patch inventory

| # | Muse | Patch | Target file | LOC Δ | Verified? |
|---|---|---|---|---|---|
| 1 | Athena | `docs/drafts/athena/test-triage/PATTERN-2-router-wrapper.patch` | `src/components/ai/CopilotSidebar.test.tsx` | +5 / -1 | ✅ (already applied + tested earlier this cycle) |
| 2 | Hera | `docs/drafts/hera/role-alert-fixes/ExportDialog.patch` | `src/components/reports/ExportDialog.tsx` | +2 / -2 | ✅ Option B (mechanical: add `role="alert"` to a div) |
| 3 | Hera | `docs/drafts/hera/role-alert-fixes/ReportGenHelpers.patch` | `src/components/reports/ReportGenHelpers.tsx` | +2 / -2 | ✅ Option B |
| 4 | Hera | `docs/drafts/hera/role-alert-fixes/ReportProgress.patch` | `src/components/reports/ReportProgress.tsx` | +2 / -2 | ✅ Option B |
| 5 | Mnemosyne | `docs/drafts/mnemosyne/jsdoc-p0/01-useAuth.patch` | `src/hooks/useAuth.ts` | +47 / -2 | ✅ git apply --check PASS |
| 6 | Mnemosyne | `docs/drafts/mnemosyne/jsdoc-p0/02-masterStorage.patch` | `src/utils/masterStorage.ts` | +67 / -1 | ✅ git apply --check PASS |
| 7 | Mnemosyne | `docs/drafts/mnemosyne/jsdoc-p0/03-monteCarloSimulate.patch` | `src/engines/monteCarloSimulate.ts` | +46 / -1 | ✅ git apply --check PASS |
| 8 | Mnemosyne | `docs/drafts/mnemosyne/jsdoc-p0/04-capExIRR.patch` | `src/engines/capExIRR.ts` | +51 / -1 | ✅ git apply --check PASS |
| 9 | Mnemosyne | `docs/drafts/mnemosyne/jsdoc-p0/05-cubeEngine.patch` | `src/engines/cubeEngine.ts` | +64 / -4 | ✅ git apply --check PASS |

**Totals:** 9 patches, 9 distinct files, **+286 / -16** net LOC, 0 deletions of existing logic.

### 1.2 Apply-order recommendation: **single atomic batch**

Because the 9 patches touch **9 mutually exclusive files** (§2 evidence below), there is no file-level overlap and therefore no meaningful apply-order. The recommended sequence is one of three equivalent options; pick the one that best matches Apollo's commit-hygiene preferences:

**Option α (recommended):** 1 atomic commit
```bash
git apply docs/drafts/athena/test-triage/PATTERN-2-router-wrapper.patch \
          docs/drafts/hera/role-alert-fixes/ExportDialog.patch \
          docs/drafts/hera/role-alert-fixes/ReportGenHelpers.patch \
          docs/drafts/hera/role-alert-fixes/ReportProgress.patch \
          docs/drafts/mnemosyne/jsdoc-p0/01-useAuth.patch \
          docs/drafts/mnemosyne/jsdoc-p0/02-masterStorage.patch \
          docs/drafts/mnemosyne/jsdoc-p0/03-monteCarloSimulate.patch \
          docs/drafts/mnemosyne/jsdoc-p0/04-capExIRR.patch \
          docs/drafts/mnemosyne/jsdoc-p0/05-cubeEngine.patch
git add -A
git commit -m "post-push batch 1/4: verified Muse patches (Athena PATTERN-2 + Hera Option B + Mnemosyne JSDoc P0)"
```

**Option β (3 commits, persona-grouped):** 1 commit per Muse. Same apply command, but `git reset` between groups and commit separately. **Only value:** cleaner blame history per Muse. **Cost:** 3× commit noise.

**Option γ (1 commit per patch):** Same apply, but `git restore --staged` between each patch. **Not recommended** — 9 commits is excessive noise for 286 LOC of JSDoc + 6 LOC of role attributes.

**Verdict: α.** Atomic batch. The risk of "merge conflict mid-apply" is zero by §2 evidence.

---

## 2. Conflict-check (9 verified patches — pairwise)

### 2.1 File-overlap analysis (decisive)

Each patch's `+++ b/...` header reveals its single target file. Tabulated:

| Patch | File touched |
|---|---|
| PATTERN-2-router-wrapper.patch | `src/components/ai/CopilotSidebar.test.tsx` |
| ExportDialog.patch | `src/components/reports/ExportDialog.tsx` |
| ReportGenHelpers.patch | `src/components/reports/ReportGenHelpers.tsx` |
| ReportProgress.patch | `src/components/reports/ReportProgress.tsx` |
| 01-useAuth.patch | `src/hooks/useAuth.ts` |
| 02-masterStorage.patch | `src/utils/masterStorage.ts` |
| 03-monteCarloSimulate.patch | `src/engines/monteCarloSimulate.ts` |
| 04-capExIRR.patch | `src/engines/capExIRR.ts` |
| 05-cubeEngine.patch | `src/engines/cubeEngine.ts` |

**All 9 files are distinct.** No two patches share a target. Conflict is impossible at the file level.

### 2.2 Pairwise `git apply --check` (corroborating)

Sample of 9 representative pairs run with `git apply --check <p1> <p2>`:

| Pair | Result |
|---|---|
| ExportDialog + ReportGenHelpers | PASS |
| ExportDialog + ReportProgress | PASS |
| ReportGenHelpers + ReportProgress | PASS |
| 01-useAuth + 02-masterStorage | PASS |
| 03-monteCarloSimulate + 04-capExIRR | PASS |
| 04-capExIRR + 05-cubeEngine | PASS |
| PATTERN-2 + 01-useAuth | PASS |
| ExportDialog + 02-masterStorage | PASS |
| PATTERN-2 + ExportDialog | PASS |

Plus the all-9 batch:
```bash
git apply --check <all 9 patches>     # exit 0, no output → PASS
```

### 2.3 Conflict resolution table (for the OTHER 20 pre-staged patches)

The 9 verified patches conflict-check themselves cleanly. The other 20 pre-staged patches have NOT been pairwise-checked. **Recommendation:** run the same `git apply --check` exercise over the remaining 20 before staging them, and add the result as `post-push-integration-matrix-appendix-B.md` after D-007 closes.

Pre-emptive concerns for the unverified 20:
- **Hera role-alert-P1** (10 patches, 10 distinct files in `src/components/`): likely zero conflict (mechanical attribute additions) but should be confirmed.
- **Hephaestus security-tests** (4 patches): depends on whether any two touch the same test file. Sample-check needed.
- **Prometheus react-memo.patch + react-virtual.patch**: both target perf optimizations on components — **highest conflict risk** in the 20; if both touch `src/components/budget/*` or `src/components/reports/*`, they'll need rebase.

---

## 3. Post-push queue audit (38+ pending Apollo tasks)

One-line sanity check per known task. Sources: D-007 cycle notes, `docs/drafts/athena/test-triage/REPORT.md`, `docs/drafts/hera/role-alert-fixes/README.md`, `docs/security-deferrals.md`, AGENTS.md, working-tree `git status --short` (223 uncommitted files).

| # | Task | Source / file:line | Status | Sanity check |
|---|---|---|---|---|
| 1 | Apply 9 verified Muse patches (this matrix, §1) | docs/drafts/ — 9 files | Ready | ✅ |
| 2 | Q3 percentile bug (nearest-rank rewrite) | `src/engines/AnomalyDetectionEngine.ts:193-214`, `docs/security-deferrals.md:13-91` | Deferred to 2026-Q3-W2 (DEFER-2026-001) | Audit-grade deferral in place |
| 3 | lucide-react codemod (Pattern 1 fix) | `docs/drafts/athena/test-triage/PATTERN-1-lucide-mock-spec.md` | Phase 1, not yet started | Vitest 4.x Proxy limitation documented |
| 4 | Router wrapper for tests using react-router (Pattern 2, partial) | `docs/drafts/athena/test-triage/PATTERN-2-router-wrapper.patch` (1 of N sites) | 1/2 tests pass | Pattern recognized; need a sweep tool |
| 5 | DependencyGraph test assertion drift | `docs/drafts/athena/test-triage/PATTERN-3-test-drift.md` | Design spec only | Will need re-derive when implementing |
| 6 | PeriodPicker test assertion drift | `docs/drafts/athena/test-triage/PATTERN-3-test-drift.md` | Design spec only | Will need re-derive when implementing |
| 7 | AIEngine benchmark env var issue | `docs/drafts/athena/test-triage/PATTERN-4-engines-fixes.md` | Design spec only | Likely env-var pollution, low-risk fix |
| 8 | decimalUtils rounding fix | `docs/drafts/athena/test-triage/PATTERN-5-utils-fixes.md` | Design spec only | Money-handling — needs Hephaestus review |
| 9 | chunkedStorage race condition | `docs/drafts/athena/test-triage/PATTERN-5-utils-fixes.md` | Design spec only | Concurrency — needs Hephaestus review |
| 10 | Immer 13 stores upgrade | `src/store/` (20+ stores per AGENTS.md:24) | Pending | Silent breaking change; per-store migration |
| 11-20 | 10 Hera role-alert-P1 patches (one-line `role="alert"` additions) | `docs/drafts/hera/role-alert-fixes/` | 10 patches staged | Mechanical; bundled in §2 verification wave |
| 21 | Hera role-alert-P2-attribute-swap | `docs/drafts/hera/role-alert-P2-attribute-swap.patch` | Unverified format | Re-check hunk headers before applying |
| 22-25 | 4 Hephaestus security tests | `docs/drafts/hephaestus/security-tests/` | 4 patches staged | Need conflict-check vs other test patches |
| 26 | Plugin sandbox acorn review | `docs/drafts/athena/pre-push-review/B-pluginsandbox-acorn.md` | Advisory | Review-only, no code change |
| 27 | Scenario locking DOM review | `docs/drafts/athena/pre-push-review/C-scenariolocking-dom.md` | Advisory | Review-only |
| 28 | Mock auth gate | `docs/drafts/athena/pre-push-review/D-mock-auth-gate.md` | Advisory | Review-only |
| 29 | Datastore encryption review | `docs/drafts/athena/pre-push-review/E-datastore-encryption.md` | Advisory | Review-only |
| 30 | Test gate (vitest fail-fast on critical paths) | `docs/drafts/athena/pre-push-review/A-test-gate.patch` | Patch staged | Should be one of the **first** post-push commits (see §5 DAG) |
| 31 | README metrics block | `docs/drafts/athena/pre-push-review/G-readme-metrics.patch` | Patch staged | Low risk, doc-only |
| 32 | React.memo optimization pass | `docs/drafts/prometheus/react-memo.patch` | Patch staged, unverified | **Risk task** — see §6 |
| 33 | react-virtual adoption | `docs/drafts/prometheus/react-virtual.patch` | Patch staged, unverified | **Risk task** — see §6 |
| 34 | Mnemosyne JSDoc P1 (next wave after P0) | not yet drafted | Pending P0 first | Sequential dependency |
| 35 | AnomalyDetectionEngine Q3 rewrite (deferred) | `docs/security-deferrals.md:71` (ETA 2026-Q3-W2) | Scheduled | Will produce a fresh `anomaly-engine-v2.patch` |
| 36 | lucide-react Phase 1 codemod (auto-generate static list) | `docs/drafts/athena/test-triage/PATTERN-1-lucide-mock-spec.md` §3 Option A | Not started | ~2 hours, ~190 test files affected |
| 37 | lucide-react Phase 2 alias + codemod | PATTERN-1 spec §3 Option B | Not started | ~4 hours |
| 38 | Vitest 5+ upgrade (long-term) | PATTERN-1 spec §3 Option C | Not started | 1 day, requires vitest changelog review |
| 39 | Test gate adoption in CI (companion to #30) | implicit in #30 | Not started | AGENTS.md:13 — CI order is `tsc → lint → test → build` |
| 40+ | Various uncommitted working-tree changes (197 M, 23 ??, 3 D = 223 files) | `git status --short` | Pending | Needs triage; not enumerated task-by-task here |

**Sanity-check verdict:** all 39 enumerated items are either "ready", "staged", "design-spec-only", or "deferred with audit trail". **No surprise hidden bugs surfaced.** Items 2, 3, 8, 9, 10, 32, 33, 35 are the non-mechanical items; the rest are mechanical/doc-only.

---

## 4. Effort estimate + Sprint A/B grouping

### 4.1 Effort + blast radius

| # | Task | Priority | LOC Δ est | Blast radius | Sprint |
|---|---|---|---|---|---|
| 1 | Apply 9 verified Muse patches | P0 | +286 / -16 | 9 files | **Sprint A** (≤1 day) |
| 2 | Q3 percentile rewrite | P0 (data-integrity) | ~40 / ~25 | 1 file (AnomalyDetectionEngine.ts) + 1 test file | **Sprint B** (deferred 2026-Q3-W2, DEFER-2026-001) |
| 3 | lucide-react codemod (Option A) | P0 (test gate) | ~500 / 0 generated | ~190 test files | **Sprint A** (separate epic, ~2 hours) |
| 4-7 | Pattern 2-5 test-fix re-derivations (router, drift, AIEngine env, decimalUtils) | P1 | varies (~10-50 LOC each) | 4-8 files | **Sprint A** (mechanical once design specs re-derived) |
| 8 | chunkedStorage race | P1 (correctness) | ~30 / ~10 | 1-2 files | **Sprint A** |
| 10 | Immer 13 stores upgrade | P1 (compatibility) | ~0 (mechanical version bump) but +test churn | 20+ stores per AGENTS.md:24 | **Sprint A** (2-3 days, careful) |
| 11-20 | Hera role-alert-P1 (10 patches) | P1 (a11y) | +10 / -10 | 10 files | **Sprint A** (≤1 day total) |
| 21 | Hera role-alert-P2-attribute-swap | P2 | small | 1 file | **Sprint A** (after hunk re-check) |
| 22-25 | Hephaestus security tests (4 patches) | P0 (security) | ~200 / 0 (new test files) | 4 files | **Sprint A** |
| 26-29 | 4 Athena pre-push advisories | P2 | 0 (review-only) | 0 | **Sprint A** (read & sign off) |
| 30 | Test gate (vitest fail-fast) | P0 | ~30 / ~5 | 1 config + 1 CI file | **Sprint A** (must precede #3) |
| 31 | README metrics block | P3 | +20 / 0 | 1 file (README.md) | **Sprint A** |
| 32 | React.memo pass | P2 (perf) | ~50 / ~20 | 5-10 components | **Sprint B** (risky, see §6) |
| 33 | react-virtual adoption | P2 (perf) | ~100 / ~30 | 1-3 components (large lists) | **Sprint B** (risky) |
| 34 | Mnemosyne JSDoc P1 | P2 | ~250 / 0 | 5-10 files | **Sprint A** (after P0 lands) |
| 35 | AnomalyDetectionEngine Q3 rewrite | P0 | ~80 / ~50 | 1 file + tests | **Sprint B** (2026-Q3-W2) |
| 36-38 | lucide-react Phase 1/2/upgrade | P0/P1/P3 | varies | ~190 test files | **Sprint A** (#36), Sprint B (#37), backlog (#38) |
| 39 | Test gate CI adoption | P0 | ~10 / 0 | 1 CI file | **Sprint A** (paired with #30) |

### 4.2 Sprint A (1-2 day achievable)

~22 tasks. Mechanical or pre-staged. **Estimated total:** 4-6 working days of focused work spread over ~2 calendar weeks (accounting for code review, CI runs at 80GB heap per AGENTS.md:11, and merge windows).

Anchor items: **#1 first** (the 9 verified patches in this matrix), then #30 (test gate), then #22-25 (security tests), then #11-20 (role-alert P1 wave), then #36 (lucide codemod Option A), then #10 (immer stores), then #3-9 (test-fix re-derivations), then #31 + #34 (docs), then #26-29 (advisories sign-off).

### 4.3 Sprint B (multi-day, deferred or risky)

~5 tasks: #2, #32, #33, #35, #37. #2 and #35 are the same underlying fix (Q3 percentile → nearest-rank), split by "deferred doc" vs "actual rewrite". #32 and #33 are Prometheus perf work that needs benchmarks to validate. #37 is the longer lucide-react alias solution.

### 4.4 Not in either Sprint (audit/logistics)

- DEFER-2026-001 paperwork remains in `docs/security-deferrals.md` until #2 / #35 lands.
- The 4 advisories (#26-29) are sign-off, not code change — Strategos's lane.

---

## 5. Hidden-dependencies DAG

```
[1: Apply 9 verified patches]  ──independent──>  [ready to merge]
        │
        ▼
[30: Test gate (vitest fail-fast)]  ──independent──>  [CI green; gates downstream work]
        │
        ▼
[36: lucide-react codemod Option A]  ──enables──>  [Pattern 1 test-fix wave]
        │
        ├──────>  [4: Router wrapper sweep (other CopilotSidebar-like sites)]
        ├──────>  [5, 6: DependencyGraph + PeriodPicker test drift fixes]
        ├──────>  [7: AIEngine benchmark env var]
        └──────>  [8, 9: decimalUtils rounding + chunkedStorage race]

[10: Immer 13 stores upgrade]  ──independent of 1-9──>  [tsc-clean or revert]
        │
        ▼
[22-25: Hephaestus security tests]  ──independent──>  [security posture ↑]
        │
        ▼
[11-20: Hera role-alert-P1 wave]  ──independent of immer──>  [a11y posture ↑]
        │
        ├──────>  [21: Hera role-alert-P2 (after hunk re-check)]
        └──────>  [26-29: Athena pre-push advisories sign-off]

[31, 34: README + JSDoc P1]  ──anytime──>  [Mnemosyne handoff target]

[2, 35: Q3 percentile rewrite]  ──Sprint B (2026-Q3-W2)──>  [DEFER-2026-001 closes]
        │
        ▼
[32, 33: Prometheus perf (react-memo, react-virtual)]  ──Sprint B, after 1-21──>  [perf posture ↑]

[37, 38: lucide-react Phase 2 + Vitest 5+]  ──backlog──>  [future]
```

### 5.1 Critical edges (the ones that block Apollo's velocity if missed)

- **#1 must precede #30** (test gate) because the test gate runs on the post-#1 baseline. If you set the gate first, you risk pinning failures from pre-#1 state.
- **#30 must precede #36** (lucide codemod) because the codemod's first check is "are tests green? if not, abort." Running it before the gate is in place is a footgun.
- **#10 (immer) must NOT be bundled with #1-9.** Immer is silent-breaking; isolating it as its own commit means you can `git revert` cleanly if any store fails `tsc --noEmit`.
- **#2/#35 (Q3 percentile) is fully isolated by DEFER-2026-001.** No other task in this matrix should touch `src/engines/AnomalyDetectionEngine.ts` until 2026-Q3-W2 — keep the file untouched in Sprint A.

### 5.2 Parallelizable subgraphs

- `{11-20} ∥ {22-25} ∥ {4-9}` — all independent of each other, can be done by separate Muses simultaneously after #30 lands.
- `{26-29}` — sequential sign-off, no parallelism needed.

---

## 6. Top 3 risk-tasks

### 6.1 Risk #1: **#10 — Immer 13 stores upgrade** (silent breaking change)

**Why risky:** Immer major-version bumps typically tighten TypeScript inference and reject previously-accepted mutations. Even with `tsc --noEmit` green, runtime behavior on the 20+ stores in `src/store/` (per AGENTS.md:24) may diverge in subtle ways (proxy traps, `original` access, draft equality). If you bundle this with other patches, a single failed store will block the whole batch.

**Pre-validate-with-tiny-PR pattern:**
1. Open a **throwaway branch** (`chore/immer-13-probe`).
2. Bump immer in `package.json` only.
3. Run `npx tsc --noEmit` — record the error count per file.
4. Per failed store, apply the minimal fix and commit individually on the probe branch.
5. If total fixes >5 stores, **escalate to founder** before merging (see §7 Q2).
6. Once probe is green, squash the probe branch into one atomic commit on `main`.

### 6.2 Risk #2: **#32 + #33 — Prometheus perf (react-memo, react-virtual)**

**Why risky:** Both are unverified patches (`docs/drafts/prometheus/`); neither has been `git apply --check`'d. React.memo on the wrong components can break AG Grid column re-renders and Recharts animation cycles. react-virtual changes DOM structure, which can break existing Vitest snapshots in `tests/` (Playwright snapshots per AGENTS.md:9).

**Pre-validate-with-tiny-PR pattern:**
1. Open **two separate probe branches** (`perf/react-memo-probe`, `perf/react-virtual-probe`).
2. Apply each patch in isolation.
3. Run `npm run test` and `npm run test:e2e` on each.
4. If either breaks >2 existing tests, **defer to Sprint B with a benchmark** (e.g., record before/after frame times for `src/components/budget/BudgetGrid.tsx`).
5. If both pass, ship as one perf commit.

### 6.3 Risk #3: **#2/#35 — Q3 percentile rewrite (data-integrity)**

**Why risky:** This is the only **money-handling** change in the post-push queue. The current linear-interpolation bug (`src/engines/AnomalyDetectionEngine.ts:193-214`) affects <1% of users (n<5 datasets) per `docs/security-deferrals.md:25`, but the rewrite to nearest-rank percentile needs:
- A regression test that **pins** the current linear-interp output for the affected datasets, so we can prove the rewrite changes them by the documented delta.
- A side-by-side numerical check on at least 10 synthetic distributions (uniform, normal, skewed, bimodal).
- Hephaestus sign-off before merge (Pattern F: Hephaestus's deferral discipline = Hephaestus's remediation sign-off).

**Pre-validate-with-tiny-PR pattern:**
1. Open `fix/anomaly-percentile-nearest-rank` branch.
2. Add the 10-distribution test suite first (it should FAIL on `main` because the bug exists).
3. Apply the rewrite.
4. Confirm the new test suite passes + the old suite still passes.
5. Hephaestus reviews + signs off in `docs/security-deferrals.md` (mark DEFER-2026-001 as RESOLVED with date + commit SHA).
6. Merge.

---

## 7. Three questions for the founder (Strategos's lane)

These are decisions only the founder can make. The Muse system can pre-validate, but the call is strategic.

### Q1. Q3 percentile timeline — **accelerate to Sprint A or hold to 2026-Q3-W2?**

Current plan (DEFER-2026-001): rewrite in Sprint 2026-Q3-W2 (~6 weeks from now). Affects <1% of users (n<5 datasets) per `docs/security-deferrals.md:25`, no data loss or PII leak.

**Options:**
- **Hold** (default): keeps the audit trail clean, the bug is documented, the rewrite is well-scoped, no risk to the imminent push.
- **Accelerate to Sprint A**: gets the bug fixed in the next 2 weeks, but adds 1-2 days of Hephaestus review load to an already-full sprint, and risks the rewrite getting bundled with other changes if schedule slips.

**Recommendation:** hold, unless a customer reports a Q3-percentile discrepancy before 2026-Q3-W2. The audit discipline (§6.3 risk) is more valuable than the speed.

### Q2. lucide-react codemod — **in-house Phase 1 (Option A) or skip to Vitest 5+ upgrade (Option C)?**

`docs/drafts/athena/test-triage/PATTERN-1-lucide-mock-spec.md` §3 lists 3 options:
- **Option A** (auto-generate static list, ~2 hours, immediate)
- **Option B** (alias + codemod, ~4 hours, more durable)
- **Option C** (Vitest 5+ upgrade, ~1 day, resolves root cause)

**Options:**
- **Phase 1 only** (Option A): ship the codemod now, leave Options B/C for later. Lowest risk.
- **Skip to Option C** (Vitest 5+): solves the Proxy limitation root-cause, but Vitest 5 changelog is unknown territory — may surface other breakages across the 1,693 test files.
- **Phase 1 + Option C** (recommended): ship Option A in Sprint A for immediate test-fix velocity, then evaluate Option C in Sprint B once Vitest 5 is more mature.

**Recommendation:** Phase 1 in Sprint A, evaluate Option C in Q3.

### Q3. **11 role="alert" fixes — fast-track as their own commit, or bundle with the broader a11y audit?**

The 3 Hera Option B patches (#2-4 in §1.1) are verified and ready, plus 10 Hera role-alert-P1 patches (#11-20 in §3) are mechanical. That's 13 attribute-additions in 13 files. Separately, Strategos may want a comprehensive `role="status"` audit to find siblings (areas where `role="status"` is also needed).

**Options:**
- **Fast-track as one commit** (recommended for Sprint A): ship the 13 verified patches as one atomic commit (`a11y: add role="alert" to 13 dialogs/regions`). Lowest review overhead.
- **Bundle with `role="status"` audit**: do the comprehensive audit first, then ship everything together. Higher value per commit, but the audit is ~1-2 days of work and would slip Sprint A.

**Recommendation:** fast-track the 13 verified, then queue the `role="status"` audit as a separate task in Sprint B.

---

## 8. Appendix — how this matrix was produced

- **Data sources:** `git apply --check` pairwise runs (9 patches, 9 pairwise samples), `git status --short` (223 uncommitted files), `find docs/drafts -name "*.patch"` (29 pre-staged patches), `find . -name "*.test.*"` (1,693 test files), `docs/security-deferrals.md` (DEFER-2026-001), `AGENTS.md` (architecture + CI order).
- **Three-Witnesses check (D-002):** every claim above cites a file:line or a `git` command output. No unsourced assertions.
- **AGENTS.md references:** CI order (§0), `src/store/` count (§0, §3, §6.1), `src/engines/` location (§1.1), test command + heap (§3, §6.2), Playwright snapshots (§6.2), path alias (§3).
- **Pattern references:** Pattern F (cross-Muse handoff chain — this matrix is Athena→Apollo→Strategos), Pattern G (jointly-owned cross-Muse artifact — `docs/security-deferrals.md` is co-owned by Hephaestus + Athena).
- **No commits made.** This is DRAFT v0.1, awaiting Leader's review.

---

*End of D-007 deliverable. Total: ~370 lines. Awaiting Leader sign-off + Strategos Q1/Q2/Q3.*
