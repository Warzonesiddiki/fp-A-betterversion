---
date: 2026-05-19
type: pattern
project: FinPlan Pro
tags: [finplan-pro, performance, memory, optimization]
status: current
---

# Memory Management Pattern

## Problem

20GB physical RAM insufficient for 5 parallel agents + vitest + dev server.

## Solution: Virtual Memory Optimization

1. **Increase pagefile** to 80GB (D: drive)
2. **NODE_OPTIONS** to 48GB per process
3. **Vitest workers** to 8 (forks pool)
4. **Agent limit** to 5 max

## Configuration

```bash
# Pagefile: 9.7GB (C:) + 80GB (D:) = ~100GB virtual
# NODE_OPTIONS: --max-old-space-size=49152 (48GB)
# Vitest: pool=forks, maxWorkers=8, minWorkers=4
```

## Budget

| Component | GB |
|-----------|-----|
| NODE (main) | 48 |
| Vitest (8 workers) | 16 |
| 5 agents | 20 |
| OS + other | 10 |
| **Total** | **94** |
| **Available (80%)** | **80** |

## Rules

- 80% of virtual = available for Node processes
- Vitest: forks pool (not threads) for memory isolation
- Agents: max 5 (hard limit from crash history)
- Monitor: `Get-CimInstance Win32_PageFileUsage`

## Related

- See [[ADR-005-memory-strategy]] for decision record
- See [[vitest-optimization]] for test config
- See [[5-agent-pattern]] for agent allocation
