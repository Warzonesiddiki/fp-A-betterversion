---
name: java-spring-boot-best-practices
description: "Spring Boot best practices for Java 17+: configuration, dependency injection, REST APIs, transactions, caching, and production-ready services."
origin: ECC
---

# Spring Boot Best Practices

Standards for building production-ready Spring Boot applications.

## When to Activate

- Building or reviewing Spring Boot services
- Configuring beans, profiles, or external properties
- Designing REST APIs or message consumers
- Implementing transactions, caching, or resilience patterns
- Debugging Spring dependency issues

## Project Setup

### Maven Dependencies

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

### Application Configuration

```yaml
# application.yml
spring:
  application:
    name: market-service
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:local}
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:5432/markets
    username: ${DB_USER:postgres}
    password: ${DB_PASSWORD:secret}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000

server:
  port: ${APP_PORT:8080}
  error:
    include-message: always
    include-binding-errors: always

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when-authorized
```

## Dependency Injection

### Constructor Injection (Preferred)

```java
@Service
public class MarketService {

    private final MarketRepository marketRepository;
    private final MarketEventPublisher eventPublisher;

    public MarketService(MarketRepository marketRepository, 
                         MarketEventPublisher eventPublisher) {
        this.marketRepository = marketRepository;
        this.eventPublisher = eventPublisher;
    }
}

// Records work as DTOs
public record CreateMarketRequest(
    @NotBlank String slug,
    @NotBlank String name
) {}
```

### Configuration Properties

```java
@ConfigurationProperties(prefix = "app")
@Validated
public record AppProperties(
    @NotBlank String name,
    @Min(1) int maxRetries = 3,
    Duration timeout = Duration.ofSeconds(30)
) {}

@Configuration
@EnableConfigurationProperties(AppProperties.class)
class AppConfig { }
```

```yaml
app:
  name: market-service
  max-retries: 5
  timeout: 60s
```

## REST API Design

### Controller Structure

```java
@RestController
@RequestMapping("/api/v1/markets")
@RequiredArgsConstructor
@Tag(name = "Markets", description = "Market management API")
public class MarketController {

    private final MarketService marketService;

    @GetMapping("/{slug}")
    public MarketResponse getMarket(@PathVariable String slug) {
        return marketService.findBySlug(slug)
            .map(MarketResponse::from)
            .orElseThrow(() -> new MarketNotFoundException(slug));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MarketResponse createMarket(@Valid @RequestBody CreateMarketRequest request) {
        Market market = marketService.create(request);
        return MarketResponse.from(market);
    }

    @PatchMapping("/{slug}/status")
    public MarketResponse updateStatus(
            @PathVariable String slug,
            @RequestBody UpdateStatusRequest request) {
        return MarketResponse.from(marketService.updateStatus(slug, request.status()));
    }
}
```

### Exception Handling

```java
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handleNotFound(EntityNotFoundException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, ex.getMessage());
        detail.setProperty("timestamp", Instant.now());
        return detail;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                e -> e.getDefaultMessage() != null ? e.getDefaultMessage() : "invalid"
            ));
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, "Validation failed");
        detail.setProperty("errors", errors);
        return detail;
    }
}
```

## Transaction Management

### Service-Level Transactions

```java
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;
    private final PaymentService paymentService;

    @Transactional
    public Order processOrder(CreateOrderRequest request) {
        Order order = new Order(request.items());
        
        inventoryService.reserve(order.getItems());
        PaymentResult payment = paymentService.charge(request.payment());
        
        order.markPaid(payment.transactionId());
        return orderRepository.save(order);
    }
}
```

### Read-Only Transactions

```java
@Service
@RequiredArgsConstructor
public class MarketQueryService {

    private final MarketRepository marketRepository;

    @Transactional(readOnly = true)
    public List<Market> findActiveMarkets() {
        return marketRepository.findByStatus(MarketStatus.ACTIVE);
    }
}
```

## Caching

### Cache Configuration

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        return RedisCacheManager.builder(factory)
            .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                    .fromSerializer(new GenericJackson2JsonRedisSerializer())))
            .withCacheConfiguration("markets",
                RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(5)))
            .build();
    }
}
```

### Cache Usage

```java
@Service
@RequiredArgsConstructor
public class MarketService {

    private final MarketRepository marketRepository;

    @Cacheable(value = "markets", key = "#slug", unless = "#result == null")
    public Optional<Market> findBySlug(String slug) {
        return marketRepository.findBySlug(slug);
    }

    @CacheEvict(value = "markets", key = "#slug")
    public void updateMarket(String slug, UpdateCommand command) { }

    @CacheEvict(value = "markets", allEntries = true)
    public void rebuildCache() { }
}
```

## Async Processing

```java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean
    public TaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-");
        return executor;
    }
}

@Service
@RequiredArgsConstructor
public class NotificationService {

    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public void sendEmail(String to, String subject, String body) {
        emailClient.send(to, subject, body);
    }
}
```

## Resilience Patterns

```java
@Configuration
public class ResilienceConfig {

    @Bean
    public CircuitBreakerFactory circuitBreakerFactory() {
        return new Resilience4JCircuitBreakerFactory();
    }
}

@Service
@RequiredArgsConstructor
public class ExternalApiService {

    private final CircuitBreakerRegistry circuitBreakerRegistry;

    public MarketData fetchMarketData(String symbol) {
        CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker("market-api");
        
        return Decorators.ofSupplier(() -> apiClient.get(symbol))
            .withCircuitBreaker(cb)
            .withFallback(List.of(Exception.class), ex -> MarketData.fallback())
            .get();
    }
}
```

## Validation

```java
public record CreateOrderRequest(
    @NotNull @Positive BigDecimal amount,
    @NotEmpty List<@NotBlank String> items,
    @Email String customerEmail
) {}

// Service-level validation
public void process(Order order) {
    if (order.isEmpty()) {
        throw new IllegalArgumentException("Order must contain items");
    }
}
```

## Health Checks

```java
@Component
@RequiredArgsConstructor
public class MarketHealthIndicator implements HealthIndicator {

    private final MarketRepository marketRepository;

    @Override
    public Health health() {
        try {
            marketRepository.count();
            return Health.up().withDetail("database", "connected").build();
        } catch (Exception ex) {
            return Health.down().withDetail("error", ex.getMessage()).build();
        }
    }
}
```

## Avoid Common Pitfalls

- Circular dependencies → use `@Lazy` or refactor
- Over-injection → group related dependencies
- Catch-all `@Service` → use specific stereotypes
- Synchronous processing → prefer `@Async` for I/O
- Missing timeouts → always configure connection/operation timeouts
- Hardcoded configs → use profiles and environment variables

**Remember**: Spring Boot convention over configuration reduces boilerplate, but understanding what's happening under the hood prevents surprises.
