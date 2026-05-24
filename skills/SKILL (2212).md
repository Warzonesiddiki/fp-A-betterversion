---
name: sre-site-reliability-engineering
description: Site Reliability Engineering practices including SLOs, error budgets, toil reduction, reliability engineering, and building sustainable systems.
origin: https://sre.google/sre-book/table-of-contents/
---

# Site Reliability Engineering

## Core Philosophy

SRE balances reliability with feature velocity. Error budgets replace error rates as success metrics.

## Service Level Objectives

### SLO Definition
```yaml
slos:
  - name: api-availability
    description: "API endpoint availability"
    target: 99.9%
    window: 30d
    sli:
      type: availability
      good: http_responses{status=~"2.."}
      total: http_responses_total

  - name: api-latency
    description: "API response time under 500ms"
    target: 99.5%
    window: 7d
    sli:
      type: latency
      threshold: 500
      good: http_request_duration_seconds_bucket{le="0.5"}
      total: http_requests_total
```

### Error Budget Policy
```yaml
error_budget:
  name: api-availability
  target: 99.9%
  budget: 0.1% # 43.83 minutes/month
  
  policy:
    - tier: healthy
      budget_remaining: > 50%
      action: Normal feature development
      
    - tier: warning
      budget_remaining: 25-50%
      action: Feature freeze, reliability work
      
    - tier: critical
      budget_remaining: < 25%
      action: Emergency reliability sprint
      
    - tier: exhausted
      budget_remaining: 0%
      action: Full stop, only reliability allowed
```

## Toil Reduction

### Identifying Toil
Characteristics:
- Manual, repetitive, automatable
- No enduring value
- Scales linearly with service growth

### Toil Metrics
```yaml
toil_tracking:
  monthly_hours:
    - category: manual_deployments
      hours: 24
      owner: platform
      
    - category: incident_responses
      hours: 16
      owner: sre
      
    - category: certificate_renewals
      hours: 8
      owner: infra
      
  target: < 50% of engineering time on toil
```

### Toil Elimination Playbook
1. Document current manual process
2. Identify repetition patterns
3. Automate one step at a time
4. Measure improvement
5. Iterate

## SLO Calculator

### Availability Targets
| Target | Downtime/Month | Downtime/Year |
|--------|----------------|---------------|
| 99%    | 7.3 hours      | 3.65 days     |
| 99.9%  | 43.8 minutes   | 8.76 hours    |
| 99.99% | 4.38 minutes   | 52.6 minutes  |
| 99.999%| 26.3 seconds   | 5.26 minutes  |

### Error Budget Burn Rate
```promql
# Burn rate over 1 hour (should be < 1)
error_burn_rate_1h = error_rate_1h / error_budget_fraction_1h

# Multi-window burn rate alert
alert: ErrorBudgetBurn
  expr: |
    (
      sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
      / (1 - 0.999)
    ) > 14.4
  for: 1h
  labels:
    severity: warning
```

## Reliability Patterns

### SLI Design
```yaml
slis:
  request_based:
    - name: http-requests
      description: "Count of successful HTTP requests"
      success_criteria: "status >= 200 and < 500"
      
    - name: grpc-requests
      description: "Count of successful gRPC requests"
      success_criteria: "status == OK"
      
  resource_based:
    - name: memory-saturation
      description: "Memory usage below threshold"
      success_criteria: "memory_used < 90% of limit"
```

### Runbooks
```markdown
# SLO Breach Runbook

## Trigger
Error budget burning at >3x rate for 1 hour

## Immediate Actions
1. Page on-call engineer
2. Create incident channel
3. Post status page update

## Diagnosis
1. Check deployment timeline
2. Review recent changes
3. Analyze error patterns
4. Check dependency health

## Mitigation Options
1. Rollback recent deployment
2. Enable feature flag
3. Scale horizontally
4. Failover to backup region

## Post-Incident
1. Document timeline
2. Identify root cause
3. Create action items
4. Update SLO documentation
```

## Reliability Engineering Lifecycle

```yaml
phases:
  design:
    - define SLIs from user journeys
    - set achievable SLOs
    - document error budget policy
    
  build:
    - implement SLI instrumentation
    - create alerting rules
    - build dashboards
    
  operate:
    - monitor error budgets
    - respond to incidents
    - conduct chaos engineering
    
  improve:
    - identify toil
    - automate manual work
    - refine SLOs based on data
```

## Chaos Engineering

### Principles
1. Start with blast radius awareness
2. Hypothesize before experiments
3. Automate experiments
4. Measure steady state

### Experiment Template
```yaml
experiment:
  name: service-kill
  description: "Kill pod to test recovery"
 steady_state:
  - metric: http_requests_success_rate
    threshold: > 95%
  method:
    - action: delete_pod
      target: random_pod
  validation:
    - verify: auto_restart
      timeout: 60s
    - verify: requests_recover
      timeout: 120s
```

## Best Practices

1. **SLO-driven development**: Feature work vs reliability work
2. **Error budgets over thresholds**: Focus on user impact
3. **Reduce toil systematically**: Automate repetitive tasks
4. **On-call as engineering**: Not support work, feature of system design
5. **Blameless postmortems**: Learn from failures
6. **TOIL/FE ratio**: Target <50% toil for senior engineers