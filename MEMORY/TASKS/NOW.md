---
id: MEMORY/TASKS/NOW.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-020
confidence: high
---

# TASKS/NOW — the single current critical path

**T-021 · Phase 0 / W0.1.1 session 021 — both tracks in one session.**

1. **Money-AST:** `src/pages/retail/PromoAnalysisPage.tsx` (10 unsafe ops) → 0, then
   `src/engines/InsuranceEngine.ts` (9).
   **Skip `src/services/mockData/index.ts` (13) — it is the fixture factory.**
   `RetailEngine` still carries 254 / 92.8 mocks and `InsuranceEngine` invents net written as
   0.85× gross and policy count as premium/360 — do not call either with invented inputs; fixing
   `InsuranceEngine` itself is the second item, so read it before reusing it.
2. **Fabrication:** `src/pages/forecasts/ForecastBuilderPage.tsx` (4) → 0, then
   `src/pages/healthcare/ClinicalTrialCostPage.tsx` (4) and
   `src/pages/sectors/TelecomDashboardPage.tsx` (4).

Ratchets to beat: money 443 / 166 modules / 81.03%; fabrication 40 / 15 files.

Two recurring shapes worth checking first on any page you open:
- a fallback to demo data when a store is empty (invisible to the detector, visible to every new
  tenant);
- one aggregate stamped onto every row of a table whose column header implies per-row measurement.

Definition of done: derivation module on `@/utils/money`, empty-state where the GL cannot support
a figure, source guard + real-engine DOM probe (assert on DATA, not page text — disclosure copy
deliberately names the things you are forbidding), teeth proven by `/tmp` revert, per-file `--json`
diff confined to the files you touched, both baselines updated with prettier, journal +
`.agent/state.json` + `.agent/HANDOVER.md` + MEMORY written through, two commits, pushed.
