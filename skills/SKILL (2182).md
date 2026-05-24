---
name: java-stream-processing
description: Functional programming with Java Streams, data transformation, aggregation, and parallel processing patterns.
origin: ECC
---

# Java Stream Processing Skill

## Overview
Functional programming with Java Streams, data transformation, aggregation, and parallel processing patterns.

## Capabilities
- Stream creation and pipeline construction
- Intermediate operations (filter, map, flatMap, distinct, sorted, limit, skip)
- Terminal operations (collect, reduce, forEach, count, anyMatch, allMatch, noneMatch)
- Collectors (groupingBy, partitioningBy, toList, toSet, toMap, averaging, summing)
- Primitive streams (IntStream, LongStream, DoubleStream)
- Optional and primitive optional handling
- Parallel streams and performance optimization
- Custom collectors and aggregation
- Stream debugging and tracing
- Lazy evaluation and short-circuiting

## Code Patterns

### Stream Pipeline with Multiple Operations
```java
List<Order> orders = getOrders();
List<String> result = orders.stream()
    .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
    .filter(o -> o.getAmount().compareTo(new BigDecimal("100")) > 0)
    .map(Order::getCustomer)
    .filter(Objects::nonNull)
    .map(Customer::getName)
    .map(String::toUpperCase)
    .distinct()
    .sorted()
    .collect(Collectors.toList());
```

### Grouping and Aggregation
```java
Map<String, List<Order>> grouped = orders.stream()
    .collect(Collectors.groupingBy(Order::getStatus));

Map<OrderStatus, Long> countByStatus = orders.stream()
    .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));

Map<String, BigDecimal> totalByCustomer = orders.stream()
    .collect(Collectors.groupingBy(
        Order::getCustomerId,
        Collectors.reducing(BigDecimal.ZERO, Order::getAmount, BigDecimal::add)
    ));

Map<String, Double> avgByCategory = products.stream()
    .collect(Collectors.groupingBy(
        Product::getCategory,
        Collectors.averagingDouble(Product::getPrice)
    ));
```

### Partitioning with Secondary Grouping
```java
Map<Boolean, Map<String, List<Order>>> partitioned = orders.stream()
    .collect(Collectors.partitioningBy(
        o -> o.getAmount().compareTo(BigDecimal.valueOf(1000)) > 0,
        Collectors.groupingBy(Order::getStatus)
    ));
```

### Custom Collector for Complex Aggregation
```java
Collector<Order, List<Order>, List<Order>> distinctById = Collector.of(
    ArrayList::new,
    (list, order) -> {
        if (list.stream().noneMatch(o -> o.getId().equals(order.getId()))) {
            list.add(order);
        }
    },
    (left, right) -> {
        left.addAll(right.stream()
            .filter(l -> left.stream().noneMatch(r -> r.getId().equals(l.getId())))
            .collect(Collectors.toList()));
        return left;
    }
);
```

### Primitive Stream Statistics
```java
IntStream ages = customers.stream().mapToInt(Customer::getAge);

IntSummaryStatistics stats = ages.summaryStatistics();
stats.getMin(); stats.getMax(); stats.getAverage(); stats.getSum();

double average = customers.stream()
    .mapToInt(Customer::getAge)
    .average()
    .orElse(0.0);

int sum = customers.stream()
    .mapToInt(Customer::getAge)
    .sum();
```

### Parallel Stream with Custom ForkJoinPool
```java
ForkJoinPool customPool = new ForkJoinPool(4);
List<Result> results = customPool.submit(() ->
    items.parallelStream()
        .map(this::processItem)
        .collect(Collectors.toList())
).get();
```

### Mapping and FlatMap for Nested Structures
```java
List<String> allEmails = customers.stream()
    .map(Customer::getEmails) // Stream<List<String>>
    .flatMap(List::stream)    // Stream<String>
    .distinct()
    .collect(Collectors.toList());

List<OrderItem> items = orders.stream()
    .flatMap(order -> order.getItems().stream())
    .collect(Collectors.toList());
```

### Reduction with Identity and Combiner
```java
BigDecimal total = orders.stream()
    .map(Order::getAmount)
    .reduce(BigDecimal.ZERO, BigDecimal::add);

String concatenated = names.stream()
    .reduce("", String::concat);

List<A> merged = list1.stream()
    .reduce(list2, (l1, l2) -> { l1.addAll(l2); return l1; });
```

### Stream of Nullable Values
```java
Stream.ofNullable(customer.getAddress())
    .flatMap(addr -> Stream.of(addr.getStreet(), addr.getCity()))
    .forEach(System.out::println);

Stream.concat(Stream.of(a), Stream.ofNullable(b))
    .forEach(doSomething);
```

### Lazy Chaining with Supplier
```java
Supplier<Stream<String>> lazyStream = () -> ExpensiveOperation.getData()
    .stream()
    .filter(...)
    .map(...);

// Use multiple times without re-computation
if (lazyStream.get().count() > 0) {
    lazyStream.get().forEach(...)
}
```

## Best Practices
- Use method references when possible
- Avoid side effects in stream operations
- Don't use streams for everything (simple loops are fine)
- Be careful with parallel streams on non-thread-safe operations
- Use `collectingAndThen` for post-processing
- Consider using `findFirst()` over `findAny()` when order matters
- Close streams that wrap I/O resources (try-with-resources)
- Debug streams with `.peek(System.out::println)`

## Performance Considerations
- Parallel streams aren't always faster (overhead for small datasets)
- Avoid boxing in primitive streams
- Use `toList()` instead of `collect(Collectors.toList())` in Java 16+
- Consider `Collector.of()` for custom aggregations to avoid multiple passes

## Related Skills
- java-concurrency-multithreading
- java-enterprise-patterns