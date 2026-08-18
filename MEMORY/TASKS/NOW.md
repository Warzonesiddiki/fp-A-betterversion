---
id: MEMORY/TASKS/NOW.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-018
confidence: high
---

# TASKS/NOW — the single current critical path

**T-019 · Phase 0 / W0.1.1 session 019 — both tracks in one session.**

1. **Money-AST:** `src/pages/forecasts/RollingForecastPage.tsx` (10 unsafe ops) → 0, then
   `src/pages/realestate/ValuationPage.tsx` (10) / `src/pages/retail/PromoAnalysisPage.tsx` (10).
   **Skip `src/services/mockData/index.ts` (13) — it is the fixture factory.**
2. **Fabrication:** `src/pages/sectors/GovernmentDashboardPage.tsx` (5) → 0, then
   `src/pages/sectors/LogisticsDashboardPage.tsx` (5).

Ratchets to beat: money 464 / 169 modules / 80.57%; fabrication 50 / 17 files.

Sector dashboards under `src/pages/sectors/` follow one shape: they read nothing and render a
fictional company. Expect to write a `*DashboardData.ts` derivation, not to patch literals — and
check whether a data-driven twin is already routed under `src/pages/sector/` before rewriting.

Definition of done: derivation module on `@/utils/money`, empty-state where the GL cannot support
a figure, source guard + real-engine DOM probe, teeth proven by `/tmp` revert, per-file `--json`
diff confined to the files you touched, both baselines updated with prettier, journal +
`.agent/state.json` + `.agent/HANDOVER.md` + MEMORY written through, two commits, pushed.
