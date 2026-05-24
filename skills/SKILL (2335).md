---
name: python-async-programming
description: asyncio patterns, async/await syntax, concurrent tasks, async generators, event loops, async context managers, and async best practices.
origin: ECC
---

# Async Python Programming

Modern async/await patterns for concurrent Python applications.

## When to Activate

- Writing asynchronous Python code
- Concurrent I/O operations
- Async web frameworks (FastAPI, aiohttp)
- Background task processing
- High-performance networking

## Async Basics

### Coroutine Fundamentals

```python
import asyncio

async def fetch_data():
    """Basic async function."""
    print("Fetching data...")
    await asyncio.sleep(1)  # Simulate I/O
    return {"data": "result"}

async def main():
    """Run coroutines."""
    result = await fetch_data()
    print(f"Got: {result}")

asyncio.run(main())

# Multiple coroutines
async def main():
    task1 = asyncio.create_task(fetch_data())
    task2 = asyncio.create_task(fetch_data())
    results = await asyncio.gather(task1, task2)
```

### Async Generator

```python
async def async_range(start: int, stop: int):
    """Async generator for streaming."""
    for i in range(start, stop):
        await asyncio.sleep(0.1)
        yield i

async def consume():
    """Consume async generator."""
    async for item in async_range(0, 10):
        print(f"Got: {item}")

# Using aiter/anext
async def consume_manual():
    it = async_range(0, 5)
    try:
        while True:
            item = await it.__anext__()
            print(f"Got: {item}")
    except StopAsyncIteration:
        pass
```

### Async Comprehensions

```python
async def fetch_all():
    """Async list comprehension."""
    urls = ["url1", "url2", "url3"]
    tasks = [fetch_url(url) for url in urls]
    results = await asyncio.gather(*tasks)

    # Async dict comprehension
    users = {name: await get_user(name) for name in names}

    # Async set comprehension
    unique_ids = {id async for id in stream_ids()}

    # Filter with async
    valid = [x async for x in async_items() if await validate(x)]
```

## Concurrent Execution

### Task Management

```python
import asyncio
from asyncio import Task, create_task

async def worker(name: str, delay: float):
    """Worker task."""
    print(f"{name} starting")
    await asyncio.sleep(delay)
    print(f"{name} done")
    return f"{name} result"

async def main():
    # Create tasks
    tasks = [
        create_task(worker("A", 2)),
        create_task(worker("B", 1)),
        create_task(worker("C", 3)),
    ]

    # Wait for all
    results = await asyncio.gather(*tasks)

    # Wait for first
    done, pending = await asyncio.wait(
        tasks,
        return_when=asyncio.FIRST_COMPLETED
    )

    # Wait for any
    done, pending = await asyncio.wait(
        tasks,
        return_when=asyncio.FIRST_EXCEPTION
    )

    # Cancel pending
    for task in pending:
        task.cancel()
```

### Semaphore and Bounded Semaphore

```python
import asyncio

async def bounded_worker(semaphore: asyncio.Semaphore, i: int):
    """Worker with concurrency limit."""
    async with semaphore:
        print(f"Worker {i} starting")
        await asyncio.sleep(1)
        print(f"Worker {i} done")
        return i

async def main():
    # Limit to 3 concurrent tasks
    semaphore = asyncio.Semaphore(3)

    tasks = [bounded_worker(semaphore, i) for i in range(10)]
    results = await asyncio.gather(*tasks)
```

### Lock and Event

```python
class AsyncCounter:
    """Thread-safe counter with async lock."""

    def __init__(self):
        self.value = 0
        self.lock = asyncio.Lock()

    async def increment(self):
        async with self.lock:
            self.value += 1
            return self.value

# Async Event for signaling
async def waiter(event: asyncio.Event):
    print("Waiting for event...")
    await event.wait()
    print("Event triggered!")

async def setter(event: asyncio.Event):
    await asyncio.sleep(2)
    event.set()

async def main():
    event = asyncio.Event()
    await asyncio.gather(waiter(event), setter(event))
```

## Async Context Managers

### Custom Async Context Manager

```python
class AsyncDatabaseConnection:
    """Async database connection manager."""

    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port
        self.connection = None

    async def __aenter__(self):
        """Connect on entering context."""
        print(f"Connecting to {self.host}:{self.port}")
        await asyncio.sleep(0.5)  # Simulate connection
        self.connection = "connected"
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Disconnect on exiting context."""
        print("Disconnecting")
        await asyncio.sleep(0.1)
        self.connection = None

    async def query(self, sql: str):
        """Execute query."""
        return f"Result: {sql}"

# Usage
async def main():
    async with AsyncDatabaseConnection("localhost", 5432) as db:
        result = await db.query("SELECT * FROM users")
        print(result)
```

### aclosing for Resource Cleanup

```python
async def fetch_items():
    """Generator that needs cleanup."""
    for i in range(5):
        yield i
        await asyncio.sleep(0.1)

async def main():
    async with aclosing(fetch_items()) as agen:
        async for item in agen:
            print(item)
    # Cleanup happens automatically
```

## AsyncIO Patterns

### Queue for Task Queues

```python
async def producer(queue: asyncio.Queue, count: int):
    """Produce items."""
    for i in range(count):
        await queue.put(i)
        await asyncio.sleep(0.1)
    await queue.put(None)  # Signal done

async def consumer(queue: asyncio.Queue):
    """Consume items."""
    while True:
        item = await queue.get()
        if item is None:
            break
        print(f"Processing: {item}")
        await asyncio.sleep(0.5)

async def main():
    queue = asyncio.Queue(maxsize=10)
    await asyncio.gather(
        producer(queue, 10),
        consumer(queue)
    )
```

### Priority Queue

```python
import asyncio
from dataclasses import dataclass, field
from typing import Any

@dataclass(order=True)
class PriorityTask:
    priority: int
    task: Any = field(compare=False)

async def main():
    queue = asyncio.PriorityQueue()

    await queue.put(PriorityTask(3, "low priority"))
    await queue.put(PriorityTask(1, "high priority"))
    await queue.put(PriorityTask(2, "medium priority"))

    while not queue.empty():
        item = await queue.get()
        print(f"Processing: {item.task}")
```

### StreamReader for Network I/O

```python
import asyncio

async def handle_client(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    """Handle TCP client."""
    addr = writer.get_extra_info('peername')
    print(f"Connected: {addr}")

    while True:
        data = await reader.read(100)
        if not data:
            break
        writer.write(data.upper())

    writer.close()
    await writer.wait_closed()

async def main():
    server = await asyncio.start_server(
        handle_client,
        'localhost',
        8888
    )
    async with server:
        await server.serve_forever()
```

## Error Handling

### Exception Handling in Async

```python
async def risky_operation():
    """Operation that might fail."""
    await asyncio.sleep(0.5)
    raise ValueError("Something went wrong")

async def main():
    try:
        await risky_operation()
    except ValueError as e:
        print(f"Caught: {e}")

# Handling multiple exceptions
async def main():
    tasks = [
        asyncio.create_task(risky_operation()),
        asyncio.create_task(another_operation()),
    ]

    results = await asyncio.gather(
        *tasks,
        return_exceptions=True
    )

    for i, result in enumerate(results):
        if isinstance(result, Exception):
            print(f"Task {i} failed: {result}")
```

### Timeout Handling

```python
async def long_operation():
    """Operation that takes time."""
    await asyncio.sleep(10)
    return "done"

async def main():
    try:
        result = await asyncio.wait_for(long_operation(), timeout=5)
    except asyncio.TimeoutError:
        print("Operation timed out")

# Using shield to prevent cancellation
async def critical_operation():
    await asyncio.sleep(10)

async def main():
    try:
        task = asyncio.create_task(critical_operation())
        await asyncio.sleep(1)
        # Won't be cancelled
        result = await asyncio.shield(task)
    except asyncio.CancelledError:
        task.cancel()
```

## Async Best Practices

### Don't Block the Event Loop

```python
# BAD - Blocking in async
async def bad_example():
    time.sleep(1)  # Blocks event loop
    return "done"

# GOOD - Use async sleep
async def good_example():
    await asyncio.sleep(1)
    return "done"

# Using run_in_executor for CPU-bound
import concurrent.futures

async def cpu_intensive(data):
    loop = asyncio.get_event_loop()
    with concurrent.futures.ThreadPoolExecutor() as pool:
        result = await loop.run_in_executor(
            pool,
            heavy_computation,
            data
        )
    return result
```

### Proper Task Creation

```python
async def main():
    # Avoid: create_task without awaiting
    # This can cause "Task exception was never retrieved"
    task = asyncio.create_task(async_operation())
    result = await task  # Always await

    # Use gather for multiple tasks
    results = await asyncio.gather(
        task1(),
        task2(),
        task3()
    )

    # Use wait for more control
    done, pending = await asyncio.wait(
        [asyncio.create_task(t()) for t in tasks],
        timeout=10
    )
```

## Integration with Libraries

### aiohttp Client

```python
import aiohttp

async def fetch_all():
    """Fetch multiple URLs concurrently."""
    urls = ["https://api.example.com/1", "https://api.example.com/2"]

    async with aiohttp.ClientSession() as session:
        tasks = [session.get(url) for url in urls]
        responses = await asyncio.gather(*tasks)

        data = []
        async for response in responses:
            json_data = await response.json()
            data.append(json_data)

    return data
```

### asyncpg for PostgreSQL

```python
import asyncpg
import asyncio

async def main():
    conn = await asyncpg.connect(
        host='localhost',
        database='mydb',
        user='user',
        password='pass'
    )

    # Execute queries concurrently
    results = await asyncio.gather(
        conn.fetch('SELECT * FROM users WHERE id = $1', 1),
        conn.fetch('SELECT * FROM products WHERE price > $1', 100)
    )

    await conn.close()
```

### aioredis

```python
import aioredis

async def main():
    redis = await aioredis.create_redis_pool('redis://localhost')

    # Set values
    await redis.set('key', 'value')

    # Get values
    value = await redis.get('key', encoding='utf-8')

    # Pipeline for batch operations
    async with redis.pipeline() as pipe:
        pipe.set('key1', 'value1')
        pipe.get('key1')
        results = await pipe.execute()

    redis.close()
```

## Debugging

### Running with Debug Info

```bash
# Enable asyncio debug mode
PYTHONASYNCIODEBUG=1 python app.py
```

```python
import asyncio

# Enable debug in code
asyncio.run(main(), debug=True)

# Check if running in debug
def check_debug():
    loop = asyncio.get_event_loop()
    if loop.get_debug():
        print("Running in debug mode")
```

### Debugging Tips

```python
# Add traces
import asyncio
import sys

async def broken():
    await asyncio.sleep(0)
    raise Exception("error")

# Set traceback callback
async def main():
    try:
        await broken()
    except Exception:
        import traceback
        traceback.print_exc()

asyncio.run(main())

# Using run_until_complete for debugging
loop = asyncio.new_event_loop()
loop.set_debug(True)
loop.run_until_complete(main())
loop.close()
```

## Quick Reference

| Pattern | Description |
|---------|-------------|
| async def | Define async function |
| await | Wait for coroutine |
| asyncio.gather | Run multiple concurrently |
| asyncio.create_task | Schedule task |
| asyncio.Semaphore | Limit concurrency |
| async with | Async context manager |
| asyncio.Queue | Producer-consumer |
| aiohttp | Async HTTP client |
| asyncpg | Async PostgreSQL |

Remember: async/await is for I/O-bound work. For CPU-bound work, use threads or processes.