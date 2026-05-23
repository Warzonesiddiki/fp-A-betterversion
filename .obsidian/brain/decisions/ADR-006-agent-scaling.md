---
date: 2026-05-19
type: adr
project: FinPlan Pro
tags: [finplan-pro, agents, scaling, architecture-decision]
status: accepted
---

# ADR-006: Agent Scaling Strategy

## Status

Accepted — 2026-05-19

## Context

- Pagefile increased from 9.7GB → 80GB. Total virtual RAM: ~100GB.
- Previous limit was 5 agents (from ADR-005 when pagefile was 9.7GB).
- 5 agents was insufficient — agents frequently completed and left slots idle.
- User hard requirement: "atleast 5 agents active at a time"

## Decision

Raise max agents from 5 → 10. Hard minimum: 5 active at all times.

## Consequences

### Positive
- 2x throughput on parallel work (test fixes, page wiring, docs)
- Agents never idle — replacement spawned immediately on completion
- Vitest can run 8 workers concurrently with agents

### Negative
- Higher memory pressure (46GB / 80GB = 57.5%)
- More git merge conflicts if agents touch same files
- Higher API token usage per session

### Mitigations
- File conflict matrix in AGENTS.md prevents overlap
- Each agent assigned non-overlapping scope
- 57.5% memory usage leaves 34GB headroom

## Alternatives Considered

1. **7 agents** — rejected: still left idle slots
2. **15 agents** — rejected: 45GB agents + 16GB vitest = 61GB, too close to 80GB
3. **Dynamic scaling (5-15)** — rejected: complexity not worth it for this project

## References

- [[memory-management]] — pagefile + NODE config
- [[agent-parallelism]] — 6-agent lessons
- [[5-agent-pattern]] — original pattern (superseded)
- [[ADR-005-memory-strategy]] — original memory ADR
