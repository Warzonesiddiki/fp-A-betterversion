---
id: MEMORY/TASKS/NOW.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# TASKS/NOW — the single current critical path

**T-018 · Phase 0 / W0.1.1 session 018 — both tracks in one session.**

1. **Money-AST:** `src/pages/cash/CashForecastPage.tsx` (10 unsafe ops) → 0, then
   `src/pages/forecasts/RollingForecastPage.tsx` (10).
   **Skip `src/services/mockData/index.ts` (13) — it is the fixture factory.**
2. **Fabrication:** `src/pages/sectors/EducationDashboardPage.tsx` (5) → 0, then
   `GovernmentDashboardPage` (5) and `LogisticsDashboardPage` (5).

Ratchets to beat: money 477 / 171 modules / 80.3%; fabrication 55 / 18 files.

Definition of done: derivation module on `@/utils/money`, empty-state where the GL cannot support
a figure, source guard + real-engine DOM probe, teeth proven by `/tmp` revert, per-file `--json`
diff confined to the files you touched, both baselines updated with prettier, journal +
`.agent/state.json` + `.agent/HANDOVER.md` + MEMORY written through, two commits, pushed.
