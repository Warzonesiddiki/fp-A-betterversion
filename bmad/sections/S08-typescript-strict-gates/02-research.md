# S08 — Research

**Date:** 2026-07-25

## 1. Questions
- Current TS error count? Why do snapshots disagree?

## 2. Findings
- `FINPLAN_CURRENT_STATE` (2026-06-09): 2,266 TSC errors.
- `reports/phase0-baseline` (2026-07-23): claims 0 errors (but used `--ignore-scripts` + offline cache; possibly stale or partial).
- `tsconfig.json`: strict + noUncheckedIndexedAccess present.
- Contradiction = why we need S03 (truth source) + a measured baseline after S04.

## 3. Decision
- After S04 (clean install), measure true `tsc` count; drive to 0; gate in CI.

## 4. Risks
- Large legacy `any` surface; phased fix.

## 5. Dependencies
- S04 (install), S03 (truth).
