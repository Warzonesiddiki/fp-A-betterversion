# S01 — Architecture

**Date:** 2026-07-25

## 1. Context
Repo hygiene is a filesystem operation; no code changes. Goal: separate signal from noise.

## 2. Components / Modules
- `bmad/archive/junk-txt/` — 62 stray `.txt` dumps.
- `bmad/archive/planning-docs/` — 13 redundant planning docs.
- `bmad/archive/agent-scratch/` — 26 agent/runtime scratch dirs+files.

## 3. Data Model & Flow
- N/A (no data model change).

## 4. Interfaces & Contracts
- Canonical root contract: `{README, CLAUDE, AGENTS, CONTRIBUTING, SECURITY, LICENSE}.md` + source/config dirs.

## 5. Integration Points
- None. Subsequent sections (S02–S100) now operate on a clean base.

## 6. Performance & Security
- Minor: smaller working tree, faster `git status`/glob. No security impact.

## 7. Testing Strategy
- Validation = `ls` root count + `git status` shows only moves + archived items exist.
