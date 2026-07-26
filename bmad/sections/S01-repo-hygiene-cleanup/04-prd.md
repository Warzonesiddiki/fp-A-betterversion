# S01 — PRD

**Date:** 2026-07-25

## 1. Overview
Remove non-canonical files from the repo root and quarantine them reversibly under `bmad/archive/`.

## 2. User Stories
- As a dev, I want only meaningful files at root, so I can navigate fast.
- As a lead, I want junk quarantined (not destroyed), so nothing is lost.

## 3. Functional Requirements
- FR-1: Move all root `*.txt` scratch dumps to `bmad/archive/junk-txt/`.
- FR-2: Move redundant planning docs to `bmad/archive/planning-docs/`.
- FR-3: Move agent-scratch dirs/files to `bmad/archive/agent-scratch/`.
- FR-4: Keep canonical root docs: README, CLAUDE, AGENTS, CONTRIBUTING, SECURITY, LICENSE.
- FR-5: Keep source/config dirs: src, server, tests, e2e, public, docs, reports, src-tauri, scripts, tools, agents, bmad, plus config files.

## 4. Non-Functional
- Reversible (quarantine, not delete). No source/config file touched.

## 5. Acceptance Criteria
- `ls` at root shows ≤30 entries, none are `.txt` dumps or superseded planning docs.
- `bmad/archive/` contains the moved items, recoverable.
- `git status` reflects moves; no source file modified.

## 6. Out of Scope
- Pruning `docs/`/`reports/` (S03); install fix (S04); doc reconciliation (S03).

## 7. Dependencies
- None (pure repo hygiene).

## 8. Open Issues
- Whether to later delete archived junk (defer to S100).
