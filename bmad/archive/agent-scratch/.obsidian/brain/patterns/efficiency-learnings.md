---
date: 2026-05-19
type: pattern
project: FinPlan Pro
tags: [finplan-pro, patterns, efficiency, workflow]
status: current
---

# Efficiency Patterns — Learned During Development

## 1. Build Before Analyzing
**Pattern:** Always run `npm run build` and `npm run test` before doing gap analysis.
**Why:** Many "gaps" from old analysis were already fixed in prior sessions. Stale gap reports waste time.
**How to apply:** Start every session with build+test check. Only analyze gaps if build passes.

## 2. Type-Check Before Writing
**Pattern:** Read `src/types/index.ts` BEFORE writing any component that uses store data.
**Why:** TypeScript types are more complex than expected. Comment needs 13 fields, Task needs 13 fields, ActivityLog needs 11 fields.
**How to apply:** Before writing a component, grep the type definition and use ALL required fields.

## 3. Store Method Name Verification
**Pattern:** Check actual store method names with `grep` before using them in components.
**Why:** Store has `addActivity` not `addActivityLog`. Method names don't always match what you'd expect.
**How to apply:** `grep "methodName" src/store/targetStore.ts` before writing the call.

## 4. Agent Parallelism (5 Max)
**Pattern:** Launch exactly 5 agents in parallel for maximum throughput.
**Why:** More than 5 causes memory exhaustion (see [[ADR-005-memory-strategy]]). Less than 5 underutilizes.
**How to apply:** Each agent reads prompt spec, checks existing code, builds only what's missing, runs build, reports. See [[agent-parallelism]] for detailed allocation.

## 5. Commit Incrementally
**Pattern:** Commit after each agent completes, not at the end.
**Why:** If one agent breaks the build, you can revert just that commit.
**How to apply:** `git add <specific files> && git commit` after each logical unit of work.

## 6. Obsidian as Secondary Brain
**Pattern:** Update .obsidian/brain/ with progress, features, decisions, and learnings.
**Why:** Context persists across sessions. Future-you knows what was built and why.
**How to apply:** Create notes for: progress, features, ADRs, bugs, patterns, decisions.
