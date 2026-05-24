---
name: sql-optimization
description: >
  SQL query optimization techniques for improving database performance.
  Covers indexing strategies, query analysis, execution plans, and common
  performance anti-patterns.
metadata:
  origin: MCP Market
  credit: MCPMarket database optimization patterns
---

# SQL Optimization

Quick reference for optimizing SQL queries and database performance.

## When to Activate

- Slow query diagnosis
- Query performance tuning
- Execution plan analysis
- Index optimization
- Connection pooling

## Query Analysis

**PostgreSQL - EXPLAIN:**
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders
WHERE status = 'pending'
ORDER BY created_at DESC;
```

**MySQL - EXPLAIN:**
```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE customer_id = 123;
```

## Common Optimizations

**Avoid SELECT *:**
```sql
-- ❌ Slow: retrieves all columns
SELECT * FROM orders;

-- ✓ Fast: retrieves only needed columns
SELECT id, total, status FROM orders;
```

**Use EXISTS instead of IN:**
```sql
-- ❌ Subquery in IN
SELECT * FROM customers
WHERE id IN (SELECT customer_id FROM orders);

-- ✓ EXISTS is faster
SELECT * FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

**Limit with Index:**
```sql
-- ❌ OFFSET is slow on large tables
SELECT * FROM products ORDER BY id LIMIT 100 OFFSET 10000;

-- ✓ Cursor pagination is O(1)
SELECT * FROM products
WHERE id > 10000
ORDER BY id
LIMIT 100;
```

## Index Optimization

**Composite Index Order:**
```sql
-- Put equality conditions first
CREATE INDEX idx ON orders (status, customer_id, created_at);
-- Good for: WHERE status = 'pending' AND customer_id = 123

-- Bad for: WHERE created_at > '2024-01-01'
```

**Covering Index:**
```sql
CREATE INDEX idx ON users (email) INCLUDE (name, created_at);
-- Avoids table lookups for this query:
SELECT email, name, created_at FROM users WHERE email = 'test@example.com';
```

**Partial Index:**
```sql
CREATE INDEX idx_active_users ON users (email)
WHERE deleted_at IS NULL;
-- Only indexes active users
```

## JOIN Optimization

**Prefer JOIN over Subquery:**
```sql
-- ❌ Subquery
SELECT (SELECT name FROM customers WHERE id = o.customer_id)
FROM orders o;

-- ✓ JOIN
SELECT c.name
FROM orders o
JOIN customers c ON c.id = o.customer_id;
```

**Reduce JOINs:**
```sql
-- Denormalize read-heavy queries
-- Add frequently accessed columns to avoid JOINs
ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255);
```

## Configuration Tuning

**PostgreSQL:**
```sql
-- Enable query analysis
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Check slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**MySQL:**
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- Analyze queries
SHOW FULL PROCESSLIST;
```

## Anti-Patterns

| Anti-Pattern | Impact | Solution |
|--------------|--------|----------|
| SELECT * | Memory bloat | Specify columns |
| LIKE '%search%' | No index use | Full-text search |
| Nested subqueries | O(n^n) complexity | JOINs/CTEs |
| Implicit casting | Index bypass | Match data types |
| OR in WHERE | Index fragmentation | UNION or IN |

## Connection Pooling

**pgBouncer (PostgreSQL):**
```ini
[databases]
mydb = host=localhost port=5432 dbname=mydb

[pgbouncer]
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20
```

## Monitoring Queries

```sql
-- PostgreSQL: Find slowest queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- MySQL: Check long-running queries
SELECT * FROM information_schema.processlist
WHERE time > 60
ORDER BY time DESC;
```

## Related

- Skill: `postgres-patterns` - PostgreSQL specific patterns
- Skill: `database-design-principles` - Schema design
- Skill: `backend-patterns` - Application-level caching

---

*Based on MCPMarket SQL optimization patterns*
