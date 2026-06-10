import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { TrialBalanceRow } from '@/types';
import { masterStorage } from '@/utils/masterStorage';

export type SortDirection = 'asc' | 'desc';
export type TBFilterType = 'accountCode' | 'accountName' | 'accountType' | 'period';

export interface TBSortConfig {
  column: string;
  direction: SortDirection;
}

export interface TBFilterConfig {
  type: TBFilterType;
  value: string;
}

export interface GLTrialBalanceState {
  rows: TrialBalanceRow[];
  filteredRows: TrialBalanceRow[];
  isLoading: boolean;
  sortConfig: TBSortConfig | null;
  filters: TBFilterConfig[];
  selectedRowId: string | null;
  pageSize: number;
  currentPage: number;

  setRows: (rows: TrialBalanceRow[]) => void;
  setLoading: (loading: boolean) => void;
  setSort: (column: string, direction: SortDirection) => void;
  addFilter: (filter: TBFilterConfig) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;
  setSelectedRow: (rowId: string | null) => void;
  setPageSize: (size: number) => void;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  refresh: () => void;
  reset: () => void;
}

function applySort(rows: TrialBalanceRow[], sort: TBSortConfig | null): TrialBalanceRow[] {
  if (!sort) return rows;
  const { column, direction } = sort;
  const sorted = [...rows].sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[column] ?? '';
    const bVal = (b as unknown as Record<string, unknown>)[column] ?? '';
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return direction === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
  return sorted;
}

function applyFilters(rows: TrialBalanceRow[], filters: TBFilterConfig[]): TrialBalanceRow[] {
  if (filters.length === 0) return rows;
  return rows.filter((row) =>
    filters.every((f) => {
      const rowVal = String((row as unknown as Record<string, unknown>)[f.type] ?? '').toLowerCase();
      return rowVal.includes(f.value.toLowerCase());
    })
  );
}

const initialState = {
  rows: [] as TrialBalanceRow[],
  filteredRows: [] as TrialBalanceRow[],
  isLoading: false,
  sortConfig: null as TBSortConfig | null,
  filters: [] as TBFilterConfig[],
  selectedRowId: null as string | null,
  pageSize: 50,
  currentPage: 0,
};

export const useGLTrialBalanceStore = create<GLTrialBalanceState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...initialState,

        setRows: (rows) => {
          const sorted = applySort(rows, get().sortConfig);
          const filtered = applyFilters(sorted, get().filters);
          set({ rows, filteredRows: filtered, currentPage: 0, isLoading: false });
        },

        setLoading: (isLoading) => set({ isLoading }),

        setSort: (column, direction) => {
          const sortConfig: TBSortConfig = { column, direction };
          const filtered = applyFilters(get().rows, get().filters);
          const sorted = applySort(filtered, sortConfig);
          set({ sortConfig, filteredRows: sorted, currentPage: 0 });
        },

        addFilter: (filter) =>
          set((state) => {
            state.filters.push(filter);
            const filtered = applyFilters(state.rows, state.filters);
            const sorted = applySort(filtered, state.sortConfig);
            state.filteredRows = sorted;
            state.currentPage = 0;
          }),

        removeFilter: (index) =>
          set((state) => {
            state.filters.splice(index, 1);
            const filtered = applyFilters(state.rows, state.filters);
            const sorted = applySort(filtered, state.sortConfig);
            state.filteredRows = sorted;
            state.currentPage = 0;
          }),

        clearFilters: () =>
          set((state) => {
            state.filters = [];
            const sorted = applySort(state.rows, state.sortConfig);
            state.filteredRows = sorted;
            state.currentPage = 0;
          }),

        setSelectedRow: (selectedRowId) => set({ selectedRowId }),

        setPageSize: (pageSize) =>
          set({ pageSize, currentPage: 0 }),

        setPage: (currentPage) => set({ currentPage }),

        nextPage: () =>
          set((state) => {
            const maxPage = Math.max(0, Math.ceil(state.filteredRows.length / state.pageSize) - 1);
            state.currentPage = Math.min(state.currentPage + 1, maxPage);
          }),

        prevPage: () =>
          set((state) => {
            state.currentPage = Math.max(0, state.currentPage - 1);
          }),

        refresh: () =>
          set((state) => {
            const filtered = applyFilters(state.rows, state.filters);
            const sorted = applySort(filtered, state.sortConfig);
            state.filteredRows = sorted;
          }),

        reset: () => set({ ...initialState }),
      })),
      {
        name: 'gl-trialbalance-store',
        storage: masterStorage,
        partialize: (state) => ({
          pageSize: state.pageSize,
          sortConfig: state.sortConfig,
        }),
      }
    )
  )
);

export const glTrialBalanceSelectors = {
  rows: (state: GLTrialBalanceState) => state.filteredRows,
  totalRows: (state: GLTrialBalanceState) => state.rows.length,
  filteredCount: (state: GLTrialBalanceState) => state.filteredRows.length,
  isLoading: (state: GLTrialBalanceState) => state.isLoading,
  sortConfig: (state: GLTrialBalanceState) => state.sortConfig,
  filters: (state: GLTrialBalanceState) => state.filters,
  selectedRow: (state: GLTrialBalanceState) => state.selectedRowId,
  pageSize: (state: GLTrialBalanceState) => state.pageSize,
  currentPage: (state: GLTrialBalanceState) => state.currentPage,
  totalPages: (state: GLTrialBalanceState) =>
    Math.max(1, Math.ceil(state.filteredRows.length / state.pageSize)),
  hasNext: (state: GLTrialBalanceState) =>
    state.currentPage < Math.ceil(state.filteredRows.length / state.pageSize) - 1,
  hasPrev: (state: GLTrialBalanceState) => state.currentPage > 0,
  pagedRows: (state: GLTrialBalanceState) => {
    const start = state.currentPage * state.pageSize;
    return state.filteredRows.slice(start, start + state.pageSize);
  },
  totalDebits: (state: GLTrialBalanceState) =>
    state.filteredRows.reduce((sum, r) => sum + r.debit, 0),
  totalCredits: (state: GLTrialBalanceState) =>
    state.filteredRows.reduce((sum, r) => sum + r.credit, 0),
  netBalance: (state: GLTrialBalanceState) =>
    state.filteredRows.reduce((sum, r) => sum + r.netChange, 0),
};
