---
name: order-fulfillment-workflow
description: Use this skill when managing order lifecycles from checkout to delivery, automating fulfillment operations, handling dropshipping, or integrating with shipping carriers. Provides patterns for order processing automation.
origin: MCP Market E-commerce Category
---

# Order Fulfillment Workflow Skill

Manage order lifecycles from checkout to delivery using e-commerce platform APIs and MCP servers.

## MCP Servers from MCP Market

| Server | Description | Use Case |
|--------|-------------|----------|
| Shopify Order API | 205+ servers | Order management |
| DSers | Dropshipping | AliExpress fulfillment |
| Truss Shopify Operations Hub | Full operations | Complete workflow |
| Rohlik | Grocery delivery | 108+ servers |

## When to Activate

- Processing new orders
- Managing order status updates
- Handling order cancellations
- Integrating with shipping carriers
- Processing returns and refunds
- Automating fulfillment workflows

## Key Patterns

### 1. Order State Machine
\\\python
from enum import Enum
from typing import Optional
import asyncio

class OrderState(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class OrderWorkflow:
    transitions = {
        OrderState.PENDING: [OrderState.CONFIRMED, OrderState.CANCELLED],
        OrderState.CONFIRMED: [OrderState.PROCESSING, OrderState.CANCELLED],
        OrderState.PROCESSING: [OrderState.SHIPPED, OrderState.CANCELLED],
        OrderState.SHIPPED: [OrderState.DELIVERED],
        OrderState.DELIVERED: [OrderState.REFUNDED],
    }
    
    def can_transition(self, current: OrderState, target: OrderState) -> bool:
        return target in self.transitions.get(current, [])
    
    async def transition(self, order_id: str, target: OrderState):
        order = await self.get_order(order_id)
        if not self.can_transition(order.state, target):
            raise InvalidTransitionError(order.state, target)
        
        await self.update_order_state(order_id, target)
        await self.trigger_state_webhook(order_id, target)
\\\

### 2. Dropshipping Order Flow
\\\python
async def process_dropship_order(order: Order, supplier: AliExpressSupplier):
    items = await extract_dropship_items(order)
    
    for item in items:
        product = await supplier.find_product(item.product_id)
        if not product or product.price > item.max_price:
            await flag_order_issue(order.id, f"Price mismatch: {item.product_id}")
            continue
        
        await supplier.create_order(
            product_id=product.id,
            quantity=item.quantity,
            shipping_address=order.shipping_address
        )
        
    await update_order_state(order.id, OrderState.PROCESSING)
    await send_customer_notification(order, "order_processing")
\\\

### 3. Shipping Label Generation
\\\python
async def generate_shipping_label(order: Order, carrier: str = "usps"):
    rate = await carrier_api.get_rates(order.shipping_address, order.weight)
    selected_rate = min(rate.options, key=lambda x: x.price)
    
    label = await carrier_api.create_label(
        from_address=warehouse.address,
        to_address=order.shipping_address,
        parcel=order.parcel,
        service=selected_rate.service
    )
    
    await order.attach_label(label)
    await update_tracking(order.id, label.tracking_number)
    
    return label
\\\

### 4. Returns Processing
\\\python
async def process_return(order_id: str, return_request: ReturnRequest):
    order = await get_order(order_id)
    
    if not order.is_within_return_window():
        raise ReturnWindowExpiredError()
    
    if not await validate_return_items(order, return_request.items):
        raise InvalidReturnItemsError()
    
    rma = await create_rma(order.id, return_request)
    
    await refund_order(order.id, return_request.refund_amount)
    await notify_warehouse_of_return(rma)
    
    return rma
\\\

## Best Practices

1. **Use webhook-driven updates** for real-time status
2. **Implement idempotent handlers** to prevent duplicates
3. **Reserve inventory** before processing
4. **Use state machines** for order lifecycle
5. **Send notifications** at key milestones
6. **Log all operations** for audit
7. **Handle edge cases** (partial fulfillment, backorders)

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| InsufficientInventory | Out of stock | Suggest alternatives |
| InvalidAddress | Shipping issue | Request address correction |
| CarrierError | API failure | Retry with backoff |
| DuplicateWebhook | Retried event | Use idempotency key |
