---
name: load-testing-performance
description: Load testing and performance testing methodologies including test design, tooling, metrics analysis, and bottleneck identification.
origin: https://grafana.com/docs/grafana-cloud/traces/tempo/
---

# Load Testing & Performance

## Testing Types

### Load Testing Spectrum
```yaml
types:
  smoke_test:
    description: "Verify basic functionality under minimal load"
    concurrent_users: 1-5
    duration: 5-10 minutes
    purpose: "Does it work at all?"
    
  load_test:
    description: "Test under expected normal load"
    concurrent_users: expected_peak * 0.5
    duration: 30-60 minutes
    purpose: "Does it meet baseline?"
    
  stress_test:
    description: "Find breaking point by exceeding normal load"
    concurrent_users: expected_peak * 1.5 to 3x
    duration: 15-30 minutes
    purpose: "Where does it break?"
    
  spike_test:
    description: "Rapid increase from zero to extreme load"
    concurrent_users: expected_peak * 5
    duration: 5-10 minutes
    purpose: "Handle sudden traffic surges?"
    
  soak_test:
    description: "Sustained load over extended period"
    concurrent_users: expected_peak
    duration: 8-24 hours
    purpose: "Memory leaks? Resource exhaustion?"
    
  chaos_load:
    description: "Load under failure conditions"
    scenarios:
      - node_failures
      - network_latency
      - dependency_degradation
```

## Test Design

### User Journey Mapping
```yaml
journeys:
  - name: browse_and_buy
    weight: 40%
    steps:
      - GET /api/products
      - GET /api/products/:id
      - POST /api/cart
      - POST /api/checkout
      
  - name: search
    weight: 30%
    steps:
      - GET /api/search?q=keyword
      - GET /api/products (filtered)
      
  - name: account_management
    weight: 20%
    steps:
      - POST /api/auth/login
      - GET /api/user/profile
      - PUT /api/user/profile
      
  - name: checkout
    weight: 10%
    steps:
      - POST /api/cart/add
      - POST /api/checkout/complete
      - POST /api/payment/process
```

### Load Profile Configuration
```yaml
load_profile:
  name: "typical_day"
  
  stages:
    - duration: 10m
      target: 100 users  # Ramp up
      
    - duration: 30m
      target: 500 users  # Steady state
      
    - duration: 5m
      target: 1000 users  # Peak simulation
      
    - duration: 10m
      target: 500 users  # Cool down
      
  think_time:
    min: 1s
    max: 5s
    distribution: uniform
    
  arrival_rate:
    type: poisson
    lambda: 50  # 50 new users per second
```

## Performance Testing Tools

### k6 Script Example
```javascript
// k6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const latency = new Trend('latency');

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'errors': ['rate<0.01'],
    'checks': ['成功率>95%'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.example.com';

export default function() {
  // User journey weighted by business impact
  const scenarios = [
    { weight: 40, fn: browseAndBuy },
    { weight: 30, fn: searchProducts },
    { weight: 20, fn: manageAccount },
    { weight: 10, fn: checkout },
  ];
  
  const scenario = weightedRandom(scenarios);
  scenario.fn();
}

function browseAndBuy() {
  const res = http.get(`${BASE_URL}/products`);
  check(res, {
    'products loaded': (r) => r.status === 200,
    'has products': (r) => r.json('products').length > 0,
  }) || errorRate.add(1);
  
  latency.add(res.timings.duration);
  
  // Random product selection
  const products = res.json('products');
  const product = products[Math.floor(Math.random() * products.length)];
  
  sleep(1 + Math.random() * 2);
  
  // Add to cart
  const cartRes = http.post(
    `${BASE_URL}/cart`,
    JSON.stringify({ product_id: product.id, quantity: 1 }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(cartRes, {
    'cart updated': (r) => r.status === 200,
  }) || errorRate.add(1);
}
```

### Locust Script
```python
from locust import HttpUser, task, between, events
from locust.runners import MasterRunner
import random

class ShopUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        self.client.get("/api/products")
        
    @task(4)
    def browse_products(self):
        self.client.get("/api/products")
        
    @task(2)
    def view_product(self):
        product_id = random.randint(1, 1000)
        self.client.get(f"/api/products/{product_id}")
        
    @task(1)
    def add_to_cart(self):
        self.client.post(
            "/api/cart",
            json={"product_id": random.randint(1, 1000), "quantity": 1}
        )
        
    @task(1)
    def checkout(self):
        self.client.post(
            "/api/checkout",
            json={
                "items": [{"product_id": random.randint(1, 1000), "qty": 1}],
                "payment": {"method": "card", "token": "tok_visa"}
            }
        )
```

### Gatling Scenario
```scala
class ShopSimulation extends Simulation {
  
  val httpConf = http
    .baseUrl("https://api.example.com")
    .acceptHeader("application/json")
    .header("Authorization", "Bearer ${token}")
    
  val browseScn = scenario("Browse and Buy")
    .exec(
      http("Get Products")
        .get("/products")
        .check(status.is(200))
    )
    .pause(1, 3)
    .exec(
      http("Add to Cart")
        .post("/cart")
        .body(StringBody("""{"product_id":"${product_id}"}"""))
    )
    
  val loadProfile = scenario("Load Profile")
    .during(Duration(30).minutes) {
      browseScn.inject(
        rampUsers(500).during(Duration(5).minutes),
        constantUsersPerSec(50).during(Duration(20).minutes),
        rampUsers(0).during(Duration(5).minutes)
      )
    }
  
  setUp(loadProfile)
    .assertions(
      global.responseTime.percentile(95).lt(500),
      global.successfulRequests.percent.gt(95)
    )
    .protocols(httpConf)
}
```

## Metrics Collection

### Key Metrics to Capture
```yaml
metrics:
  request:
    - count
    - duration_p50_p95_p99
    - error_rate
    - timeout_rate
    
  throughput:
    - requests_per_second
    - bytes_sent_received
    
  infrastructure:
    cpu:
      - utilization_per_core
      - steal_time
    memory:
      - used_percent
      - available
    network:
      - bandwidth_utilization
      - connections
    disk:
      - iops
      - latency
      - queue_depth
      
  application:
    - active_connections
    - queue_depth
    - gc_pause_time
```

### Prometheus Metrics Integration
```yaml
metrics:
  targets:
    - job: k6
      endpoint: /metrics
      
  queries:
    http_reqs_total:
      query: sum(rate(http_reqs_total[5m])) by (status)
      
    http_req_duration:
      query: histogram_quantile(0.99, sum(rate(http_req_duration_seconds_bucket[5m])) by (le))
      
    errors:
      query: sum(rate(http_reqs_failed_total[5m])) / sum(rate(http_reqs_total[5m]))
```

## Bottleneck Analysis

### Performance Waterfall
```markdown
## Load Test Bottleneck Analysis

Target: 500 concurrent users, <500ms p99

### Observation
- Average latency: 450ms
- p99 latency: 1200ms  ← PROBLEM
- Error rate: 0.5%

### Analysis
1. Check database query times during load
   - Found: p99 = 800ms for complex JOIN
   - Root cause: Missing index on orders.user_id
   
2. Check connection pool saturation
   - Found: Pool at 95% during peak
   - Root cause: Pool size too small (10)
   
3. Check external dependencies
   - Found: Payment API averaging 200ms
   - Acceptable under normal load
   
4. Check GC behavior
   - Found: Stop-the-world GC 150ms pauses
   - Root cause: Memory pressure

### Recommendations
| Issue | Fix | Impact |
|-------|-----|--------|
| Missing index | ALTER TABLE orders ADD INDEX idx_user_id | -600ms p99 |
| Pool size | Increase to 50 | +20% throughput |
| Memory | Increase heap 4GB → 8GB | -100ms latency |
```

### Common Bottlenecks
```yaml
bottlenecks:
  database:
    - missing_indexes
    - slow_queries
    - connection_pool_saturation
    - lock_contention
    
  application:
    - memory_pressure
    - gc_pauses
    - thread_pool_saturation
    - serialization_overhead
    
  network:
    - bandwidth_limits
    - latency_to_dependencies
    - connection_limit
    
  infrastructure:
    - cpu_saturation
    - disk_iops_limit
    - ephemeral_port_exhaustion
```

## Results Analysis

### Performance Report Template
```markdown
# Load Test Results - [Date]

## Test Configuration
- Tool: [k6/Locust/Gatling]
- Duration: [X minutes]
- Max Users: [N]
- Target: [URL]

## Key Results

### Throughput
| Metric | Target | Actual | Status |
|---------|--------|--------|--------|
| RPS | 1000 | 950 | ✓ |
| Peak Concurrent | 500 | 498 | ✓ |

### Latency
| Percentile | Target | Actual | Status |
|------------|--------|--------|--------|
| p50 | 100ms | 80ms | ✓ |
| p95 | 300ms | 250ms | ✓ |
| p99 | 500ms | 800ms | ✗ FAIL |

### Errors
- Total Errors: 125
- Error Rate: 0.25%
- Primary Error: 500 from /api/checkout

## Findings

### Critical
1. [Issue] - [Impact]

### High
1. [Issue] - [Impact]

### Medium
1. [Issue] - [Impact]

## Recommendations
1. [Action item]
2. [Action item]

## Sign-off
- Performance Engineer: [Name]
- Review Date: [Date]
```

## Test Environment

### Environment Setup
```yaml
test_environment:
  topology:
    load_generators: 5
    regions: [us-east-1, eu-west-1]
    
  configuration:
    duplicates_production: true
    data_size: production_like
    
  isolation:
    dedicated: true
    shared_with_prod: false
    
  monitoring:
    - real_time_dashboards
    - infrastructure_metrics
    - application_profiling
```

## Best Practices

1. **Test realistic scenarios**: User journeys weighted by actual usage
2. **Warm up before measuring**: Pre-warm caches and connections
3. **Measure consistently**: Same conditions for comparison
4. **Monitor infrastructure**: Don't just test the app
5. **Correlate metrics**: Link load to resource usage
6. **Iterate**: Start simple, add complexity
7. **Test failure modes**: What happens when it breaks?
8. **Document baseline**: Know what "good" looks like