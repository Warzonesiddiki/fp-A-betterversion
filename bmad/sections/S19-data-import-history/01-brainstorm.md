# S19 — Brainstorming: Data Import History

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Every import is auditable and reversible.

## 2. SCAMPER
- **Add:** import job history list; "Undo Last Import".
- **Modify:** link to S13 upload.

## 3. Ideation
- `glStore.importHistory` records each import + entries added.

## 4. Selected Directions
1. `ImportJobHistory` page + undo action.
2. (Tasklist 1.1.2 references undo — verify.)

## 5. Open Questions
- Undo = soft revert or hard delete of imported entries? (delete imported entries only.)
