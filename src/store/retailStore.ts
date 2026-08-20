// @money-ast-allow Reason: Sort comparator: b.revenue - a.revenue returns sign for Array.sort(), not a money result
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

/**
 * A promotion the user has actually recorded.
 *
 * Added in session 021. `PromoAnalysisPage` previously hardcoded five
 * campaigns (Summer Sale, Back to School, Holiday Bundle …) with costs,
 * revenues and baselines, read the GL only to discard it (`entries: _entries`)
 * and exported the invented figures to PDF and Excel. Promotions are not
 * general-ledger objects, so they live here as user input and default to an
 * empty list — a workspace with no campaigns shows no campaigns.
 */
export interface RetailPromotion {
  id: string;
  name: string;
  type: string;
  /** Discount offered, percent. */
  discountPercent: number;
  startDate: string;
  endDate: string;
  /** Promotion spend. */
  cost: number;
  /** Revenue recorded during the promotion window. */
  revenue: number;
  /** Revenue that would have been expected without it. */
  baselineRevenue: number;
  /**
   * Gross margin on incremental revenue, percent. Optional: without it, return
   * on spend can only be stated on a revenue basis, never as profit.
   */
  grossMarginPercent?: number;
  status: 'planned' | 'active' | 'completed';
}

interface RetailState {
  products: RetailProduct[];
  stores: RetailStoreLocation[];
  promotions: RetailPromotion[];
  isLoading: boolean;
  error: string | null;
  setProducts: (products: RetailProduct[]) => void;
  addProduct: (product: RetailProduct) => void;
  updateProduct: (id: string, updates: Partial<RetailProduct>) => void;
  removeProduct: (id: string) => void;
  setStores: (stores: RetailStoreLocation[]) => void;
  setPromotions: (promotions: RetailPromotion[]) => void;
  addPromotion: (promotion: RetailPromotion) => void;
  removePromotion: (id: string) => void;
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
        promotions: [],
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

        setPromotions: enforce(Permissions.ENTITY_UPDATE, 'setPromotions', (promotions) =>
          set((state) => {
            state.promotions = promotions;
          })
        ),

        addPromotion: enforce(Permissions.ENTITY_CREATE, 'addPromotion', (promotion) =>
          set((state) => {
            state.promotions.push(promotion);
          })
        ),

        removePromotion: enforce(Permissions.ENTITY_DELETE, 'removePromotion', (id) =>
          set((state) => {
            state.promotions = state.promotions.filter((p) => p.id !== id);
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
            state.promotions = [];
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
        version: 2,
        // v1 -> v2 introduces `promotions`, defaulting to empty. A persisted v1
        // workspace must not materialise campaigns it never entered.
        migrate: (state: unknown) => {
          if (state && typeof state === 'object' && !('promotions' in state)) {
            return { ...(state as Record<string, unknown>), promotions: [] };
          }
          return state;
        },
      }
    )
  )
);
