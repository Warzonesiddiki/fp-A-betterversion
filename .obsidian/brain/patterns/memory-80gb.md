# Memory Configuration — 80 GB

## Setup
- **Physical RAM:** 10 GB
- **Pagefile:** 80 GB (C: drive)
- **Total virtual:** ~90 GB
- **NODE_OPTIONS:** `--max-old-space-size=81920` (80 GB, set globally via `[System.Environment]::SetEnvironmentVariable`)

## Package.json Scripts
```json
"test": "node --max-old-space-size=81920 node_modules/vitest/vitest.mjs run",
"test:watch": "node --max-old-space-size=81920 node_modules/vitest/vitest.mjs"
```

## Vitest Config
```typescript
pool: 'threads',        // shared heap (not forks)
maxThreads: 4,
minThreads: 2,
```

## Why 80 GB
- 8 OOM crashes at lower limits (4 GB, 16 GB, 32 GB, 40 GB, 50 GB)
- 156 engines + 177 components + 422 test files = large AST
- AG Grid vendor chunk alone is 1.1 MB
- Threads pool shares heap — all workers get the 80 GB limit

## Anti-Patterns
- NEVER use `export NODE_OPTIONS=...` in bash (doesn't persist across calls)
- NEVER use forks pool on Windows (separate processes, each capped at 4 GB default)
- ALWAYS set in package.json scripts or globally via PowerShell

## Related
- [[ADR-007-test-memory-strategy]]
- [[oom-prevention]]
- [[2026-05-21-session-status]]
