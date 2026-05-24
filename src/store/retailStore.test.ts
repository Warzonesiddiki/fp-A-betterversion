import { describe, it, expect, beforeEach } from 'vitest';
import { useRetailStore } from './retailStore';

describe('retailStore', () => {
  beforeEach(() => {
    useRetailStore.setState({
      products: [],
      stores: [],
      isLoading: false,
      error: null,
    });
  });

  it('should have initial empty state after reset', () => {
    const state = useRetailStore.getState();
    expect(state.products).toEqual([]);
    expect(state.stores).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set products', () => {
    const products = [
      {
        id: 'p1',
        name: 'Widget',
        sku: 'W-001',
        category: 'Electronics',
        price: 29.99,
        cost: 15.0,
        stock: 100,
        reorderLevel: 20,
      },
    ];
    useRetailStore.getState().setProducts(products);
    expect(useRetailStore.getState().products).toEqual(products);
  });

  it('should add a product', () => {
    useRetailStore.getState().addProduct({
      id: 'p2',
      name: 'Gadget',
      sku: 'G-001',
      category: 'Electronics',
      price: 49.99,
      cost: 25.0,
      stock: 50,
      reorderLevel: 10,
    });
    expect(useRetailStore.getState().products).toHaveLength(1);
    expect(useRetailStore.getState().products[0].name).toBe('Gadget');
  });

  it('should update a product', () => {
    useRetailStore.getState().addProduct({
      id: 'p3',
      name: 'Thingamajig',
      sku: 'T-001',
      category: 'Home',
      price: 19.99,
      cost: 8.0,
      stock: 200,
      reorderLevel: 30,
    });
    useRetailStore.getState().updateProduct('p3', { price: 24.99, stock: 180 });
    const updated = useRetailStore.getState().products[0];
    expect(updated.price).toBe(24.99);
    expect(updated.stock).toBe(180);
  });

  it('should not update non-existent product', () => {
    useRetailStore.getState().addProduct({
      id: 'p4',
      name: 'Test',
      sku: 'T-002',
      category: 'Home',
      price: 10,
      cost: 5,
      stock: 100,
      reorderLevel: 10,
    });
    useRetailStore.getState().updateProduct('nonexistent', { price: 999 });
    expect(useRetailStore.getState().products[0].price).toBe(10);
  });

  it('should remove a product', () => {
    useRetailStore.getState().addProduct({
      id: 'p5',
      name: 'ToRemove',
      sku: 'R-001',
      category: 'Home',
      price: 10,
      cost: 5,
      stock: 100,
      reorderLevel: 10,
    });
    useRetailStore.getState().removeProduct('p5');
    expect(useRetailStore.getState().products).toHaveLength(0);
  });

  it('should set stores', () => {
    const stores = [
      {
        id: 'st1',
        name: 'Downtown',
        location: '123 Main St',
        revenue: 500000,
        footTraffic: 10000,
        conversionRate: 0.25,
      },
    ];
    useRetailStore.getState().setStores(stores);
    expect(useRetailStore.getState().stores).toEqual(stores);
  });

  it('should set loading state', () => {
    useRetailStore.getState().setLoading(true);
    expect(useRetailStore.getState().isLoading).toBe(true);
  });

  it('should set error state', () => {
    useRetailStore.getState().setError('Failed');
    expect(useRetailStore.getState().error).toBe('Failed');
  });

  it('should clear all data', () => {
    useRetailStore.getState().addProduct({
      id: 'p1',
      name: 'Test',
      sku: 'T-001',
      category: 'Home',
      price: 10,
      cost: 5,
      stock: 100,
      reorderLevel: 10,
    });
    useRetailStore.getState().setLoading(true);
    useRetailStore.getState().setError('err');
    useRetailStore.getState().clearAll();
    const state = useRetailStore.getState();
    expect(state.products).toEqual([]);
    expect(state.stores).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should find low stock products', () => {
    useRetailStore.getState().setProducts([
      {
        id: 'p1',
        name: 'A',
        sku: 'A',
        category: 'C',
        price: 10,
        cost: 5,
        stock: 5,
        reorderLevel: 10,
      },
      {
        id: 'p2',
        name: 'B',
        sku: 'B',
        category: 'C',
        price: 10,
        cost: 5,
        stock: 50,
        reorderLevel: 10,
      },
      {
        id: 'p3',
        name: 'C',
        sku: 'C',
        category: 'C',
        price: 10,
        cost: 5,
        stock: 10,
        reorderLevel: 10,
      },
    ]);
    const lowStock = useRetailStore.getState().getLowStockProducts();
    expect(lowStock).toHaveLength(2); // p1 (5<=10) and p3 (10<=10)
  });

  it('should return empty low stock for empty products', () => {
    expect(useRetailStore.getState().getLowStockProducts()).toHaveLength(0);
  });

  it('should get top stores by revenue', () => {
    useRetailStore.getState().setStores([
      {
        id: 'st1',
        name: 'A',
        location: 'L1',
        revenue: 100000,
        footTraffic: 100,
        conversionRate: 0.1,
      },
      {
        id: 'st2',
        name: 'B',
        location: 'L2',
        revenue: 300000,
        footTraffic: 300,
        conversionRate: 0.3,
      },
      {
        id: 'st3',
        name: 'C',
        location: 'L3',
        revenue: 200000,
        footTraffic: 200,
        conversionRate: 0.2,
      },
    ]);
    const top2 = useRetailStore.getState().getTopStores(2);
    expect(top2).toHaveLength(2);
    expect(top2[0].name).toBe('B');
    expect(top2[1].name).toBe('C');
  });

  it('should handle getTopStores with count larger than stores', () => {
    useRetailStore.getState().setStores([
      {
        id: 'st1',
        name: 'A',
        location: 'L1',
        revenue: 100000,
        footTraffic: 100,
        conversionRate: 0.1,
      },
    ]);
    expect(useRetailStore.getState().getTopStores(5)).toHaveLength(1);
  });

  it('should calculate total revenue', () => {
    useRetailStore.getState().setStores([
      {
        id: 'st1',
        name: 'A',
        location: 'L1',
        revenue: 100000,
        footTraffic: 100,
        conversionRate: 0.1,
      },
      {
        id: 'st2',
        name: 'B',
        location: 'L2',
        revenue: 200000,
        footTraffic: 200,
        conversionRate: 0.2,
      },
    ]);
    expect(useRetailStore.getState().getTotalRevenue()).toBe(300000);
  });

  it('should return 0 total revenue for empty stores', () => {
    expect(useRetailStore.getState().getTotalRevenue()).toBe(0);
  });
});
