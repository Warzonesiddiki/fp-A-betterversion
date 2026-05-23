---
date: 2026-05-19
type: pattern
project: FinPlan Pro
tags: [finplan-pro, pattern, agents, efficiency]
status: current
---

# 5-Agent Parallel Pattern

## Rule

Always launch exactly 5 agents when doing build work. Maximizes parallelism without overwhelming. Constrained by [[ADR-005-memory-strategy]] to 5 agents max.

## Agent Allocation Template

| Slot | Role | Scope |
|------|------|-------|
| 1 | Builder | New feature/engine/component |
| 2 | Wirer | Wire pages to stores |
| 3 | Fixer | Fix stubs, tests, types |
| 4 | Auditor | Verify patterns, lint, build |
| 5 | Documenter | Obsidian brain, graphify |

## Anti-Patterns

- **< 5 agents:** Underutilized parallelism
- **> 6 agents:** Diminishing returns, merge conflicts
- **Same file per agent:** Guaranteed conflicts
- **No build check per agent:** Broken merges

## Workflow

1. Identify 5 non-overlapping work areas
2. Assign each to an agent with clear directive
3. Each agent: read → build → test → commit
4. Main thread: monitor, merge, resolve conflicts
5. After all complete: run full test suite

## What Worked

- Store fixes (5 stores in parallel, no conflicts)
- [[charts]] components (6 charts, 5 agents, zero conflicts)
- Sector KPIs (16 sectors, parallel updates)
- [[formula-engine]], [[compliance]], [[fx-engine]] tests (3 engines, parallel test creation)

## What Didn't

- 6 agents on same store file → merge conflict
- Agents without build check → broken main
- Agents modifying types.ts simultaneously → conflicts

## Session Stats (2026-05-19)

- Total agents launched: 30+
- Average agent runtime: 3-8 minutes
- Commits per agent batch: 3-5
- Build pass rate: 100% between batches
- Test regression: 82 failures from store/auth changes
- Test fix: agent-based parallel fixing
