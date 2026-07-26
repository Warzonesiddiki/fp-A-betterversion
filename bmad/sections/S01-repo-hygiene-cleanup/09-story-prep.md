# S01 — Story Prep

**Date:** 2026-07-25

## Pre-Implementation Checklist
- [x] PRD acceptance criteria understood
- [x] No UX beyond repo layout
- [x] Architecture contracts agreed (canonical root set)
- [x] No tests needed beyond `ls`/`git status` validation
- [x] Reuse: `bmad/archive/` already created

## Implementation Order
1. Create archive buckets (done in setup).
2. Move `.txt` dumps.
3. Move planning docs.
4. Move agent-scratch dirs.
5. Second pass: PERFORMANCE_LOG.md, plan dirs, move prior report into bmad.
6. Verify.

## Guardrails
- Move (reversible), never `rm`. Touch no source/config files.
