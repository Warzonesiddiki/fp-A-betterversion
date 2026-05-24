---
name: java-concurrency-multithreading
description: Advanced Java concurrency patterns, thread management, synchronization, and high-performance multithreaded application development.
origin: ECC
---

# Java Concurrency & Multithreading Skill

## Overview
Advanced Java concurrency patterns, thread management, synchronization, and high-performance multithreaded application development.

## Capabilities
- Thread creation and lifecycle management
- ExecutorService and thread pools
- Synchronization primitives (ReentrantLock, Semaphore, CountDownLatch, CyclicBarrier)
- Concurrent collections (ConcurrentHashMap, ConcurrentLinkedQueue, BlockingQueue)
- Fork/Join framework and parallel streams
- Thread-safe singleton patterns
- Producer-consumer patterns
- Read-write locks andStampedLock
- CompletableFuture and async programming
- ThreadLocal and context propagation
- Thread dump analysis and deadlock detection

## Code Patterns

### Thread Pool Configuration
```java
ExecutorService executor = new ThreadPoolExecutor(
    corePoolSize,
    maxPoolSize,
    keepAliveTime,
    TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(queueCapacity),
    new ThreadFactory() {
        private int count = 0;
        @Override
        public Thread newThread(Runnable r) {
            return new Thread(r, "worker-" + count++);
        }
    },
    new ThreadPoolExecutor.CallerRunsPolicy()
);
```

### CompletableFuture Pipeline
```java
CompletableFuture<String> result = CompletableFuture
    .supplyAsync(() -> fetchData())
    .thenApply(data -> processData(data))
    .thenCompose(processed -> saveData(processed))
    .exceptionally(ex -> handleError(ex))
    .thenAccept(result -> logResult(result));
```

### Producer-Consumer with BlockingQueue
```java
BlockingQueue<Item> queue = new LinkedBlockingQueue<>(100);

Producer: queue.offer(item) / queue.put(item) // blocking
Consumer: queue.poll(timeout, unit) / queue.take() // blocking
```

### Read-Write Lock Pattern
```java
ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
Lock readLock = rwLock.readLock();
Lock writeLock = rwLock.writeLock();

// Read
readLock.lock();
try { return data; } finally { readLock.unlock(); }

// Write
writeLock.lock();
try { data = newValue; } finally { writeLock.unlock(); }
```

### StampedLock Optimistic Reading
```java
StampedLock lock = new StampedLock();
long stamp = lock.tryOptimisticRead();
try {
    Object result = data;
    if (!lock.validate(stamp)) {
        stamp = lock.readLock();
        try { result = data; } finally { lock.unlockRead(stamp); }
    }
    return result;
} finally { }
```

### Thread-Safe Singleton (Double-Checked Locking)
```java
public class Singleton {
    private static volatile Singleton instance;
    private Singleton() {}
    public static Singleton getInstance() {
        if (instance == null) synchronized (Singleton.class) {
            if (instance == null) instance = new Singleton();
        }
        return instance;
    }
}
```

### Phaser for Multi-Phase Synchronization
```java
Phaser phaser = new Phaser(3); // 3 parties

Runnable task = () -> {
    phase1();
    phaser.arriveAndAwaitAdvance();
    phase2();
    phaser.arriveAndAwaitAdvance();
    phase3();
    phaser.arriveAndDeregister();
};
```

### Concurrent Merge with AtomicReference
```java
AtomicReference<Node> head = new AtomicReference<>();

public void add(Node newNode) {
    Node current;
    do {
        current = head.get();
        newNode.next = current;
    } while (!head.compareAndSet(current, newNode));
}
```

### Thread Interruption Pattern
```java
public void run() {
    while (!Thread.currentThread().isInterrupted()) {
        try {
            doWork();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            break;
        }
    }
}
```

## Best Practices
- Prefer immutable objects for thread safety
- Use concurrent collections over synchronized alternatives
- Avoid shared mutable state between threads
- Use appropriate thread pool sizes (CPU-bound: N+1, I/O-bound: 2N)
- Profile and monitor thread contention
- Use virtual threads (Java 21+) for high-volume concurrent tasks
- Implement graceful shutdown with properAwaitTermination

## Related Skills
- java-stream-processing
- java-reactive-programming-webflux
- java-enterprise-patterns