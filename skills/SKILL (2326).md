---
name: time-tracking-workflow
description: Time tracking patterns for productivity analysis, billing accuracy, and focus optimization. Includes time blocking, pomodoro techniques, and analytics.
origin: productivity-expert
version: 1.0.0
---

# Time Tracking Workflow

A systematic approach to tracking, analyzing, and optimizing how you spend your time for increased productivity and better work-life balance.

## When to Activate

- Setting up new time tracking system
- Analyzing productivity patterns
- Preparing accurate client bills
- Identifying time wasters
- Improving focus and concentration
- Planning realistic estimates
- Conducting retrospectives

## Core Tracking Methods

### 1. Activity Logging

```yaml
entry:
  timestamp: "2024-01-15T09:30:00Z"
  activity: "Code review - Auth module"
  category: "development"
  project: "client-portal"
  duration_minutes: 45
  tags: ["review", "security"]
  interrupted: false
  notes: "Found XSS vulnerability in login"
```

### 2. Time Blocking

```
┌─────────────────────────────────────────┐
│ 09:00 - 10:30  │ Deep Work: Feature Y   │
│ (90 min block) │ No meetings, phone off  │
├─────────────────────────────────────────┤
│ 10:30 - 11:00  │ Email & Communications │
├─────────────────────────────────────────┤
│ 11:00 - 12:30  │ Deep Work: Testing      │
├─────────────────────────────────────────┤
│ 12:30 - 13:30  │ LUNCH BREAK            │
├─────────────────────────────────────────┤
│ 13:30 - 15:00  │ Meetings               │
├─────────────────────────────────────────┤
│ 15:00 - 17:00  │ Deep Work: Code         │
└─────────────────────────────────────────┘
```

### 3. Pomodoro Technique

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  25min  │ →   │  5min   │ →   │  25min  │
│ FOCUS   │     │ BREAK   │     │ FOCUS   │
└─────────┘     └─────────┘     └─────────┘
                                         │
┌─────────────────────────────────────────┴─────┐
│              LONGER BREAK (15-30 min)          │
│         After 4 pomodoros                       │
└────────────────────────────────────────────────┘
```

## Tracking Categories

### Work Categories

| Category | Examples | Billing |
|----------|----------|--------|
| Development | Coding, debugging, refactoring | Yes |
| Meetings | Standups, planning, reviews | Depends |
| Code Review | PR reviews, pair programming | Yes |
| Documentation | READMEs, docs, wikis | Yes |
| Communication | Slack, email, sync | Partial |
| Admin | Invoicing, reports, planning | No |
| Learning | Training, research, exploring | Partial |

### Time Analysis Dimensions

```
Total Time
  ├── Productive (deep work)
  ├── Neutral (necessary overhead)
  └── Wasted (interruptions, distractions)

By Project
  ├── Revenue-generating
  ├── Internal tools
  └── Maintenance

By Energy
  ├── High-focus tasks
  └── Low-focus tasks
```

## Productivity Analysis

### Focus Ratio

```
Focus Ratio = Deep Work Time / Total Work Time

Target: > 60%
Good: 50-60%
Needs Improvement: < 50%
```

### Context Switching Cost

| Switch Type | Recovery Time | Daily Limit |
|-------------|---------------|-------------|
| Task switch within project | 5-10 min | Unlimited |
| Project switch | 15-25 min | 4-5 max |
| Deep ↔ Shallow switch | 20-30 min | 2-3 max |
| Complete interruption | 1+ hour | 1-2 max |

### Weekly Pattern Analysis

```markdown
## Time Distribution (Average Week)

Development:    ████████████████░░░░  55%
Meetings:       ██████░░░░░░░░░░░░░  20%
Email/Slack:    ████░░░░░░░░░░░░░░░  12%
Admin:          ██░░░░░░░░░░░░░░░░░   8%
Learning:       ██░░░░░░░░░░░░░░░░░   5%
```

## Best Practices

### Accurate Tracking

1. **Track immediately** - Don't rely on memory
2. **Be specific** - "Meeting" vs "Q4 planning review with eng team"
3. **Note interruptions** - Track context switches
4. **Mark multi-tasking** - Split time when needed
5. **Review daily** - Catch gaps and errors early

### Automation Triggers

```yaml
git_commit:          # Auto-log development time
calendar_event:      # Log meeting duration
ide_active:          # Track focus time
slack_away:          # Pause tracking
```

## Time Tracking Tools

| Tool | Best For | Key Features |
|------|----------|--------------|
| Toggl | General use | One-click, reports |
| RescueTime | Passive | Auto-categorization |
| Clockify | Teams | Free, integrations |
| Harvest | Billing | Invoicing, estimates |
| Timing | Mac power users | Automatic categories |

## Anti-Patterns

| Mistake | Impact | Fix |
|---------|--------|-----|
| Retroactive logging | Inaccurate data | Track in real-time |
| No categories | Can't analyze | Define clear categories |
| Overly granular | Tracking fatigue | Simplify to 4-6 categories |
| Ignoring results | No improvement | Review weekly |
| Perfectionism | Abandonment | Good enough > none |

## Reporting Templates

### Daily Log
```markdown
## 2024-01-15

| Time | Activity | Project | Notes |
|------|----------|---------|-------|
| 09:00 | Deep work | X | Feature implementation |
| 10:30 | Break | - | Coffee, stretch |
| 10:45 | Deep work | X | Continued |
| 12:00 | Lunch | - | |
```

### Weekly Summary
```markdown
## Week of Jan 15-19

Total Hours: 42.5
Target: 40

By Category:
- Development: 23h (54%)
- Meetings: 8h (19%)
- Communication: 5h (12%)
- Admin: 4h (9%)
- Learning: 2.5h (6%)

Focus Ratio: 54% (target: 60%)
Interruptions: 12 (avg: 2.4/day)
Deep Work Blocks: 8
```

---

*Track it, analyze it, optimize it.*