# S01 — Research

**Date:** 2026-07-25

## 1. Questions
- What is actually at the repo root that is noise vs signal?
- Which docs contradict each other (truth-source problem)?

## 2. Findings (verified by direct inspection)
- **Root had 119 entries.** Majority were scratch artifacts from prior agent runs.
- **62 `.txt` dump files** at root: `test-output.txt` (351 KB), `memdir.txt`/`memdir2.txt` (~340 KB each), `vitest_*.txt`, `shared_*.txt`, `tsc*.txt`, `team_*.txt`, `out.txt`, `utf8.txt`, `tabs_*.txt`, `ai_intel.txt`, etc. None are imported by code.
- **13 redundant planning docs**: `FINPLAN_CURRENT_STATE.md`, `FINPLAN_*_PLAN.md` (×4), `COMPLETION_TASKLIST_ZERO_COMPROMISE.md`, `GEMINI.md`, `HANDOVER_PROMPT_FOR_AGENT.md`, `PLAN.md`, `PROJECT_BACKLOG.md`, `PROJECT_INDEX.md`, `ROADMAP.md`, `knowledge.md`, `PERFORMANCE_LOG.md`.
- **26 agent-scratch entries**: `_TEMP_ACTIVE`, `AGENT_SWARM`, `hive`, `swarm`, `_bmad`, `.mimocode`, `.superpowers`, `.openhands`, `.openclaude`, `.hermes`, `.claude-flow`, `.obsidian`, `.planning`, `.ai`, `.a5c`, `.agents`, `.storybook`, `agent_runs`, `bundle-report`, `graphify-out`, `memory`, `prompt`, `skills`, `skills-lock.json`, `portless.json`, `plan`, `plan and advice`.
- **Contradiction confirmed**: README header "🟢 Production-Ready / 8,334+ tests" vs `COMPLETION_TASKLIST` "tests historically ~48% pass rate" vs `FINPLAN_CURRENT_STATE` "2,266 TSC errors". (Documented in prior status report.)

## 3. Best practice
- Git repos should keep root to: source, canonical docs, config, entry files. Agent/runtime artifacts belong in ignored or archived paths.
- `git mv`/move + keep is safer than delete for first pass.

## 4. Risks
- Some hidden dirs (`.agents`, `.storybook`) *might* be tooling configs. Mitigation: quarantine (reversible), not delete.

## 5. Decisions
- Quarantine everything non-canonical to `bmad/archive/`. Canonical root = `README.md, CLAUDE.md, AGENTS.md, CONTRIBUTING.md, SECURITY.md, LICENSE` + source/config dirs.
