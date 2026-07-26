# S01 — Brainstorming: Repo Hygiene & Foundation

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- A "zero-compromise" product cannot live in a repo full of scratch dumps and contradictory docs.
- The repo's *signal* (source + canonical docs) must be separable from *noise* (agent logs, superseded roadmaps).
- Cleanup must be **reversible** (quarantine, not `rm -rf`).

## 2. SCAMPER
- **Substitute:** archive → `bmad/archive/` instead of deleting.
- **Combine:** many duplicate "current state" docs → one status board (`bmad/SECTION_INDEX.md`).
- **Eliminate:** 100+ stray `.txt` logs, 13 redundant planning docs, 26 agent-scratch dirs.
- **Reverse:** keep only what code/docs reference; everything else is guilty until proven useful.

## 3. Ideation Map
- Root clutter → move to archive
- Conflicting docs (README "Production-Ready" vs tasklist "~48% tests") → single truth source
- Agent scratch dirs (.hermes, .obsidian, hive, swarm, AGENT_SWARM, _bmad …) → quarantine
- Keep: src, server, tests, e2e, public, docs, reports, src-tauri, configs, README/CLAUDE/AGENTS/CONTRIBUTING/SECURITY/LICENSE

## 4. Selected Directions
1. Quarantine all junk into `bmad/archive/` (reversible). (carried → Dev Story)
2. Establish `bmad/SECTION_INDEX.md` as the single live status board. (carried → S03)
3. Keep only 6 canonical root docs; everything else lives under `bmad/`, `docs/`, or `reports/`.

## 5. Open Questions
- Should `docs/` and `reports/` be pruned later? → Yes, tracked in S03.
- Do we delete archived junk eventually? → Only after S100, with explicit approval.
