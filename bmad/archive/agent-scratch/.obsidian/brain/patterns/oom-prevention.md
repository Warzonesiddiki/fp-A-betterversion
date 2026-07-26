---
date: 2026-05-20
type: pattern
project: FinPlan Pro
tags: [finplan-pro, pattern, memory, oom, debugging]
status: current
---

# OOM Prevention Pattern — 2026-05-20

## Problem
Node.js has a 4GB default heap limit. Running vitest with multiple agents + tests causes FATAL ERROR: Reached heap limit.

## 8 OOM Crashes This Session

| # | Root Cause | Fix |
|---|-----------|-----|
| 1 | vitest 8 workers, no NODE_OPTIONS | Reduce to 4 workers |
| 2 | cross-env not propagating to children | Add execArgv to vite.config |
| 3 | execArgv only for workers, not main | Add node --max-old-space-size |
| 4 | NODE_OPTIONS not inherited by forks | cross-env + node flag + execArgv |
| 5 | 6 agents + vitest = memory pressure | Reduce to 2 agents max |
| 6 | Bulk script commenting out code | Revert, use Edit tool |
| 7 | Agent context accumulation | Restart agents periodically |
| 8 | vitest + build + agents simultaneously | Stagger operations |

## Current Configuration
```json
// package.json
"test": "node --max-old-space-size=50000 node_modules/vitest/vitest.mjs run"

// vite.config.ts
pool: 'threads',
maxThreads: 4,
minThreads: 2,
```

## Rules
1. **NODE_OPTIONS in package.json** — NOT via bash export (doesn't persist)
2. **Threads pool** — shares heap (unlike forks which create separate processes)
3. **2 agents max** — each uses ~2-4GB
4. **Stagger operations** — don't run vitest + build + agents simultaneously
5. **Monitor with:** `powershell Get-CimInstance Win32_PageFileUsage`
6. **100GB virtual available** — 50GB heap is safe

## Related
- [[2026-05-19-build-status]] — build configuration
- [[MASTER_PLAN_259_GAPS]] — performance architecture
