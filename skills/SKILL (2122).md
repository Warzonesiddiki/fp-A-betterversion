---
name: ai-api-integration
description: Patterns for integrating AI/LLM APIs into applications, including authentication, error handling, rate limiting, and production best practices.
origin: MCP Market
---

# AI API Integration

## Overview
Patterns for integrating AI/LLM APIs into applications, including authentication, error handling, rate limiting, and production best practices.

## MCP Market References
- **Google Analytics** (2.1k stars) - AI-consumable analytics API
- **Salesforce** (399 stars) - AI integration with CRM
- **Notion** (4.3k stars) - AI-driven content management
- **MCP Link** (604 stars) - OpenAPI to MCP conversion
- **Guardian** (199 stars) - MCP server security management

## API Integration Patterns

### 1. Authentication & Security
- Store keys in secure vault (AWS Secrets, HashiCorp Vault)
- Never expose keys in client-side code
- Implement key rotation policies
- OAuth 2.0 flows for server and service-to-service apps
- Implement refresh token handling

### 2. Request Management
- Timeout configuration (30-120s for LLM calls)
- Retry logic with exponential backoff
- Request queuing for rate limits
- Response caching where appropriate
- Idempotency keys for critical operations

### 3. Error Handling Strategy
**Error Categories:**
- Retryable: Network timeouts, 429 rate limits, 503 service unavailable
- Non-retryable: 400 bad request, 401 unauthorized, 404 not found
- Fatal: Payment required, forbidden, payload too large

### 4. Rate Limiting
- Token bucket algorithm
- Per-endpoint limits
- Global limits consideration
- Adaptive rate limiting based on usage
- Queue management with priority

### 5. Streaming Responses
- Server-Sent Events (SSE) handling
- Chunked response processing
- Real-time progress updates
- Cancellation handling
- Connection pooling

## MCP Server Integration
- Use MCP servers as standardized AI tool interfaces
- Implement proper resource cleanup
- Handle MCP protocol versioning
- Monitor MCP server health

## Production Checklist
- [ ] API key rotation implemented
- [ ] Retry logic with backoff
- [ ] Rate limit handling
- [ ] Timeout configuration
- [ ] Error logging and alerting
- [ ] Circuit breaker pattern
- [ ] Request/response logging (sensitive data masked)
- [ ] Graceful degradation

## Cost Optimization
- Token usage tracking and budgets
- Caching frequent queries
- Request compression
- Model selection based on task complexity
- Batch processing for non-real-time tasks

## Monitoring & Observability
- Request latency percentiles
- Error rate by endpoint
- Token usage trends
- Cost tracking by feature
- Custom business metrics