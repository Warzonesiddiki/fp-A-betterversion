import { describe, it, expect, beforeEach } from 'vitest';
import { useGLTrialBalanceStore, glTrialBalanceSelectors } from './glTrialBalanceStore';
import type { TrialBalanceRow } from '@/types';

describe('glTrialBalanceStore', () => {
  beforeEach(() => {
    useGLTrialBalanceStore.setState({
      rows: [],
      filteredRows: [],
      isLoading: false,
      sortConfig: null,
      filters: [],
      selectedRowId: null,
      pageSize: 50,
      currentPage: 0,
    });
  });

  const mockRows: TrialBalanceRow[] = [
    {
      accountId: '1',
      accountCode: '1000',
      accountName: 'Cash',
      accountType: 'Asset',
      beginningBalance: 10000,
      debit: 5000,
      credit: 2000,
      netChange: 3000,
      endingBalance: 13000,
    },
    {
      accountId: '2',
      accountCode: '2000',
      accountName: 'AP',
      accountType: 'Liability',
      beginningBalance: 5000,
      debit: 1000,
      credit: 3000,
      netChange: -2000,
      endingBalance: 3000,
    },
    {
      accountId: '3',
      accountCode: '3000',
      accountName: 'Revenue',
      accountType: 'Revenue',
      beginningBalance: 0,
      debit: 0,
      credit: 10000,
      netChange: -10000,
      endingBalance: -10000,
    },
  ];

  it('starts with empty rows', () => {
    const state = useGLTrialBalanceStore.getState();
    expect(state.rows).toEqual([]);
    expect(state.filteredRows).toEqual([]);
  });

  it('setRows populates rows and filteredRows', () => {
    useGLTrialBalanceStore.getState().setRows(mockRows);
    const state = useGLTrialBalanceStore.getState();
    expect(state.rows).toHaveLength(3);
    expect(state.filteredRows).toHaveLength(3);
    expect(state.isLoading).toBe(false);
  });

  it('setSort sorts ascending by accountCode', () => {
    useGLTrialBalanceStore.getState().setRows(mockRows);
    useGLTrialBalanceStore.getState().setSort('accountCode', 'asc');
    const { filteredRows } = useGLTrialBalanceStore.getState();
    expect(filteredRows[0]?.accountCode).toBe('1000');
    expect(filteredRows[2]?.accountCode).toBe('3000');
  });

  it('setSort sorts descending by debit', () => {
    useGLTrialBalanceStore.getState().setRows(mockRows);
    useGLTrialBalanceStore.getState().setSort('debit', 'desc');
    const { filteredRows } = useGLTrialBalanceStore.getState();
    expect(filteredRows[0]?.debit).toBe(5000);
    expect(filteredRows[2]?.debit).toBe(0);
  });

  it('addFilter filters rows', () => {
    useGLTrialBalanceStore.getState().setRows(mockRows);
    useGLTrialBalanceStore.getState().addFilter({ type: 'accountType', value: 'Asset' });
    const { filteredRows } = useGLTrialBalanceStore.getState();
    expect(filteredRows).toHaveLength(1);
    expect(filteredRows[0]?.accountType).toBe('Asset');
  });

  it('addFilter with accountName search', () => {
    useGLTrialBalanceStore.getState().setRows(mockRows);
    useGLTrialBalanceStore.getState().addFilter({ type: 'accountName', value: 'cash' });
    const { filteredRows } = useGLTrialBalanceStore.getState();
    expect(filteredRows).toHaveLength(1);
    expect(filteredRows[0]?.accountName).toBe('Cash');
  });

  it('removeFilter restores rows', () => {
    useGLTrialBalanceStore.getState().setRows(mockRows);
    useGLTrialBalanceStore.getState().addFilter({ type: 'accountType', value: 'Asset' });
    useGLTrialBalanceStore.getState().removeFilter(0);
    const { filteredRows } = useGLTrialBalanceStore.getState();
    expect(filteredRows).toHaveLength(3);
  });

  it('clearFilters removes all filters', () => {
    useGLTrialBalanceStore.getState().setRows(mockRows);
    useGLTrialBalanceStore.getState().addFilter({ type: 'accountType', value: 'Asset' });
    useGLTrialBalanceStore.getState().addFilter({ type: 'accountCode', value: '1' });
    useGLTrialBalanceStore.getState().clearFilters();
    const { filteredRows } = useGLTrialBalanceStore.getState();
    expect(filteredRows).toHaveLength(3);
    expect(useGLTrialBalanceStore.getState().filters).toEqual([]);
  });

  it('pagination selectors work correctly', () => {
    useGLTrialBalanceStore.getState().setRows(mockRows);
    useGLTrialBalanceStore.getState().setPageSize(2);
    const state = useGLTrialBalanceStore.getState();
    expect(state.pageSize).toBe(2);
    expect(state.currentPage).toBe(0);

    const paged = glTrialBalanceSelectors.pagedRows(state);
    expect(paged).toHaveLength(2);

    useGLTrialBalanceStore.getState().nextPage();
    const nextPaged = glTrialBalanceSelectors.pagedRows(useGLTrialBalanceStore.getState());
    expect(nextPaged).toHaveLength(1);
  });

  it('nextPage does not exceed max page', () => {
    useGLTrialBalanceStore.getState().setRows(mockRows);
    useGLTrialBalanceStore.getState().setPageSize(2);
    useGLTrialBalanceStore.getState().nextPage();
    useGLTrialBalanceStore.getState().nextPage();
    useGLTrialBalanceStore.getState().nextPage();
    expect(useGLTrialBalanceStore.getState().currentPage).toBe(1);
  });

  it('prevPage does not go below 0', () => {
    useGLTrialBalanceStore.getState().prevPage();
    expect(useGLTrialBalanceStore.getState().currentPage).toBe(0);
  });

  it('setSelectedRow updates selection', () => {
    useGLTrialBalanceStore.getState().setSelectedRow('1');
    expect(useGLTrialBalanceStore.getState().selectedRowId).toBe('1');
    useGLTrialBalanceStore.getState().setSelectedRow(null);
    expect(useGLTrialBalanceStore.getState().selectedRowId).toBeNull();
  });

  it('selectors return correct computed values', () => {
    const state = useGLTrialBalanceStore.getState();
    expect(glTrialBalanceSelectors.totalRows(state)).toBe(0);
    expect(glTrialBalanceSelectors.filteredCount(state)).toBe(0);
    expect(glTrialBalanceSelectors.totalPages(state)).toBe(1);
    expect(glTrialBalanceSelectors.hasNext(state)).toBe(false);
    expect(glTrialBalanceSelectors.hasPrev(state)).toBe(false);
    expect(glTrialBalanceSelectors.totalDebits(state)).toBe(0);
    expect(glTrialBalanceSelectors.totalCredits(state)).toBe(0);
    expect(glTrialBalanceSelectors.netBalance(state)).toBe(0);
  });

  it('aggregate selectors compute correctly with data', () => {
    useGLTrialBalanceStore.getState().setRows(mockRows);
    const state = useGLTrialBalanceStore.getState();

    expect(glTrialBalanceSelectors.totalRows(state)).toBe(3);
    expect(glTrialBalanceSelectors.totalDebits(state)).toBe(6000);
    expect(glTrialBalanceSelectors.totalCredits(state)).toBe(15000);
    expect(glTrialBalanceSelectors.netBalance(state)).toBe(-9000);
  });

  it('reset returns to initial state', () => {
    useGLTrialBalanceStore.getState().setRows(mockRows);
    useGLTrialBalanceStore.getState().setSort('accountCode', 'desc');
    useGLTrialBalanceStore.getState().reset();
    const state = useGLTrialBalanceStore.getState();
    expect(state.rows).toEqual([]);
    expect(state.filteredRows).toEqual([]);
    expect(state.sortConfig).toBeNull();
  });

  it('refresh re-applies filters and sort', () => {
    useGLTrialBalanceStore.getState().setRows(mockRows);
    useGLTrialBalanceStore.getState().addFilter({ type: 'accountType', value: 'Asset' });
    const state = useGLTrialBalanceStore.getState();
    expect(state.filteredRows).toHaveLength(1);

    useGLTrialBalanceStore.getState().refresh();
    expect(useGLTrialBalanceStore.getState().filteredRows).toHaveLength(1);
  });
});
