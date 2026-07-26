# S03 — PRD

**Date:** 2026-07-25

## 1. Overview
Establish a single source of truth for documentation and honest status.

## 2. User Stories
- As a reader, I want one place for status and one doc per topic.

## 3. Functional Requirements
- FR-1: Create `DOCS_MAP.md` mapping each doc → responsibility.
- FR-2: Update README status badge to "🟡 In Development — BMAD S01–S100 (S01 complete)".
- FR-3: Move stale `reports/*` (pre-2026-07, superseded) to `bmad/archive/`.
- FR-4: Quarantine doc-scratches in `docs/` (`superpowers`, `openhands`, `vision-pivot`, `task-board*.json`, `drafts` if stale) to `bmad/archive/`.
- FR-5: Keep `docs/architecture`, `docs/security`, `docs/sectors`, `docs/rules` (useful).

## 4. Non-Functional
- Docs are linkable and reviewable.

## 5. Acceptance Criteria
- `DOCS_MAP.md` present; README badge accurate; no contradictory status claims at root.

## 6. Out of Scope
- Full doc rewrite (later sections update their own docs).

## 7. Dependencies
- S01 (archive exists).

## 8. Open Issues
- None.
