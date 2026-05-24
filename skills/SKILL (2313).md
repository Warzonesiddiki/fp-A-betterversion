---
name: microservices-java
description: "Java microservices architecture: service design, inter-service communication, API gateways, distributed tracing, and resilience patterns."
origin: ECC
---

# Java Microservices Architecture

Best practices for building and operating microservices with Java.

## When to Activate

- Designing microservice architectures
- Implementing service-to-service communication
- Adding resilience patterns (circuit breakers, retries)
- Setting up API gateways or service meshes
- Debugging distributed systems

## Service Design Principles

### Bounded Context

```java
// Each service owns its domain
@Service
@Transactional
public class MarketService {
    private final MarketRepository marketRepository;
    private final MarketEventPublisher eventPublisher;

    public MarketService(MarketRepository marketRepository,
                         MarketEventPublisher eventPublisher) {
        this.marketRepository = marketRepository;
        this.eventPublisher = eventPublisher;
    }

    public Market create(CreateMarketCommand command) {
        Market market = new Market(command.slug(), command.name());
        Market saved = marketRepository.save(market);
        eventPublisher.publish(new MarketCreatedEvent(saved.getId(), saved.getSlug()));
        return saved;
    }
}
```

### Database per Service

```java
// Each service has its own schema/database
@Entity
@Table(name = "markets")
public class Market {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String slug;
    
    @Enumerated(EnumType.STRING)
    private MarketStatus status;
    
    // No foreign keys to other services' entities
}
```

## REST Client Communication

### WebClient (Non-blocking)

```java
@Configuration
@RequiredArgsConstructor
public class WebClientConfig {

    @Value("${services.order.url}")
    private String orderServiceUrl;

    @Bean
    public WebClient orderServiceWebClient(WebClient.Builder builder) {
        return builder
            .baseUrl(orderServiceUrl)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .filter(logRequest())
            .build();
    }

    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            log.info("Request: {} {}", clientRequest.method(), clientRequest.url());
            return Mono.just(clientRequest);
        });
    }
}

@Service
@RequiredArgsConstructor
public class OrderServiceClient {

    private final WebClient webClient;

    public Mono<OrderResponse> getOrder(String orderId) {
        return webClient.get()
            .uri("/api/orders/{orderId}", orderId)
            .retrieve()
            .bodyToMono(OrderResponse.class)
            .timeout(Duration.ofSeconds(5))
            .onErrorResume(WebClientResponseException.class,
                ex -> Mono.error(new OrderServiceException(ex.getStatusCode())));
    }
}
```

### RestTemplate (Synchronous - Legacy)

```java
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(Duration.ofSeconds(2))
            .setReadTimeout(Duration.ofSeconds(5))
            .build();
    }
}

@Service
@RequiredArgsConstructor
public class CustomerServiceClient {

    private final RestTemplate restTemplate;

    public Customer getCustomer(Long customerId) {
        try {
            return restTemplate.getForObject(
                "http://customer-service/api/customers/{id}",
                Customer.class,
                customerId
            );
        } catch (HttpClientErrorException.NotFound ex) {
            throw new CustomerNotFoundException(customerId);
        }
    }
}
```

## Resilience Patterns

### Circuit Breaker

```java
@Configuration
public class Resilience4jConfig {

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        return CircuitBreakerRegistry.ofDefaults();
    }
}

@Service
@RequiredArgsConstructor
public class PaymentServiceClient {

    private final WebClient webClient;
    private final CircuitBreakerRegistry registry;

    public Mono<PaymentResult> processPayment(PaymentRequest request) {
        CircuitBreaker cb = registry.circuitBreaker("payment-service");
        
        return Mono.fromCallable(() -> webClient.post()
                .uri("/api/payments")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(PaymentResult.class)
                .block())
            .transformDeferred(CircuitBreakerOperator.of(cb))
            .retry(3)
            .onErrorResume(Exception.class, ex -> Mono.just(PaymentResult.fallback()));
    }
}
```

### Retry with Backoff

```java
@Configuration
public class RetryConfig {

    @Bean
    public RetryRegistry retryRegistry() {
        RetryConfig config = new RetryConfig();
        config.setMaxAttempts(3);
        config.setWaitDuration(Duration.ofSeconds(1));
        config.setIntervalFunction(IntervalFunction.ofExponentialBackoff(2, 5));
        
        return RetryRegistry.of(config);
    }
}

@Service
public class InventoryServiceClient {

    private final WebClient webClient;
    private final Retry retry;

    public Mono<InventoryStatus> checkAvailability(List<String> skus) {
        return webClient.post()
            .uri("/api/inventory/check")
            .bodyValue(new InventoryCheckRequest(skus))
            .retrieve()
            .bodyToMono(InventoryStatus.class)
            .transformDeferred(RetryOperator.of(retry))
            .doOnError(ex -> log.error("Inventory check failed", ex));
    }
}
```

### Bulkhead Pattern

```java
@Configuration
public class BulkheadConfig {

    @Bean
    public BulkheadRegistry bulkheadRegistry() {
        BulkheadConfig config = BulkheadConfig.custom()
            .maxConcurrentCalls(10)
            .maxWaitDuration(Duration.ofMillis(500))
            .build();
        
        return BulkheadRegistry.of(config);
    }
}
```

## API Gateway

### Spring Cloud Gateway

```java
@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("market_service", r -> r
                .path("/api/markets/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .addRequestHeader("X-Gateway", "spring-cloud")
                    .circuitBreaker(c -> c.setName("market-cb")))
                .uri("lb://market-service"))
            .route("order_service", r -> r
                .path("/api/orders/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .retry(retry -> retry.setRetries(3)))
                .uri("lb://order-service"))
            .build();
    }
}
```

### Gateway Filters

```java
@Component
public class AuthenticationFilter implements GlobalFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        return chain.filter(exchange);
    }
}
```

## Distributed Tracing

### Spring Cloud Sleuth / OpenTelemetry

```java
@Configuration
public class TracingConfig {

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate template = new RestTemplate();
        template.setInterceptors(List.of(
            new TracingClientHttpRequestInterceptor(
                Tracer.currentTraceContext()
            )
        ));
        return template;
    }
}

@Service
@RequiredArgsConstructor
public class TracingService {

    private final Tracer tracer;

    public void processWithTrace(String correlationId) {
        try (Tracer.SpanInScope span = tracer.withSpanInScope(
                tracer.nextSpan().name("process-request").start())) {
            Span currentSpan = tracer.currentSpan();
            currentSpan.tag("correlation.id", correlationId);
            currentSpan.tag("processing.type", "sync");
            
            // Business logic
            doProcess(correlationId);
        }
    }
}
```

### MDC with WebClient

```java
@Configuration
public class TracingWebClientConfig {

    @Bean
    public WebClient webClient(WebClient.Builder builder) {
        return builder
            .filter((request, next) -> {
                String traceId = MDC.get("traceId");
                if (traceId != null) {
                    request.headers(h -> h.set("X-Trace-Id", traceId));
                }
                return next.exchange(request);
            })
            .build();
    }
}
```

## Event-Driven Communication

### Kafka Producer

```java
@Configuration
@RequiredArgsConstructor
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public NewTopic marketsTopic() {
        return TopicBuilder.name("markets-events")
            .partitions(3)
            .replicas(1)
            .build();
    }
}

@Service
@RequiredArgsConstructor
public class MarketEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishMarketCreated(Market market) {
        MarketCreatedEvent event = new MarketCreatedEvent(
            market.getId(), market.getSlug(), Instant.now()
        );
        kafkaTemplate.send("markets-events", market.getSlug(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Failed to publish event for {}", market.getSlug(), ex);
                } else {
                    log.info("Published event: {}", result.getRecordMetadata());
                }
            });
    }
}
```

### Kafka Consumer

```java
@Service
public class MarketEventConsumer {

    @KafkaListener(topics = "markets-events", groupId = "order-service")
    public void handleMarketCreated(ConsumerRecord<String, MarketCreatedEvent> record) {
        MarketCreatedEvent event = record.value();
        log.info("Received market event: {}", event);
        
        try {
            processMarketCreated(event);
        } catch (Exception ex) {
            log.error("Failed to process event", ex);
            throw ex; // Triggers rebalance
        }
    }
}
```

## Service Discovery

### Eureka Client

```yaml
spring:
  application:
    name: market-service
  cloud:
    discovery:
      client:
        simple:
          instances:
            order-service:
              - uri: http://localhost:8082
```

### Load Balancing

```java
@Configuration
public class LoadBalancedConfig {

    @Bean
    @LoadBalanced
    public WebClient.Builder loadBalancedWebClientBuilder() {
        return WebClient.builder();
    }
}

@Service
@RequiredArgsConstructor
public class ServiceClient {

    private final RestTemplate restTemplate;

    // Uses service name directly with Eureka
    public Customer getCustomer(Long customerId) {
        return restTemplate.getForObject(
            "http://customer-service/api/customers/{id}",
            Customer.class,
            customerId
        );
    }
}
```

## Health Checks

```java
@Component
@RequiredArgsConstructor
public class ServiceHealthIndicator implements HealthIndicator {

    private final CircuitBreakerRegistry circuitBreakerRegistry;
    private final MeterRegistry meterRegistry;

    @Override
    public Health health() {
        Map<String, Object> details = new HashMap<>();
        details.put("circuit_breakers", getCircuitBreakerStatus());
        details.put("metrics", meterRegistry.getNames().size());

        return Health.up()
            .withDetails(details)
            .build();
    }

    private Map<String, String> getCircuitBreakerStatus() {
        return circuitBreakerRegistry.getAllCircuitBreakers().stream()
            .collect(Collectors.toMap(
                CircuitBreaker::getName,
                cb -> cb.getState().name()
            ));
    }
}
```

## Common Pitfalls

- **Distributed monolith**: Services too tightly coupled
- **Chatty communication**: Too many synchronous calls
- **Missing circuit breakers**: Cascading failures
- **No tracing**: Difficult debugging in production
- **Inconsistent error handling**: Different error formats
- **Shared databases**: Creates hidden coupling

## Testing Microservices

```java
@SpringBootTest
@Testcontainers
class MarketServiceIntegrationTest {

    @Container
    static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Test
    void publishesEventOnMarketCreation() {
        // Test event publishing
    }
}
```

**Remember**: Microservices solve organizational scaling, not technical problems. Start with a monolith; decompose when needed.
