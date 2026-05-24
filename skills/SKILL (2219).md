---
name: onboarding-process-design
description: Onboarding guides, checklists, and workflow design patterns for integrating new team members, customers, or systems with clarity and measurable outcomes.
origin: MCP Market
---

# Onboarding Process Design

Design onboarding experiences that get people (or systems) productive fast, reduce anxiety, and set clear expectations from day one.

## When to Activate

- Designing onboarding for new hires
- Creating customer onboarding flows
- Building system provisioning checklists
- Setting up buddy/mentor programs
- Creating role-specific onboarding guides
- Auditing existing onboarding for gaps

## Onboarding Types

### Type Matrix

| Type | Audience | Duration | Owner |
|------|----------|----------|-------|
| Employee | New hires | 30-90 days | People Ops |
| Customer | New users | 1-14 days | Customer Success |
| System | DevOps provisioning | Hours | SRE/DevOps |
| Partner | External integrators | 7-30 days | Partnerships |

### Decision Framework

```
What is being onboarded?
│
├── Human (employee, customer)
│   ├── High-touch → Dedicated success manager
│   └── Self-serve → Checklist + documentation
│
└── System (service, component)
    ├── Critical path → Automated provisioning + runbook
    └── Exploratory → Optional, well-documented
```

## Employee Onboarding

### 30-60-90 Day Framework

```markdown
# Engineering Onboarding — 30/60/90 Plan

## 30 Days: Learn

### Week 1: Orient
- [ ] Complete HR paperwork
- [ ] Set up workstation and accounts
- [ ] Meet your manager for 1:1
- [ ] Meet your buddy
- [ ] Attend company all-hands
- [ ] Complete security training
- [ ] Read: Engineering Handbook (link)

### Week 2: Context
- [ ] Shadow a sprint planning meeting
- [ ] Shadow a code review session
- [ ] Read architecture docs
- [ ] Set up local development environment
- [ ] Make your first PR (even if small)
- [ ] Meet with 3 team members (informational interviews)

### Week 3-4: Contribute
- [ ] Pick up a "good first issue"
- [ ] Complete first feature PR (with review)
- [ ] Attend all team ceremonies
- [ ] Learn the deployment pipeline
- [ ] 1:1 with manager: feedback check-in

### 30 Day Checkpoint
- Manager review: goals alignment, role clarity
- Buddy feedback: integration, questions

---

## 60 Days: Contribute

### Focus Areas
- Owning complete features with guidance
- Participating actively in design discussions
- Building relationships across teams
- Learning codebase conventions

### Milestones
- [ ] Completed 2+ features independently
- [ ] Participated in architecture decision
- [ ] Presented something at engineering sync
- [ ] Cross-team collaboration initiated

### 60 Day Checkpoint
- Manager review: performance, growth areas
- Self-assessment: confidence, clarity

---

## 90 Days: Own

### Focus Areas
- Independent work with minimal guidance
- Mentoring newer teammates
- Identifying improvements to processes
- Contributing to team planning

### Milestones
- [ ] Led a feature from design to deploy
- [ ] Proposed a process improvement
- [ ] Conducted a code review
- [ ] Mentored a newer teammate

### 90 Day Checkpoint
- Performance review: full role expectations
- Goal setting: next quarter objectives
```

### Role-Specific Onboarding

```markdown
# Engineering Manager Onboarding

## Pre-Day 1
- [ ] Send welcome email with start details
- [ ] Prepare laptop, accounts, access
- [ ] Schedule week-1 meetings (team 1:1s, skip-levels)
- [ ] Assign onboarding buddy (another manager)
- [ ] Send team intro email

## Day 1
- [ ] Office tour, introductions
- [ ] HR paperwork, benefits enrollment
- [ ] Meet with manager: role clarity, expectations
- [ ] Meet with buddy: managerial perspective
- [ ] Set up all accounts and tools

## Week 1
- [ ] 1:1 with each direct report (30 min each)
- [ ] Attend all team ceremonies
- [ ] Shadow 1:1s between manager-buddy and reports
- [ ] Review team documentation and history
- [ ] Meet cross-functional partners (product, design, ops)
- [ ] First 1:1 with manager: concerns, questions

## Month 1
- [ ] Lead a team ceremony (standup, planning)
- [ ] Conduct first performance conversation
- [ ] Review team OKRs and roadmap
- [ ] Identify quick wins for the team
- [ ] 30-day manager review

---

# Individual Contributor Onboarding

## Pre-Day 1
- [ ] Welcome email with start details
- [ ] Send buddy intro email
- [ ] Prepare laptop, accounts, access
- [ ] Assign starter project

## Day 1
- [ ] Office tour, team introductions
- [ ] HR paperwork, benefits
- [ ] Set up workstation
- [ ] Meet buddy (30 min, informal)
- [ ] Environment setup: follow local dev guide

## Week 1
- [ ] Local dev environment working
- [ ] First PR merged (docs, config, or small fix)
- [ ] Meet team members (1:1 coffee chats)
- [ ] Attend all ceremonies
- [ ] 1:1 with manager: background, goals

## Month 1
- [ ] Own a complete feature (with code review)
- [ ] Understand deployment pipeline
- [ ] Know where to find help (docs, Slack, buddy)
- [ ] 30-day manager review: feedback, adjustments
```

## Customer Onboarding

### Onboarding Funnel

```
New Signup
    │
    ▼
┌──────────────────────────────────────────────────────┐
│  Welcome                                            │
│  • Confirmation email with next steps               │
│  • Video: Product overview (3 min)                  │
│  • Link: Quick start guide                          │
└──────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────┐
│  Setup                                              │
│  • Create first workspace                           │
│  • Connect integration (Slack, GitHub)               │
│  • Invite first teammate                            │
│  • Set up first [project, pipeline, store]          │
└──────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────┐
│  Activate (Aha! moment)                             │
│  • Complete first core workflow                     │
│  • Send first [message, deploy, payment, order]     │
│  • This varies by product type                      │
└──────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────┐
│  Expand                                             │
│  • Add more users                                   │
│  • Enable additional features                       │
│  • Complete onboarding survey                      │
└──────────────────────────────────────────────────────┘
```

### Customer Onboarding Checklist

```markdown
# Customer Onboarding Checklist

## Account Setup (Complete within 1 hour)
- [ ] Confirm email address
- [ ] Set up company profile
- [ ] Configure billing (trial or paid)
- [ ] Set notification preferences

## Integrations (Complete within 24 hours)
- [ ] Connect GitHub / GitLab / Bitbucket
- [ ] Connect Slack workspace
- [ ] Import existing data (if migrating)

## Core Setup (Complete within 48 hours)
- [ ] Create first workspace/project
- [ ] Set up user roles and permissions
- [ ] Configure first pipeline or workflow
- [ ] Run first test deployment

## Team Invites (Complete within 1 week)
- [ ] Invite team members
- [ ] Assign roles based on responsibilities
- [ ] Complete team onboarding session

## Launch (Complete within 2 weeks)
- [ ] First production deployment
- [ ] Team trained on advanced features
- [ ] Onboarding survey completed
- [ ] Success manager check-in
```

## System Onboarding

### Provisioning Runbook Template

```markdown
# Service Onboarding Runbook

## Prerequisites
- AWS account with admin access
- Terraform >= 1.5
- kubectl configured for target cluster
- Access to secrets manager

## Provisioning Steps

### 1. Infrastructure Setup
```bash
# Clone the infrastructure repo
git clone git@github.com:org/infrastructure.git
cd infrastructure

# Create environment config
cp env/staging.tfvars env/prod.tfvars
# Edit env/prod.tfvars with service-specific values

# Plan and apply
terraform plan -var-file=env/prod.tfvars -out=prod.tfplan
terraform apply prod.tfplan
```

### 2. DNS Configuration
- [ ] Create Route53 record: `service.example.com`
- [ ] Point to ALB endpoint
- [ ] Enable TLS certificate
- [ ] Wait for propagation (TTL: 300s)

### 3. Secrets Setup
- [ ] Add to secrets manager:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `API_KEY_PRODUCTION`
  - `SENTRY_DSN`
- [ ] Update IAM policies if needed
- [ ] Verify secrets accessible from pods

### 4. Deploy Initial Version
```bash
# Build and push Docker image
docker build -t 123456789.dkr.ecr.us-east-1.amazonaws.com/service:1.0.0 .
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/service:1.0.0

# Apply Kubernetes manifests
kubectl apply -f k8s/production/

# Verify deployment
kubectl rollout status deployment/service -n production
```

### 5. Verification
- [ ] Health check: `curl https://service.example.com/health`
- [ ] Metrics visible in Datadog
- [ ] Logs flowing to CloudWatch
- [ ] Alerts configured
- [ ] Runbook linked in PagerDuty

## Rollback Procedure
```bash
# Rollback to previous deployment
kubectl rollout undo deployment/service -n production

# Rollback infrastructure
terraform apply -var-file=env/prod.tfvars -target=module.service -out=rollback.tfplan
```
```

## Onboarding Metrics

### Metrics Framework

```yaml
metrics:
  employee:
    time_to_productivity:
      definition: "Days until first merged PR"
      target: "< 14 days"
      measure: "GitHub / HR system"

    completion_rate:
      definition: "30-day checklist completion"
      target: "> 90%"
      measure: "HR system"

    ramp_survey:
      definition: "Manager + new hire survey score"
      target: "> 4.0/5.0"
      measure: "Quarterly survey"

    attrition_90d:
      definition: "New hire attrition within 90 days"
      target: "< 5%"
      measure: "HR system"

  customer:
    time_to_aha:
      definition: "Hours until Aha! moment"
      target: "< 4 hours"
      measure: "Product analytics"

    activation_rate:
      definition: "% completing core workflow in 7 days"
      target: "> 40%"
      measure: "Product analytics"

    onboarding_completion:
      definition: "% completing onboarding checklist"
      target: "> 60%"
      measure: "CS platform"

    churn_30d:
      definition: "Churn within first 30 days"
      target: "< 10%"
      measure: "Billing system"
```

### Onboarding Funnel Analysis

```python
# Analyze onboarding funnel
import pandas as pd
from datetime import timedelta

def analyze_onboarding_funnel(signups: pd.DataFrame, events: pd.DataFrame) -> dict:
    """Calculate conversion at each onboarding stage."""

    stages = [
        ("signup", lambda df: df["created_at"].notna()),
        ("email_confirmed", lambda df: df["email_confirmed_at"].notna()),
        ("first_login", lambda df: df["first_login_at"].notna()),
        ("workspace_created", lambda df: df["workspace_created_at"].notna()),
        ("integration_connected", lambda df: df["integration_connected_at"].notna()),
        ("activated", lambda df: df["activated_at"].notna()),
    ]

    results = {}
    for stage_name, filter_fn in stages:
        count = signups.merge(events, on="user_id").pipe(filter_fn).shape[0]
        results[stage_name] = {
            "count": count,
            "rate": count / signups.shape[0]
        }

    return results

def measure_time_to_aha(signups: pd.DataFrame, events: pd.DataFrame) -> pd.Series:
    """Measure hours from signup to Aha! moment."""
    merged = signups.merge(events, on="user_id")

    return (
        (merged["activated_at"] - merged["created_at"])
        .dt.total_seconds() / 3600  # Convert to hours
        .describe(percentiles=[0.5, 0.75, 0.9, 0.95])
    )
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Assign an onboarding buddy | Reduces anxiety, accelerates cultural integration |
| Clear 30/60/90 milestones | Sets expectations, creates momentum |
| Automate provisioning | Reduces toil, ensures consistency |
| Measure time-to-productivity | If you don't measure, you can't improve |
| Onboarding is a product | UX matters; test and iterate |
| Pre-flight checklists | Prevent day-one surprises |
| Regular check-ins | Catch issues before they become problems |
| Document the onboarding | Process clarity benefits both parties |

## Common Pitfalls

```
Pitfall: "Onboarding is one-size-fits-all"
Fix: Role-specific tracks with different milestones

Pitfall: "Set up once, forget it"
Fix: Review onboarding quarterly; update for team/org changes

Pitfall: "No way to track progress"
Fix: Use a tracking tool; don't leave it to memory

Pitfall: "Onboarding buddy is underutilized"
Fix: Train buddies; give them a structured agenda

Pitfall: "Too much information day 1"
Fix: Spread content across 30 days; respect cognitive load

Pitfall: "No feedback loop"
Fix: Survey new hires/customers at 30/60/90 days; iterate
```

## Related Skills

- `training-material-creation` — training content and curricula
- `wikis-knowledge-management` — wiki-based onboarding docs
- `onboarding-process-design` — onboarding checklists and workflows
- `task-management` — task tracking for onboarding milestones
- `changelog-management` — documenting onboarding process changes
