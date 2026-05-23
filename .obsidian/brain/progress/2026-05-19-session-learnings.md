---
date: 2026-05-19
type: learning
project: FinPlan Pro
tags: [finplan-pro, learning, efficiency, patterns]
status: current
---

# Session Learnings — 2026-05-19

## What We Learned (Efficiency Patterns)

### 1. Build Before Bothering
Always check `npm run build` first. Many "gaps" from old analysis were already fixed. Don't trust stale gap reports.

### 2. Type-Check Before Writing
Read the actual TypeScript types in `src/types/index.ts` before writing components. The types are more complex than expected:
- Comment needs: resourceType, resourceId, cellId, parentId, authorId, authorName, authorInitials, content, mentions, isResolved, resolvedAt, createdAt, replies
- Task needs: title, description, assigneeId, assigneeName, dueDate, priority, status, relatedResourceType, relatedResourceId, createdBy, createdAt
- ActivityLog needs: userId, userName, userEmail, action, resourceType, resourceId, resourceName, details, timestamp

### 3. Store Method Names
Check actual store methods before using them. collaborationStore has `addActivity` not `addActivityLog`.

### 4. Agent Parallelism
5 agents max works well (see [[ADR-005-memory-strategy]]). Each agent should:
- Read prompt spec first
- Check existing code
- Build only what's missing
- Run build after changes
- Report: files created, build status
- See [[agent-parallelism]] for detailed allocation template

### 5. Obsidian as Secondary Brain
Update .obsidian/brain/ with:
- Progress notes after each session
- Architecture decisions (ADRs) — see [[ADR-004-test-fixing-strategy]], [[ADR-005-memory-strategy]]
- Bug discoveries
- Feature documentation — see [[formula-engine]], [[compliance]], [[charts]], [[plugin-system]]
- Learning patterns — see [[efficiency-learnings]]

## Current Build Status
- Build: PASS
- Tests: 6256 pass, 1 skip
- Plugin system: 7 files, 1585 lines
- CollaborationPage: DONE (was 0 bytes)
- Agent definitions: 5 created in .claude/agents/
- Learning hooks: installed in ~/.claude/homunculus/
- MCP servers: 5 (github, git, filesystem, excel-analyser, playwright)

## Active Agents (6 running)
1. keyboard-agent — keyboard shortcuts + command palette
2. charts-agent — advanced chart components
3. fx-agent — FX engine + currency pages
4. compliance-agent — compliance + audit features
5. sector-agent — sector dashboard KPIs
6. migration-agent — data migration wizard
