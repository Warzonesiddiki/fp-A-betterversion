---
name: design-patterns-java
description: "Essential design patterns implemented in Java 17+: Creational, Structural, Behavioral patterns with modern Java idioms and examples."
origin: ECC
---

# Design Patterns in Java

Classic and modern implementations of design patterns using Java 17+ features.

## When to Activate

- Designing object-oriented solutions
- Refactoring complex code structures
- Choosing appropriate patterns for specific problems
- Understanding existing code patterns
- Architecture discussions

## Creational Patterns

### Factory Method

```java
// Product interface
public interface Notification {
    void send(String message);
}

// Concrete products
public record EmailNotification(String address) implements Notification {
    @Override
    public void send(String message) {
        System.out.println("Email to " + address + ": " + message);
    }
}

public record SmsNotification(String phoneNumber) implements Notification {
    @Override
    public void send(String message) {
        System.out.println("SMS to " + phoneNumber + ": " + message);
    }
}

// Factory
public interface NotificationFactory {
    Notification create(String target);
}

public class EmailNotificationFactory implements NotificationFactory {
    @Override
    public Notification create(String target) {
        return new EmailNotification(target);
    }
}
```

### Builder Pattern

```java
// Fluent builder with static factory
public class Order {
    private final String orderId;
    private final List<OrderItem> items;
    private final Customer customer;
    private final PaymentMethod payment;
    private final ShippingAddress shipping;

    private Order(Builder builder) {
        this.orderId = builder.orderId;
        this.items = List.copyOf(builder.items);
        this.customer = builder.customer;
        this.payment = builder.payment;
        this.shipping = builder.shipping;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String orderId;
        private List<OrderItem> items = new ArrayList<>();
        private Customer customer;
        private PaymentMethod payment;
        private ShippingAddress shipping;

        public Builder orderId(String orderId) { this.orderId = orderId; return this; }
        public Builder items(List<OrderItem> items) { this.items = items; return this; }
        public Builder customer(Customer customer) { this.customer = customer; return this; }
        public Builder payment(PaymentMethod payment) { this.payment = payment; return this; }
        public Builder shipping(ShippingAddress shipping) { this.shipping = shipping; return this; }
        
        public Order build() {
            validate();
            return new Order(this);
        }

        private void validate() {
            if (items.isEmpty()) {
                throw new IllegalStateException("Order must have items");
            }
        }
    }
}

// Usage
Order order = Order.builder()
    .orderId("ORD-001")
    .items(List.of(new OrderItem("SKU-123", 2)))
    .customer(customer)
    .payment(PaymentMethod.CREDIT_CARD)
    .build();
```

### Singleton Pattern

```java
// Thread-safe singleton with holder pattern
public class Configuration {
    private final String baseUrl;
    private final int timeout;

    private Configuration() {
        this.baseUrl = System.getenv("BASE_URL");
        this.timeout = Integer.parseInt(System.getenv("TIMEOUT"));
    }

    private static class Holder {
        private static final Configuration INSTANCE = new Configuration();
    }

    public static Configuration getInstance() {
        return Holder.INSTANCE;
    }
}
```

## Structural Patterns

### Adapter Pattern

```java
// External legacy payment gateway
public interface LegacyPaymentGateway {
    boolean process(String cardNumber, double amount, String currency);
}

// New domain interface
public interface PaymentProcessor {
    PaymentResult processPayment(Money amount, PaymentMethod method);
}

// Adapter
public class PaymentGatewayAdapter implements PaymentProcessor {
    private final LegacyPaymentGateway legacyGateway;

    public PaymentGatewayAdapter(LegacyPaymentGateway legacyGateway) {
        this.legacyGateway = legacyGateway;
    }

    @Override
    public PaymentResult processPayment(Money amount, PaymentMethod method) {
        boolean success = legacyGateway.process(
            method.cardNumber(),
            amount.amount().doubleValue(),
            amount.currency().name()
        );
        return new PaymentResult(success, success ? "tx-123" : null);
    }
}
```

### Decorator Pattern

```java
// Base interface
public interface DataReader {
    String read() throws IOException;
}

// Core implementation
public class FileDataReader implements DataReader {
    private final Path path;

    public FileDataReader(Path path) { this.path = path; }

    @Override
    public String read() throws IOException {
        return Files.readString(path);
    }
}

// Decorators
public class BufferedDataReader implements DataReader {
    private final DataReader delegate;

    public BufferedDataReader(DataReader delegate) { this.delegate = delegate; }

    @Override
    public String read() throws IOException {
        return delegate.read(); // Adds buffering behavior
    }
}

public class LoggingDataReader implements DataReader {
    private final DataReader delegate;
    private final Logger log = LoggerFactory.getLogger(LoggingDataReader.class);

    public LoggingDataReader(DataReader delegate) {
        this.delegate = delegate;
    }

    @Override
    public String read() throws IOException {
        log.info("Reading from {}", delegate.getClass().getSimpleName());
        return delegate.read();
    }
}

// Usage
DataReader reader = new LoggingDataReader(
    new BufferedDataReader(
        new FileDataReader(path)
    )
);
```

### Composite Pattern

```java
// Component
public interface OrderComponent {
    Money calculateTotal();
    void print(int indent);
}

// Leaf
public class OrderItem implements OrderComponent {
    private final String name;
    private final Money price;
    private final int quantity;

    @Override
    public Money calculateTotal() {
        return price.multiply(quantity);
    }

    @Override
    public void print(int indent) {
        System.out.println("  ".repeat(indent) + "- " + name + " x" + quantity);
    }
}

// Composite
public class OrderGroup implements OrderComponent {
    private final String name;
    private final List<OrderComponent> children = new ArrayList<>();

    public OrderGroup(String name) { this.name = name; }

    public void add(OrderComponent component) { children.add(component); }

    @Override
    public Money calculateTotal() {
        return children.stream()
            .map(OrderComponent::calculateTotal)
            .reduce(Money.ZERO, Money::add);
    }

    @Override
    public void print(int indent) {
        System.out.println("  ".repeat(indent) + "+ " + name);
        children.forEach(c -> c.print(indent + 1));
    }
}
```

## Behavioral Patterns

### Strategy Pattern

```java
// Strategy interface
@FunctionalInterface
public interface DiscountStrategy {
    Money apply(Money originalPrice, Customer customer);
}

// Concrete strategies
public record PercentageDiscount(double percent) implements DiscountStrategy {
    @Override
    public Money apply(Money originalPrice, Customer customer) {
        return originalPrice.multiply(1 - percent);
    }
}

public record LoyaltyDiscount(int years) implements DiscountStrategy {
    @Override
    public Money apply(Money originalPrice, Customer customer) {
        if (customer.loyaltyYears() >= years) {
            return originalPrice.multiply(0.9);
        }
        return originalPrice;
    }
}

// Context
public class PricingService {
    private DiscountStrategy discountStrategy = new NoDiscount();

    public void setDiscountStrategy(DiscountStrategy strategy) {
        this.discountStrategy = strategy;
    }

    public Money calculatePrice(Money basePrice, Customer customer) {
        return discountStrategy.apply(basePrice, customer);
    }
}
```

### Observer Pattern

```java
// Observer interface
@FunctionalInterface
public interface MarketObserver {
    void onMarketUpdate(MarketEvent event);
}

// Subject
public class MarketService {
    private final List<MarketObserver> observers = new CopyOnWriteArrayList<>();

    public void addObserver(MarketObserver observer) {
        observers.add(observer);
    }

    public void removeObserver(MarketObserver observer) {
        observers.remove(observer);
    }

    private void notifyObservers(MarketEvent event) {
        observers.forEach(o -> o.onMarketUpdate(event));
    }

    public void updateMarket(Market market) {
        // Update logic
        notifyObservers(new MarketUpdateEvent(market));
    }
}

// Concrete observer
public class PriceAlertService implements MarketObserver {
    @Override
    public void onMarketUpdate(MarketEvent event) {
        if (event instanceof MarketUpdateEvent update) {
            checkPriceAlerts(update.market());
        }
    }
}
```

### Command Pattern

```java
// Command interface
public interface Command<T> {
    T execute();
}

// Command implementations
public record CreateOrderCommand(List<OrderItem> items, Customer customer) implements Command<Order> {
    private final OrderService orderService;

    @Override
    public Order execute() {
        return orderService.create(this);
    }
}

public record CancelOrderCommand(String orderId) implements Command<Void> {
    private final OrderRepository orderRepository;

    @Override
    public Void execute() {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));
        order.cancel();
        orderRepository.save(order);
        return null;
    }
}

// Invoker
public class CommandDispatcher {
    private final Map<String, Command<?>> commands = new HashMap<>();

    public void register(String name, Command<?> command) {
        commands.put(name, command);
    }

    public <T> T dispatch(String name) {
        Command<T> command = (Command<T>) commands.get(name);
        if (command == null) {
            throw new IllegalArgumentException("Unknown command: " + name);
        }
        return command.execute();
    }
}
```

### Template Method Pattern

```java
public abstract class DataProcessor {
    public final void process(byte[] data) {
        validate(data);
        byte[] normalized = normalize(data);
        Object result = extract(normalized);
        store(result);
        notify();
    }

    protected void validate(byte[] data) {
        if (data == null || data.length == 0) {
            throw new IllegalArgumentException("Data cannot be empty");
        }
    }

    protected abstract byte[] normalize(byte[] data);
    protected abstract Object extract(byte[] data);
    
    protected void store(Object result) {
        repository.save(result);
    }

    protected void notify() {
        notificationService.notify("Processing complete");
    }
}

public class JsonDataProcessor extends DataProcessor {
    @Override
    protected byte[] normalize(byte[] data) {
        return data; // Already normalized
    }

    @Override
    protected Object extract(byte[] data) {
        return new ObjectMapper().readValue(data, JsonNode.class);
    }
}
```

### State Pattern

```java
// State interface
public interface OrderState {
    void next(OrderContext context);
    void prev(OrderContext context);
    void printStatus();
}

// States
public class NewOrderState implements OrderState {
    @Override
    public void next(OrderContext context) {
        context.setState(new ProcessingState());
    }

    @Override
    public void prev(OrderContext context) {
        // Cannot go back from new
    }

    @Override
    public void printStatus() {
        System.out.println("Order created, awaiting payment");
    }
}

// Context
public class OrderContext {
    private OrderState state = new NewOrderState();

    public void setState(OrderState state) {
        this.state = state;
    }

    public void next() { state.next(this); }
    public void prev() { state.prev(this); }
    public void printStatus() { state.printStatus(); }
}
```

## Pattern Selection Guide

| Problem | Pattern(s) |
|---------|------------|
| Object creation complexity | Factory, Builder |
| Single instance needed | Singleton |
| Interface mismatch | Adapter |
| Adding behavior dynamically | Decorator, Strategy |
| Tree-like structures | Composite |
| Event handling | Observer |
| Encapsulating requests | Command |
| Algorithm skeleton | Template Method |
| State-dependent behavior | State |

## Anti-Patterns to Avoid

- **God classes**: Excessive responsibilities
- **Over-engineering**: Patterns for patterns' sake
- **Tight coupling**: Direct instantiation of concrete classes
- **Premature optimization**: Simple solutions first

**Remember**: Patterns solve recurring problems. Don't force a pattern where a simpler solution exists.
