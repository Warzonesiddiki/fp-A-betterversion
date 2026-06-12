# Vibe Coding Workflow — Upgrade Research

> Researched: 2026-05-19
> Goal: State-of-the-art vibe coding setup for FinPlan Pro

## Current State

| Component         | Status           | Notes                        |
| ----------------- | ---------------- | ---------------------------- |
| Agent parallelism | 5 agents         | Good                         |
| Memory (RAM)      | 32GB NODE        | Good                         |
| Test runner       | vitest 4 workers | Good                         |
| Knowledge graph   | graphify         | Needs re-run                 |
| Obsidian brain    | 35 notes         | Needs cross-links            |
| Learning hooks    | installed        | Not generating instincts yet |
| MCP servers       | 5                | Need 5 more                  |

## Workflow Upgrades Needed

### 1. Pre-Flight Checklist (before every session)

```
□ npm run build — verify clean
□ git status — check uncommitted work
□ .obsidian/brain/ — read MOC for context
□ Last session summary — check progress/
□ Agent count — confirm 5 ready
```

### 2. Agent Allocation Template

Always 5 agents, each with distinct scope:

| Slot | Agent             | Scope                 |
| ---- | ----------------- | --------------------- |
| 1    | test-fixer        | Fix failing tests     |
| 2    | page-builder      | Wire stub pages       |
| 3    | engine-builder    | Build missing engines |
| 4    | brain-updater     | Update Obsidian       |
| 5    | skills-researcher | Research new patterns |

### 3. Build-Test-Commit Loop

```
Build → Test → Fix → Build → Commit
  ↑                              |
  └──────────────────────────────┘
```

Every agent must:

1. Build before editing
2. Test after editing
3. Commit if build passes
4. Report: files changed, build status

### 4. Cooldown Pattern

- 30 min work → 2 min pause
- Let agents finish current task
- Don't launch new agents during pause
- CPU cools, memory settles

### 5. Memory Management

```
NODE_OPTIONS: --max-old-space-size=32768
Vitest: pool=forks, maxWorkers=4
Pagefile: 80GB (secondary)
80% virtual = ~88GB available
```

## Skills to Acquire

### High Priority

1. **verification-loop** — verify implementations work correctly
2. **tdd-workflow** — test-driven development cycle
3. **security-review** — OWASP audit before commits
4. **frontend-patterns** — React best practices
5. **coding-standards** — enforce consistency

### Medium Priority

6. **e2e-testing** — Playwright E2E patterns
7. **performance-engineer** — bundle analysis, lazy loading
8. **architecture-decision-records** — document decisions
9. **blueprint** — system design patterns
10. **strategic-compact** — context management

### Low Priority

11. **codebase-onboarding** — understand new repos fast
12. **search-first** — search before coding
13. **deep-research** — multi-source research

## Hooks to Install

### Pre-Edit Hook

```json
"PreEdit": [{
  "matcher": "*",
  "hooks": [{
    "type": "command",
    "command": "echo 'Building before edit...' && npm run build 2>&1 | tail -1"
  }]
}]
```

### Post-Edit Hook

```json
"PostEdit": [{
  "matcher": "*",
  "hooks": [{
    "type": "command",
    "command": "echo 'Testing after edit...' && npx vitest --run --reporter=verbose 2>&1 | tail -3"
  }]
}]
```

### Post-Commit Hook

```json
"PostCommit": [{
  "matcher": "*",
  "hooks": [{
    "type": "command",
    "command": "echo 'Updating brain...' && date >> .obsidian/brain/progress/commit-log.txt"
  }]
}]
```

## Obsidian Integration

### Session Start

1. Read MOC-FinPlan-Pro.md
2. Check progress/ for last session
3. Read any blocking decisions

### During Work

1. Update progress notes after each commit
2. Log decisions as ADRs
3. Document new features

### Session End

1. Update build-status.md
2. Update MOC if new notes added
3. Commit brain changes

## Graph Integration

### Before Coding

```
/graphify query "What depends on [component]?"
```

### After Changes

```
/graphify --update
```

### Weekly

```
/graphify --cluster-only
```

## Quality Gates

### Before Commit

- [ ] Build passes
- [ ] Tests pass (or failures explained)
- [ ] No console.log in production code
- [ ] No hardcoded secrets
- [ ] Components under 300 lines
- [ ] Files under 500 lines

### Before PR

- [ ] All quality gates pass
- [ ] Obsidian brain updated
- [ ] Graph updated
- [ ] Memory files updated

## Anti-Patterns to Avoid

1. **Don't analyze, build** — user frustrated with over-analysis
2. **Don't launch 6+ agents** — memory pressure, crashes
3. **Don't skip cooldown** — CPU heat, instability
4. **Don't commit secrets** — .env, credentials
5. **Don't force-push to main** — destructive
6. **Don't amend unless asked** — lose history
7. **Don't create docs unless asked** — bloat
8. **Don't add features beyond scope** — creep

## Session Template

```
1. Resume session
2. Read MOC + last progress
3. Build check (npm run build)
4. Launch 5 agents on identified gaps
5. Monitor progress, commit when ready
6. Cooldown at 30min
7. Update Obsidian brain
8. Commit brain changes
9. Repeat until done
```
