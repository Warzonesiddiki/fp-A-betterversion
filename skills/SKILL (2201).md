---
name: disaster-recovery-planning
description: Disaster recovery planning including RTO/RPO definitions, backup strategies, failover procedures, and recovery testing.
origin: https://www.scylladb.com/what-is/dr/
---

# Disaster Recovery Planning

## Recovery Objectives

### RTO/RPO Definitions
```yaml
recovery_objectives:
  tier1_critical:
    name: "Mission Critical"
    rto: 15 minutes
    rpo: 0  # Near-zero data loss
    examples:
      - payment processing
      - trading systems
      
  tier2_important:
    name: "Business Critical"
    rto: 1 hour
    rpo: 15 minutes
    examples:
      - order management
      - customer portal
      
  tier3_standard:
    name: "Standard"
    rto: 4 hours
    rpo: 1 hour
    examples:
      - reporting systems
      - analytics
      
  tier4_batch:
    name: "Batch Processing"
    rto: 24 hours
    rpo: 24 hours
    examples:
      - data warehouse
      - backup analytics
```

### Recovery Matrix
```yaml
scenarios:
  - name: single_server_failure
    impact: low
    rto_actual: 5 minutes
    automation: auto_restart
    
  - name: availability_zone_failure
    impact: medium
    rto_actual: 15 minutes
    automation: failover
    
  - name: region_failure
    impact: high
    rto_actual: 2 hours
    automation: manual_failover
```

## Backup Strategies

### Backup Types
```yaml
backup:
  full:
    frequency: weekly
    retention: 4 weeks
    time: Sunday 2am UTC
    
  incremental:
    frequency: daily
    retention: 30 days
    
  continuous:
    method: WAL_archiving
    retention: 7 days
    
  snapshots:
    frequency: every_6_hours
    retention: 7 days
    location: different_region
```

### Database Backup
```yaml
backup:
  postgresql:
    full_dump:
      command: pg_dump -Fc -h localhost -U postgres dbname
      destination: s3://backups/db/full/
      schedule: "0 2 * * 0"  # Sunday 2am
      
    continuous:
      wal_level: replica
      archive_mode: on
      archive_command: |
        aws s3 cp %p s3://backups/db/wal/%f
      
    point_in_time:
      enabled: true
      retention: 30 days
      
  redis:
    type: rdb
    frequency: hourly
    destination: s3://backups/redis/
    
  elasticsearch:
    type: snapshot
    repository: s3://backups/es/
    frequency: every_6_hours
```

### Application Backup
```yaml
backup:
  application_state:
    files:
      - /var/app/uploads
      - /var/app/config
      destination: s3://backups/app/
      
    databases:
      - service: main-db
        type: full
        frequency: daily
        
      - service: cache-db
        type: rdb
        frequency: every_15_minutes
        
  configuration:
    - name: environment_variables
      export: "env | grep APP_ > config/env.backup"
      
    - name: secrets
      export: vault kv export -f config/secrets.backup
```

## Failover Architecture

### Multi-Region Setup
```yaml
regions:
  primary: us-east-1
  standby: us-west-2
  
failover:
  mode: active_standby
  
  replication:
    database:
      type: synchronous
      target: us-west-2
      max_lag: 1 second
      
    storage:
      type: async
      target: s3://backup-us-west-2/
      
  dns:
    provider: route53
    health_check:
      endpoint: /health
      interval: 30 seconds
      threshold: 3
    failover:
      record_set:
        name: api.example.com
        type: A
        targets:
          primary: 10.0.1.100
          standby: 10.0.2.100
```

### Failover Detection
```yaml
health_checks:
  - name: primary_api
    type: http
    endpoint: https://api.primary.example.com/health
    interval: 15s
    timeout: 5s
    threshold: 2
    
  - name: primary_db
    type: tcp
    host: db.primary.example.com
    port: 5432
    interval: 30s
    
  - name: synthetic_transaction
    type: script
    script: ./scripts/checkout_flow.sh
    interval: 60s
    
failover_trigger:
  conditions:
    - api_health_check_fails: 2 consecutive
    - db_health_check_fails: 3 consecutive
    - synthetics_fails: true
  action: initiate_failover
```

## Recovery Procedures

### Runbook Template
```markdown
# Disaster Recovery Runbook

## Trigger Conditions
- [ ] Primary region unavailable
- [ ] Database cluster down
- [ ] [Other specific conditions]

## Pre-Check
- [ ] Verify disaster is real (not just alert)
- [ ] Check secondary region is healthy
- [ ] Notify stakeholders
- [ ] Open incident ticket

## Failover Steps

### 1. Database Failover (45 min target)
```bash
# Verify replication status
psql -h db-standby -c "SELECT now() - pg_last_xact_replay_timestamp();"
# Should be < 30 seconds

# Promote standby
pg_ctl promote -D /var/lib/postgresql/data

# Update connection strings
vault kv put database/config primary_host=db-standby
```

### 2. Application Failover (15 min target)
```bash
# Deploy to secondary region
./scripts/deploy.sh --region us-west-2 --version v2.3.1

# Switch DNS
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890 \
  --change-batch file://dns-failover.json

# Verify health
curl https://api.secondary.example.com/health
```

### 3. Verification (15 min target)
```bash
# Run smoke tests
./scripts/smoke-tests.sh --region us-west-2

# Check monitoring
# - Error rates should be 0
# - Latency should be normal
```

## Post-Recovery
- [ ] Update status page
- [ ] Notify all stakeholders
- [ ] Document timeline
- [ ] Plan for failback

## Failback Procedure
[Separate runbook for returning to primary]
```

## Testing Strategy

### Testing Schedule
```yaml
dr_testing:
  frequency:
    table_top: monthly
    component: quarterly
    full_dr: twice_yearly
    
  scope:
    - name: "Backup Restoration"
      scope: database
      frequency: monthly
      
    - name: "Failover Execution"
      scope: single_service
      frequency: quarterly
      
    - name: "Full Region Failover"
      scope: all_services
      frequency: bi_annually
```

### Testing Scenarios
```yaml
scenarios:
  - name: backup_restore
    description: "Restore from backup in isolation"
    steps:
      - create_fresh_environment
      - restore_database_from_backup
      - verify_data_integrity
      - verify_application_functionality
      
  - name: database_failover
    description: "Failover database to standby"
    steps:
      - trigger_failover
      - verify_replication_caught_up
      - verify_application_connected
      - run_readiness_tests
      
  - name: full_region_failover
    description: "Complete region switch"
    steps:
      - notify_users_of_drill
      - fail database
      - fail applications
      - switch DNS
      - verify_end_to_end
      - failback
      
  - name: ransomware_simulation
    description: "Recover from encrypted systems"
    steps:
      - isolate_backup_systems
      - verify_backup_integrity
      - restore_in_clean_environment
      - validate_no_contamination
```

### Test Results Template
```markdown
# DR Test Results - [Date]

## Test: [Name]
**Status**: PASSED / FAILED / PARTIAL

## Results

### RTO Achieved
- Target: [X minutes]
- Actual: [Y minutes]
- Variance: [Z minutes]

### RPO Achieved
- Target: [Data loss window]
- Actual: [Data verified]
- Variance: [Analysis]

### Issues Found
1. [Issue description]
2. [Issue description]

### Actions Required
| Action | Owner | Due Date |
|--------|-------|----------|
| [Action] | @name | [Date] |

## Sign-Off
- Test Lead: [Name]
- Reviewer: [Name]
- Approval Date: [Date]
```

## Chaos Engineering Integration

### DR-Focused Chaos
```yaml
experiments:
  - name: region_failover
    description: "Simulate region unavailability"
    method:
      - inject_network_failure
        target: region:us-east-1
        duration: 30m
        
    validation:
      - verify: failover_triggered
        timeout: 15m
      - verify: rpo_met
        max_data_loss: 1m
      - verify: services_reachable
        timeout: 5m
        
  - name: database_corruption
    description: "Simulate database corruption"
    method:
      - corrupt_primary_node
        target: db-primary
        
    validation:
      - verify: failover_completed
        timeout: 10m
      - verify: no_data_loss
```

## Documentation Requirements

```yaml
dr_documentation:
  required:
    - recovery_procedures
    - contact_list
    - escalation_matrix
    - system_dependencies
    
  review:
    frequency: quarterly
    owner: sre_team
    
  distribution:
    - on_call_engineers
    - management
    - cloud_ops
```

## Best Practices

1. **Test regularly**: Untested DR is not DR
2. **Automate everything**: Manual steps fail under pressure
3. **Measure RTO/RPO**: Know your actual recovery time
4. **Keep backups immutable**: Use WORM storage
5. **Test backup integrity**: Verify restores actually work
6. **Document dependencies**: Know what depends on what
7. **Plan for failback**: Don't forget returning to normal
8. **Train on procedures**: Practice makes recovery smooth