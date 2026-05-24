---
name: project-management-workflow
description: Project management patterns including planning, estimation, risk management, stakeholder communication, and delivery workflows.
origin: project-management
version: 1.0.0
---

# Project Management Workflow

A comprehensive framework for planning, executing, and delivering projects successfully while managing constraints and stakeholder expectations.

## When to Activate

- Starting a new project
- Planning sprints or milestones
- Risk assessment and mitigation
- Stakeholder communication
- Scope changes and prioritization
- Project retrospectives
- Delivery planning

## Project Lifecycle

### Phases

```
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ DISCOVER│→│  PLAN   │→│ EXECUTE │→│ MONITOR │→│ DELIVER │
│         │  │         │  │         │  │         │  │         │
│ Define  │  │ Roadmap │  │ Build   │  │ Track   │  │ Release │
│ scope   │  │ Estimate│  │ Ship    │  │ Adapt   │  │ Handoff │
└─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘
```

### Phase Gate Review

| Phase | Gate Criteria | Approver |
|-------|---------------|----------|
| Discover | Requirements clear, stakeholders aligned | PM + Lead |
| Plan | Estimates validated, resources confirmed | PM |
| Execute | Quality gates passed, tests passing | Tech Lead |
| Monitor | KPIs on track, risks managed | PM + Stakeholders |
| Deliver | UAT signed off, docs complete | Product + Release |

## Project Charter

### Template

```markdown
# Project Charter: [Project Name]

**Version:** 1.0 | **Date:** YYYY-MM-DD
**Sponsor:** @person | **Project Manager:** @person
**Status:** Active

## 1. Business Objective
[Why are we doing this? What problem does it solve?]

## 2. Scope

### In Scope
- Feature A
- Feature B

### Out of Scope
- Feature C
- Integration with system X

## 3. Success Criteria
| Metric | Target | Measurement |
|--------|--------|-------------|
| Adoption | 50% users in 30 days | Analytics |
| Performance | <200ms response | APM tool |
| Quality | <1% error rate | Monitoring |

## 4. Timeline
- Phase 1: YYYY-MM-DD to YYYY-MM-DD
- Phase 2: YYYY-MM-DD to YYYY-MM-DD
- Launch: YYYY-MM-DD

## 5. Budget
| Category | Allocated | Spent | Variance |
|----------|-----------|-------|----------|
| Development | $X | $Y | Z% |
| Infrastructure | | | |
| Training | | | |

## 6. Team
| Role | Person | Commitment |
|------|--------|------------|
| Lead | @person | 100% |
| Dev 1 | @person | 80% |
| QA | @person | 50% |

## 7. Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| | H/M/L | H/M/L | |

## 8. Stakeholders
| Stakeholder | Interest | Influence | Communication |
|--------------|----------|-----------|----------------|
| @person | High | High | Weekly |
```

## Planning & Estimation

### Estimation Techniques

#### Planning Poker

```
Team members hold cards: 0, 1, 2, 3, 5, 8, 13, 20, 40, 100

1. Product Owner reads story
2. Clarifying questions
3. Each member selects card privately
4. Reveal simultaneously
5. Discuss outliers (high/low)
6. Re-estimate until consensus
```

#### Three-Point Estimation

```
E = (O + 4M + P) / 6

Where:
- O = Optimistic estimate
- M = Most likely estimate
- P = Pessimistic estimate

Variance = (P - O) / 6
```

#### T-Shirt Sizing

| Size | Story Points | Time (example) | Description |
|------|--------------|-----------------|-------------|
| XS | 1 | 1-2 hours | Trivial |
| S | 2 | 2-4 hours | Simple |
| M | 5 | 1-2 days | Medium complexity |
| L | 8 | 3-5 days | Complex |
| XL | 13 | 1-2 weeks | Very complex |
| XXL | 21 | 2-4 weeks | Epic |

### Capacity Planning

```yaml
sprint_capacity:
  team: 5 developers
  hours_per_person: 6 (of 8)
  total_hours: 30
  
  deductions:
    meetings: 3 hours
    code_review: 2 hours
    admin: 1 hour
  
  available: 24 hours
  
  velocity_history:
    last_5_sprints: [26, 24, 28, 22, 27]
    average: 25.4
    prediction: 24-26
    
  commitment: 24 points (conservative)
```

## Risk Management

### Risk Matrix

```
Impact
  ↑
  │  1(low)   2(med)   3(high)   4(critical)
  │
H │  Medium   High    Critical   Critical
  │
M │   Low     Medium    High      Critical
  │
L │   Low      Low     Medium     High
  │
  └──────────────────────────────────► Likelihood
```

### Risk Response Strategies

| Risk Type | Avoid | Mitigate | Transfer | Accept |
|-----------|-------|----------|----------|--------|
| Technical | Cancel | POC early | Insurance | Buffer |
| Resource | Cross-train | Backup | Contractors | Overtime |
| Schedule | Scope cut | Add buffer | Partial delivery | Compress |
| Quality | Different approach | QA focus | SLA contract | UAT phase |

### Risk Log

```yaml
risk:
  id: "RSK-001"
  title: "Third-party API instability"
  category: "technical"
  impact: "high"
  likelihood: "medium"
  status: "active"
  response: "mitigate"
  mitigation: "Implement circuit breaker, fallback to cache"
  contingency: "Use mock data, prioritize local-first"
  owner: "@person"
  review_date: "2024-02-01"
  created: "2024-01-15"
```

## Stakeholder Management

### Stakeholder Mapping

```
    Influence
        ↑
        │  KEEP SATISFIED  │   MANAGE CLOSELY
        │   (low influence,│   (high influence,
        │    high interest)│    high interest)
        │                   │
        ├───────────────────┼───────────────────→ Interest
        │   MONITOR         │   KEEP INFORMED
        │   (low influence, │   (high influence,
        │    low interest)  │    low interest)
        │
```

### Communication Plan

| Audience | Frequency | Channel | Content |
|----------|-----------|---------|---------|
| Sponsor | Weekly | Email | Status summary, decisions |
| Team | Daily | Standup | Progress, blockers |
| Stakeholders | Bi-weekly | Meeting | Demo, updates |
| Execs | Monthly | Deck | High-level progress, risks |

### Status Report Template

```markdown
# Status Report - Week of YYYY-MM-DD

## Project: [Name]
**PM:** @person | **Period:** Jan 15-19

## Overall Status: 🟢 Green / 🟡 Yellow / 🔴 Red

## Progress
- Completed this week
- Key milestones reached

## Scope
- In scope items: X
- Out of scope items: Y
- Scope changes: None / [Describe]

## Schedule
| Milestone | Original | Current | Variance |
|-----------|----------|---------|----------|
| Phase 1 | Jan 31 | Jan 31 | On track |
| Launch | Mar 15 | Mar 20 | +5 days |

## Budget
| Category | Budget | Spent | Remaining |
|----------|--------|-------|-----------|
| Total | $X | $Y | Z |

## Risks & Blockers
| Risk | Status | Mitigation |
|------|--------|------------|

## Upcoming
- Next week priorities
- Key decisions needed

## Decisions Made
- [List recent decisions]
```

## Scope Management

### Change Request Process

```
┌─────────────────────────────────────────┐
│         CHANGE REQUEST                  │
│  ID: CR-001 | Submitted: YYYY-MM-DD     │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         IMPACT ANALYSIS                 │
│  - Scope change                         │
│  - Schedule impact                      │
│  - Budget impact                        │
│  - Resource impact                      │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         DECISION                         │
│  - Approve: Incorporate into plan       │
│  - Defer: Backlog for future             │
│  - Reject: Document rationale            │
└─────────────────────────────────────────┘
```

### Scope Creep Indicators

| Early Warning | Action |
|---------------|--------|
| "Just one more thing..." | Document, assess, decide |
| Undocumented additions | Require CR process |
| Expanding acceptance criteria | Lock scope, create new |
| "This should be quick" | Full estimation always |

## Delivery Workflow

### Release Criteria

```yaml
release_criteria:
  functional:
    - "All acceptance criteria met"
    - "No P0/P1 bugs open"
    - "Smoke tests passing"
    
  non_functional:
    - "Performance within SLA"
    - "Security scan clean"
    - "Accessibility compliant"
    
  process:
    - "Documentation updated"
    - "Training materials ready"
    - "Support team briefed"
```

### Handoff Checklist

- [ ] Code merged and tagged
- [ ] Release notes written
- [ ] Deployment verified in staging
- [ ] Rollback plan documented
- [ ] Monitoring in place
- [ ] Runbook reviewed
- [ ] Support team trained
- [ ] Post-launch support scheduled

## Metrics & KPIs

### Project Health Dashboard

| Metric | Target | Current | Trend |
|--------|--------|---------|-------|
| Schedule variance | < 10% | 5% | ↑ |
| Budget variance | < 5% | 2% | → |
| Quality (bug rate) | < 1% | 0.8% | ↓ |
| Team morale | > 4/5 | 4.2/5 | → |
| Scope completion | On track | On track | → |

---

*Plan thoroughly, execute adaptively, deliver reliably.*