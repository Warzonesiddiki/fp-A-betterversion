---
name: java-reactive-programming-webflux
description: Reactive programming with Project Reactor, Spring WebFlux, and building non-blocking reactive applications.
origin: ECC
---

# Java Reactive Programming & WebFlux Skill

## Overview
Reactive programming with Project Reactor, Spring WebFlux, and building non-blocking reactive applications.

## Capabilities
- Mono and Flux reactive types
- Reactive streams and backpressure
- WebFlux controller and router functions
- Reactive web clients (WebClient)
- Scheduler configuration and thread pools
- Error handling and retry patterns
- Testing reactive streams with StepVerifier
- Transformation and filtering operators
- Hot vs cold publishers
- Combining and merging streams
- Context and thread-local in reactive code

## Code Patterns

### WebFlux REST Controller
```java
@RestController
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping("/products")
    public Flux<Product> getAllProducts() {
        return productService.findAll();
    }

    @GetMapping("/products/{id}")
    public Mono<Product> getProduct(@PathVariable String id) {
        return productService.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Product not found")));
    }

    @PostMapping("/products")
    public Mono<Product> createProduct(@RequestBody @Valid Product product) {
        return productService.save(product);
    }

    @GetMapping("/products/search")
    public Flux<Product> searchProducts(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productService.search(query, page, size);
    }
}
```

### WebFlux Functional Router
```java
@Configuration
public class ProductRouter {
    @Bean
    public RouterFunction<ServerResponse> productRoutes(ProductHandler handler) {
        return route(GET("/products"), handler::getAll)
            .and(route(GET("/products/{id}"), handler::getById))
            .and(route(POST("/products"), handler::create))
            .and(route(PUT("/products/{id}"), handler::update))
            .and(route(DELETE("/products/{id}"), handler::delete));
    }
}

@Component
public class ProductHandler {
    public Mono<ServerResponse> getAll(ServerRequest request) {
        return ServerResponse.ok()
            .body(productService.findAll(), Product.class);
    }
}
```

### Reactive Service with Transaction
```java
@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;

    public Flux<Product> findAll() {
        return productRepository.findAll();
    }

    public Mono<Product> findById(String id) {
        return productRepository.findById(id)
            .switchIfEmpty(Mono.error(new ProductNotFoundException(id)));
    }

    public Mono<Product> save(Product product) {
        return productRepository.save(product);
    }

    public Mono<Void> deleteById(String id) {
        return productRepository.findById(id)
            .flatMap(productRepository::delete);
    }
}
```

### WebClient for External API Calls
```java
@Component
@RequiredArgsConstructor
public class ExternalApiClient {
    private final WebClient webClient;

    public Mono<User> getUser(String userId) {
        return webClient.get()
            .uri("/users/{id}", userId)
            .retrieve()
            .bodyToMono(User.class);
    }

    public Flux<Order> getOrders(String userId) {
        return webClient.get()
            .uri("/users/{id}/orders", userId)
            .retrieve()
            .bodyToFlux(Order.class);
    }

    public Mono<Response> postData(Data data) {
        return webClient.post()
            .uri("/data")
            .bodyValue(data)
            .retrieve()
            .bodyToMono(Response.class)
            .retryWhen(Retry.backoff(3, Duration.ofMillis(1000)));
    }

    public Mono<Response> withHeaders() {
        return webClient.get()
            .uri("/secure/data")
            .header("Authorization", "Bearer " + token)
            .retrieve()
            .bodyToMono(Response.class);
    }
}
```

### Error Handling and Fallback
```java
public Mono<Product> getProductWithFallback(String id) {
    return productService.findById(id)
        .onErrorResume(NotFoundException.class, e ->
            Mono.error(new ResourceNotFoundException("Product " + id)))
        .onErrorResume(WebClientResponseException.class, e ->
            Mono.error(new ExternalServiceException("API unavailable")))
        .switchIfEmpty(Mono.error(new NotFoundException("Product not found")))
        .doOnError(ex -> log.error("Error retrieving product", ex))
        .doOnNext(product -> cacheProduct(product));
}
```

### Retry and Circuit Breaker
```java
public Mono<Data> getDataWithRetry() {
    return webClient.get()
        .uri("/data")
        .retrieve()
        .bodyToMono(Data.class)
        .retryWhen(Retry.backoff(5, Duration.ofMillis(1000))
            .filter(ex -> ex instanceof WebClientException)
            .doAfterRetry(retrySignal ->
                log.warn("Retrying attempt {}", retrySignal.totalRetries())))
        .timeout(Duration.ofSeconds(5))
        .onErrorResume(Exception.class, e ->
            Mono.just(fallbackData()));
}
```

### Combining Multiple Streams
```java
Mono<Tuple2<User, List<Order>>> userWithOrders(String userId) {
    return Mono.zip(
        userService.findById(userId),
        orderService.findByUserId(userId).collectList()
    );
}

Flux<EnrichedProduct> productWithDetails(List<String> ids) {
    return Flux.fromIterable(ids)
        .flatMap(id -> Mono.zip(
            productService.findById(id),
            detailService.findByProductId(id).defaultIfEmpty(emptyDetail())
        ).map(tuple -> new EnrichedProduct(tuple.getT1(), tuple.getT2())));
}
```

### Thread Scheduling
```java
// Parallel execution (default)
Flux.just(1, 2, 3).publishOn(Schedulers.parallel())

// Elastic/bounded elastic for I/O operations
webClient.get().retrieve().bodyToMono(String.class)
    .subscribeOn(Schedulers.boundedElastic())

// Single thread for sequential operations
.map(x -> processSequentially(x))
    .publishOn(Schedulers.single())

// Immediate execution
.flatMap(...)
    .publishOn(Schedulers.immediate())
```

### Testing with StepVerifier
```java
@ExtendWith(SpringExtension.class)
class ProductServiceTest {
    @Autowired private ProductService productService;

    @Test
    void testFindAll() {
        StepVerifier.create(productService.findAll())
            .expectNext(new Product("1", "Product 1"))
            .expectNext(new Product("2", "Product 2"))
            .verifyComplete();
    }

    @Test
    void testFindByIdNotFound() {
        StepVerifier.create(productService.findById("invalid"))
            .expectError(NotFoundException.class)
            .verify();
    }

    @Test
    void testErrorHandling() {
        StepVerifier.create(brokenMono)
            .expectError(IllegalStateException.class)
            .verify();
    }
}
```

### Backpressure Handling
```java
// Buffer and drop old items
source.onBackpressureBuffer(100, BufferOverflowStrategy.DROP_OLDEST);

// Drop all items when buffer full
source.onBackpressureBuffer(100, BufferOverflowStrategy.DROP_LATEST);

// Error when buffer overflows
source.onBackpressureBuffer(100, BufferOverflowStrategy.ERROR);

// Limit rate of processing
source.limitRate(10);

// Request on demand
source.request(10);
```

## Best Practices
- Never block in reactive pipelines
- Use proper schedulers for I/O vs CPU work
- Implement circuit breaker patterns for external calls
- Handle errors at the top level or with centralized error handlers
- Use `subscribeOn` for blocking operations
- Avoid nested Mono/Flux (use flatMap instead)
- Set appropriate timeouts on all I/O operations

## Related Skills
- java-concurrency-multithreading
- java-microservices-architect
- java-enterprise-patterns