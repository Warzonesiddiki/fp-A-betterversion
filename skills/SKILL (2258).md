---
name: inventory-management-system
description: Use this skill when tracking product stock levels, managing warehouse operations, handling inventory reservations and allocations, or automating reorder triggers. Provides patterns for multi-location inventory tracking.
origin: MCP Market E-commerce Category
---

# Inventory Management System Skill

Track and manage product inventory across multiple locations and sales channels using e-commerce platform APIs and MCP servers.

## MCP Servers from MCP Market

| Server | Description | Use Case |
|--------|-------------|----------|
| Shopify InventoryLevel API | 205+ servers | Real-time stock tracking |
| Odoo Inventory | 310+ servers | Multi-warehouse management |
| DSers | Dropshipping | AliExpress inventory sync |
| Truss Shopify Operations | Full hub | Multi-location tracking |

## When to Activate

- Monitoring stock levels across stores
- Processing inventory adjustments
- Managing warehouse transfers
- Setting reorder points and triggers
- Tracking reserved inventory for orders
- Processing batch inventory operations

## Key Patterns

### 1. Real-time Inventory Sync
\\\python
async def sync_inventory_levels(stores: List[Store], product_id: str, new_quantity: int):
    tasks = []
    for store in stores:
        if store.supports_webhooks:
            # Webhook will handle updates
            continue
        tasks.append(update_store_inventory(store, product_id, new_quantity))
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return aggregate_results(results)
\\\

### 2. Reserved Inventory Pattern
\\\python
class InventoryReservation:
    async def reserve(self, order_id: str, items: List[OrderItem]) -> Reservation:
        async with self.db.transaction():
            for item in items:
                inventory = await self.get_inventory(item.product_id, item.location_id)
                if inventory.available < item.quantity:
                    raise InsufficientInventoryError(item.product_id)
                
                await self.update_inventory(
                    item.product_id,
                    item.location_id,
                    reserved=inventory.reserved + item.quantity
                )
            
            reservation = await self.create_reservation(order_id, items)
            return reservation
    
    async def release(self, reservation_id: str):
        # Release reserved inventory on order cancellation
        pass
    
    async def convert_to_deduction(self, reservation_id: str):
        # Deduct from actual inventory on shipment
        pass
\\\

### 3. Reorder Point Automation
\\\python
class ReorderPointManager:
    def calculate_reorder_point(self, product: Product, lead_time_days: int) -> int:
        avg_daily_sales = product.avg_daily_sales_last_30_days
        safety_stock = product.safety_stock_days * avg_daily_sales
        reorder_point = (avg_daily_sales * lead_time_days) + safety_stock
        return int(reorder_point)
    
    async def check_and_create_po(self, product: Product):
        current = await self.get_inventory(product.id)
        reorder_point = self.calculate_reorder_point(product, product.lead_time_days)
        
        if current.available <= reorder_point:
            await self.create_purchase_order(product, product.reorder_quantity)
            await self.notify_reorder(product)
\\\

### 4. Multi-location Transfer
\\\python
async def initiate_transfer(product_id: str, from_location: str, to_location: str, quantity: int):
    async with db.transaction():
        await decrement_inventory(product_id, from_location, quantity)
        await increment_inventory(product_id, to_location, quantity)
        
        transfer = Transfer(
            product_id=product_id,
            from_location=from_location,
            to_location=to_location,
            quantity=quantity,
            status="in_transit"
        )
        await transfer.save()
        
    return transfer
\\\

## Best Practices

1. **Use webhooks** for real-time inventory updates
2. **Implement atomic transactions** for consistency
3. **Reserve inventory** for pending orders
4. **Calculate safety stock** based on demand patterns
5. **Use idempotency keys** for adjustments
6. **Track all changes** with audit logs
7. **Handle concurrent updates** to prevent overselling

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| InsufficientInventory | Not enough stock | Check alternate locations |
| ConcurrentModification | Race condition | Retry with fresh data |
| LocationNotFound | Invalid warehouse | Validate location ID |
| ProductNotTracked | Inventory not enabled | Enable inventory tracking |
