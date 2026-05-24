---
name: payment-gateway-integration
description: Use this skill when integrating payment processors like Stripe, PayPal, Square, Razorpay into e-commerce platforms. Supports payment processing, refunds, webhooks, and transaction management via MCP or REST APIs.
origin: MCP Market E-commerce Category
---

# Payment Gateway Integration Skill

Integrate payment processors into e-commerce platforms using MCP servers and REST APIs. Supports Stripe, PayPal, Square, Razorpay, and other payment solutions.

## MCP Servers from MCP Market

| Server | Description | Use Case |
|--------|-------------|----------|
| Stripe Agent Toolkit | 995+ servers (top-ranked) | Payment intents, charges, subscriptions |
| PayPal Agent Toolkit | 188+ servers | Braintree, PayPal Commerce |
| Square | 99+ servers | POS and online payments |
| Razorpay | 219+ servers | Indian market payments |
| Zen7 Payment Agent | 178+ servers | AI-native DApp payments |

## When to Activate

- Processing payments and charges
- Handling refunds and disputes
- Managing subscriptions and recurring billing
- Processing webhooks for payment events
- Implementing multi-currency support
- Setting up payment methods and vaults

## MCP Configuration Example

\\\json
{
  "mcpServers": {
    "stripe": {
      "command": "uvx",
      "args": ["mcp-stripe-agent-toolkit"],
      "env": {"STRIPE_SECRET_KEY": "sk_live_..."}
    },
    "paypal": {
      "command": "uvx",
      "args": ["mcp-paypal-agent-toolkit"],
      "env": {
        "PAYPAL_CLIENT_ID": "...",
        "PAYPAL_CLIENT_SECRET": "..."
      }
    }
  }
}
\\\

## Key Patterns

### 1. Payment Intent Flow
\\\python
async def create_payment_intent(client, amount: int, currency: str, customer_id: str):
    intent = await client.payment_intents.create({
        "amount": amount,
        "currency": currency,
        "customer": customer_id,
        "payment_method_types": ["card"],
        "idempotency_key": generate_idempotency_key()
    })
    return intent

async def confirm_payment(intent_id: str, payment_method_id: str):
    return await stripe.payment_intents.confirm(
        intent_id,
        {"payment_method": payment_method_id}
    )
\\\

### 2. Webhook Handler Pattern
\\\python
from fastapi import FastAPI, Request, HTTPException
import hmac
import hashlib

app = FastAPI()

@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    
    if not verify_stripe_signature(payload, signature, webhook_secret):
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    event = json.loads(payload)
    
    handlers = {
        "payment_intent.succeeded": on_payment_success,
        "payment_intent.payment_failed": on_payment_failure,
        "charge.refunded": on_refund_processed,
        "dispute.created": on_dispute_created
    }
    
    handler = handlers.get(event["type"])
    if handler:
        await handler(event["data"]["object"])
    
    return {"received": True}
\\\

### 3. Refund Processing Pattern
\\\python
async def process_refund(client, charge_id: str, amount: int = None, reason: str = None):
    return await client.refunds.create({
        "charge": charge_id,
        "amount": amount,  # None for full refund
        "reason": reason,
        "idempotency_key": f"refund_{charge_id}_{uuid.uuid4()}"
    })
\\\

### 4. Subscription Billing Pattern
\\\python
async def create_subscription(client, customer_id: str, price_id: str, trial_days: int = 0):
    return await client.subscriptions.create({
        "customer": customer_id,
        "items": [{"price": price_id}],
        "trial_period_days": trial_days,
        "payment_behavior": "default_incomplete"
    })
\\\

## Best Practices

1. **Always use idempotency keys** to prevent duplicate charges
2. **Verify webhook signatures** before processing
3. **Handle 3D Secure authentication** flow
4. **Use database transactions** for payment state
5. **Implement retry logic** with exponential backoff
6. **Log all payment operations** for audit
7. **Store payment methods securely** using tokenization

## Error Handling

| Error Code | Meaning | Action |
|------------|---------|--------|
| card_declined | Card was declined | Ask customer to try another card |
| insufficient_funds | Not enough funds | Ask customer to add funds |
| expired_card | Card expired | Request new card details |
| processing_error | Temporary error | Retry with backoff |
| 3d_secure_required | Requires auth | Redirect to authentication |
