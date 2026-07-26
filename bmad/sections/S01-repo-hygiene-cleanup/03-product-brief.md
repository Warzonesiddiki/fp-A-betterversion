# S01 — Product Brief

**Date:** 2026-07-25

## 1. Vision (this section)
A repository that is clean, trustworthy, and navigable — where every file earns its place. This is the foundation that makes "zero compromises" credible.

## 2. Target Users
- **Developers/agents** working in the repo: need signal, not noise.
- **Future maintainers / auditors**: need one source of truth.

## 3. Problem & Value
- Problem: 119 root entries, 101 of them junk/contradictory; impossible to trust status.
- Value: clean root, reversible quarantine, single status board → faster, safer work on S02–S100.

## 4. Success Metrics
- Root contains only canonical files/dirs (≤30 entries).
- 0 stray `.txt` dumps at root.
- All removed items recoverable from `bmad/archive/`.

## 5. Scope Guardrails
- In: move junk to archive, keep canonical docs.
- Out: deleting archived files, pruning `docs/`/`reports/` (→ S03), fixing install (→ S04).
