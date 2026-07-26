# S01 — Epics & Stories

**Date:** 2026-07-25

## Epic 1: Quarantine root clutter
### Story S01-1: Move stray `.txt` dumps
- AC: 0 `.txt` files remain at root; all in `bmad/archive/junk-txt/`.
### Story S01-2: Move redundant planning docs
- AC: 13 docs moved; root keeps only 6 canonical docs.
### Story S01-3: Move agent-scratch dirs/files
- AC: 26 entries moved; no source/config dir removed.

## Epic 2: Preserve signal
### Story S01-4: Verify canonical root
- AC: `ls` root ≤30 entries; source/config intact.

## Traceability
| Story | Arch | Tests | Dev | Review |
|-------|------|-------|-----|--------|
| S01-1 | ✅ | ls | ✅ | ✅ |
| S01-2 | ✅ | ls | ✅ | ✅ |
| S01-3 | ✅ | ls | ✅ | ✅ |
| S01-4 | ✅ | ls | ✅ | ✅ |
