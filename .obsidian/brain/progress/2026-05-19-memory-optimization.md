---
date: 2026-05-19
type: progress
project: FinPlan Pro
tags: [finplan-pro, memory, performance, optimization]
status: current
---

# Memory Optimization — 2026-05-19

## Problem
Crash during multi-agent session. Root cause: 6 agents + vitest = ~12GB virtual memory, exceeding physical RAM (20GB) + original pagefile (9.7GB).

## Solution
User manually added 80GB pagefile on secondary drive.

## Configuration
- **Physical RAM:** 20GB
- **Pagefile 1 (C:):** 9.7GB (system-managed)
- **Pagefile 2 (D:):** 80GB (manually added)
- **Total Virtual:** ~110GB
- **Target Usage:** 80% = ~88GB

## Node.js Settings
```bash
NODE_OPTIONS="--max-old-space-size=32768"  # 32GB per process
```

## Vitest Settings (vite.config.ts)
```typescript
test: {
  pool: 'forks',
  poolOptions: {
    forks: {
      singleFork: false,
      maxForks: 4,
      minForks: 2,
    },
  },
  maxWorkers: 4,
  minWorkers: 2,
  testTimeout: 30000,
  hookTimeout: 30000,
}
```

## Current Pagefile Usage
- C: drive: 3.2GB used, 4.7GB peak
- D: drive: 0.9GB used, 2.4GB peak
- Total in use: ~4.1GB of ~90GB allocated

## Agent Limits
- **Before crash:** 6 agents (too many)
- **After fix:** 5 agents (user requested)
- **Safe limit:** 5 agents + 1 main process = ~6 concurrent Node processes

## Key Learning
- Each agent spawns a Node process (~1-2GB)
- Vitest with forks pool uses separate processes per worker
- 4 vitest workers + 5 agents = ~9 concurrent processes
- With 32GB NODE max, theoretical peak = 9 × 32GB = 288GB (but actual usage much lower)
- Pagefile provides safety net for spikes
