---
name: incident-management-oncall
description: Incident management and on-call practices including severity classification, escalation policies, war room procedures, and post-mortems.
origin: https://www.pagerduty.com/resources/learn/incident-response/
---

# Incident Management & On-Call

## Incident Lifecycle

```yaml
phases:
  detection:
    - automated_monitoring
    - customer_report
    - internal_observation
    
  declaration:
    - assign_severity
    - page_on_call
    - create_incident_channel
    
  response:
    - diagnose
    - mitigate
    - resolve
    
  followup:
    - postmortem
    - action_items
    - prevention
```

## Severity Classification

### Severity Levels
```yaml
severity:
  sev1:
    name: "P1 - Critical"
    definition: "Complete service outage or data loss affecting all users"
    response_time: 5 minutes
    escalation: Immediate L1 → L2 → L3 → VP Engineering
    
  sev2:
    name: "P2 - High"
    definition: "Major feature broken affecting significant user segment"
    response_time: 15 minutes
    escalation: L1 → L2 → L3
    
  sev3:
    name: "P3 - Medium"
    definition: "Minor feature broken or degradation without workaround"
    response_time: 1 hour
    escalation: L1 → L2 (async if off-hours)
    
  sev4:
    name: "P4 - Low"
    definition: "Minor issue with workaround available"
    response_time: 4 hours
    escalation: L1 only
```

### Severity Decision Tree
```
Is service completely unavailable?
  YES → SEV1
  NO
    ↓
Are >25% of users impacted?
  YES → SEV2
  NO
    ↓
Is there a workaround available?
  YES → SEV4
  NO → SEV3
```

## On-Call Setup

### Rotation Configuration
```yaml
oncall:
  rotation:
    primary:
      - engineer: alice
        schedule: week_A
      - engineer: bob
        schedule: week_B
        
    secondary:
      - engineer: charlie
        schedule: week_A
      - engineer: diana
        schedule: week_B
        
  escalation:
    - trigger: no_acknowledge
      after: 5 minutes
      action: page_secondary
      
    - trigger: no_resolve
      after: 30 minutes
      action: page_lead
      
    - trigger: sev1_unresolved
      after: 1 hour
      action: page_vp_engineering
```

### On-Call Responsibilities
```markdown
## Primary On-Call Duties

### Immediate (0-5 min)
- Acknowledge alerts within 5 minutes
- Assess severity and declare incident if needed
- Post initial status in incident channel

### Triage (5-15 min)
- Investigate root cause
- Engage relevant expertise
- Update stakeholders

### Resolution (ongoing)
- Drive to resolution
- Document timeline
- Communicate updates every 15 min for SEV1/2

### Handoff
- Clearly communicate status
- Ensure continuity of investigation
- Never leave incident uncovered
```

## Incident Response Process

### War Room Setup
```markdown
# SEV1 Incident Channel Template

## Incident: [Brief Description]
**Severity**: P1
**Started**: [Timestamp]
**Status**: INVESTIGATING

## War Room
- Incident Commander: @name
- Tech Lead: @name
- Comms Lead: @name
- Liaison: @name (external stakeholders)

## Timeline
| Time | Action |
|------|--------|
| HH:MM | Alert triggered |
| HH:MM | On-call acknowledged |
| HH:MM | Incident declared |
| HH:MM | [Action taken] |
| HH:MM | [Mitigation applied] |

## Impact
- Users affected: [Number/Percentage]
- Services affected: [List]
- Business impact: [Description]

## Current Status
[Brief description of current state]

## Next Steps
- [ ] [Action]
- [ ] [Action]
```

### Communication Templates

#### Initial Notification
```markdown
## 🚨 INCIDENT DECLARED

**What**: [Brief description]
**Severity**: P1/P2
**Impact**: [Who/what is affected]
**Started**: [Time]

Incident channel: #inc-[date]-[brief-name]
Status page: [Link]

Investigating. Next update in 15 minutes.
```

#### Update Template
```markdown
## 📋 UPDATE [HH:MM]

**Status**: INVESTIGATING → MITIGATING → RESOLVING
**Progress**: [What has been tried]
**Current hypothesis**: [Working theory]
**Next action**: [What is happening next]
**ETA to resolution**: [Estimate]

Impact unchanged/increasing/decreasing
```

#### Resolution Notice
```markdown
## ✅ RESOLVED [HH:MM]

**Duration**: [X hours Y minutes]
**Root cause**: [Brief explanation]
**Mitigation**: [What was done]

Full post-mortem scheduled for [Date].
```

## Post-Mortem Process

### Post-Mortem Template
```markdown
# Post-Mortem: [Incident Name]
**Date**: [Date]
**Severity**: P[X]
**Duration**: [Duration]
**Author**: [Name]

## Executive Summary
[2-3 sentence summary of what happened and impact]

## Impact
- Users affected: [Number]
- Revenue impact: [Estimate]
- SLA impact: [If applicable]

## Root Cause
[Detailed explanation of why it happened]

## Timeline
| Time | Event |
|------|-------|
| HH:MM | [Event] |
| HH:MM | [Event] |

## Detection & Response
- How detected: [Source]
- Time to detect: [Duration]
- Time to respond: [Duration]

## Contributing Factors
1. [Factor 1]
2. [Factor 2]

## Lessons Learned

### What went well
- [Positive observation]

### What went poorly
- [Negative observation]

## Action Items
| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| [Action] | @name | [Date] | P1 |
```

### Blameless Culture
- Focus on systems, not individuals
- Assume good intent
- Remove "who" from root cause analysis
- Look for systemic fixes

## On-Call Tools

### Alert Routing
```yaml
routing:
  severity_based:
    critical:
      - pagerduty_critical
      - slack_incident_channel
      - twilio_voice
      
    warning:
      - slack_alerts_channel
      - email_summary
      
  topic_based:
    database:
      - dba_oncall
      - database_channel
      
    infrastructure:
      - infra_oncall
      - platform_channel
```

### Runbook Structure
```yaml
runbooks:
  database_high_cpu:
    trigger: cpu_usage > 90% for 5m
    steps:
      - name: check_connections
        command: SELECT count(*) FROM pg_stat_activity;
        
      - name: identify_queries
        command: |
          SELECT pid, now() - pg_stat_activity.query_start AS duration, query
          FROM pg_stat_activity
          WHERE state != 'idle' AND query_start < now() - interval '5 minutes'
          
      - name: kill_slow_queries
        command: SELECT pg_terminate_backend(pid);
        
    escalation:
      not_resolved: 30m
      action: page_dba_lead
```

## Best Practices

1. **Rotate frequently**: Weekly or bi-weekly to prevent burnout
2. **Compensate fairly**: Pay for on-call availability and incidents
3. **Practice incidents**: Run game days quarterly
4. **Document everything**: Every runbook, every decision
5. **Minimal noise**: Only alert on actionable items
6. **Clear handoffs**: Never assume someone knows the status
7. **Customer focus**: Communicate externally, not just internally
8. **Review metrics**: Track MTTD, MTTR, alert volume