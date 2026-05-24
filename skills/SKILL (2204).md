---
name: distributed-tracing-patterns
description: Distributed tracing patterns including trace context propagation, sampling strategies, trace visualization, and correlation techniques.
origin: https://opentelemetry.io/docs/concepts/observability-primer/understand-distributed-tracing/
---

# Distributed Tracing Patterns

## Trace Anatomy

```
Trace
└── Span (Root - Entry Point)
    ├── Span (Service A)
    │   └── Span (Database Query)
    ├── Span (Service B - External Call)
    └── Span (Service C - Async)
```

### Span Structure
```yaml
span:
  name: "HTTP GET /api/users"
  trace_id: "abc123def456..."
  span_id: "xyz789"
  parent_span_id: null  # null for root span
  
  attributes:
    http.method: "GET"
    http.url: "/api/users"
    http.status_code: 200
    service.name: "user-service"
    
  status:
    code: OK
    message: ""
    
  events:
    - name: "db.query.start"
      timestamp: "2024-01-15T10:30:00Z"
      attributes:
        db.statement: "SELECT * FROM users"
        
  links:
    - trace_id: "other-trace-id"
      span_id: "other-span-id"
      type: "producers"
```

## Context Propagation

### HTTP Headers (W3C TraceContext)
```yaml
headers:
  traceparent:
    format: "00-{trace-id}-{parent-id}-{trace-flags}"
    example: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"
    
  tracestate:
    format: "key=value,key=value"
    example: "congo=t61rcWkgMzE,pulsar=2.5"
```

### Propagation Config
```yaml
# OpenTelemetry SDK
opentelemetry:
  propagators:
    - tracecontext  # W3C TraceContext
    - baggage      # W3C Baggage
    
  context:
    propagation:
      inject:
        - type: http_headers
          headers:
            traceparent: required
            tracestate: optional
            
      extract:
        - type: http_headers
          carriers:
            - http.request.headers
            
      baggage:
        keys:
          - user.id
          - tenant.id
```

### Custom Propagators
```python
from opentelemetry import trace
from opentelemetry.propagate import set_global_textmap
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

class CustomPropagator(TraceContextTextMapPropagator):
    def inject(self, carrier, context):
        carrier['x-correlation-id'] = context.trace_id
        super().inject(carrier, context)
        
    def extract(self, carrier):
        trace_id = carrier.get('x-correlation-id')
        context = super().extract(carrier)
        # Add custom extraction logic
        return context
        
set_global_textmap(CustomPropagator())
```

## Sampling Strategies

### Head-Based Sampling
```yaml
sampling:
  head_based:
    probabilistic:
      rate: 0.1  # 10% sampling
      
    rate_limiting:
      max_traces_per_second: 100
      
    priority:
      rules:
        - match: error=true
          sample: always
        - match: path=/health
          sample: never
        - match: path=/api/batch
          sample: 0.01
```

### Tail-Based Sampling
```yaml
sampling:
  tail_based:
    enabled: true
    reporting:
      delay: 5s  # Wait to make decisions
      buffer_size: 10000
      
    rules:
      - name: "sample_all_errors"
        type: error
        percentage: 100
        
      - name: "sample_slow_traces"
        type: latency
        threshold: 2s
        percentage: 100
        
      - name: "sample_rare_paths"
        type: tag
        tag: path
        values: ["/admin/*", "/debug/*"]
        percentage: 100
        
      - name: "sample_10_percent"
        type: probabilistic
        percentage: 10
```

### Adaptive Sampling
```yaml
adaptive_sampling:
  strategy: "keep_error_or_slow"
  
  conditions:
    - error: true  # Always keep errors
      percentage: 100
      
    - duration_ms: "> 1000"
      percentage: 100
      
    - rare_endpoint: true
      percentage: 100
      
    - default:
      percentage: 1
      max_traces_per_second: 1000
```

## Trace Visualization

### Trace Timeline
```markdown
GET /api/orders/12345 (1250ms)
├── [150ms] middleware.auth
│   └── [20ms] redis.get("auth:user:123")
├── [200ms] middleware.permissions
│   └── [180ms] http.call(auth-service)
├── [600ms] handler.getOrders
│   ├── [50ms] redis.get("user:123:orders")
│   └── [550ms] db.query
│       └── [500ms] sql:JOIN orders products ← SLOW QUERY
└── [100ms] response.serialize
```

### Service Map
```yaml
service_map:
  nodes:
    - name: api-gateway
      connections:
        - to: user-service
          calls_per_min: 5000
          avg_latency: 45ms
          
    - name: user-service
      connections:
        - to: user-db
          calls_per_min: 10000
          avg_latency: 25ms
        - to: auth-service
          calls_per_min: 3000
          avg_latency: 80ms
          
    - name: order-service
      connections:
        - to: order-db
          calls_per_min: 8000
          avg_latency: 30ms
```

## Correlation Patterns

### Logs → Traces
```yaml
correlation:
  log_enrichment:
    inject_trace_context: true
    fields:
      - trace_id
      - span_id
      - service.name
      
  # Structured log format
  log_template: |
    {
      "timestamp": "%{timestamp}",
      "level": "%{level}",
      "service": "%{service.name}",
      "trace_id": "%{trace.id}",
      "span_id": "%{span.id}",
      "message": "%{message}"
    }
```

### Metrics → Traces
```yaml
correlation:
  metric_to_trace:
    enabled: true
    
  exemplars:
    enabled: true
    
  dimensions:
    - trace_id
    - service_name
    - operation_name
    
  queries:
    - name: "high_latency_traces"
      metric: http_request_duration_seconds_p99
      threshold: 1s
      action: link_to_traces
```

### Traces → Logs
```yaml
correlation:
  trace_to_log:
    enabled: true
    
  log_link:
    query: "trace_id=%{trace.id}"
    filters:
      - service.name
      - environment
```

## Instrumentation Patterns

### Synchronous Services
```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

@app.route("/api/users/<user_id>")
def get_user(user_id):
    with tracer.start_as_current_span(
        "get_user",
        attributes={
            "user.id": user_id,
            "http.method": "GET"
        }
    ) as span:
        try:
            user = user_service.get(user_id)
            span.set_status(StatusCode.OK)
            return jsonify(user)
        except Exception as e:
            span.record_exception(e)
            span.set_status(StatusCode.ERROR, str(e))
            raise
```

### Async Services (Message Queues)
```python
@tracer.start_as_current_span("process_message")
def handle_message(message):
    span = trace.get_current_span()
    span.set_attribute("messaging.system", "kafka")
    span.set_attribute("messaging.destination", message.topic)
    span.set_attribute("messaging.operation", "receive")
    
    headers = {}
    propagator.inject(headers, trace.get_current_span().context)
    message.headers.update(headers)
    
    # Process with linked trace
    with tracer.start_as_current_span(
        "handler",
        links=[Link(message.trace_context)]
    ):
        return process(message)
```

### Database Tracing
```python
class TracedDB:
    def execute(self, query, params=None):
        span = tracer.start_span(
            "db.query",
            attributes={
                "db.system": "postgresql",
                "db.statement": query,
                "db.operation": "execute"
            }
        )
        
        start = time.perf_counter()
        result = self._execute(query, params)
        duration = time.perf_counter() - start
        
        span.set_attribute("db.duration_ms", duration * 1000)
        span.set_status(StatusCode.OK if duration < 1 else StatusCode.ERROR)
        
        return result
```

## Distributed Tracing in Kubernetes

### Service Mesh Integration
```yaml
# Istio configuration for tracing
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  components:
    pilot:
      config:
        enableTracing: true
        tracing:
          sampling: 10
          zipkin:
            address: zipkin.istio-system:9411
            
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
  - reviews
  http:
  - route:
    - destination:
        host: reviews
    retries:
      attempts: 3
    timeout: 2s
```

### Sidecar Injection
```yaml
# Annotations for automatic tracing
pod:
  annotations:
    sidecar.istio.io/inject: "true"
    tracing.opentelemetry.io/inject: "true"
    tracing.opentelemetry.io/exporter: "otlp"
    tracing.opentelemetry.io/endpoint: "http://otel-collector:4317"
```

## Best Practices

1. **Propagate context everywhere**: HTTP, gRPC, messaging, databases
2. **Sample strategically**: More errors and slow traces
3. **Add business context**: User IDs, tenant IDs, transaction IDs
4. **Keep spans short**: < 1 second, decompose if longer
5. **Use span events**: Not just attributes for steps
6. **Correlate all signals**: Logs, metrics, traces unified
7. **Instrument early**: Framework auto-instrumentation first
8. **Monitor span cardinality**: Limit custom attributes