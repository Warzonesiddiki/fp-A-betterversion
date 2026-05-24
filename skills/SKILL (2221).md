---
name: api-documentation-best-practices
description: API documentation patterns including OpenAPI specs, code examples, authentication docs, error references, and interactive documentation experiences.
origin: MCP Market
---

# API Documentation Best Practices

Create API docs that developers actually want to read — accurate, complete, and interactive.

## When to Activate

- Writing API reference documentation
- Creating OpenAPI/Swagger specifications
- Documenting authentication and authorization
- Adding code examples in multiple languages
- Building interactive API explorers
- Reviewing API documentation for completeness

## OpenAPI Specification

### Complete OpenAPI Structure

```yaml
openapi: 3.0.3
info:
  title: Payments API
  version: 2.1.0
  description: |
    The Payments API enables processing payments, managing customers,
    and handling webhooks for your application.

    ## Authentication
    All endpoints require a Bearer token in the Authorization header.

    ```bash
    curl -H "Authorization: Bearer $API_KEY" https://api.example.com/v2/...
    ```

  contact:
    name: API Support
    email: api@example.com
    url: https://developers.example.com/support
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.example.com/v2
    description: Production
  - url: https://sandbox.example.com/v2
    description: Sandbox

tags:
  - name: Payments
    description: Create and manage payments
  - name: Customers
    description: Customer management
  - name: Webhooks
    description: Webhook event handling

paths:
  /payments:
    post:
      operationId: createPayment
      summary: Create a payment
      description: |
        Creates a new payment. Payments are processed asynchronously —
        the response includes a `status` field that indicates whether
        the payment was immediately `succeeded` or is `processing`.
      tags: [Payments]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePaymentRequest'
            example:
              amount: 4999
              currency: USD
              customer_id: cus_abc123
              description: "Invoice #1234"
              payment_method: card
      responses:
        '201':
          description: Payment created
          headers:
            X-Request-Id:
              schema:
                type: string
              description: Unique request identifier
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Payment'
              example:
                id: pay_xyz789
                amount: 4999
                currency: USD
                status: succeeded
                created_at: "2025-01-15T10:30:00Z"
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: API-Key
      description: |
        Your API key can be found in the
        [Dashboard Settings](https://dashboard.example.com/settings/api-keys).

  schemas:
    CreatePaymentRequest:
      type: object
      required:
        - amount
        - currency
        - payment_method
      properties:
        amount:
          type: integer
          description: Amount in the smallest currency unit (cents)
          example: 4999
          minimum: 50
          maximum: 99999999
        currency:
          type: string
          description: ISO 4217 currency code
          example: USD
          enum: [USD, EUR, GBP, CAD, AUD]
        customer_id:
          type: string
          description: Customer ID (optional if payment_method is provided)
          example: cus_abc123
        description:
          type: string
          maxLength: 500
          example: "Invoice #1234"
        payment_method:
          type: string
          enum: [card, bank_account, wallet]
          example: card
        metadata:
          type: object
          additionalProperties:
            type: string
          description: Arbitrary key-value pairs for your records

    Payment:
      type: object
      properties:
        id:
          type: string
          example: pay_xyz789
        amount:
          type: integer
        currency:
          type: string
        status:
          type: string
          enum: [processing, succeeded, failed, refunded]
        created_at:
          type: string
          format: date-time
        customer_id:
          type: string
        description:
          type: string
        metadata:
          type: object

    Error:
      type: object
      required: [code, message]
      properties:
        code:
          type: string
          example: invalid_request
        message:
          type: string
          example: "Missing required field: amount"
        details:
          type: array
          items:
            $ref: '#/components/schemas/FieldError'

    FieldError:
      type: object
      properties:
        field:
          type: string
          example: amount
        code:
          type: string
          example: out_of_range
        message:
          type: string
          example: "Must be between 50 and 99999999"

  responses:
    ValidationError:
      description: Request validation failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: validation_error
            message: Request validation failed
            details:
              - field: amount
                code: out_of_range
                message: "Must be between 50 and 99999999"

    Unauthorized:
      description: Invalid or missing API key
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: unauthorized
            message: "Invalid API key"

    UnprocessableEntity:
      description: Semantically invalid request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

## Code Examples

### Multi-Language Examples

```markdown
## Create a Payment

Creates a new payment with the specified amount and currency.

### Request

```bash
curl -X POST https://api.example.com/v2/payments \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 4999,
    "currency": "USD",
    "customer_id": "cus_abc123",
    "description": "Invoice #1234",
    "payment_method": "card"
  }'
```

```typescript
// TypeScript / Node.js
import { Client } from '@example/payments-sdk';

const client = new Client({ apiKey: process.env.API_KEY });

const payment = await client.payments.create({
  amount: 4999,
  currency: 'USD',
  customerId: 'cus_abc123',
  description: 'Invoice #1234',
  paymentMethod: 'card',
});

console.log(payment.id); // pay_xyz789
console.log(payment.status); // succeeded
```

```python
# Python
import os
from example_payments import Client

client = Client(api_key=os.environ['API_KEY'])

payment = client.payments.create(
    amount=4999,
    currency='USD',
    customer_id='cus_abc123',
    description='Invoice #1234',
    payment_method='card',
)

print(payment.id)  # pay_xyz789
print(payment.status)  # succeeded
```

```go
// Go
package main

import (
    "os"
    "fmt"
    example "github.com/example/payments-go"
)

func main() {
    client := example.NewClient(os.Getenv("API_KEY"))

    payment, err := client.Payments.Create(example.CreatePaymentParams{
        Amount:        4999,
        Currency:      "USD",
        CustomerID:    "cus_abc123",
        Description:   "Invoice #1234",
        PaymentMethod: "card",
    })
    if err != nil {
        panic(err)
    }

    fmt.Println(payment.ID)   // pay_xyz789
    fmt.Println(payment.Status) // succeeded
}
```

### Response Examples

```markdown
### Response

```json
{
  "id": "pay_xyz789",
  "amount": 4999,
  "currency": "USD",
  "status": "succeeded",
  "created_at": "2025-01-15T10:30:00Z",
  "customer_id": "cus_abc123",
  "description": "Invoice #1234",
  "metadata": {}
}
```
```

## Authentication Documentation

### Auth Patterns

```markdown
## Authentication

The Payments API uses API keys for authentication.

### Getting Your API Key

1. Log in to the [Dashboard](https://dashboard.example.com)
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Copy and securely store your key

### Using Your API Key

Include your API key in the `Authorization` header of every request:

```bash
curl https://api.example.com/v2/payments \
  -H "Authorization: Bearer sk_live_abc123..."
```

```typescript
const client = new Client({
  apiKey: 'sk_live_abc123...',
  // Or set via environment variable
  // API_KEY=sk_live_abc123...
});
```

### Key Types

| Environment | Prefix | Use Case |
|------------|--------|----------|
| Live | `sk_live_` | Production traffic |
| Test | `sk_test_` | Development and testing |
| Restricted | `sk_restr_` | Limited scope access |

### Security Best Practices

- **Never expose keys in client-side code** — use server-side calls only
- **Rotate keys immediately** if you suspect compromise
- **Use restricted keys** for third-party integrations
- **Set IP allowlists** for production keys
```

## Error Reference

### Error Response Format

```markdown
## Errors

All errors follow a consistent format:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": [
      {
        "field": "amount",
        "code": "out_of_range",
        "message": "Must be between 50 and 99999999"
      }
    ]
  }
}
```
```

### Error Code Reference

```markdown
| Code | HTTP Status | Description |
|------|------------|-------------|
| `unauthorized` | 401 | Invalid or missing API key |
| `forbidden` | 403 | Valid key but insufficient permissions |
| `not_found` | 404 | Resource doesn't exist |
| `validation_error` | 400 | Invalid request fields |
| `unprocessable_entity` | 422 | Valid JSON but semantically invalid |
| `rate_limit_exceeded` | 429 | Too many requests |
| `conflict` | 409 | Duplicate resource or state conflict |
| `internal_error` | 500 | Server-side error (contact support) |
```

### Handling Errors

```typescript
import { Client, PaymentsError } from '@example/payments-sdk';

const client = new Client({ apiKey: process.env.API_KEY });

try {
  const payment = await client.payments.create({ ... });
} catch (error) {
  if (error instanceof PaymentsError) {
    switch (error.code) {
      case 'validation_error':
        // Handle field-level errors
        error.details.forEach(d => {
          console.error(`Field ${d.field}: ${d.message}`);
        });
        break;
      case 'rate_limit_exceeded':
        // Respect retry-after header
        const retryAfter = error.headers?.['retry-after'];
        await sleep(retryAfter * 1000);
        break;
      case 'unauthorized':
        // Refresh API key
        break;
      default:
        throw error; // Re-throw unexpected errors
    }
  }
}
```

## Interactive Documentation

### SDK Auto-Generation

```yaml
# SDK generation config (openapi-generator)
spec_file: openapi.yaml
output_dir: ./sdk
language: typescript

options:
  projectName: payments-sdk
  npmName: '@example/payments-sdk'
  npmVersion: 2.1.0
  githubAccount: example
  githubRepo: payments-sdk

features:
  - typescript-axios
  - fetch-http-client
```

### Postman Collection

```yaml
# postman-collection.json
{
  "info": {
    "name": "Payments API",
    "version": "2.1.0",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://api.example.com/v2"
    },
    {
      "key": "apiKey",
      "value": "{{$dotenv API_KEY}}"
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{apiKey}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Payments",
      "item": [
        {
          "name": "Create Payment",
          "request": {
            "method": "POST",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/payments",
              "host": ["{{baseUrl}}"],
              "path": ["payments"]
            },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"amount\": 4999,\n  \"currency\": \"USD\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            }
          },
          "response": []
        }
      ]
    }
  ]
}
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| OpenAPI spec as source of truth | Generate docs and SDKs from single source |
| Consistent error format | Developers know what to expect |
| Real code examples, not pseudocode | Reduces friction in adoption |
| Test your own docs | Run the examples; fix broken ones |
| Document edge cases | Include 4xx and 5xx examples |
| Show auth on every endpoint | Don't assume developers will read auth section |
| Version API docs | Keep old versions accessible |
| Interactive sandboxes | Try-it-now increases conversion |

## Common Pitfalls

```
Pitfall: "Examples are pseudocode or placeholder"
Fix: All examples must be runnable; CI tests the examples

Pitfall: "Auth documentation is buried"
Fix: Auth is the very first thing developers read; put it at the top

Pitfall: "Only happy-path responses documented"
Fix: Every endpoint must show error responses too

Pitfall: "Docs drift from implementation"
Fix: Treat OpenAPI spec as code; review in PR; generate from spec

Pitfall: "No working examples in each language"
Fix: Set language parity as a goal; automate generation where possible

Pitfall: "Authentication docs say 'use HTTPS'"
Fix: Be concrete: show exact headers, exact bearer format, exact error codes
```

## Related Skills

- `api-design` — REST API design patterns
- `code-linter-formatter` — linting and formatting code examples
- `technical-writing-standards` — prose style for API reference
- `documentation-as-code` — treating API docs like code with CI/CD
- `documentation-standards` — broader documentation patterns
