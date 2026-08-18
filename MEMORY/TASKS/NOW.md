---
id: MEMORY/TASKS/NOW.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-022
confidence: high
---

# TASKS/NOW — the single current critical path

**T-023 · Phase 0 / W0.1.1 session 023 — both tracks in one session.**

1. **Money-AST:** `src/pages/analytics/BenchmarkingPage.tsx` (8 unsafe ops) → 0, then
   `src/engines/DriverCascadeEngine.ts` (7).
   **Skip `src/services/mockData/index.ts` (13) — it is the fixture factory.**
2. **Fabrication:** `src/pages/sectors/TelecomDashboardPage.tsx` (4) → 0, then
   `src/pages/construction/ConstructionDashboardPage.tsx` (3) and
   `src/pages/construction/EquipmentManagementPage.tsx` (3).

**Also queued (fabrication the detector cannot see):** `healthcareStore` still persists seeded
`qualityMetrics`, `savingsData` (Orthopedics target 2,400,000 …) and `programs` for every tenant.
They feed `ValueBasedCarePage`. Clear them to empty with a persist-version bump when you take that
page, exactly as `constructionStore` (s014) and `insuranceStore` (s015) were cleared.

Ratchets to beat: money 421 / 163 modules / 81.44%; fabrication 32 / 13 files.

Four shapes seen in every recent session — check before writing code:
- a store read and discarded (`const { entries: _entries } = useGLStore()`) while fixtures render;
- a demo fallback when a store is empty;
- an engine armed with inventions that no page currently calls (fix it, do not leave it loaded);
- a green "known answer" test that encodes the fabrication you are about to remove — **four found
  in six sessions**. Grep the suite for the numbers you are deleting.

And check your OWN new code with the detector before committing: the session-022 rewrite
introduced 5 unsafe ops that the ratchet caught.

Definition of done: derivation module on `@/utils/money`, empty-state where the data cannot
support a figure, source guard + real-engine DOM probe (assert on DATA, not page text), teeth
proven by `/tmp` revert, per-file `--json` diff confined to the files you touched, both baselines
updated with prettier, journal + `.agent/state.json` + `.agent/HANDOVER.md` + MEMORY written
through, two commits, pushed.
