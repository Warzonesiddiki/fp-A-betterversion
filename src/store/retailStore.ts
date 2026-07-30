import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import { enforce, Permissions } from '@/utils/rbacEnforcer';
import { sumMoney } from '@/utils/money';

export interface RetailProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reorderLevel: number;
}

export interface RetailStoreLocation {
  id: string;
  name: string;
  location: string;
  revenue: number;
  footTraffic: number;
  conversionRate: number;
}

interface RetailState {
  products: RetailProduct[];
  stores: RetailStoreLocation[];
  isLoading: boolean;
  error: string | null;
  setProducts: (products: RetailProduct[]) => void;
  addProduct: (product: RetailProduct) => void;
  updateProduct: (id: string, updates: Partial<RetailProduct>) => void;
  removeProduct: (id: string) => void;
  setStores: (stores: RetailStoreLocation[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
  getLowStockProducts: () => RetailProduct[];
  getTopStores: (count: number) => RetailStoreLocation[];
  getTotalRevenue: () => number;
}

export const useRetailStore = create<RetailState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        products: [],
        stores: [],
        isLoading: false,
        error: null,

        setProducts: enforce(Permissions.INVENTORY_UPDATE, 'setProducts', (products) =>
          set((state) => {
            state.products = products;
          })
        ),

        addProduct: enforce(Permissions.INVENTORY_CREATE, 'addProduct', (product) =>
          set((state) => {
            state.products.push(product);
          })
        ),

        updateProduct: enforce(Permissions.INVENTORY_UPDATE, 'updateProduct', (id, updates) =>
          set((state) => {
            const idx = state.products.findIndex((p) => p.id === id);
            if (idx !== -1) Object.assign(state.products[idx]!, updates);
          })
        ),

        removeProduct: enforce(Permissions.INVENTORY_DELETE, 'removeProduct', (id) =>
          set((state) => {
            state.products = state.products.filter((p) => p.id !== id);
          })
        ),

        setStores: enforce(Permissions.ENTITY_UPDATE, 'setStores', (stores) =>
          set((state) => {
            state.stores = stores;
          })
        ),

        setLoading: (isLoading) =>
          set((state) => {
            state.isLoading = isLoading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        clearAll: enforce(Permissions.INVENTORY_DELETE, 'clearAll', () =>
          set((state) => {
            state.products = [];
            state.stores = [];
            state.isLoading = false;
            state.error = null;
          })
        ),

        getLowStockProducts: () => get().products.filter((p) => p.stock <= p.reorderLevel),

        getTopStores: (count) =>
          [...get().stores].sort((a, b) => b.revenue - a.revenue).slice(0, count),

        getTotalRevenue: () => sumMoney(get().stores.map((s) => s.revenue)).toNumber(),
      })),
      {
        name: 'retail-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
