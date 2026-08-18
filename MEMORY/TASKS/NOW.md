---
id: MEMORY/TASKS/NOW.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-021
confidence: high
---

# TASKS/NOW — the single current critical path

**T-022 · Phase 0 / W0.1.1 session 022 — both tracks in one session.**

1. **Money-AST:** `src/engines/InsuranceEngine.ts` (9 unsafe ops) → 0, then
   `src/pages/analytics/BenchmarkingPage.tsx` (8).
   **Skip `src/services/mockData/index.ts` (13) — it is the fixture factory.**
   `InsuranceEngine.calculateStats` invents net written as 0.85× gross and policy count as
   premium ÷ 360, and abs()es amounts. It is currently UNUSED by
   `src/pages/insurance/UnderwritingPage.tsx` (cleaned in session 015) — check every caller before
   changing its shape, and prefer returning `null` over keeping the inventions alive.
2. **Fabrication:** `src/pages/healthcare/ClinicalTrialCostPage.tsx` (4) → 0, then
   `src/pages/sectors/TelecomDashboardPage.tsx` (4) and
   `src/pages/construction/ConstructionDashboardPage.tsx` (3).

Ratchets to beat: money 430 / 164 modules / 81.3%; fabrication 36 / 14 files.

Three shapes that have appeared in every recent session — check for them before writing code:
- a store read and discarded (`const { entries: _entries } = useGLStore()`) while fixtures render;
- a demo fallback when a store is empty;
- a green "known answer" test that encodes the fabrication you are about to remove (three found
  in five sessions: the 70% cash split, the ±6% band twice).

Definition of done: derivation module on `@/utils/money`, empty-state where the GL cannot support
a figure, source guard + real-engine DOM probe (assert on DATA, not page text), teeth proven by
`/tmp` revert, per-file `--json` diff confined to the files you touched, both baselines updated
with prettier, journal + `.agent/state.json` + `.agent/HANDOVER.md` + MEMORY written through, two
commits, pushed.
