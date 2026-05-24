---
name: database-design-principles
description: >
  Database design principles covering normalization, schema architecture,
  data modeling, and relationship design. Best practices for creating
  maintainable and performant database structures.
metadata:
  origin: MCP Market
  credit: MCPMarket database management best practices
---

# Database Design Principles

Quick reference for database design and schema architecture.

## When to Activate

- Designing new database schemas
- Refactoring existing databases
- Data modeling for applications
- Normalization decisions
- Performance optimization

## Normalization Forms

| Form | Goal | When to Use |
|------|------|-------------|
| 1NF | Atomic values, no repeating groups | Always start here |
| 2NF | No partial dependencies | Tables with composite keys |
| 3NF | No transitive dependencies | Most OLTP systems |
| BCNF | Handle overlapping candidate keys | Complex schemas |
| 4NF | No multi-valued dependencies | Multi-valued attributes |
| 5NF | Eliminate join dependencies | Specialized cases |

## Schema Design Patterns

**One-to-One:**
```sql
-- Can be same table or separate
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_profiles (
  user_id INT PRIMARY KEY REFERENCES users(id),
  bio TEXT,
  avatar_url VARCHAR(500)
);
```

**One-to-Many:**
```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  total DECIMAL(10,2)
);
```

**Many-to-Many:**
```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255)
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255)
);

CREATE TABLE enrollments (
  student_id INT REFERENCES students(id),
  course_id INT REFERENCES courses(id),
  PRIMARY KEY (student_id, course_id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Data Modeling Best Practices

**Naming Conventions:**
- Tables: plural, snake_case (users, order_items)
- Columns: snake_case (created_at, is_active)
- Primary keys: id or {table}_id
- Foreign keys: {other_table}_id
- Indexes: idx_{table}_{column(s)}

**Column Design:**
- Use appropriate data types (avoid VARCHAR for fixed-length)
- Include audit columns (created_at, updated_at)
- Add deleted_at for soft deletes
- Use BOOLEAN for flags, not strings

## Index Strategy

**When to Index:**
- Foreign keys (enforce relationships)
- Columns in WHERE clauses
- Columns in ORDER BY
- High-cardinality columns

**When NOT to Index:**
- Low-cardinality columns (status, boolean)
- Columns rarely queried
- Text fields with high update frequency

## Anti-Patterns to Avoid

```sql
-- ❌ EAV (Entity-Attribute-Value)
INSERT INTO attributes (entity_id, attr_name, attr_value)
VALUES (1, 'color', 'blue');

-- ✓ Use proper columns
ALTER TABLE products ADD COLUMN color VARCHAR(50);
```

```sql
-- ❌ Storing JSON for searchability
SELECT * FROM orders WHERE data->>'color' = 'blue';

-- ✓ Proper schema with indexed columns
ALTER TABLE orders ADD COLUMN color VARCHAR(50);
CREATE INDEX idx_orders_color ON orders(color);
```

## Migration Checklist

- [ ] Add columns with defaults AFTER existing data
- [ ] Back up before destructive changes
- [ ] Test migrations on staging first
- [ ] Use transactions for multi-step changes
- [ ] Include rollback scripts
- [ ] Document schema changes

## Related

- Skill: `database-migrations` - Safe migration strategies
- Skill: `sql-optimization` - Query optimization
- Skill: `postgres-patterns` - PostgreSQL specific patterns

---

*Based on MCPMarket database design patterns*
