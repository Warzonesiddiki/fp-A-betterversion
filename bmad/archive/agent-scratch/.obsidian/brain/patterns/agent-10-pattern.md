---
date: 2026-05-19
type: pattern
project: FinPlan Pro
tags: [finplan-pro, agents, parallelism, scaling]
status: current
---

# 10-Agent Pattern

## Rule

Always maintain ≥5 active agents. Max 10 concurrent.

## Allocation Template

When launching a batch, assign these roles (fill as needed):

| Slot | Role | Focus |
|------|------|-------|
| 1 | Test Fixer | Fix failing tests |
| 2 | Page Builder | Wire stub pages to stores |
| 3 | Sector Builder | Build sector sub-pages |
| 4 | Hooks Builder | Create missing hooks |
| 5 | Brain Updater | Update Obsidian vault |
| 6 | Gap Scanner | Find remaining gaps |
| 7 | Engine Builder | Build missing engines |
| 8 | Skills Loader | Load/acquire skills |
| 9 | Graphifier | Refresh knowledge graph |
| 10 | Verification | Run build + test + lint |

## Workflow

1. Launch 5 agents minimum at session start
2. When agent completes → immediately spawn replacement from queue
3. Never go below 5 active
4. Track: `git log --oneline -5` for agent commits
5. Track: `git diff --stat HEAD` for pending work

## Memory Budget

10 agents × 3GB = 30GB. Vitest 16GB. Total 46GB of 80GB safe.

## Anti-Patterns

- NEVER wait for all agents before launching replacements
- NEVER launch <5 agents for a "quick" batch
- NEVER share file scope between agents (conflicts)

See [[agent-parallelism]] for 6-agent lessons learned. See [[ADR-006-agent-scaling]] for decision.
