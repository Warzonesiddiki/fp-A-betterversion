---
name: debugging-strategies
description: >
  Systematic debugging techniques and root cause analysis workflows. Scientific method frameworks, 
  profiling tools configuration, memory leak detection, and patterns for resolving intermittent, 
  flaky, and race-condition bugs in JavaScript, Python, and Go.
origin: MCP Market
---

# Debugging Strategies & Root Cause Analysis

Comprehensive frameworks for systematic bug isolation, reproduction, and resolution across any technology stack.

## When to Activate

- Investigating performance regressions in high-traffic environments
- Establishing systematic debugging workflow for unfamiliar codebases
- Tracking down elusive memory leaks and race conditions
- Handling intermittent, flaky, or race-condition bugs
- Debugging unfamiliar or legacy codebases

## Scientific Method Framework

### Step 1: Hypothesis Formation

`
Before debugging, formulate a hypothesis:
1. What is the expected behavior?
2. What is the actual behavior?
3. What changed recently that could cause this?
4. What is the simplest explanation?
`

### Step 2: Controlled Testing

`ash
# Binary search debugging - isolate the issue
git bisect start
git bisect bad  # current broken commit
git bisect good # last known good commit

# Differential analysis - compare environments
diff <(curl -s env1.api.com) <(curl -s env2.api.com)

# Canary testing - gradual rollout
kubectl rollout history deployment/app
kubectl rollout undo deployment/app
`

### Step 3: Root Cause Verification

`	ypescript
// Verify root cause with a discriminating test
it('should fail with exact error', () => {
  const result = buggyFunction(input);
  expect(result.error).toBe('ECONNREFUSED');
  expect(result.cause).toBe('Service unavailable at port 8080');
});
`

## Reproduction Checklists

### Information Gathering Checklist

`markdown
## Bug Report Template
- [ ] Error type, message, stack trace
- [ ] Last meaningful tool call sequence
- [ ] What the agent was trying to do
- [ ] Current context pressure (repeated prompts, oversized logs)
- [ ] Environment assumptions (cwd, branch, service state)
- [ ] Expected vs actual behavior
- [ ] Reproduction steps (minimal case)
- [ ] Frequency (always/intermittent/once)
`

### Reproduction Patterns

`javascript
// 1. Create minimal reproduction case
const minimalCase = {
  input: { /* minimal data that triggers bug */ },
  setup: { /* required state */ },
  steps: ['step 1', 'step 2', 'step 3'],
};

// 2. Isolate the failing component
// Bad: Testing entire application
// Good: Test only the failing module

// 3. Verify with exact error conditions
it('reproduces the exact bug', () => {
  expect(buggyCode).toThrow('ExpectedError: occurred at line 42');
});
`

## Language-Specific Debugging

### JavaScript / Node.js

`javascript
// Memory leak detection with heap snapshots
const v8 = require('v8');
const fs = require('fs');

function captureHeapSnapshot(label) {
  const snapshot = v8.writeHeapSnapshot();
  console.log(Heap snapshot captured:  - );
}

// Profiling with Chrome DevTools Protocol
const inspector = require('inspector');
inspector.open();
const session = new inspector.Session();
session.connect();

// CPU profiling
session.post('Profiler.enable');
session.post('Profiler.start');
// ... run problematic code ...
session.post('Profiler.stop', (err, { profile }) => {
  fs.writeFileSync('profile.cpuprofile', JSON.stringify(profile));
});
`

`ash
# Node.js debugging
node --inspect-brk app.js
# Then connect with Chrome DevTools at chrome://inspect

# Memory leak detection
node --expose-gc app.js
# Use global.gc() to force garbage collection

# Async stack traces
node --async-context-frame app.js
`

### Python

`python
# Memory profiling with tracemalloc
import tracemalloc

tracemalloc.start()

# ... run code ...

snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')
for stat in top_stats[:10]:
    print(stat)

# Line-level memory tracking
tracemalloc.start()
current, peak = tracemalloc.get_traced_memory()
print(f"Current: {current / 1024:.1f} KB, Peak: {peak / 1024:.1f} KB")
`

`python
# Debugging with breakpoint
import pdb; pdb.set_trace()

# Or use rich debugger
from rich import print
from rich.traceback import Traceback
try:
    # code that might fail
    pass
except Exception:
    print(Traceback(show_locals=True))
`

`ash
# Py-spy for flame graphs
pip install py-spy
py-spy record -o profile.svg --pid 8692

# Memory profiling
python -m memory_profiler script.py
`

### Go

`go
// Race condition detection
func TestRaceCondition(t *testing.T) {
    var counter int
    var wg sync.WaitGroup
    
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func() {
            counter++
            wg.Done()
        }()
    }
    wg.Wait()
    
    if counter != 100 {
        t.Errorf("Race condition detected: expected 100, got %d", counter)
    }
}
`

`ash
# Run with race detector
go test -race ./...

# CPU profiling
go test -cpuprofile=cpu.prof ./...
go tool pprof cpu.prof

# Memory profiling
go test -memprofile=mem.prof ./...
go tool pprof mem.prof

# Trace execution
go test -trace=trace.out ./...
go tool trace trace.out
`

## Debugging Patterns

### Pattern: Binary Search Debugging

`	ypescript
// Isolate bug by halving the search space
function findBugBoundary(items: any[]): number {
  let low = 0;
  let high = items.length;
  
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (isBuggy(items.slice(0, mid))) {
      high = mid;  // Bug is in first half
    } else {
      low = mid + 1;  // Bug is in second half
    }
  }
  return low;
}
`

### Pattern: Differential Analysis

`ash
# Compare working vs broken execution
diff <(expected_output) <(actual_output)

# Compare network requests
mitmproxy  # intercept and compare requests

# Compare database queries
EXPLAIN ANALYZE -- see query execution plans
`

### Pattern: Time-Travel Debugging

`ash
# Use git bisect for regression bugs
git log --oneline -20  # find recent changes
git stash  # save current state
git checkout 
# test the old version
git checkout 
# test the new version
`

## Memory Leak Detection

### Common Patterns

`	ypescript
// 1. Unclosed event listeners
// Bad
element.addEventListener('click', handler);
// handler captures closure with large state

// Good - clean up listeners
const controller = new AbortController();
element.addEventListener('click', handler, { signal: controller.signal });
// when done: controller.abort()

// 2. Global state accumulation
const cache = new Map();  // Grows without limit

// Good - bounded cache with LRU eviction
const cache = new LRUCache({ maxSize: 1000 });

// 3. Timer/interval leaks
const interval = setInterval(update, 1000);
// Always clear when component unmounts
return () => clearInterval(interval);
`

### Heap Analysis

`javascript
// Capture heap snapshots for comparison
const v8 = require('v8');

// After initial state
const snapshot1 = v8.writeHeapSnapshot();

// After running suspect code
runSuspectCode();

// After GC if possible
if (global.gc) global.gc();

// Capture after state
const snapshot2 = v8.writeHeapSnapshot();

// Compare in Chrome DevTools or use heap snapshot diff
`

## Race Condition Patterns

### Detection Strategies

`go
// 1. Add synchronization primitives
var mu sync.Mutex
var sharedResource interface{}

func safeAccess() {
    mu.Lock()
    defer mu.Unlock()
    // access sharedResource
}

// 2. Use atomic operations for simple values
var counter int64

func increment() {
    atomic.AddInt64(&counter, 1)
}

// 3. Use channels for communication
ch := make(chan Request, bufferSize)
`

### Test for Race Conditions

`	ypescript
// Concurrent access test
it('handles concurrent writes without data race', async () => {
  const results = await Promise.all(
    Array(100).fill(0).map(() => 
      fetch('/api/counter/increment', { method: 'POST' })
    )
  );
  
  const finalCount = await fetch('/api/counter');
  expect(finalCount.value).toBe(100);
});
`

`ash
# Run race detector
go test -race -count=3 ./...  # run 3 times to catch intermittent races

# Thread sanitizer for C++
clang++ -fsanitize=thread -g -O2 program.cpp -o program
./program
`

## Performance Bottleneck Analysis

### Profiling Workflow

`javascript
// 1. Identify slow operations
console.time('operation');
// ... code ...
console.timeEnd('operation');

// 2. Use performance.mark
performance.mark('operation-start');
// ... code ...
performance.mark('operation-end');
performance.measure('operation', 'operation-start', 'operation-end');

// 3. Analyze with Chrome DevTools Performance panel
`

`python
# cProfile for Python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# ... code to profile ...

profiler.disable()

stream = io.StringIO()
stats = pstats.Stats(profiler, stream=stream)
stats.sort_stats('cumulative')
stats.print_stats(20)  # top 20 functions
print(stream.getvalue())
`

### Flame Graph Generation

`ash
# Linux perf for system-level profiling
perf record -F 99 -a -g -- sleep 30
perf script | stackcollapse-perf.pl | flamegraph.pl > output.svg

# Node.js flamegraph
npm install -g 0x
0x script.js
`

## Error Handling Patterns

### Structured Error Responses

`	ypescript
interface AppError {
  code: string;      // Machine-readable error code
  message: string;  // Human-readable message
  details?: object; // Additional context
  stack?: string;   // Stack trace (dev only)
}

function createError(type: ErrorType, message: string, details?: object): AppError {
  return {
    code: type,
    message,
    details,
    stack: process.env.NODE_ENV === 'development' ? new Error().stack : undefined,
  };
}

// Usage
throw createError('DATABASE_CONNECTION', 'Failed to connect to database', {
  host: config.db.host,
  port: config.db.port,
  reason: error.message,
});
`

### Error Recovery Patterns

`	ypescript
// Retry with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts: number; baseDelay: number }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < options.maxAttempts) {
        const delay = options.baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Circuit breaker pattern
class CircuitBreaker {
  private failures = 0;
  private lastFailure: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure! > RECOVERY_TIMEOUT) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
}
`

## Debugging Checklists

### Before Asking for Help

- [ ] Create minimal reproduction case
- [ ] Verify bug exists in isolation
- [ ] Check recent changes (git log)
- [ ] Review error message and stack trace
- [ ] Verify environment (versions, config)
- [ ] Check if this is a known issue
- [ ] Try the simplest fix first
- [ ] Document what you've tried

### During Investigation

- [ ] Form hypothesis before testing
- [ ] Change one variable at a time
- [ ] Use binary search for complex issues
- [ ] Compare with known good state
- [ ] Isolate the failing component
- [ ] Check logs at all levels
- [ ] Verify assumptions with direct checks
- [ ] Keep detailed notes of attempts

### After Fix

- [ ] Verify fix in isolation
- [ ] Run existing test suite
- [ ] Test edge cases
- [ ] Add regression test for the bug
- [ ] Document the fix
- [ ] Review similar patterns for same issue

## Tools Reference

| Tool | Language | Use Case |
|------|----------|----------|
| Chrome DevTools | JS/TS | Memory leaks, CPU profiling, network |
| Node.js --inspect | Node.js | Debugger integration |
| Py-Spy | Python | Flame graphs |
| cProfile | Python | CPU profiling |
| pdb | Python | Interactive debugging |
| Delve | Go | Go debugging |
| go test -race | Go | Race condition detection |
| perf | Linux | System-wide profiling |
| Valgrind | C/C++ | Memory errors |
