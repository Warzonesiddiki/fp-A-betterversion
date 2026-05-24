---
name: prd-to-plan
description: Convert PRD to implementation plan — task breakdown, dependencies, timeline
user-invocable: true
---

# PRD to Plan

Apply when: converting requirements into actionable implementation tasks.

## Process
1. Read PRD/requirements
2. Identify technical components needed
3. Break into tasks (each < 4 hours)
4. Map dependencies between tasks
5. Identify risks and unknowns
6. Estimate effort per task

## Output Format
```markdown
## Tasks
- [ ] Task 1: [description] (depends on: none) — [S/M/L]
- [ ] Task 2: [description] (depends on: Task 1) — [S/M/L]

## Risks
- Risk 1: [description] → Mitigation: [plan]

## Unknowns
- Question 1: [needs investigation]
```

## Rules
- Tasks should be independently testable
- No task larger than 4 hours
- Always include a testing task
- Flag unknowns that need spike/investigation
