---
name: java-performance-optimization
description: "Java performance optimization: profiling, memory management, JIT compilation, collection tuning, stream performance, and garbage collection tuning."
origin: ECC
---

# Java Performance Optimization

Best practices for profiling, tuning, and optimizing Java applications.

## When to Activate

- Investigating performance issues or bottlenecks
- Memory leaks or excessive GC activity
- High latency or low throughput
- Capacity planning or load testing
- Code review for performance-critical paths

## Profiling Tools

### JFR (Java Flight Recorder)

```bash
# Start JFR recording
java -XX:StartFlightRecording=filename=recording.jfr,duration=60s \
     -jar application.jar

# Continuous recording with JMX
java -XX:StartFlightRecording=disk=true,maxsize=500m,maxage=1h \
     -XX:FlightRecorderOptions=repository=/var/f lr \
     -jar application.jar

# Analyze recording
jfr summary recording.jfr
jfr print --events "jdk.CPULoad,jdk.GCHeapSummary" recording.jfr
```

### Async-Profiler

```bash
# CPU profiling
profiler.sh -d 30 -f profile.html --async ./application.jar

# Memory allocation profiling
profiler.sh -d 30 -f alloc.html -e alloc ./application.jar

# Lock contention profiling
profiler.sh -d 30 -f locks.html -e lock ./application.jar
```

### VisualVM / JConsole

```bash
# Enable JMX
java -Dcom.sun.management.jmxremote.port=9010 \
     -Dcom.sun.management.jmxremote.authenticate=false \
     -Dcom.sun.management.jmxremote.ssl=false \
     -jar application.jar
```

## Memory Management

### Heap Sizing

```bash
# Set initial and maximum heap
java -Xms2g -Xmx2g -jar application.jar

# Young generation sizing (G1GC)
java -Xms4g -Xmx4g -XX:NewSize=1g -XX:MaxNewSize=1g \
     -XX:+UseG1GC -jar application.jar

# Container-aware sizing
java -XX:+UseContainerSupport \
     -XX:MaxRAMPercentage=75.0 \
     -XX:InitialRAMPercentage=50.0 \
     -jar application.jar
```

### Memory Leaks Detection

```java
// Using JFR to detect leaks
@Scheduled(fixedRate = 60000)
public void logMemoryStats() {
    Runtime runtime = Runtime.getRuntime();
    long totalMemory = runtime.totalMemory();
    long freeMemory = runtime.freeMemory();
    long usedMemory = totalMemory - freeMemory;
    
    log.info("Memory: used={}MB, total={}MB, free={}MB",
        usedMemory / 1024 / 1024,
        totalMemory / 1024 / 1024,
        freeMemory / 1024 / 1024);
}

// Common leak patterns to avoid
public class CacheLeakExample {
    private final Map<String, Object> cache = new ConcurrentHashMap<>();
    
    // BAD: Unbounded growth
    public void addToCache(String key, Object value) {
        cache.put(key, value); // OOM eventually
    }
    
    // GOOD: Bounded cache with eviction
    public void addToCache(String key, Object value) {
        if (cache.size() > MAX_SIZE) {
            cache.remove(oldestKey());
        }
        cache.put(key, value);
    }
}
```

## Collection Performance

### Choosing the Right Collection

```java
// ArrayList vs LinkedList
// ArrayList: O(1) random access, O(n) insert/delete at middle
// LinkedList: O(n) random access, O(1) insert/delete at ends

// ArrayList for iteration and random access
List<Market> markets = new ArrayList<>(expectedSize);

// HashSet for membership testing
Set<String> knownSlugs = new HashSet<>(1000);

// TreeSet for sorted unique elements
NavigableSet<Order> ordersByAmount = new TreeSet<>(
    Comparator.comparing(Order::getAmount).reversed()
);

// Concurrent collections for threading
ConcurrentHashMap<String, Session> sessions = new ConcurrentHashMap<>();

// EnumSet for enum keys
EnumMap<MarketStatus, Long> statusCounts = new EnumMap<>(MarketStatus.class);
```

### Sizing Collections

```java
// Avoid resizing by providing initial capacity
List<Market> markets = new ArrayList<>(expectedSize); // ~1.1x expected
Map<String, Market> marketMap = new HashMap<>(expectedSize * 2);

// For loops that add elements
List<String> slugs = new ArrayList<>(markets.size());
for (Market market : markets) {
    slugs.add(market.getSlug());
}
```

## Stream Performance

### Avoiding Common Pitfalls

```java
// BAD: Nested streams
List<String> result = markets.stream()
    .flatMap(m -> m.getTags().stream())
    .filter(tag -> tag.startsWith("tech"))
    .toList();

// BETTER: Flatten once
Set<String> uniqueTags = markets.stream()
    .flatMap(m -> m.getTags().stream())
    .collect(Collectors.toSet());

// BAD: Expensive operations in pipeline
return markets.stream()
    .map(m -> fetchFromDatabase(m.getId())) // N database calls
    .filter(m -> m.isActive())
    .toList();

// BETTER: Batch fetch
Set<Long> ids = markets.stream().map(Market::getId).collect(Collectors.toSet());
Map<Long, MarketDetail> details = marketDetailRepo.findByIds(ids).stream()
    .collect(Collectors.toMap(MarketDetail::getId, d -> d));

// Parallel streams for CPU-bound operations
return largeList.parallelStream()
    .map(this::expensiveComputation)
    .toList();
```

### Sequential vs Parallel

```java
// Parallel for large datasets, CPU-bound work
long sum = LongStream.range(0, 10_000_000)
    .parallel()
    .map(this::expensiveCalculation)
    .sum();

// Sequential for small datasets, I/O-bound work
List<String> names = markets.stream()
    .map(Market::getName) // fast operation
    .toList();
```

## JIT Compilation

### JITWarmup

```java
// Warmup before measuring
public class WarmupRunner {

    public static void run(Runnable task, int iterations) {
        for (int i = 0; i < iterations; i++) {
            task.run();
        }
    }
}

// Usage
WarmupRunner.run(() -> {
    // Run performance-critical code during warmup
    marketService.processBatch(batch);
}, 100_000);

// JIT metrics
-XX:+PrintCompilation
-XX:+UnlockDiagnosticVMOptions -XX:+PrintInlining
```

### Escape Analysis

```java
// JIT can eliminate object allocation for non-escaping objects
public Money calculateTotal(List<OrderItem> items) {
    BigDecimal total = BigDecimal.ZERO; // May be eliminated
    for (OrderItem item : items) {
        total = total.add(item.getPrice().amount());
    }
    return new Money(total, Currency.USD);
}
```

## Garbage Collection Tuning

### G1GC (Default in Java 11+)

```bash
java -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \
     -XX:G1HeapRegionSize=8m \
     -XX:InitiatingHeapOccupancyPercent=45 \
     -jar application.jar
```

### ZGC (Low Latency)

```bash
java -XX:+UseZGC \
     -XX:MaxGCPauseMillis=10 \
     -Xmx32g -Xms32g \
     -jar application.jar
```

### Shenandoah (Short Pauses)

```bash
java -XX:+UseShenandoahGC \
     -XX:MaxGCPauseMillis=5 \
     -jar application.jar
```

### GC Logging

```bash
java -Xlog:gc*:file=gc.log:time:filecount=5,filesize=10m \
     -jar application.jar
```

## String Optimization

```java
// BAD: String concatenation in loop
String result = "";
for (Market market : markets) {
    result += market.getName() + ",";
}

// GOOD: StringBuilder
StringBuilder sb = new StringBuilder(markets.size() * 20);
for (Market market : markets) {
    sb.append(market.getName()).append(",");
}

// BETTER: Join
String result = markets.stream()
    .map(Market::getName)
    .collect(Collectors.joining(","));

// String.intern() for deduplication (use carefully)
String deduplicated = expensiveString.intern();
```

## Object Pooling

```java
// Reuse expensive objects
public class DateFormatPool {
    private static final ConcurrentLinkedQueue<DateFormat> pool = 
        new ConcurrentLinkedQueue<>();
    
    public static DateFormat getDateFormat(String pattern) {
        DateFormat df = pool.poll();
        if (df == null) {
            df = new SimpleDateFormat(pattern);
        }
        return df;
    }
    
    public static void returnDateFormat(DateFormat df) {
        pool.offer(df);
    }
}
```

## Profiling Checklist

1. **Measure before optimizing** - Profile first
2. **Identify the bottleneck** - CPU, memory, I/O, or network
3. **Check GC logs** - Frequent GC or long pauses?
4. **Analyze heap dumps** - What objects consume memory?
5. **Review hot paths** - What code runs most frequently?

## Anti-Patterns

- **Premature optimization**: Measure first
- **Micro-optimization**: Big gains come from architecture
- **Guessing instead of profiling**: Use tools
- **Ignoring algorithmic complexity**: O(n²) is rarely the answer
- **Premature caching**: Can create consistency issues
- **Excessive synchronization**: Limits scalability

## Benchmarking

```java
@Fork(2)
@Warmup(iterations = 3, time = 1, timeUnit = TimeUnit.SECONDS)
@Measurement(iterations = 5, time = 1, timeUnit = TimeUnit.SECONDS)
@BenchmarkMode(Mode.Throughput)
@OutputTimeUnit(TimeUnit.SECONDS)
public class ListBenchmark {

    @Benchmark
    public List<String> arrayListIteration(List<String> state) {
        return state.stream().map(String::toUpperCase).toList();
    }

    @Benchmark
    public List<String> arrayListLoop(List<String> state) {
        List<String> result = new ArrayList<>(state.size());
        for (String s : state) {
            result.add(s.toUpperCase());
        }
        return result;
    }
}
```

**Remember**: The fastest code is code you don't execute. Optimize the algorithm first, then micro-optimize hot paths after profiling.
