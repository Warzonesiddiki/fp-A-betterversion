---
date: 2026-05-19
type: progress
project: FinPlan Pro
tags: [finplan-pro, agents, scaling, virtual-ram]
status: current
---

# Agent Limit Update — 2026-05-19

## Change

Agent limit raised from 5 → 10 max. Hard rule: always keep ≥5 agents active at all times.

## Rationale

- Pagefile increased to 80GB (from 9.7GB). Total virtual RAM now ~100GB.
- Each agent uses ~3GB. 10 agents = 30GB + vitest 8 workers (16GB) = 46GB, well under 80GB safe threshold.
- User explicitly requested: "lets update agent limit as we have more page file"
- Hard rule enforced: "atleast 5 agents active at a time"

## Current Config

- **RAM:** 20GB physical
- **Pagefile:** 9.7GB (C:) + 80GB (D:) = ~90GB
- **Total virtual:** ~100GB
- **Safe usage (80%):** ~80GB
- **NODE_OPTIONS:** `--max-old-space-size=49152` (48GB)
- **Vitest:** maxWorkers=8, minWorkers=4, maxForks=8

## Agent Budget

| Component | Memory |
|-----------|--------|
| 10 agents × 3GB | 30GB |
| Vitest 8 workers × 2GB | 16GB |
| Build process | ~4GB |
| **Total** | **50GB** (62.5% of 80GB safe) |

## Anti-Pattern: Going Below 5

Never drop below 5 active agents. When an agent completes, immediately spawn a replacement. Queue work items to keep agents busy.

See [[ADR-006-agent-scaling]] for full rationale. See [[memory-management]] for pagefile config.
