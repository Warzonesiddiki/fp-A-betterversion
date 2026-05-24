---
name: java-microservices-architect
description: Designing, building, and orchestrating Java microservices with Spring Cloud, service discovery, configuration management, and distributed system patterns.
origin: ECC
---

# Java Microservices Architect Skill

## Overview
Designing, building, and orchestrating Java microservices with Spring Cloud, service discovery, configuration management, and distributed system patterns.

## Capabilities
- Spring Cloud ecosystem (Eureka, Config Server, Gateway)
- Service registration and discovery
- API Gateway patterns
- Distributed configuration management
- Service-to-service communication
- Circuit breaker patterns
- Distributed tracing and monitoring
- Event-driven microservices
- Message-driven architectures
- Container orchestration basics
- Service mesh patterns
- API design and versioning

## Code Patterns

### Service Registration with Eureka
```java
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}

spring:
  application:
    name: eureka-server
  eureka:
    instance:
      hostname: localhost
    client:
      register-with-eureka: false
      fetch-registry: false
    server:
      wait-time-in-ms-when-sync-empty: 0
```

### Service Discovery Client
```java
@SpringBootApplication
@EnableDiscoveryClient
public class ProductServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
    }
}

@RestController
@RequiredArgsConstructor
public class ProductController {
    private final DiscoveryClient discoveryClient;

    @GetMapping("/services")
    public List<String> getServices() {
        return discoveryClient.getServices().stream()
            .filter(s -> !s.equals("eureka"))
            .collect(Collectors.toList());
    }

    @GetMapping("/service-instances/{serviceId}")
    public List<ServiceInstance> getInstances(@PathVariable String serviceId) {
        return discoveryClient.getInstances(serviceId);
    }
}
```

### Service Communication with RestTemplate
```java
@Service
public class OrderService {
    @LoadBalanced
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Autowired private RestTemplate restTemplate;

    public Product getProduct(String productId) {
        List<ServiceInstance> instances = discoveryClient.getInstances("product-service");
        String url = instances.get(0).getUri() + "/products/" + productId;
        return restTemplate.getForObject(url, Product.class);
    }

    // Better: use service name directly with @LoadBalanced
    public Product getProductBalanced(String productId) {
        return restTemplate.getForObject(
            "http://product-service/products/{id}", Product.class, productId);
    }
}
```

### Feign Client
```java
@FeignClient(name = "product-service")
public interface ProductClient {
    @GetMapping("/products/{id}")
    Product getProduct(@PathVariable("id") String id);

    @GetMapping("/products")
    List<Product> getProducts(@RequestParam("category") String category);

    @PostMapping("/products")
    Product createProduct(@RequestBody Product product);
}

@Service
@RequiredArgsConstructor
public class OrderService {
    private final ProductClient productClient;

    public Order createOrder(OrderRequest request) {
        Product product = productClient.getProduct(request.getProductId());
        // process order
    }
}
```

### Spring Cloud Gateway
```java
@Configuration
public class GatewayConfig {
    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("product-route", r -> r.path("/api/products/**")
                .uri("lb://product-service"))
            .route("order-route", r -> r.path("/api/orders/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .addRequestHeader("X-Gateway", "true"))
                .uri("lb://order-service"))
            .build();
    }
}

spring:
  cloud:
    gateway:
      routes:
        - id: product-service
          uri: lb://product-service
          predicates:
            - Path=/products/**
        - id: auth-service
          uri: lb://auth-service
          predicates:
            - Path=/auth/**
```

### Circuit Breaker with Resilience4j
```java
@Service
public class ProductServiceWithCircuitBreaker {
    private final CircuitBreakerRegistry circuitBreakerRegistry;

    @CircuitBreaker(name = "productService", fallbackMethod = "fallback")
    public Product getProduct(String id) {
        return restTemplate.getForObject(
            "http://product-service/products/" + id, Product.class);
    }

    public Product fallback(String id, Throwable ex) {
        log.warn("Circuit breaker triggered", ex);
        return new Product(id, "Fallback Product");
    }

    @CircuitBreaker(name = "productService", fallbackMethod = "fallback")
    @Retry(maxAttempts = 3, waitDuration = @Duration("100ms"))
    public List<Product> getProducts() { /* ... */ }
}
```

### Rate Limiter
```java
@Configuration
public class RateLimiterConfig {
    @Bean
    public RateLimiterRegistry rateLimiterRegistry() {
        return RateLimiterRegistry.ofDefaults();
    }
}

@Service
public class LimitedService {
    @RateLimiter(name = "default")
    public Result limitedOperation() {
        return doOperation();
    }

    @RateLimiter(name = "custom", fallbackMethod = "rateLimitFallback")
    public Result limitedWithFallback() {
        return doOperation();
    }
}
```

### Distributed Configuration
```java
spring:
  cloud:
    config:
      uri: http://localhost:8888
      label: main
      profiles:
        - default

@RefreshScope
@RestController
public class ConfigController {
    @Value("${custom.property:default}")
    private String customProperty;

    @GetMapping("/config")
    public String getConfig() {
        return customProperty;
    }
}

# bootstrap.yml for config client
spring:
  application:
    name: product-service
  cloud:
    config:
      discovery:
        enabled: true
      service-id: config-server
```

### Event-Driven with Kafka
```java
@Service
public class OrderEventPublisher {
    @Autowired private KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public void publishOrderCreated(Order order) {
        OrderEvent event = new OrderEvent("ORDER_CREATED", order);
        kafkaTemplate.send("order-events", order.getId(), event);
    }
}

@Component
public class OrderEventListener {
    @KafkaListener(topics = "order-events", groupId = "inventory-group")
    public void handleOrderEvent(ConsumerRecord<String, OrderEvent> record) {
        OrderEvent event = record.value();
        if ("ORDER_CREATED".equals(event.getType())) {
            inventoryService.reserve(event.getOrder());
        }
    }
}
```

### Service Mesh Integration
```java
// Kubernetes deployment with service mesh annotations
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: product-service
    spec:
      containers:
      - name: product-service
        image: product-service:1.0
        ports:
        - containerPort: 8080
        env:
        - name: SERVICE_NAME
          value: "product-service"

---
apiVersion: v1
kind: Service
metadata:
  name: product-service
spec:
  selector:
    app: product-service
  ports:
  - port: 80
    targetPort: 8080
```

### API Versioning
```java
@RestController
@RequestMapping("/api/v1")
public class ProductControllerV1 {
    @GetMapping("/products")
    public List<ProductDto> getProducts() { return impl.getProducts(); }
}

@RestController
@RequestMapping("/api/v2")
public class ProductControllerV2 {
    @GetMapping("/products")
    public List<ProductExtendedDto> getProducts(
            @RequestParam(defaultValue = "false") boolean extended) {
        return impl.getProducts(extended);
    }
}
```

## Best Practices
- Use service discovery for loose coupling
- Implement circuit breakers for fault tolerance
- Keep services small and focused (single responsibility)
- Use asynchronous communication where possible
- Implement proper error handling and fallback strategies
- Use distributed tracing for debugging
- Version APIs carefully and support multiple versions
- Keep configuration externalized
- Implement proper health checks and readiness probes

## Related Skills
- java-reactive-programming-webflux
- java-cloud-native
- java-security-spring-security
- java-caching-redis-jcache