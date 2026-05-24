---
name: mongodb-best-practices
description: >
  MongoDB database patterns for schema design, indexing, aggregation pipelines,
  and performance optimization. Quick reference for common MongoDB operations
  and best practices based on MCP Market database management patterns.
metadata:
  origin: MCP Market
  credit: MCPMarket database management MCPs
---

# MongoDB Best Practices

Quick reference for MongoDB database design and operations.

## When to Activate

- Designing MongoDB schemas
- Writing aggregation pipelines
- Creating indexes for query optimization
- Working with MongoDB Atlas
- Implementing document modeling

## Index Patterns

| Use Case | Index Type | Command |
|----------|------------|---------|
| Equality queries | Single field | `{ field: 1 }` |
| Sort operations | Compound | `{ field: 1, created: -1 }` |
| Wildcard text | Text index | `{ content: \"text\" }` |
| Geospatial | 2dsphere | `{ location: \"2dsphere\" }` |
| Partial matches | Partial | `{ email: 1 }` with filter |

## Schema Design Patterns

**Normalized References:**
```javascript
// Store reference IDs, not embedded documents
{ user_id: ObjectId("..."), item_id: ObjectId("...") }
```

**Embedded Documents:**
```javascript
// For one-to-few relationships
{
  user: "John",
  addresses: [
    { street: "123 Main", city: "NYC", type: "home" }
  ]
}
```

**Time-Series Data:**
```javascript
// Use separate collections for high-volume time series
{ timestamp: ISODate(), metric: "cpu", value: 85 }
```

## Aggregation Pipeline Patterns

**Basic Pipeline:**
```javascript
db.collection.aggregate([
  { $match: { status: "active" } },
  { $group: { _id: "$category", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } },
  { $limit: 10 }
])
```

**Lookup (Joins):**
```javascript
db.orders.aggregate([
  { $lookup: {
      from: "customers",
      localField: "customer_id",
      foreignField: "_id",
      as: "customer"
    }
  },
  { $unwind: "$customer" }
])
```

## Query Optimization

- Use `explain()` to analyze query plans
- Limit returned fields with projections: `{ field: 1, _id: 0 }`
- Use `hint()` to force specific indexes
- Avoid `$where` for security and performance

## MCP Server Integration

Use these MCP servers with Claude:
- **MongoDB Lens** - Natural language MongoDB queries
- **MongoDB Atlas** - Cloud database management
- **RESTHeart** - Agent-ready MongoDB backend

## Related

- Skill: `postgres-patterns` - PostgreSQL patterns
- Skill: `sql-optimization` - General SQL optimization

---

*Based on MCPMarket database management patterns*
