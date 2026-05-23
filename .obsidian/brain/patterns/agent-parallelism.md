---
date: 2026-05-19
type: pattern
project: FinPlan Pro
tags: [finplan-pro, pattern, agents, parallelism, workflow]
status: current
---

# Agent Parallelism Pattern — 5-Agent Model

Memory constrained to 5 agents per [[ADR-005-memory-strategy]].

## What Worked

### Setup Phase (2 agents)
1. **gap-analyzer** — fast scan of all 15 prompt parts vs codebase
2. **setup-agent** — install learning hooks, create agent definitions

### Build Phase (6 agents)
1. **keyboard-agent** — keyboard shortcuts, command palette
2. **charts-agent** — 6 chart components
3. **fx-agent** — FXEngine for currency
4. **compliance-agent** — ComplianceEngine + AuditEngine
5. **sector-agent** — sector KPI verification
6. **migration-agent** — migration wizard

### Follow-up Phase (6 agents)
1. **fx-builder** — expand FX engine
2. **compliance-builder** — expand compliance
3. **sector-verifier** — verify all 16 sectors
4. **page-finisher** — fix remaining stubs
5. **routing-agent** — verify routing
6. **obsidian-updater** — update brain vault

## Rules

- **Max 6 agents** — hard limit, user enforced
- **Each agent reads spec first** — don't guess, read prompt files
- **Each agent runs build** — `npm run build` must pass
- **Each agent reports** — files created, build status
- **No file conflicts** — each agent works on isolated files
- **Commit after each agent** — incremental progress

## Anti-Patterns

- Launching agents without reading specs = wasted runs
- Agents working on same files = merge conflicts
- Not running build after changes = broken code committed
- Too many agents = resource exhaustion, timeouts
- Agents that don't commit = work lost on termination

## Time Budget

- Gap analysis: ~2 min
- Setup (hooks, agents): ~3 min
- Build agents: ~5-10 min each
- Total session: ~60-90 min for full cycle
