/**
 * Data Permission Filter — Tests
 */

import { describe, it, expect } from 'vitest';
import {
  applyRowFilters,
  applyColumnFilters,
  maskRowValues,
  applyDataPermissions,
  getEffectivePermissions,
  hasDataPermission,
} from '../dataPermissionFilter';
import type { DataPermission, RowFilter, ColumnFilter } from '@/types/permissions';

describe('dataPermissionFilter', () => {
  const sampleRows = [
    { department: 'Engineering', account: 'Revenue', amount: 100000, salary: 150000 },
    { department: 'Sales', account: 'Revenue', amount: 200000, salary: 120000 },
    { department: 'HR', account: 'Expenses', amount: 50000, salary: 100000 },
    { department: 'Engineering', account: 'Expenses', amount: 80000, salary: 140000 },
  ];
  const allColumns = ['department', 'account', 'amount', 'salary'];

  describe('applyRowFilters', () => {
    it('returns all rows when no filters', () => {
      expect(applyRowFilters(sampleRows, [])).toHaveLength(4);
    });

    it('filters by equals', () => {
      const filters: RowFilter[] = [
        { id: '1', field: 'department', operator: 'equals', values: ['Engineering'], hardHide: true },
      ];
      const result = applyRowFilters(sampleRows, filters);
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.department === 'Engineering')).toBe(true);
    });

    it('filters by in', () => {
      const filters: RowFilter[] = [
        { id: '1', field: 'department', operator: 'in', values: ['Engineering', 'Sales'], hardHide: true },
      ];
      expect(applyRowFilters(sampleRows, filters)).toHaveLength(3);
    });

    it('filters by between', () => {
      const filters: RowFilter[] = [
        { id: '1', field: 'amount', operator: 'between', values: [60000, 150000], hardHide: false },
      ];
      const result = applyRowFilters(sampleRows, filters);
      expect(result).toHaveLength(2); // 100k and 80k (50k < 60k, 200k > 150k)
    });
  });

  describe('applyColumnFilters', () => {
    it('returns all columns when no filters', () => {
      const result = applyColumnFilters(allColumns, []);
      expect(result.visibleColumns).toEqual(allColumns);
      expect(result.maskedColumns).toHaveLength(0);
    });

    it('hides columns', () => {
      const filters: ColumnFilter[] = [
        { id: '1', field: 'salary', visible: false, masked: false, readOnly: false },
      ];
      const result = applyColumnFilters(allColumns, filters);
      expect(result.visibleColumns).not.toContain('salary');
    });

    it('masks columns', () => {
      const filters: ColumnFilter[] = [
        { id: '1', field: 'salary', visible: true, masked: true, readOnly: false },
      ];
      const result = applyColumnFilters(allColumns, filters);
      expect(result.visibleColumns).toContain('salary');
      expect(result.maskedColumns).toContain('salary');
    });
  });

  describe('maskRowValues', () => {
    it('masks specified columns', () => {
      const row = { name: 'Test', salary: 150000 };
      const masked = maskRowValues(row, ['salary']);
      expect(masked.name).toBe('Test');
      expect(masked.salary).toBe('****');
    });

    it('returns original row when no masked columns', () => {
      const row = { name: 'Test', salary: 150000 };
      const masked = maskRowValues(row, []);
      expect(masked).toEqual(row);
    });
  });

  describe('applyDataPermissions', () => {
    it('produces filtered view with row and column filters', () => {
      const permissions: DataPermission[] = [
        {
          id: 'perm-1',
          principal: { type: 'role', roleName: 'viewer' },
          resource: { type: 'global' },
          actions: ['read'],
          rowFilters: [
            { id: 'r1', field: 'department', operator: 'equals', values: ['Engineering'], hardHide: true },
          ],
          columnFilters: [
            { id: 'c1', field: 'salary', visible: false, masked: false, readOnly: false },
          ],
          isActive: true,
          expiresAt: null,
          grantedBy: 'admin',
          grantedAt: '2026-01-01T00:00:00Z',
        },
      ];

      const view = applyDataPermissions(sampleRows, allColumns, permissions);

      expect(view.filteredRows).toBe(2); // Only Engineering
      expect(view.visibleColumns).not.toContain('salary');
      expect(view.isFiltered).toBe(true);
      expect(view.totalRows).toBe(4);
    });
  });

  describe('getEffectivePermissions', () => {
    const permissions: DataPermission[] = [
      {
        id: 'perm-1',
        principal: { type: 'role', roleName: 'admin' },
        resource: { type: 'global' },
        actions: ['read', 'write'],
        rowFilters: [],
        columnFilters: [],
        isActive: true,
        expiresAt: null,
        grantedBy: 'system',
        grantedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'perm-2',
        principal: { type: 'user', userId: 'user-1' },
        resource: { type: 'budget', budgetId: 'bgt-001' },
        actions: ['read'],
        rowFilters: [],
        columnFilters: [],
        isActive: true,
        expiresAt: null,
        grantedBy: 'admin',
        grantedAt: '2026-01-01T00:00:00Z',
      },
    ];

    it('returns role-matched permissions', () => {
      const effective = getEffectivePermissions(permissions, 'user-2', ['admin']);
      expect(effective).toHaveLength(1);
      expect(effective[0]!.id).toBe('perm-1');
    });

    it('returns user-matched permissions', () => {
      const effective = getEffectivePermissions(permissions, 'user-1', ['viewer']);
      expect(effective).toHaveLength(1);
      expect(effective[0]!.id).toBe('perm-2');
    });
  });

  describe('hasDataPermission', () => {
    const permissions: DataPermission[] = [
      {
        id: 'perm-1',
        principal: { type: 'role', roleName: 'admin' },
        resource: { type: 'budget', budgetId: '*' },
        actions: ['read', 'write', 'export'],
        rowFilters: [],
        columnFilters: [],
        isActive: true,
        expiresAt: null,
        grantedBy: 'system',
        grantedAt: '2026-01-01T00:00:00Z',
      },
    ];

    it('allows access for matching role and action', () => {
      expect(hasDataPermission(permissions, 'user-1', ['admin'], 'read', 'budget', 'bgt-001')).toBe(true);
    });

    it('denies access for non-matching role', () => {
      expect(hasDataPermission(permissions, 'user-1', ['viewer'], 'read', 'budget', 'bgt-001')).toBe(false);
    });
  });
});
