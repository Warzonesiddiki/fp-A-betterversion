# S03 — Research

**Date:** 2026-07-25

## 1. Questions
- What docs exist; which contradict; what should each own?

## 2. Findings (verified)
- README claims "🟢 Production-Ready / 8,334+ tests / 80% coverage" — **false** (tasklist says ~48% historical; install fails).
- Multiple stale snapshots: `FINPLAN_CURRENT_STATE` (2026-06-09, 2266 TSC errors), `reports/phase0-baseline` (2026-07-23, 0 errors) — contradictory.
- `docs/` has subfolders: strategy, security, specs, rules, sectors, perf, plans, proposals, ratification(soon), drafts, engines, parts, personas, openhands, superpowers, vision-pivot, task-board*.json, verdicts. Some are agent scratch.
- `reports/` has phase completion + gap/accessibility reports — useful but dated.

## 3. Best Practice
- One source of truth per concern; status in one board; overview docs honest.

## 4. Risks
- `docs/` contains agent-tooling dirs (`superpowers`, `openhands`, `vision-pivot`, `task-board*.json`) that may be clutter → quarantine to `bmad/archive/`.

## 5. Decisions
- Establish `DOCS_MAP.md`; fix README badge; prune `reports/` + quarantine doc-scratch.
