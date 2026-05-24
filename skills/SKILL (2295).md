---
name: redis-cache-patterns
description: >
  Redis caching patterns for distributed systems, session management,
  pub/sub messaging, and performance optimization. Quick reference for
  Redis data structures and common caching strategies.
metadata:
  origin: MCP Market
  credit: MCPMarket infrastructure patterns
---

# Redis Cache Patterns

Quick reference for Redis caching strategies and patterns.

## When to Activate

- Implementing caching layers
- Session management
- Pub/sub messaging
- Rate limiting
- Distributed locks

## Data Structures

| Structure | Use Case | Commands |
|-----------|----------|----------|
| String | Cache values, counters | `SET`, `GET`, `INCR` |
| Hash | Objects, session data | `HSET`, `HGET`, `HGETALL` |
| List | Queues, timelines | `LPUSH`, `RPOP`, `LRANGE` |
| Set | Unique values, tags | `SADD`, `SMEMBERS`, `SINTER` |
| Sorted Set | Leaderboards, priorities | `ZADD`, `ZRANGE`, `ZREVRANK` |
| Bitmap | Presence tracking | `SETBIT`, `GETBIT` |

## Cache Patterns

**Cache-Aside (Lazy Loading):**
```python
def get_user(user_id):
    cache_key = f"user:{user_id}"
    user = redis.get(cache_key)
    if user:
        return user
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)
    redis.setex(cache_key, 3600, json.dumps(user))
    return user
```

**Write-Through:**
```python
def update_user(user_id, data):
    db.update("users", data, id=user_id)
    redis.setex(f"user:{user_id}", 3600, json.dumps(data))
```

**Read-Through:**
```python
def get_stats(metric):
    cached = redis.get(f"stats:{metric}")
    if cached:
        return json.loads(cached)
    result = compute_stats(metric)
    redis.setex(f"stats:{metric}", 300, json.dumps(result))
    return result
```

## Session Management

```python
# Session with expiration
redis.setex(f"session:{session_id}", 86400, json.dumps({
    "user_id": 123,
    "data": {},
    "created": now()
}))
```

## Pub/Sub Patterns

**Publisher:**
```python
redis.publish("events", json.dumps({
    "type": "user_login",
    "user_id": 123,
    "timestamp": now()
}))
```

**Subscriber:**
```python
pubsub = redis.pubsub()
pubsub.subscribe("events")
for message in pubsub.listen():
    handle_event(json.loads(message["data"]))
```

## Distributed Locks

```python
# Simple lock
def acquire_lock(lock_name, ttl=30):
    result = redis.set(f"lock:{lock_name}", "1", nx=True, ex=ttl)
    return result == True

def release_lock(lock_name):
    redis.delete(f"lock:{lock_name}")
```

## Rate Limiting

```python
def rate_limit(key, limit, window):
    current = redis.incr(key)
    if current == 1:
        redis.expire(key, window)
    return current <= limit
```

## Configuration

```bash
# Connection
redis-cli -h localhost -p 6379

# Key patterns
KEYS user:*          # List all user keys
FLUSHDB              # Clear current database
INFO                 # Server info
```

## Related

- Skill: `backend-patterns` - Backend architecture patterns
- Skill: `sql-optimization` - Database optimization techniques

---

*Based on MCPMarket infrastructure patterns*
