---
name: java-enterprise-patterns
description: Enterprise application design patterns, architectural styles, and best practices for large-scale Java applications.
origin: ECC
---

# Java Enterprise Patterns Skill

## Overview
Enterprise application design patterns, architectural styles, and best practices for large-scale Java applications.

## Capabilities
- GoF Design Patterns (Creational, Structural, Behavioral)
- Enterprise Integration Patterns (EIP)
- Domain-Driven Design (DDD) patterns
- Spring Framework patterns and best practices
- Transaction management patterns
- Service-oriented architecture patterns
- Layered architecture patterns
- Repository and Unit of Work patterns
- Factory and Builder patterns
- Observer and Event-driven patterns

## Code Patterns

### Repository Pattern with Specification
```java
public interface Repository<T, ID> {
    Optional<T> findById(ID id);
    List<T> findAll();
    List<T> findBySpecification(Specification<T> spec);
    T save(T entity);
    void delete(T entity);
}

public class JpaProductRepository implements Repository<Product, String> {
    @PersistenceContext private EntityManager em;

    @Override
    public List<Product> findBySpecification(Specification<T> spec) {
        return em.unwrap(Session.class)
            .createCriteriaQuery(spec)
            .getResultList();
    }
}

public class ProductSpecifications {
    public static Specification<Product> withCategory(String category) {
        return (root, query, cb) -> cb.equal(root.get("category"), category);
    }

    public static Specification<Product> priceGreaterThan(BigDecimal price) {
        return (root, query, cb) -> cb.greaterThan(root.get("price"), price);
    }

    public static Specification<Product> active() {
        return (root, query, cb) -> cb.equal(root.get("active"), true);
    }
}

// Usage
Specification<Product> spec = ProductSpecifications.withCategory("Electronics")
    .and(ProductSpecifications.priceGreaterThan(BigDecimal.valueOf(100)))
    .and(ProductSpecifications.active());
```

### Factory Pattern with Spring
```java
@Configuration
public class PaymentFactoryConfig {
    @Bean
    public PaymentFactory paymentFactory(List<PaymentMethod> methods) {
        return new PaymentFactory(methods);
    }
}

public class PaymentFactory {
    private final Map<String, PaymentMethod> methods;

    public PaymentFactory(List<PaymentMethod> methods) {
        this.methods = methods.stream()
            .collect(Collectors.toMap(PaymentMethod::getType, identity()));
    }

    public PaymentMethod getPaymentMethod(String type) {
        PaymentMethod method = methods.get(type);
        if (method == null) throw new IllegalArgumentException("Unknown payment type: " + type);
        return method;
    }
}

public interface PaymentMethod {
    String getType();
    PaymentResult process(PaymentRequest request);
}

@Service
public class CreditCardPayment implements PaymentMethod {
    @Override public String getType() { return "credit_card"; }
    @Override public PaymentResult process(PaymentRequest request) { /* ... */ }
}
```

### Builder Pattern with Fluent API
```java
public class OrderBuilder {
    private Order order = new Order();

    public OrderBuilder id(String id) { order.setId(id); return this; }
    public OrderBuilder customer(Customer customer) { order.setCustomer(customer); return this; }
    public OrderBuilder item(Item item) { order.getItems().add(item); return this; }
    public OrderBuilder items(List<Item> items) { order.getItems().addAll(items); return this; }
    public OrderBuilder shippingAddress(Address address) { order.setShippingAddress(address); return this; }
    public OrderBuilder billingAddress(Address address) { order.setBillingAddress(address); return this; }

    public Order build() {
        if (order.getCustomer() == null) throw new IllegalStateException("Customer required");
        if (order.getItems().isEmpty()) throw new IllegalStateException("At least one item required");
        return order;
    }
}

// Usage
Order order = new OrderBuilder()
    .id("ORD-001")
    .customer(customer)
    .items(items)
    .shippingAddress(shippingAddress)
    .billingAddress(billingAddress)
    .build();
```

### Strategy Pattern
```java
public interface PricingStrategy {
    BigDecimal calculatePrice(Order order);
}

@Service
@Qualifier("vip")
public class VipPricingStrategy implements PricingStrategy {
    @Override public BigDecimal calculatePrice(Order order) {
        return order.getTotal().multiply(new BigDecimal("0.8")); // 20% discount
    }
}

@Service
@Qualifier("standard")
public class StandardPricingStrategy implements PricingStrategy {
    @Override public BigDecimal calculatePrice(Order order) {
        return order.getTotal();
    }
}

@Service
@RequiredArgsConstructor
public class PricingService {
    private final Map<String, PricingStrategy> strategies;

    public BigDecimal calculatePrice(Order order, String strategyType) {
        return strategies.get(strategyType).calculatePrice(order);
    }
}
```

### Observer/Event Pattern
```java
public interface DomainEvent {
    Instant getOccurredOn();
}

public class OrderPlacedEvent implements DomainEvent {
    private final String orderId;
    private final Instant occurredOn = Instant.now();

    public String getOrderId() { return orderId; }
    public Instant getOccurredOn() { return occurredOn; }
}

public interface EventHandler<E extends DomainEvent> {
    void handle(E event);
}

@Service
public class OrderPlacedEventHandler implements EventHandler<OrderPlacedEvent> {
    @EventListener
    public void handle(OrderPlacedEvent event) {
        notificationService.sendOrderConfirmation(event.getOrderId());
    }
}

@Service
@RequiredArgsConstructor
public class EventPublisher {
    private final ApplicationEventPublisher publisher;

    public void publish(DomainEvent event) {
        publisher.publishEvent(event);
    }
}
```

### Unit of Work Pattern
```java
public interface UnitOfWork {
    void registerNew(aggregateRoot);
    void registerDirty(aggregateRoot);
    void registerRemoved(aggregateRoot);
    void commit();
    void rollback();
}

@Service
@RequiredArgsConstructor
public class UnitOfWorkImpl implements UnitOfWork {
    private final EntityManager em;
    private final List<AggregateRoot> newEntities = new ArrayList<>();
    private final List<AggregateRoot> dirtyEntities = new ArrayList<>();
    private final List<AggregateRoot> removedEntities = new ArrayList<>();

    @Override
    public void registerNew(AggregateRoot entity) { newEntities.add(entity); }
    @Override
    public void registerDirty(AggregateRoot entity) { dirtyEntities.add(entity); }
    @Override
    public void registerRemoved(AggregateRoot entity) { removedEntities.add(entity); }

    @Override
    public void commit() {
        try {
            newEntities.forEach(em::persist);
            dirtyEntities.forEach(em::merge);
            removedEntities.forEach(em::remove);
            em.flush();
        } catch (RuntimeException e) {
            rollback();
            throw e;
        }
    }

    @Override
    public void rollback() { em.clear(); }
}
```

### Service Layer with Transaction Boundaries
```java
@Service
@Transactional
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;
    private final PaymentService paymentService;
    private final EventPublisher eventPublisher;

    public Order createOrder(CreateOrderRequest request) {
        inventoryService.reserveItems(request.getItems());

        Order order = Order.create(request);
        order = orderRepository.save(order);

        paymentService.processPayment(order);

        eventPublisher.publish(new OrderPlacedEvent(order.getId()));

        return order;
    }
}
```

### DTO Mapper with MapStruct
```java
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface OrderMapper {
    OrderDto toDto(Order order);
    Order toEntity(OrderDto dto);
    List<OrderDto> toDtoList(List<Order> orders);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "status", constant = "PENDING")
    Order toEntity(CreateOrderRequest request);
}

// Usage
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderMapper orderMapper;

    public OrderDto createOrder(CreateOrderRequest request) {
        Order order = orderMapper.toEntity(request);
        Order saved = orderRepository.save(order);
        return orderMapper.toDto(saved);
    }
}
```

### CQRS Pattern
```java
// Command Side
@Service
@RequiredArgsConstructor
public class CommandHandler {
    private final OrderRepository orderRepository;
    private final EventPublisher eventPublisher;

    @Transactional
    public OrderId createOrder(CreateOrderCommand command) {
        Order order = Order.create(command);
        orderRepository.save(order);
        eventPublisher.publish(new OrderCreatedEvent(order.getId()));
        return order.getId();
    }
}

// Query Side
@Repository
public class OrderQueryRepository {
    @Query("SELECT new com.dto.OrderView(o.id, o.customerName, o.total) FROM Order o")
    List<OrderView> findAllOrderViews();
}

@Service
public class QueryHandler {
    public List<OrderDto> getOrders() {
        return orderQueryRepository.findAllOrderViews().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
}
```

### Decorator Pattern
```java
public interface PricingService {
    BigDecimal calculatePrice(Product product);
}

@Service
@RequiredArgsConstructor
public class BasicPricingService implements PricingService {
    @Override public BigDecimal calculatePrice(Product product) {
        return product.getBasePrice();
    }
}

@Component
@RequiredArgsConstructor
public class DiscountPricingDecorator implements PricingService {
    private final PricingService decorated;

    @Override
    public BigDecimal calculatePrice(Product product) {
        BigDecimal basePrice = decorated.calculatePrice(product);
        BigDecimal discount = product.getDiscount() != null ? product.getDiscount() : BigDecimal.ZERO;
        return basePrice.subtract(discount);
    }
}
```

## Best Practices
- Use DTOs to separate layers, not entities
- Keep transactions short and focused
- Use specification pattern for complex queries
- Apply Single Responsibility Principle
- Leverage dependency injection for testability
- Use event-driven patterns for cross-cutting concerns
- Implement proper exception handling and mapping
- Consider CQRS for complex read/write scenarios

## Related Skills
- java-microservices-architect
- java-security-spring-security
- java-caching-redis-jcache