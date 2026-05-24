---
name: meeting-notes-automation
description: Meeting notes patterns including capture templates, action item tracking, decision logging, and automated follow-up workflows.
origin: productivity-expert
version: 1.0.0
---

# Meeting Notes Automation

A systematic approach to capturing, organizing, and acting on meeting output for productive follow-through.

## When to Activate

- Before, during, or after meetings
- Setting up recurring meeting notes templates
- Tracking action items across meetings
- Decision logging and auditing
- Weekly meeting summaries
- Creating meeting-free time

## Pre-Meeting Setup

### Agenda Template

```markdown
# Meeting: [Topic]
**Date:** YYYY-MM-DD | **Time:** HH:MM | **Duration:** X min
**Attendees:** @person1, @person2
**Facilitator:** @person
**Notekeeper:** @person

## Objectives
1. [ ] Decision on X
2. [ ] Update on Y
3. [ ] Brainstorm Z

## Agenda
| Time | Topic | Owner |
|------|-------|-------|
| 5min | Check-in | All |
| 15min | Main topic | @person |
| 10min | Discussion | @person |
| 5min | Action items | @person |

## Pre-reading
- [Link to relevant doc]
- [Link to relevant doc]

## Expected Outcomes
- Decision about X
- List of next steps
```

### Pre-Meeting Checklist

- [ ] Agenda sent 24+ hours ahead
- [ ] Pre-readings attached
- [ ] Time zone confirmed for all
- [ ] Video link working
- [ ] Relevant documents linked

## During-Meeting Capture

### Live Notes Template

```markdown
# Meeting Notes - [Topic]
**Date:** YYYY-MM-DD | **Started:** HH:MM | **Ended:** HH:MM

## Attendees
| Name | Role | Present |
|------|------|---------|
| @person1 | Lead | ✓ |
| @person2 | Member | ✓ |
| @person3 | Guest | ✗ |

## Discussion Summary

### Topic 1: [Title]
**Summary:**
- Point discussed
- Decision made (or deferred)

**Key Quotes:**
> "Relevant quote or insight"

### Topic 2: [Title]
**Summary:**
- Another topic

## Decisions Made
| ID | Decision | Rationale | Made By |
|----|----------|-----------|---------|
| D-001 | Use approach X | Faster to implement | @person1 |

## Action Items
| ID | Task | Owner | Due Date | Status |
|----|------|-------|----------|--------|
| A-001 | Implement feature X | @person2 | 2024-01-20 | Open |
| A-002 | Write specs for Y | @person3 | 2024-01-22 | Open |

## Parking Lot
- Topic to revisit later
- Topic outside scope

## Next Meeting
**Date:** YYYY-MM-DD
**Topics:** Topic A, Topic B
```

### Quick Capture Rules

```
SPEND 10 seconds at START: Write header (who, when, why)
SPEND 30 seconds per TOPIC: Note what happened
SPEND 10 seconds per DECISION: Mark it clearly
SPEND 10 seconds per ACTION: Note owner + due date
SPEND 5 minutes at END: Review and fill gaps
```

## Action Item Tracking

### Action Item Fields

```yaml
action_item:
  id: "AI-001"
  description: "Send updated timeline to stakeholders"
  owner: "@person"
  due_date: "2024-01-20"
  status: "in_progress"
  priority: "high"
  linked_meeting: "2024-01-15-weekly-sync"
  parent_goal: "Q1 OKR-42"
  created_at: "2024-01-15T10:30:00Z"
  completed_at: null
  blockers: []
```

### Status Workflow

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│  OPEN   │ →  │   WIP   │ →  │COMPLETED│
│         │    │         │    │         │
│ Not yet │    │ Started │    │ Done!   │
│ started │    │ working │    │ Shipped │
└─────────┘    └─────────┘    └─────────┘
     │              │
     │              ▼
     │         ┌─────────┐
     └───────► │ BLOCKED │
               │  Needs  │
               │  unblock│
               └─────────┘
```

### Follow-Up Reminders

| Timeframe | Action |
|-----------|--------|
| Day after | Send notes, flag overdue actions |
| 3 days | Check on items due soon |
| Due date | Prompt owner, escalate if needed |
| Week after | Review completion rate |

## Decision Logging

### Decision Record Template

```markdown
# Decision: [Title]

**Date:** YYYY-MM-DD
**Meeting:** [Link to meeting notes]
**Made By:** [Group/Individual]
**Status:** Accepted / Deprecated / Superseded

## Context
What problem are we solving?

## Options Considered
1. **Option A**
   - Pros: ...
   - Cons: ...

2. **Option B**
   - Pros: ...
   - Cons: ...

3. **Option C** (chosen)
   - Pros: ...
   - Cons: ...

## Decision
[What was decided]

## Rationale
Why this option over others?

## Consequences
### Positive
- ...

### Negative
- ...

## Review Date
YYYY-MM-DD (revisit if context changes)

## Status History
| Date | Status | Notes |
|------|--------|-------|
| YYYY-MM-DD | Accepted | Initial decision |
```

## Meeting Types & Templates

### Standup (15 min max)

```markdown
# Daily Standup - YYYY-MM-DD

## Yesterday
- @person1: Completed X, working on Y
- @person2: Finished feature Z
- @person3: Blocked on review

## Today
- @person1: Working on Y
- @person2: Starting feature A
- @person3: Unblocking review

## Blockers
- @person3: Needs review from @person4

## Notes
Any brief announcements
```

### Sprint Planning (2 hours max)

```markdown
# Sprint Planning - Sprint N

**Dates:** Start → End
**Capacity:** X story points

## Sprint Goal
[One sentence goal]

## Backlog Grooming
Items moved to sprint:
- [ ] Story 1 (X points)
- [ ] Story 2 (Y points)

## Commitment
Total: X points

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| | | |

## Definition of Done
- [ ] Code review
- [ ] Tests passing
- [ ] Deployed to staging
```

### Retrospective (1 hour)

```markdown
# Retrospective - Sprint N

**Date:** YYYY-MM-DD
**Format:** Start/Stop/Continue

## Start Doing
- [ ] Practice to adopt

## Stop Doing
- [ ] Practice to drop

## Continue Doing
- [ ] What's working well

## Action Items
| Action | Owner | Due |
|--------|-------|-----|
| | | |

## Metrics
| Metric | Last Sprint | This Sprint |
|--------|-------------|-------------|
| Velocity | X | Y |
| Satisfaction | Z | W |
```

## Automation Patterns

### Auto-Capture Tools

| Tool | Captures | Integration |
|------|----------|-------------|
| Otter.ai | Audio → text | Calendar, Slack |
| Fireflies.ai | Meeting transcription | Notion, CRMs |
| Fellow | Structured notes | Calendar |
| Hugo | Meeting notes | Notion |

### Workflow Automation

```yaml
meeting_complete_trigger:
  - capture_recording
  - transcribe_audio
  - generate_summary
  
post_meeting_actions:
  - send_notes_to_attendees
  - create_action_items_as_tasks
  - update_tracking_spreadsheet
  - schedule_follow_up_reminders
```

## Meeting Hygiene

### Anti-Patterns

| Anti-Pattern | Problem | Solution |
|---------------|---------|----------|
| No agenda | Unfocused, wasted time | Require agenda to schedule |
| No notes | Lost context | Assign notekeeper |
| Missing action owners | Nobody does it | Mandatory owner field |
| No due dates | No urgency | Default to 1 week |
| Not shared | Silos knowledge | Auto-distribute |

### Best Practices

```
✓  Start and end on time
✓  Have clear facilitator
✓  Assign notekeeper in advance
✓  End with action items + owners
✓  Distribute notes within 24 hours
✓  Review action items at next meeting
✓  Cancel if no agenda
✓  Shorter is better
```

## Metrics

| Metric | Target | Tracking |
|--------|--------|----------|
| Action completion | > 80% | By owner |
| Notes distributed | < 24 hours | Post-meeting |
| Meeting hours/week | < 10 hours | Calendar audit |
| Action item clarity | 100% have owner | Review notes |

---

*Capture it clearly, follow through reliably.*