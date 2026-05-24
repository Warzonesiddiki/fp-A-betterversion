---
name: java-17-features
description: "Java 17+ features: Records, sealed classes, pattern matching, switch expressions, text blocks, and modern language improvements."
origin: ECC
---

# Java 17+ Features

Modern Java language features for cleaner, more expressive code.

## When to Activate

- Using Java 17, 21, or newer in projects
- Migrating from older Java versions
- Writing records, sealed classes, or pattern matching
- Modernizing legacy Java code
- Understanding new language idioms

## Records

### Basic Records

```java
// Simple immutable data carrier
public record Money(BigDecimal amount, Currency currency) {
    
    // Compact canonical constructor for validation
    public Money {
        Objects.requireNonNull(amount, "amount must not be null");
        Objects.requireNonNull(currency, "currency must not be null");
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("amount must not be negative");
        }
    }

    // Static factory method
    public static Money of(BigDecimal amount, Currency currency) {
        return new Money(amount, currency);
    }

    public static Money zero(Currency currency) {
        return new Money(BigDecimal.ZERO, currency);
    }

    // Instance methods still allowed
    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(this.amount.add(other.amount), currency);
    }
}

// Usage
Money price = new Money(new BigDecimal("99.99"), Currency.USD);
Money total = price.add(new Money(new BigDecimal("10.00"), Currency.USD));
```

### Records with Nested Classes

```java
public record Order(
    String orderId,
    Customer customer,
    List<OrderItem> items,
    OrderStatus status
) {
    public record OrderItem(String sku, int quantity, Money unitPrice) {
        public Money totalPrice() {
            return unitPrice.add(unitPrice); // simplified
        }
    }

    public enum OrderStatus { PENDING, PAID, SHIPPED, DELIVERED }
}

// Using nested types
Order.OrderItem item = new Order.OrderItem("SKU-123", 2, price);
```

### Records as DTOs

```java
// Request record
public record CreateMarketRequest(
    @NotBlank String slug,
    @NotBlank String name,
    @NotNull MarketStatus status
) {}

// Response record
public record MarketResponse(
    Long id,
    String slug,
    String name,
    MarketStatus status,
    Instant createdAt
) {
    // Enrichment method
    public String displayName() {
        return "%s (%s)".formatted(name, slug);
    }

    // Factory from domain
    public static MarketResponse from(Market market) {
        return new MarketResponse(
            market.getId(),
            market.getSlug(),
            market.getName(),
            market.getStatus(),
            market.getCreatedAt()
        );
    }
}
```

## Sealed Classes

### Basic Sealed Hierarchy

```java
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
    double perimeter();
}

public record Circle(double radius) implements Shape {
    @Override
    public double area() { return Math.PI * radius * radius; }
    @Override
    public double perimeter() { return 2 * Math.PI * radius; }
}

public record Rectangle(double width, double height) implements Shape {
    @Override
    public double area() { return width * height; }
    @Override
    public double perimeter() { return 2 * (width + height); }
}

public record Triangle(double a, double b, double c) implements Shape {
    @Override
    public double area() { return Math.sqrt(0.25 * (a + b + c) * (-a + b + c) * (a - b + c) * (a + b - c)); }
    @Override
    public double perimeter() { return a + b + c; }
}
```

### Sealed Classes for Domain Modeling

```java
public sealed interface PaymentResult 
    permits PaymentSuccess, PaymentDeclined, PaymentError {

    String transactionId();
}

public record PaymentSuccess(String transactionId, Instant processedAt) 
    implements PaymentResult {}

public record PaymentDeclined(String reason) 
    implements PaymentResult {}

public record PaymentError(String errorCode, String message) 
    implements PaymentResult {}

// Exhaustive handling
public String describeResult(PaymentResult result) {
    return switch (result) {
        case PaymentSuccess success -> "Paid: " + success.transactionId();
        case PaymentDeclined declined -> "Declined: " + declined.reason();
        case PaymentError error -> "Error: " + error.message();
    };
}
```

### Permits Multiple Types

```java
public abstract sealed class Vehicle permits Car, Truck, Motorcycle {
    public abstract String licensePlate();
}

public final class Car extends Vehicle {
    private final String licensePlate;
    private final int doors;
    
    public Car(String licensePlate, int doors) {
        this.licensePlate = licensePlate;
        this.doors = doors;
    }
    
    @Override
    public String licensePlate() { return licensePlate; }
}

public non-sealed class Truck extends Vehicle {
    private final String licensePlate;
    private final double capacity;
    
    @Override
    public String licensePlate() { return licensePlate; }
}

public sealed class Motorcycle extends Vehicle permits ElectricMotorcycle {
    private final String licensePlate;
    
    @Override
    public String licensePlate() { return licensePlate; }
}

public final class ElectricMotorcycle extends Motorcycle {
    public ElectricMotorcycle(String licensePlate) {
        super(licensePlate);
    }
}
```

## Pattern Matching

### Pattern Matching for instanceof

```java
// Before Java 16
if (obj instanceof String) {
    String s = (String) obj;
    if (s.length() > 5) {
        System.out.println(s.toUpperCase());
    }
}

// Java 17+ (pattern variable is scoped)
if (obj instanceof String s && s.length() > 5) {
    System.out.println(s.toUpperCase());
}

// Null check combined
if (obj instanceof String s && !s.isBlank()) {
    System.out.println(s.toUpperCase());
}
```

### Record Patterns

```java
// Deconstructing records in instanceof
public String describe(Object obj) {
    if (obj instanceof Money(BigDecimal amount, Currency currency)) {
        return "%s %s".formatted(amount, currency);
    }
    if (obj instanceof MarketResponse(Long id, String slug, String name, _, _)) {
        return "%d: %s".formatted(id, name);
    }
    return "Unknown";
}

// With additional conditions
if (obj instanceof Point(int x, int y) p && x > 0 && y > 0) {
    System.out.println("First quadrant: " + p);
}
```

### Switch Pattern Matching

```java
// Basic switch expression (Java 14+)
public String format(Object obj) {
    return switch (obj) {
        case Integer i -> "int: " + i;
        case String s -> "string: " + s;
        case null -> "null";
        default -> "unknown: " + obj.getClass().getSimpleName();
    };
}

// Pattern matching in switch (Java 21+)
public String describeShape(Shape shape) {
    return switch (shape) {
        case Circle c -> "Circle(r=%.2f)".formatted(c.radius());
        case Rectangle r -> "Rectangle(%.2f x %.2f)".formatted(r.width(), r.height());
        case Triangle t -> "Triangle(%.2f, %.2f, %.2f)".formatted(t.a(), t.b(), t.c());
    };
}

// With guards
public String categorize(Object obj) {
    return switch (obj) {
        case Integer i when i > 0 -> "positive";
        case Integer i when i < 0 -> "negative";
        case Integer i -> "zero";
        case String s when !s.isBlank() -> "non-empty string";
        case String s -> "empty string";
        default -> "other";
    };
}
```

## Text Blocks

```java
// Before Java 15
String json = "{\n" +
    "  \"name\": \"John\",\n" +
    "  \"age\": 30\n" +
"}";

// Java 15+ text blocks
String json = """
    {
      "name": "John",
      "age": 30
    }
    """;

// SQL query
String query = """
    SELECT o.id, o.status, c.name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.status = 'PENDING'
      AND o.created_at > :since
    ORDER BY o.created_at DESC
    """;

// Formatted text blocks
String message = """
    Order Summary:
    -------------
    ID: %s
    Items: %d
    Total: $%.2f
    """.formatted(orderId, itemCount, total);
```

## Other Modern Features

### Pattern for Switch Label (Java 21+)

```java
record Pair<S, T>(S first, T second) {}

String describe(Pair<String, Integer> pair) {
    return switch (pair) {
        case Pair(String s, Integer i) -> "Pair('%s', %d)".formatted(s, i);
    };
}
```

### Unnamed Patterns and Variables (Java 21+)

```java
// Ignore specific parts of a pattern
public record Position(int x, int y, int z) {}

void process(Position pos) {
    switch (pos) {
        case Position(int x, int y, _) -> 
            System.out.println("x=%d, y=%d".formatted(x, y));
    }
}
```

### Stream to List (Java 16+)

```java
// Before Java 16
List<String> names = stream.collect(Collectors.toList());

// Java 16+
List<String> names = stream.toList(); // immutable

// Mutable list
List<String> names = stream.toList(String::new, ArrayList::add, ArrayList::addAll);
```

### Collections CopyOf (Java 10+)

```java
// Immutable copies
List<String> immutableCopy = List.copyOf(originalList);
Set<String> immutableSet = Set.copyOf(originalSet);
Map<K, V> immutableMap = Map.copyOf(originalMap);

// Records often use copyOf internally
public record Order(List<Item> items) {
    public Order {
        items = List.copyOf(items); // defensive copy
    }
}
```

## Migration Checklist

1. Update `pom.xml` or `build.gradle` to Java 17+
2. Enable preview features if needed: `--enable-preview`
3. Replace Lombok with native features where possible
4. Use `jdeps` to identify dependencies on internal APIs
5. Test thoroughly - some edge cases behave differently

## Common Patterns

| Old Approach | Modern Java 17+ |
|--------------|-----------------|
| Lombok `@Data` | Record |
| Lombok `@Value` | Record |
| Lombok `@Builder` | Builder class or Lombok `@Builder` |
| `Optional.ofNullable().orElseThrow()` | `Optional::orElseThrow` |
| `BigDecimal.ZERO` | Enum singleton or `BigDecimal.ZERO` |
| Abstract classes for ADTs | Sealed interfaces/classes |
| `instanceof` + cast | Pattern matching |

## IDE Support

- IntelliJ IDEA: Full support for all Java 17+ features
- VS Code: Use Extension Pack for Java
- Eclipse: 2022-09+ supports Java 17

**Remember**: Modern Java reduces boilerplate significantly. Prefer records for data carriers, sealed classes for controlled hierarchies, and pattern matching for type-safe dispatch.
