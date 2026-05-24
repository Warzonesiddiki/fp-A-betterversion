---
name: log-aggregation-elk-stack
description: Log aggregation using ELK stack (Elasticsearch, Logstash, Kibana) including ingestion, parsing, indexing, and visualization.
origin: https://www.elastic.co/guide/en/logstash/current/index.html
---

# Log Aggregation with ELK Stack

## Architecture Overview

```
[App Servers] → [Filebeat/Agents] → [Logstash/Kafka] → [Elasticsearch] → [Kibana]
                                      ↓
                                  Index Lifecycle Management
```

## Elasticsearch

### Index Configuration
```json
{
  "index_patterns": ["logs-*"],
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1,
    "index.lifecycle.name": "logs-policy",
    "index.lifecycle.rollover_alias": "logs"
  },
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "level": { "type": "keyword" },
      "service": { "type": "keyword" },
      "message": { "type": "text", "analyzer": "standard" },
      "trace_id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "metadata": { "type": "object", "enabled": false }
    }
  }
}
```

### Index Lifecycle Management
```yaml
ilm_policy:
  name: logs-policy
  phases:
    hot:
      min_age: 0s
      actions:
        rollover:
          max_size: 50gb
          max_age: 7d
        set_priority:
          priority: 100
          
    warm:
      min_age: 7d
      actions:
        shrink:
          number_of_shards: 1
        forcemerge:
          max_num_segments: 1
        set_priority:
          priority: 50
          
    cold:
      min_age: 30d
      actions:
        set_priority:
          priority: 0
          
    delete:
      min_age: 90d
      actions:
        delete: {}
```

## Logstash Pipeline

### Basic Pipeline
```ruby
input {
  beats {
    port => 5044
  }
  
  kafka {
    bootstrap_servers => "kafka:9092"
    topics => ["application-logs"]
    group_id => "logstash"
    codec => json
  }
}

filter {
  if [log_type] == "application" {
    json {
      source => "message"
    }
    
    date {
      match => ["timestamp", "ISO8601"]
      target => "@timestamp"
    }
    
    mutate {
      add_field => { "environment" => "%{[@metadata][env]}" }
    }
    
    if [level] == "ERROR" {
      mutate {
        add_tag => ["error"]
      }
    }
  }
  
  if [log_type] == "access" {
    grok {
      match => { 
        "message" => '%{IPORHOST:client_ip} %{WORD:method} %{URIPATHPARAM:request} %{HTTPVERSION:http_version} %{NUMBER:status_code:int}'
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "logs-%{[@metadata][env]}-%{+YYYY.MM.dd}"
    ilm_enabled => true
    ilm_rollover_alias => "logs"
    ilm_pattern => "{now/d}-000001"
    ilm_alias => "logs"
  }
}
```

### JSON Parsing
```ruby
filter {
  json {
    source => "message"
    target => "parsed"
  }
  
  mutate {
    rename => {
      "[parsed][level]" => "level"
      "[parsed][service]" => "service"
      "[parsed][trace_id]" => "trace_id"
      "[parsed][user_id]" => "user_id"
    }
    remove_field => ["parsed", "message"]
  }
}
```

## Filebeat Configuration

### Application Logs
```yaml
filebeat:
  inputs:
    - type: log
      enabled: true
      paths:
        - /var/log/app/*.log
      fields:
        env: production
        log_type: application
      json:
        keys_under_root: true
        overwrite_keys: true
        add_error_key: true
        
    - type: log
      enabled: true
      paths:
        - /var/log/nginx/*.log
      fields:
        env: production
        log_type: nginx
      multiline:
        pattern: '^['
        negate: true
        match: after
        
  processors:
    - add_host_metadata:
        when_not.contains: source: "localhost"
    - add_cloud_metadata: ~
    - add_docker_metadata: ~
    - decode_json_fields:
        fields: ["message"]
        target: ""
        
  output:
    logstash:
      hosts: ["logstash:5044"]
```

### Kubernetes Logs
```yaml
filebeat:
  autodiscover:
    providers:
      - type: kubernetes
        hints: true
        templates:
          - condition:
              contains:
                kubernetes.labels.app: web
            config:
              - type: container
                paths:
                  - /var/log/containers/*-${data.kubernetes.container.id}.log
                fields:
                  service: web
                  environment: production
```

## Kibana Dashboards

### Log Analysis Dashboard
```json
{
  "title": "Log Analysis",
  "panels": [
    {
      "title": "Log Volume by Level",
      "type": "lens",
      "gridData": { "x": 0, "y": 0, "w": 12, "h": 8 },
      "visualization": {
        "layers": [
          {
            "source": "logs-*",
            "breakdown": "level",
            "metrics": ["count"]
          }
        ]
      }
    },
    {
      "title": "Error Rate (5m)",
      "type": "lens",
      "gridData": { "x": 12, "y": 0, "w": 12, "h": 8 },
      "visualization": {
        "layers": [
          {
            "source": "logs-*",
            "filter": "level: ERROR",
            "metrics": ["count"]
          }
        ]
      }
    }
  ]
}
```

### Saved Searches
```json
{
  "title": "Recent Errors",
  "columns": ["@timestamp", "level", "service", "message"],
  "sort": [["@timestamp", "desc"]],
  "filter": [
    { "query": { "match": { "level": "ERROR" } } }
  ]
}
```

## Query Examples

### Error Analysis
```sql
-- Error patterns over time
GET /logs-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "range": { "@timestamp": { "gte": "now-1h" } } },
        { "term": { "level": "ERROR" } }
      ]
    }
  },
  "aggs": {
    "by_service": {
      "terms": { "field": "service" },
      "aggs": {
        "by_error_type": {
          "terms": { "field": "error.type", "size": 5 },
          "aggs": {
            "top_errors": {
              "top_hits": {
                "_source": ["message", "trace_id"],
                "size": 3
              }
            }
          }
        }
      }
    }
  }
}
```

### Trace Correlation
```sql
-- Find all logs for a trace
GET /logs-*/_search
{
  "query": {
    "term": { "trace_id": "abc123" }
  },
  "sort": [
    { "@timestamp": "asc" }
  ],
  "highlight": {
    "fields": {
      "message": {}
    }
  }
}
```

## Performance Tuning

### Index Settings
```json
{
  "settings": {
    "index.refresh_interval": "5s",
    "index.number_of_replicas": "0",
    "translog.durability": "async",
    "translog.sync_interval": "5s",
    "merge.scheduler.max_thread_count": 1
  }
}
```

### Shard Allocation
```yaml
# Cluster level
cluster.routing.allocation.node_concurrent_recoveries: 4
cluster.routing.allocation.node_initial_primaries_recoveries: 4

# Index level
PUT /logs-000001/_settings
{
  "index.routing.allocation.include._tier_preference": "data_hot"
}
```

## Log Collection Architecture

```yaml
tiered_ingestion:
  application:
    agents: filebeat
    format: json
    fields:
      - service
      - environment
      - version
      
  infrastructure:
    agents: metricbeat
    format: structured
      
  network:
    collectors: packetbeat
    format: flows
```

## Best Practices

1. **Use structured logging**: JSON format preferred
2. **Correlate with traces**: Include trace_id in all logs
3. **Index lifecycle management**: Hot-warm-cold-delete
4. **Right-size shards**: Target 50GB per shard
5. **Filter early**: Drop unnecessary fields at ingestion
6. **Use ILM**: Automatically manage data retention
7. **Index patterns**: One pattern per environment
8. **Dashboard by user journey**: Not by service