---
name: task-management
description: GTD (Getting Things Done) and Kanban patterns for effective task management. Includes capture, clarify, organize, reflect, and engage workflows.
origin: productivity-expert
version: 1.0.0
---

# Task Management - GTD & Kanban Framework

A comprehensive task management system combining Getting Things Done (GTD) methodology with Kanban visualization for maximum productivity.

## When to Activate

- Breaking down complex projects into actionable tasks
- Organizing backlog and prioritizing work
- Setting up personal or team Kanban boards
- Managing context-switching and focus
- Weekly reviews and task audits
- Capturing杂乱的thoughts and ideas

## GTD Core Workflow

### 1. Capture
Collect everything occupying mental space:
- Quick capture to inbox (notebook, app, voice)
- No judgment during capture phase
- Zero friction entry points
- Daily inbox review to process

### 2. Clarify
Determine what each item is:
- Is it actionable?
  - YES → What's the next action?
  - NO → Trash / Reference / Someday/Maybe
- Single next physical action
- <2 minutes? Do it now

### 3. Organize

```
INBOX
  ↓
[Actionable]
  ├── Projects (multi-step outcomes)
  │     └── Next Actions → Context Lists
  ├── Waiting For (delegated items)
  └── Calendar (time-specific commitments)
[Non-Actionable]
  ├── Reference Material
  ├── Someday/Maybe
  └── Trash
```

### 4. Reflect
- Daily: Review today's actions
- Weekly: Complete weekly review (inbox zero, project status, context lists)
- Monthly: Larger horizon planning

### 5. Engage
Choose based on:
- Context (where you are)
- Time available
- Energy level
- Priority

## Kanban Implementation

### Core Principles

| Principle | Description |
|-----------|-------------|
| Visualize workflow | Map value stream |
| Limit WIP | Cap work in progress |
| Flow focus | Optimize for completion |
| Make policies explicit | Rules are visible |
| Feedback loops | Regular cadences |
| Improve collaboratively | Team-based kaizen |

### Standard Columns

```
| BACKLOG | TODO | IN PROGRESS | REVIEW | DONE |
|         |      |             |        |      |
| ideas   | ready| active work | testing| ship |
```

### WIP Limits

| Column | WIP Limit | Rationale |
|--------|-----------|-----------|
| In Progress | 3 | Context preservation |
| Review | 2 | Quality attention |
| Total flow | 7 | Balance throughput |

### Kanban Metrics

- **Lead Time**: Idea → Done
- **Cycle Time**: Start → Done
- **Throughput**: Items completed per period
- **WIP**: Current items in progress
- **Cumulative Flow**: Capacity over time

## Project Breakdown Patterns

### PACER Model
```
P - Purpose: Why are we doing this?
A - Outcome: What does success look like?
C - Components: Major work areas
E - Events: Milestones and checkpoints
R - Resources: Who/what is needed
```

### Task Decomposition

```markdown
## Project: Launch Feature X

### Epic
- User can do Y

### Stories
- [ ] Story 1: As user, I need Y
- [ ] Story 2: System validates Z

### Tasks
- [ ] Design API schema
- [ ] Implement service layer
- [ ] Write unit tests
- [ ] Integration testing
```

### Definition of Done

- [ ] Code written and reviewed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Acceptance criteria met
- [ ] Merged to main branch

## Priority Frameworks

### Eisenhower Matrix

```
         Urgent        Not Urgent
      ┌─────────────┬─────────────┐
High  │   DO FIRST  │  SCHEDULE   │
      │  (crisis,   │ (planning,  │
      │  deadlines) │  prevention)│
      ├─────────────┼─────────────┤
Low   │  DELEGATE   │  ELIMINATE  │
      │  (interrupt │  (time      │
      │  -ions)     │  wasters)   │
      └─────────────┴─────────────┘
```

### MoSCoW Method

| Priority | Meaning | Target |
|----------|---------|--------|
| Must Have | Critical for delivery | 100% |
| Should Have | Important but not critical | 80% |
| Could Have | Desired but optional | 60% |
| Won't Have | Explicitly excluded | 0% |

## Daily Task Management

### Morning Ritual
1. Review calendar for time commitments
2. Check project boards for status
3. Identify 3 MITs (Most Important Tasks)
4. Time-block deep work sessions

### Focus Techniques

```
Pomodoro: 25 min work → 5 min break
Deep Work: 90 min blocks → 20 min rest
Time Boxing: Fixed duration per task
```

### Energy Management

| Energy Level | Task Type |
|--------------|-----------|
| High | Creative, complex problem-solving |
| Medium | Meetings, reviews, communications |
| Low | Administrative, email, routine |

## Weekly Review

### 10-Step GTD Weekly Review
1. Get clear - Process inbox to zero
2. Get current - Review all lists
3. Get creative - What's on your mind?
4. Review projects - Status of each
5. Review next actions - Clear context lists
6. Review waiting for - Follow up
7. Review calendar - Past and future
8. Review someday/maybe - Move to active?
9. Review waiting for - Any stuck items?
10. Set up next week - Preview commitments

## Tools Integration

| Tool Type | Use Case | Examples |
|-----------|----------|----------|
| Capture | Quick entry | Things, OmniFocus, Notion |
| Kanban | Team boards | Linear, Jira, Trello |
| Context | Personal actions | Apple Reminders, Todoist |
| Reference | Knowledge | Notion, Obsidian, Evernote |

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Big bang tasks | Hard to track | Break to 1-4 hour chunks |
| No context tags | Can't find relevant tasks | Add @location/@tool tags |
| Infinite backlog | Overwhelm | Regular culling (20% quarterly) |
| Skipping reviews | Drift | Commit to weekly cadence |
| Context switching | Efficiency loss | Batch similar tasks |

## Quick Commands

```bash
/inbox          # Show unprocessed items
/process        # Walk through inbox items
/next-actions   # List next actions by context
/projects       # Show all active projects
/week-review    # Guide through weekly review
/prioritize     # Reorder tasks by importance
```

---

*Capture it, clarify it, complete it.*