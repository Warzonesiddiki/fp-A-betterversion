---
name: capacity-planning
description: Capacity planning and forecasting including resource modeling, scaling strategies, and cost optimization.
origin: https://aws.amazon.com/architecture/
---

# Capacity Planning

## Capacity Model

### Capacity Dimensions
```yaml
dimensions:
  compute:
    metrics:
      - cpu_utilization
      - core_count
      - threads_per_core
    thresholds:
      warning: 70%
      critical: 85%
      
  memory:
    metrics:
      - used_percent
      - available_gb
      - swap_usage
    thresholds:
      warning: 75%
      critical: 90%
      
  storage:
    metrics:
      - used_percent
      - iops_available
      - throughput_available
    thresholds:
      warning: 80%
      critical: 90%
      
  network:
    metrics:
      - bandwidth_utilization
      - connections
      - packet_loss
    thresholds:
      warning: 60%
      critical: 80%
```

### Resource Calculation
```yaml
sizing_formula:
  # Horizontal scaling
  required_instances = ceil(
    (expected_rps * avg_response_time) / (core_count * target_utilization)
  )
  
  # Memory-based
  required_memory = (
    working_set_size * peak_concurrent_users * safety_factor
  ) / instance_memory
  
  # Database
  connection_pool = ceil(
    (expected_concurrent * avg_query_time) / avg_query_duration
  )
```

## Capacity Metrics

### Key Metrics to Track
```yaml
metrics:
  utilization_trend:
    - current_utilization
    - 30_day_trend
    - projected_90_days
    
  growth_rate:
    - daily_active_users
    - transactions_per_day
    - data_growth_rate
    
  headroom:
    - current_headroom_percent
    - minimum_headroom_required
    - expected_headroom_at_peak
```

### Capacity Dashboard
```yaml
dashboard:
  panels:
    - title: "Current Utilization"
      metrics:
        - cpu_utilization
        - memory_utilization
        - storage_utilization
        
    - title: "30-Day Trend"
      type: timeseries
      queries:
        - avg_over_time(cpu_utilization[7d])
        - avg_over_time(memory_utilization[7d])
        
    - title: "Projected Capacity"
      type: gauge
      formula: |
        current_usage / (
          (1 - growth_rate) ^ days_until_full
        )
        
    - title: "Scaling Events"
      filter: autoscaling_actions
```

## Forecasting

### Growth Modeling
```yaml
forecasting:
  methods:
    linear:
      use_case: "Stable, predictable growth"
      formula: |
        future_value = current * (1 + growth_rate) ^ periods
        
    exponential:
      use_case: "Viral growth, new products"
      formula: |
        future_value = current * e^(growth_rate * periods)
        
    seasonal:
      use_case: "Predictable patterns (daily, weekly, monthly)"
      formula: |
        future_value = trend * seasonal_factor
        
  inputs:
    historical_data:
      min_period: 90 days
      frequency: daily
      
    growth_indicators:
      - user_growth_rate
      - transaction_growth_rate
      - feature_adoption
```

### Demand Forecasting
```yaml
forecast:
  horizon: 90 days
  
  scenarios:
    conservative:
      growth_rate: 5% per month
      peak_multiplier: 1.2x
      
    moderate:
      growth_rate: 10% per month
      peak_multiplier: 1.5x
      
    aggressive:
      growth_rate: 20% per month
      peak_multiplier: 2x
      
  output:
    - date: "2024-04-01"
      instances_needed: 50
      cost_impact: "$X/month"
      
    - date: "2024-07-01"
      instances_needed: 80
      cost_impact: "$Y/month"
```

## Scaling Strategies

### Horizontal Scaling
```yaml
autoscaling:
  metrics:
    - type: average_utilization
      metric: cpu
      target: 70%
      
    - type: average_utilization
      metric: memory
      target: 80%
      
  configuration:
    min_instances: 3
    max_instances: 100
    
    cooldown:
      scale_up: 60s
      scale_down: 300s
      
    warmup: 120s
    
  scaling_policies:
    step:
      - metric: cpu
        lower_bound: 70
        upper_bound: 85
        adjustment: +1
        
      - metric: cpu
        lower_bound: 85
        upper_bound: 100
        adjustment: +5
        
    target_tracking:
      - metric: asg_cpu_utilization
        target: 70
```

### Vertical Scaling
```yaml
vertical_scaling:
  thresholds:
    - metric: cpu
      trigger: > 80% for 5m
      action: schedule_upgrade
      
    - metric: memory
      trigger: > 90% for 5m
      action: immediate_upgrade
      
  instance_types:
    - name: t3.medium
      vcpu: 2
      memory: 4gb
      
    - name: t3.large
      vcpu: 2
      memory: 8gb
      
    - name: m5.xlarge
      vcpu: 4
      memory: 16gb
      
  migration:
    method: blue_green
    risk: low
```

### Database Scaling
```yaml
database_scaling:
  read_replicas:
    enabled: true
    count: 2
    weight: 50% of traffic
    
  connection_pooling:
    - type: pg_bouncer
      pool_mode: transaction
      max_client_conn: 1000
      default_pool_size: 20
      
  sharding:
    - strategy: tenant_based
      shards: 4
      key: tenant_id
      
    - strategy: hash_based
      shards: 16
      key: user_id
      
  partitioning:
    - type: range
      column: created_at
      interval: monthly
      
    - type: list
      column: region
```

## Capacity Planning Process

```yaml
process:
  monthly_review:
    - collect_metrics_last_30_days
    - analyze_trends
    - update_forecasts
    - identify_risks
    
  quarterly_planning:
    - review_capacity_model
    - update_growth_assumptions
    - plan_infrastructure_changes
    - budget_approval
    
  event_preparation:
    - identify_upcoming_events
    - stress_test_systems
    - pre_scale_2_weeks_before
```

### Capacity Planning Meeting Agenda
```markdown
## Capacity Review - [Month/Year]

### Current State
- Utilization metrics
- Growth trends
- Upcoming changes

### Forecast
- 3-month projection
- Risk areas
- Mitigation plans

### Recommendations
- Scaling actions needed
- Cost impact
- Timeline

### Decisions Needed
- Budget approval
- Timeline confirmation
- Risk acceptance
```

## Cost Optimization

### Rightsizing
```yaml
rightsizing:
  analysis:
    - identify_underutilized_resources
    - compare_usage to_size
    - calculate_savings
    
  thresholds:
    cpu: < 20% average = overprovisioned
    memory: < 50% average = consider_smaller
    
  recommendations:
    - instance_type_downgrade
    - spot_instance_usage
    - reserved_capacity
```

### Spot Instance Strategy
```yaml
spot:
  suitable_workloads:
    - batch_processing
    - stateless_services
    - fault_tolerant_apps
    
  configuration:
    fallback: on_demand
    diversification: 3_availability_zones
    interruption_handling:
      checkpoint_frequency: 5m
      graceful_shutdown: 30s
      
  savings:
    on_demand_rate: $0.50/hr
    spot_rate: $0.15/hr
    savings_percent: 70%
```

### Reserved Capacity
```yaml
reserved:
  approach:
    baseline: 60% reserved
    flexible: 30% on_demand
    burst: 10% spot
    
  term_selection:
    1_year: 30-40% savings
    3_year: 50-60% savings
    
  scope:
    - steady_state_services
    - predictable_baseline
```

## Capacity Runbook

```markdown
# Capacity Runbook

## Daily Monitoring
- [ ] Review capacity dashboard
- [ ] Check for approaching thresholds
- [ ] Verify scaling events completed

## Weekly Review
- [ ] Analyze utilization trends
- [ ] Update 90-day forecast
- [ ] Identify underutilized resources

## Monthly Planning
- [ ] Capacity review meeting
- [ ] Update growth model
- [ ] Plan scaling actions

## Scaling Actions

### Web Tier Scaling
```bash
# Check current capacity
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names web-asg

# Manual scale up if needed
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name web-asg \
  --desired-capacity 20 \
  --honor-cooldown
```

### Database Scaling
```bash
# Check connection utilization
SELECT count(*) FROM pg_stat_activity;

# Scale read replica
aws rds modify-db-instance \
  --db-instance-identifier primary \
  --db-instance-class db.r5.xlarge
```

## Alerts
| Alert | Threshold | Action |
|-------|-----------|--------|
| High CPU | > 80% for 5m | Check autoscaling |
| Memory Critical | > 90% | Immediate scale up |
| Storage Warning | > 80% | Plan cleanup |
```

## Capacity Metrics Report

```yaml
report:
  period: monthly
  sections:
    - name: utilization_summary
      metrics:
        - avg_cpu_utilization
        - avg_memory_utilization
        - storage_growth_rate
        
    - name: trends
      charts:
        - 90_day_utilization_trend
        - growth_rate_trajectory
        
    - name: forecast
      projections:
        - 30_day_capacity_needs
        - 90_day_capacity_needs
        - annual_capacity_plan
        
    - name: optimization
      opportunities:
        - resources_to_rightsize
        - potential_savings
```

## Best Practices

1. **Plan for growth**: Always maintain 30% headroom
2. **Monitor trends**: Early warning prevents surprises
3. **Automate scaling**: Reactive is too late
4. **Rightsize regularly**: Wasted resources waste money
5. **Use reserved for baseline**: Cost optimization
6. **Test limits**: Know your breaking point
7. **Document assumptions**: Growth rate, seasonality
8. **Review quarterly**: Capacity needs evolve