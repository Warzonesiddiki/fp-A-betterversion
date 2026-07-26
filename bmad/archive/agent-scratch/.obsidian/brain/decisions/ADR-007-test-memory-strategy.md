---
date: 2026-05-20
type: decision
project: FinPlan Pro
tags: [finplan-pro, adr, memory, testing, vitest]
status: accepted
---

# ADR-007: Test Memory Strategy

## Status

Accepted — 2026-05-20

## Context

FinPlan Pro has 418 test files. Running all tests with `pool: 'forks'` creates separate processes, each with 4GB default heap limit. Crashed 5 times with OOM.

System has 20GB physical RAM + 80GB pagefile = 100GB virtual.

## Decision

Use `pool: 'threads'` with `node --max-old-space-size=32768` for test execution.

## Rationale

1. **threads pool** — Worker threads share main process heap. One 32GB heap instead of 3 separate 4GB heaps.
2. **node --max-old-space-size=32768** — Direct flag in test script. No cross-env (fails on Windows).
3. **maxThreads: 2** — 2 thread workers. Enough parallelism, safe memory.
4. **No --no-isolate** — Keep test isolation for correctness.

## Alternatives Considered

| Alternative | Why Rejected |
|------------|-------------|
| pool: 'forks' + execArgv | Forks create separate processes, execArgv ignored on Windows |
| cross-env NODE_OPTIONS | Doesn't propagate to forked processes on Windows |
| --no-isolate | Breaks test isolation, causes state leakage |
| Run tests in batches | Complex, slow, needs custom script |
| Increase pagefile | Doesn't help — Node heap limit is per-process |

## Consequences

**Positive:**
- Tests run without OOM
- 32GB heap handles 418 test files
- Thread workers share memory efficiently
- Simple configuration

**Negative:**
- Thread workers share state (potential test pollution)
- 2 workers max (slower than 4+ forks)
- 32GB heap may be excessive for small test suites

## Implementation

```json
// package.json
"test": "node --max-old-space-size=32768 node_modules/vitest/vitest.mjs run"
```

```typescript
// vite.config.ts
{
  pool: 'threads',
  maxThreads: 2,
  minThreads: 1,
  maxWorkers: 2,
  minWorkers: 1,
}
```

## Related
- [[ADR-005-memory-strategy]] — general memory strategy
- [[oom-prevention]] — OOM crash history and fixes
- [[memory-management]] — memory management pattern
