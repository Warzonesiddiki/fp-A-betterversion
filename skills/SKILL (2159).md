---
name: rest-graphql-patterns
description: Architectural patterns for building and consuming REST and GraphQL APIs with best practices.
origin: MCP Market
---

# REST and GraphQL API Patterns

## Overview

This skill covers architectural patterns for building and consuming REST and GraphQL APIs, based on best practices from MCP integrations and modern API design.

## REST API Patterns

### 1. Resource-Oriented Design

Standard REST resource patterns:
- Collection: /resources
- Single: /resources/{id}
- Related: /resources/{id}/sub-resources

Example endpoints:
- GET /products - List all products
- POST /products - Create new product
- GET /products/{id} - Get product by ID
- PUT /products/{id} - Update product (full)
- PATCH /products/{id} - Update product (partial)
- DELETE /products/{id} - Delete product

### 2. Pagination Patterns

Offset-based pagination:
class OffsetPagination:
    def __init__(self, page=1, per_page=20):
        self.page = max(1, page)
        self.per_page = min(per_page, 100)
    
    @property
    def offset(self):
        return (self.page - 1) * self.per_page

Cursor-based pagination:
class CursorPagination:
    def __init__(self, cursor=None, limit=20):
        self.cursor = cursor
        self.limit = limit

### 3. Error Response Standardization

Common error codes:
- 400: bad_request
- 401: unauthorized
- 403: forbidden
- 404: not_found
- 422: validation_error
- 429: rate_limit
- 500: server_error

## GraphQL Patterns

### 1. Schema Design

GraphQL types:
- Query: Product queries with filtering and pagination
- Mutation: Create, update, delete operations
- Connection: Edge-based pagination with pageInfo
- Input: Filter and input types for operations

### 2. Query Patterns

Fragment example:
fragment ProductFields on Product {
    id
    name
    price
    category { id name }
}

Query example:
query GetProductMinimal(productId: ID!) {
    product(id: productId) {
        id
        name
        price
    }
}

### 3. Mutation Patterns

Create mutation:
mutation CreateProduct(input: CreateProductInput!) {
    createProduct(input: input) {
        id
        name
    }
}

Update mutation:
mutation UpdateProduct(id: ID!, input: UpdateProductInput!) {
    updateProduct(id: id, input: input) {
        id
        name
    }
}

### 4. Data Loader Pattern (N+1 Prevention)

class DataLoader:
    def __init__(self, batch_fn, batch_wait=0.01):
        self.batch_fn = batch_fn
        self.batch_wait = batch_wait
        self.cache = {}
        self.pending = []
    
    async def load(self, key):
        if key in self.cache:
            return self.cache[key]
        self.pending.append(key)
        return await self._wait_for(key)
    
    async def _flush(self):
        await asyncio.sleep(self.batch_wait)
        if self.pending:
            keys = list(self.pending)
            self.pending = []
            results = await self.batch_fn(keys)
            for key, result in zip(keys, results):
                self.cache[key] = result

## Best Practices

### REST
1. Use plural nouns for resources
2. Use proper HTTP methods
3. Return appropriate status codes
4. Use versioning in URL
5. Implement proper caching

### GraphQL
1. Design schema around domain types
2. Use connections for pagination
3. Implement DataLoader for N+1 prevention
4. Use fragments to reduce duplication
5. Add proper validation

### Both
1. Document all endpoints
2. Implement error handling
3. Add rate limiting
4. Version your API
5. Use proper authentication
