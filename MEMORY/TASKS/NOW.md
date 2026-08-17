---
id: MEMORY/TASKS/NOW.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# TASKS/NOW — the single current critical path

**T-017 · Phase 0 / W0.1.1 session 017 — both tracks in one session.**

1. **Money-AST:** `src/pages/DashboardPage.tsx` (11 unsafe ops) → 0.
   *In progress:* derivation extracted to `src/pages/dashboard/dashboardModel.ts`; page rewired;
   detector reports 0 for both files; `tsc` clean. **Remaining:** known-answer unit tests, DOM
   probe + source guard, teeth check, baseline update.
2. **Fabrication:** `src/pages/healthcare/PatientRevenuePage.tsx` (5 currency-literal findings:
   `$840k`, `$450k`, `$1.2M`, `$120k`, `$2.1M` in the denial table) → 0, plus the un-detected
   inventions on the same page (fixed `change` deltas 8.4 / −0.8 / 1.2 / −2.4, invented sparkline
   histories) and `HealthcareEngine`'s hardcoded `denialRate: 4.2`.

Definition of done: both detectors re-run, both baselines updated with prettier, teeth proven,
journal + `.agent/state.json` + `.agent/HANDOVER.md` + MEMORY updated, two commits, pushed.
