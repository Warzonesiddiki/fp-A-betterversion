---
date: 2026-05-19
type: pattern
project: FinPlan Pro
tags: [finplan-pro, vibe-coding, workflow, patterns]
status: current
---

# Vibe Coding Pattern

## Context Manager

Before starting any task:
1. Read CLAUDE.md + AGENTS.md
2. `git log --oneline -5` for recent work
3. `git status` for pending changes
4. `npm run build` to verify clean state

After completing:
- Suggest `/compact` if context >70%
- Update `.obsidian/brain/progress/`
- Commit before switching tasks

Context budget: <50% normal, 50-70% compact after task, 70-85% compact NOW, >85% stop.

## Surgical Diffs

- Edit over Write for existing files
- Minimal old_string — smallest unique match
- No reformatting surrounding code
- No "while I'm here" fixes
- Token budget: Edit 200, batch 800, new file 2000

## GSD Architect Mode

For multi-file features (>2 files):
1. Read existing code
2. Identify files to create/modify
3. Draft plan with dependencies + risks
4. Get user approval
5. Execute approved plan

Skip for: single file, bug fix, exact user instructions.

## Caveman Mode

Activated by "caveman". Levels:
- **lite**: drop filler, keep grammar
- **full**: fragments only
- **ultra**: single words

Always write normally for: security warnings, irreversible actions, clarifications.

## Auto Lint Fix

Loop: read error → fix → recheck. 3 attempts max before escalating.
- TypeScript: check tsconfig, fix types
- ESLint: read .eslintrc, fix rule
- Test: read test + source, fix mismatch
- Build: read vite.config, fix config

## Scope Guard

Allowed: budgeting, forecasting, consolidation, scenarios, reports, import, formulas, FX, sectors, collaboration, audit, plugins, a11y.

Forbidden: UGC, e-commerce, real-time collab, ML predictions, mobile, backend server, third-party APIs.

## Zustand Pattern

Canonical middleware stack (required order):
1. `subscribeWithSelector` — outermost
2. `persist` — if store needs persistence
3. `immer` — innermost

Use persist for: auth, settings, ui. Skip for: transient data.

## Related

- [[vibe-coding-setup]] — installation details
- [[ADR-005-memory-strategy]] — memory config
- [[agent-parallelism]] — 5-agent model
