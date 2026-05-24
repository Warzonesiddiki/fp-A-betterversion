---
name: apm-application-monitoring
description: Application Performance Monitoring including APM tools, metrics collection, performance baselining, and optimization strategies.
origin: https://newrelic.com/resources/guides/introduction-apm
---

# Application Performance Monitoring

## APM Architecture

```yaml
components:
  agents:
    - language_agents: [python, java, nodejs, go]
    - infrastructure: [host, container, process]
    - network: [http, database, messaging]
      
  collect:
    - metrics: time-series data
    - traces: distributed request paths
    - logs: correlated application logs
    - events: deployments, config changes
    
  analyze:
    - real_user_monitoring
    - synthetic_monitoring
    - anomaly_detection
```

## Key Metrics

### Response Time
```yaml
metrics:
  latency:
    p50:
      name: "Median Response Time"
      query: histogram_quantile(0.50, rate(http_request_duration_bucket[5m]))
      alert_threshold: 200ms
      
    p95:
      name: "95th Percentile"
      query: histogram_quantile(0.95, rate(http_request_duration_bucket[5m]))
      alert_threshold: 500ms
      
    p99:
      name: "99th Percentile"
      query: histogram_quantile(0.99, rate(http_request_duration_bucket[5m]))
      alert_threshold: 1000ms
      
    p999:
      name: "99.9th Percentile"
      query: histogram_quantile(0.999, rate(http_request_duration_bucket[5m]))
      alert_threshold: 2000ms
```

### Throughput
```yaml
metrics:
  throughput:
    rps:
      name: "Requests Per Second"
      query: sum(rate(http_requests_total[5m]))
      
    concurrent_users:
      name: "Concurrent Users"
      query: sum(http_active_requests)
      
    error_rate:
      name: "Error Rate"
      query: |
        sum(rate(http_requests_total{status=~"5.."}[5m])) 
        / sum(rate(http_requests_total[5m])) * 100
```

### Resource Utilization
```yaml
metrics:
  resources:
    cpu:
      query: avg(rate(process_cpu_seconds_total[5m])) * 100
      alert: 80%
      
    memory:
      query: process_resident_memory_bytes / memory_limit * 100
      alert: 85%
      
    gc:
      jvm_gc_pause_seconds:
        query: rate(jvm_gc_pause_seconds_sum[5m])
        alert: > 100ms average
```

## APM Instrumentation

### Python Flask Example
```python
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

TracerProvider = trace.get_tracer_provider()
TracerProvider.add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter(endpoint="otlp:4317"))
)
FlaskInstrumentor().instrument_app(app)

@app.route("/api/users/<id>")
def get_user(id):
    with trace.get_tracer(__name__).start_as_current_span("get_user") as span:
        span.set_attribute("user.id", id)
        user = db.query_user(id)
        return jsonify(user)
```

### Node.js Express Example
```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: 'grpc://otel:4317' }),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();

// In your route
app.get('/api/products/:id', async (req, res) => {
  const span = tracer.startSpan('getProduct');
  span.setAttribute('product.id', req.params.id);
  
  const product = await productService.get(req.params.id);
  span.end();
  
  res.json(product);
});
```

### Java Spring Boot
```java
import io.opentelemetry.api.trace.Tracer;

@Service
public class UserService {
    private final Tracer tracer;
    
    @Autowired
    public UserService(Tracer tracer) {
        this.tracer = tracer;
    }
    
    public User getUser(Long id) {
        Span span = tracer.spanBuilder("getUser").startSpan();
        try {
            span.setAttribute("user.id", id);
            return userRepository.findById(id);
        } finally {
            span.end();
        }
    }
}
```

## Performance Baselines

### Baselining Process
```yaml
baselines:
  establish:
    duration: 30 days minimum
    conditions:
      - normal_traffic
      - no incidents
      - no deployments
      
  metrics:
    - response_time_p50
    - response_time_p95
    - response_time_p99
    - throughput_rps
    - error_rate
    
  thresholds:
    dynamic:
      - type: std_dev
        multiplier: 2.5
        description: "2.5 standard deviations"
        
    static:
      - metric: p99_latency
        value: 1000ms
        
    slo_based:
      - slo: api-latency
        threshold: 99.5% under 500ms
```

### Anomaly Detection
```yaml
anomaly_detection:
  algorithms:
    - zigzag:
        sensitivity: medium
        min_samples: 10
        
    - gradient:
        sensitivity: high
        min_samples: 20
        
  alerting:
    - condition: deviation > 3x baseline
      severity: warning
      
    - condition: deviation > 5x baseline
      severity: critical
```

## Transaction Tracing

### Trace Configuration
```yaml
distributed_tracing:
  sampling:
    head_based:
      rate: 10%
      rules:
        - path: /health
          rate: 0%
        - path: /api/batch
          rate: 1%
          
    tail_based:
      enabled: true
      reporters: 5
      rules:
        - error: true
          probability: 100%
        - slow: duration > 2000
          probability: 100%
```

### Trace Analysis
```markdown
## Transaction Waterfall

Endpoint: GET /api/orders/12345
Duration: 1250ms

├── 0ms AuthMiddleware (50ms)
│   └── Redis (20ms)
├── 50ms FetchUser (100ms)
│   └── SQL: SELECT * FROM users WHERE id=? (80ms)
├── 150ms CheckPermissions (200ms)
│   └── External: AuthService (180ms)
├── 350ms FetchOrders (600ms)
│   ├── Redis Cache Miss (5ms)
│   └── SQL: SELECT * FROM orders WHERE user_id=? (550ms)
│       └── Slow Query: JOIN products (500ms) ← ISSUE
└── 950ms Serialize (100ms)
    └── JSON Encoding (100ms)
```

## Database Monitoring

### Query Performance
```yaml
db_metrics:
  slow_queries:
    threshold: 100ms
    
  connection_pool:
    active:
      alert: > 80% max
    waiting:
      alert: > 10/sec
      
  query_samples:
    threshold: 500ms
    capture: true
```

### SQL Analysis
```sql
-- Top slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time,
  rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Table bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_live_tup,
  n_dead_tup,
  CASE WHEN n_live_tup > 0 
    THEN round(100.0*n_dead_tup/n_live_tup, 2) 
    ELSE 0 END AS dead_tup_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

## APM Dashboards

### Service Health Dashboard
```json
{
  "widgets": [
    {
      "type": "metric",
      "title": "Apdex Score",
      "queries": [
        "SELECT average(apm.service.apdex.score) FROM Metric WHERE service.name = 'api'"
      ]
    },
    {
      "type": "timeseries",
      "title": "Response Time",
      "queries": [
        "SELECT average(duration) FROM Transaction WHERE appName = 'api' TIMESERIES AUTO"
      ]
    },
    {
      "type": "heatmap",
      "title": "Latency Distribution",
      "query": "SELECT histogram(apm.service.key.request) FROM Metric"
    },
    {
      "type": "table",
      "title": "Top Errors",
      "query": "SELECT count(*) FROM TransactionError WHERE appName = 'api' FACET error.message LIMIT 10"
    }
  ]
}
```

## Performance Optimization

### Profiling
```yaml
profiling:
  cpu:
    enabled: true
    interval: 10ms
    duration: 30s
    
  memory:
    enabled: true
    allocation_threshold: 1mb
    
  memory_leak_detection:
    baseline: 24h
    delta_threshold: 10%
```

### Optimization Workflow
1. Identify high-impact endpoints (traffic × latency)
2. Profile under load
3. Find bottlenecks (CPU, memory, I/O, network)
4. Optimize hot paths
5. Re-measure and compare

## Best Practices

1. **Auto-instrumentation first**: Use framework integrations
2. **Custom spans for business logic**: Add meaningful attributes
3. **Sample wisely**: Head-based for volume, tail-based for errors
4. **Correlate all signals**: Traces + metrics + logs
5. **Baseline and alert dynamically**: Static thresholds are fragile
6. **Profile in production**: Low-overhead continuous profiling
7. **Monitor user experience**: Real user monitoring essential
8. **Track dependencies**: External calls often cause latency