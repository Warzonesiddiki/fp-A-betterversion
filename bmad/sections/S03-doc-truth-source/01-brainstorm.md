# S03 — Brainstorming: Doc Truth Source

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- A repo can have only **one** source of truth per concern. Contradictory docs destroy trust ("zero compromise" needs honest docs).

## 2. SCAMPER
- **Combine:** S01 archived 13 redundant docs; now assign each surviving doc a single job.
- **Eliminate:** the "🟢 Production-Ready" banner in README (false today).
- **Substitute:** status lives in `bmad/SECTION_INDEX.md`, not scattered snapshots.

## 3. Ideation
- README = product overview (honest status badge).
- CLAUDE.md / AGENTS.md = dev+agent instructions.
- `bmad/` = project management (plan, index, sections, archive).
- `docs/` = architecture, ADRs, security, sectors.
- `reports/` = phase completion reports (prune in this section).

## 4. Selected Directions
1. Define a `DOCS_MAP.md` declaring each doc's single responsibility.
2. Fix README status to "In Development (BMAD S01–S100)".
3. Prune `reports/` to keep only dated, useful phase reports; move stale ones to archive.

## 5. Open Questions
- Keep `docs/` as-is or restructure? → light restructure: add `docs/architecture/`, `docs/security/`.
