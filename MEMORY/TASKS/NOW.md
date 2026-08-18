---
id: MEMORY/TASKS/NOW.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-019
confidence: high
---

# TASKS/NOW — the single current critical path

**T-020 · Phase 0 / W0.1.1 session 020 — both tracks in one session.**

1. **Money-AST:** `src/pages/realestate/ValuationPage.tsx` (10 unsafe ops) → 0, then
   `src/pages/retail/PromoAnalysisPage.tsx` (10).
   **Skip `src/services/mockData/index.ts` (13) — it is the fixture factory.**
   Note: `RealEstateEngine` still carries mocks (4.2 / 94.8 / 6.2) and an amount-sign/prefix-80
   fork; `RetailEngine` still carries 254 / 92.8. Do not call either with invented inputs.
2. **Fabrication:** `src/pages/sectors/LogisticsDashboardPage.tsx` (5) → 0, then
   `ForecastBuilderPage` / `ClinicalTrialCostPage` (4 each).

Ratchets to beat: money 453 / 167 modules / 80.87%; fabrication 45 / 16 files.

Phase 0 exit needs AST ≥90%: 453 → ~250 ops. At ~12 ops a session that is a long arc; consider
whether a class-wide fix (the `existing.debit += e.debit` grouping idiom appears in at least
ChartOfAccounts, ActivityFeed, SharedReports, TeamWorkspace, Consolidation and Education pages)
would move more than one file at a time.

Definition of done: derivation module on `@/utils/money`, empty-state where the GL cannot support
a figure, source guard + real-engine DOM probe, teeth proven by `/tmp` revert, per-file `--json`
diff confined to the files you touched, both baselines updated with prettier, journal +
`.agent/state.json` + `.agent/HANDOVER.md` + MEMORY written through, two commits, pushed.
