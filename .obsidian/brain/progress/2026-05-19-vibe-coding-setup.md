---
date: 2026-05-19
type: progress
project: FinPlan Pro
tags: [finplan-pro, vibe-coding, skills, setup]
status: current
---

# Vibe Coding Setup — 2026-05-19

## 7 Vibe Coding Skills Installed

All in `.claude/rules/` (gitignored — local only):

1. **skill-vibe-context-manager** — prevents context bleed, session init checklist, context budget tracking
2. **skill-surgical-diffs** — patch-only edits via Edit tool, token budget per operation, Write forbidden on existing files >50 lines
3. **skill-gsd-architect** — plan-before-build for multi-file features, Architect Mode protocol with risks section
4. **skill-caveman-mode** — activated by "caveman", 3 levels (lite/full/ultra), drops all filler
5. **skill-auto-lint-fix** — self-correction loop: 3 attempts before escalating, covers TS/lint/test/build errors
6. **skill-finplan-scope** — scope guard: allowed features (FP&A) vs forbidden (e-commerce, ML, mobile)
7. **skill-zustand-pattern** — canonical store pattern: subscribeWithSelector → persist → immer

## Skills Loaded

See [[skills-inventory]] for full list. Key categories:
- 8 frontend/testing skills from everything-claude-code
- 5 compound engineering skills (brainstorm, plan, code-review, compound, debug)
- 22 total rules active

## Integrations Added

- **GSD** (Get Shit Done) — installed via npx, 29 agents + hooks + commands
- **Compound Engineering** — cloned from EveryInc, 49 agents + 36 skills
- **Claude Code Toolkit** — cloned from rohitg00, 135 agents + 35 skills
- **Hermes Agent** — cloned from NousResearch, self-improving agent framework

## Memory Optimizations

- Pagefile: 9.7GB (C:) + 80GB (new) = ~90GB virtual
- NODE_OPTIONS: --max-old-space-size=32768 (32GB)
- Vitest: pool=forks, maxWorkers=4, minWorkers=2
- See [[ADR-005-memory-strategy]]

## Related

- [[vibe-coding-pattern]] — workflow details
- [[skills-inventory]] — full skill catalog
- [[efficiency-learnings]] — patterns discovered
