---
date: 2026-05-19
type: decision
project: FinPlan Pro
tags: [finplan-pro, adr, memory, performance]
status: accepted
---

# ADR-005: Memory Strategy for Multi-Agent Sessions

## Status
Accepted — 2026-05-19

## Context
Multi-agent sessions (6 agents + vitest) crashed due to memory exhaustion. Physical RAM: 20GB, original pagefile: 9.7GB. Peak usage exceeded available memory.

## Decision
1. Add 80GB pagefile on secondary drive
2. Set NODE_OPTIONS to 48GB per process
3. Configure vitest with forks pool (8 workers)
4. Limit agents to 5 concurrent

## Rationale
- **Pagefile:** Provides virtual memory headroom for spikes. SSD-backed pagefile has acceptable performance for overflow.
- **NODE 48GB:** Allows each process to handle large test suites and codebases without OOM.
- **Forks pool:** Vitest forks are isolated processes — crash in one doesn't kill others.
- **5 agents:** Empirical limit. 6 agents crashed; 5 is stable with pagefile.

## Alternatives Considered
1. **Reduce NODE to 4GB** — rejected, test suite needs more
2. **Sequential agents** — rejected, too slow
3. **Swap to SSD only** — rejected, need both physical and virtual
4. **Reduce test parallelism** — rejected, tests already slow

## Consequences
- **Positive:** Can run 5 agents + 4 vitest workers concurrently
- **Positive:** Crash resilience — pagefile absorbs spikes
- **Negative:** SSD wear from pagefile writes
- **Negative:** Slight latency when processes swap to disk
- See [[memory-management]] pattern for implementation details
- See [[agent-parallelism]] for 5-agent allocation template

## Metrics
- Before: 6 agents → crash at ~12GB virtual
- After: 5 agents + 8 workers → stable at ~40GB virtual, peak ~60GB
- Pagefile usage: peak 2.6GB (C:) + 16GB (D:) = 18.6GB
- NODE_OPTIONS: 48GB, Vitest: 8 workers (forks pool)
- See [[2026-05-19-vitest-optimization]] for latest config
