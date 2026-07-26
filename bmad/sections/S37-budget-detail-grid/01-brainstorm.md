# S37 — Brainstorming: Budget Detail Grid

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Editing a budget must feel like a spreadsheet: keyboard-driven, undoable.

## 2. SCAMPER
- **Add:** AG Grid editable currency cells; full keyboard (F2/Enter/Ctrl+C/V); undo/redo; version snapshots + restore; cell comments + audit.
- **Modify:** reuse the grid in reports (→ S64).

## 3. Ideation
- `BudgetDetailPage` with AG Grid + history stack.

## 4. Selected Directions
1. `BudgetDetailPage`: AG Grid editor + undo/redo + versions + comments.
2. (Tasklist 2.1.3 unchecked.)

## 5. Open Questions
- Comments stored per cell? (yes, in version metadata.)
