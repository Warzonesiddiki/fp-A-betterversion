---
name: monitoring-observability
description: Monitoring and observability including metrics, logs, traces (the three pillars), alerting strategies, SLOs, and incident response.
origin: https://opentelemetry.io/docs/concepts/
---

# Monitoring and Observability

## The Three Pillars

### 1. Metrics
Quantitative measurements over time.

```yaml
# Prometheus metrics example
# Counter - tracks total requests
http_requests_total{status="200", method="GET"} 12345

# Gauge - current value
cpu_usage_percent 45.2

# Histogram - distribution
http_request_duration_seconds_bucket{le="0.1"} 100
http_request_duration_seconds_bucket{le="0.5"} 500
http_request_duration_seconds_bucket{le="+Inf"} 1000
```

### 2. Logs
Timestamped records of events.

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "error",
  "service": "api-gateway",
  "trace_id": "abc123",
  "message": "Request failed",
  "error": {
    "type": "TimeoutError",
    "stack": "..."
  }
}
```

### 3. Traces
Request paths through distributed systems.

```
Trace: abc123
  └─ Span: api-gateway (0ms - 250ms)
     └─ Span: auth-service (10ms - 50ms)
     └─ Span: user-service (60ms - 200ms)
        └─ Span: database (70ms - 150ms)
```

## Alerting Strategies

### SLO-Based Alerting
```yaml
# Error budget alerting
alerting:
  name: high-error-rate
  severity: critical
  slo: api-availability
  threshold: 80%
  window: 1h
  
# Multi-window alerts to prevent flapping
alert: HighCPUUsage
  expr: avg(node_cpu_usage) > 90 for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High CPU usage for 5 minutes"
```

### Alert Routing
```yaml
# PagerDuty integration
routes:
  - match:
      severity: critical
    route:
      - pd.create_incident
      - slack.critical_alerts
      
  - match:
      severity: warning
    route:
      - slack.warning_alerts
```

## Observability Patterns

### RED Method
- **Rate**: Requests per second
- **Errors**: Error rate percentage
- **Duration**: Response time distribution

### USE Method
- **Utilization**: Percentage of time resource is busy
- **Saturation**: How overloaded the resource is
- **Errors**: Error rate

## Common Metrics to Track

### Application
```promql
# Request rate
sum(rate(http_requests_total[5m]))

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) 
/ sum(rate(http_requests_total[5m]))

# Latency (p99)
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

### Infrastructure
```promql
# CPU usage
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))

# Disk usage
100 * (node_filesystem_size_bytes{mountpoint="/"} 
     - node_filesystem_avail_bytes{mountpoint="/"}) 
     / node_filesystem_size_bytes{mountpoint="/"}
```

## Dashboards

### Golden Signals Dashboard
```yaml
dashboard:
  title: Service Overview
  panels:
    - title: Request Rate
      type: graph
      targets:
        - expr: sum(rate(http_requests_total[5m])) by (service)
        
    - title: Error Rate
      type: graph
      targets:
        - expr: sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
        
    - title: Latency P50/P95/P99
      type: graph
      targets:
        - expr: histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))
        - expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
        - expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
        
    - title: Saturation
      type: gauge
      targets:
        - expr: node_load1 / count(node_cpu_seconds_total{mode="idle"}) by (instance)
```

## Incident Response

### Runbooks
```markdown
# High Error Rate Runbook

## Symptoms
- Error rate > 1% for 5 minutes
- Multiple downstream services affected

## Diagnosis Steps
1. Check recent deployments: `git log --since="1 hour ago"`
2. Check database metrics (connections, query time)
3. Check external dependencies status
4. Review recent logs for patterns

## Mitigation
1. If deployment-related: Rollback to previous version
2. If database-related: Scale connection pool or database
3. If dependency-related: Enable circuit breaker
4. Scale horizontally if capacity issue

## Escalation
- L2 on-call if not resolved in 15 minutes
- L3/SRE if P0 incident
```

## Best Practices

1. **Instrument early**: Add observability during development
2. **Correlate data**: Link metrics, logs, and traces
3. **Alert on outcomes**: Use SLOs and error budgets
4. **Avoid alert fatigue**: High severity, low noise
5. **Document runbooks**: Every alert needs a response plan
6. **Use distributed tracing**: Essential for microservices
7. **Retention policies**: Balance cost vs. historical analysis
8. **SLO definitions**: Clear reliability targets
