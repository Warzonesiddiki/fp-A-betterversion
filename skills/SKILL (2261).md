---
name: ecommerce-platform-integration
description: Use this skill when integrating e-commerce platforms, managing products/orders/customers via APIs, or automating store operations. Supports Shopify, WooCommerce, and other major platforms via MCP or REST API calls. Based on patterns from mcpmarket.com e-commerce category (724+ servers including Stripe Agent Toolkit, Shopify, WooCommerce, PayPal Agent Toolkit, Razorpay, Square, Xero, Airbnb, Odoo, GoHighLevel, Zomato, and others).
origin: MCP Market E-commerce Category
---

# E-commerce Platform Integration Skill

Integrate and automate major e-commerce platforms using MCP servers and REST APIs. Supports Shopify, WooCommerce, Stripe, PayPal, Square, Razorpay, Odoo, and more from the MCP Market e-commerce category.

## MCP Servers from MCP Market

| Server | Description | Use Case |
|--------|-------------|----------|
| Stripe Agent Toolkit | 995+ servers | AI-powered financial operations |
| Shopify | 205+ servers | Store management via GraphQL |
| WooCommerce | 88+ servers | WordPress store integration |
| PayPal Agent Toolkit | 188+ servers | Braintree and PayPal payments |
| Razorpay | 219+ servers | Indian market payments |
| Square | 99+ servers | Payment processing |
| Odoo | 310+ servers | ERP integration |
| DSers | Dropshipping | AliExpress to Shopify automation |
| Truss Shopify Operations Hub | Full operations | Products, orders, inventory, fulfillment |

## When to Activate

- Product creation, updates, or bulk operations
- Order management and status tracking
- Customer data synchronization
- Inventory level monitoring and updates
- Payment processing and reconciliation
- Multi-store or multi-channel operations

## MCP Configuration Example

\\\json
{
  "mcpServers": {
    "shopify": {
      "command": "uvx",
      "args": ["mcp-shopify"],
      "env": {
        "SHOPIFY_SHOP_DOMAIN": "your-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "your-access-token"
      }
    },
    "stripe": {
      "command": "uvx",
      "args": ["mcp-stripe-agent-toolkit"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_live_..."
      }
    }
  }
}
\\\

## Key Patterns

### 1. Platform Abstraction Layer
\\\python
from abc import ABC, abstractmethod
from typing import Dict, List, Any

class BaseEcommerceClient(ABC):
    @abstractmethod
    def get_products(self, limit: int = 50) -> List[Dict]:
        pass
    
    @abstractmethod
    def get_orders(self, status: str = None) -> List[Dict]:
        pass
    
    @abstractmethod
    def update_inventory(self, product_id: str, quantity: int):
        pass

class ShopifyClient(BaseEcommerceClient):
    def __init__(self, shop_domain: str, access_token: str):
        self.base_url = f"https://{shop_domain}/admin/api/2024-01"
        self.headers = {"X-Shopify-Access-Token": access_token}
    
    def get_products(self, limit: int = 50) -> List[Dict]:
        # GraphQL API implementation
        pass
\\\

### 2. Webhook Handler Pattern
\\\python
import hmac
import hashlib

def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    computed = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={computed}", signature)

def handle_shopify_webhook(payload: dict, event_type: str):
    handlers = {
        "orders/create": on_new_order,
        "orders/updated": on_order_updated,
        "products/update": on_product_updated,
        "inventory_levels/update": on_inventory_update
    }
    handler = handlers.get(event_type)
    if handler:
        handler(payload)
\\\

### 3. Inventory Sync Pattern
\\\python
async def sync_inventory_across_stores(stores: List[EcommerceStore]):
    tasks = []
    for store in stores:
        tasks.append(fetch_inventory_levels(store))
    
    results = await asyncio.gather(*tasks)
    unified_inventory = aggregate_inventory(results)
    
    for store in stores:
        await update_store_inventory(store, unified_inventory)
\\\

## Best Practices

1. **Use MCP servers** for recommended platform integrations
2. **Implement webhook handlers** for real-time updates
3. **Use idempotency keys** for payment and order operations
4. **Handle rate limits** with exponential backoff
5. **Verify webhook signatures** for security
6. **Use database transactions** for order and inventory state
7. **Log all operations** for debugging and compliance

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid API credentials | Refresh access token |
| 429 Rate Limited | API quota exceeded | Implement backoff strategy |
| 422 Unprocessable | Invalid request data | Validate request payload |
| 503 Service Unavailable | Platform outage | Use circuit breaker pattern |
