// src/components/audit/AuditFilters.tsx
// Clio (Audit Muse) — Part 141 P0A-17 — 12 filter types with chips + dropdowns + date pickers
// v0.2.2 SECURITY HARDENING 2026-06-18 — Sentinel BRUTAL v2.0 P0 fixes F-CLIO-2/7 RBAC gating

import { useCallback, type JSX } from 'react';
import { Search, X } from 'lucide-react';
import { useAuditTrailStore, selectCanViewGdprAudit } from '@/store/auditTrailStore';
import type {
  AuditOperation,
  ApprovalStatus,
  DataType,
  AuditSource,
} from '@/store/auditTrailStore';
import { Button } from '@/components/ui/Button';
import {
  auditOpBadges,
  auditApprovalBadges,
  auditPanelTokens,
  auditFiltersTokens,
} from './auditTokens';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// v0.2 BUILD 2026-06-18 — Demeter T-4.4: removed dead `color` field; canonical
// source is `auditOpBadges[op.value]` / `auditApprovalBadges[a.value]`.
const OPERATIONS: { value: AuditOperation; label: string }[] = [
  { value: 'write', label: 'Write' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'bulk', label: 'Bulk' },
];

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: 'number', label: 'Number' },
  { value: 'string', label: 'String' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'object', label: 'Object' },
  { value: 'array', label: 'Array' },
];

const APPROVAL_STATUSES: { value: ApprovalStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'auto', label: 'Auto' },
];

const ALL_SOURCES: AuditSource[] = ['manual', 'import', 'api', 'plugin', 'automation', 'gdpr'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuditFilters(): JSX.Element {
  const filters = useAuditTrailStore((s) => s.filters);
  const setFilter = useAuditTrailStore((s) => s.setFilter);
  const clearFilters = useAuditTrailStore((s) => s.clearFilters);
  const entries = useAuditTrailStore((s) => s.entries);
  // F-CLIO-2/7 FIX: RBAC gating for GDPR-source filter and hasConsent checkbox
  const canViewGdprAudit = useAuditTrailStore(selectCanViewGdprAudit);
  const visibleSources = canViewGdprAudit ? ALL_SOURCES : ALL_SOURCES.filter((s) => s !== 'gdpr');

  const toggleArrayFilter = useCallback(
    <T extends string>(key: 'operation' | 'dataType' | 'approvalStatus', value: T) => {
      const current = (filters[key] as T[] | undefined) ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setFilter(key, next.length > 0 ? (next as never) : undefined);
    },
    [filters, setFilter]
  );

  const uniqueUsers = Array.from(new Set(entries.map((e) => e.userId))).sort();

  const hasAnyFilter =
    !!filters.cellId ||
    !!filters.userId ||
    (filters.operation && filters.operation.length > 0) ||
    (filters.dataType && filters.dataType.length > 0) ||
    (filters.approvalStatus && filters.approvalStatus.length > 0) ||
    !!filters.source ||
    !!filters.transactionId ||
    !!filters.dateRange ||
    !!filters.valueRange ||
    !!filters.fullTextSearch ||
    !!filters.hasVersion ||
    !!filters.hasConsent;

  return (
    <div
      className={
        auditPanelTokens.bg + ' rounded-lg border ' + auditPanelTokens.border + ' p-4 space-y-4'
      }
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h2>
        {hasAnyFilter && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" /> Clear all
          </Button>
        )}
      </div>

      {/* 1. Cell ID text search */}
      <div>
        <label
          htmlFor="audit-filter-cell-id"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Cell ID (sector/scenario/period/lineItem)
        </label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            id="audit-filter-cell-id"
            type="text"
            value={filters.cellId ?? ''}
            onChange={(e) => setFilter('cellId', e.target.value || undefined)}
            placeholder="e.g. revenue/2026Q1/item-5"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            aria-label="Filter by cell ID"
          />
        </div>
      </div>

      {/* 2. User dropdown */}
      <div>
        <label
          htmlFor="audit-filter-user"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          User
        </label>
        <select
          id="audit-filter-user"
          value={filters.userId ?? ''}
          onChange={(e) => setFilter('userId', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          aria-label="Filter by user"
        >
          <option value="">All users ({uniqueUsers.length})</option>
          {uniqueUsers.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Operation chips */}
      <div>
        <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Operation (4 chips)
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by operation">
          {OPERATIONS.map((op) => {
            const active = filters.operation?.includes(op.value) ?? false;
            return (
              <button
                key={op.value}
                type="button"
                onClick={() => toggleArrayFilter('operation', op.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-opacity ${
                  auditOpBadges[op.value]
                } ${active ? 'opacity-100 ring-2 ring-offset-1 ring-blue-500' : 'opacity-50'}`}
                aria-pressed={active}
              >
                {op.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Data type chips */}
      <div>
        <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Data Type (6 chips)
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by data type">
          {DATA_TYPES.map((dt) => {
            const active = filters.dataType?.includes(dt.value) ?? false;
            return (
              <button
                key={dt.value}
                type="button"
                onClick={() => toggleArrayFilter('dataType', dt.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  active ? auditFiltersTokens.chipActive : auditFiltersTokens.chipInactive
                }`}
                aria-pressed={active}
              >
                {dt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Approval status chips */}
      <div>
        <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Approval Status (4 chips)
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by approval status">
          {APPROVAL_STATUSES.map((a) => {
            const active = filters.approvalStatus?.includes(a.value) ?? false;
            return (
              <button
                key={a.value}
                type="button"
                onClick={() => toggleArrayFilter('approvalStatus', a.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-opacity ${
                  auditApprovalBadges[a.value]
                } ${active ? 'opacity-100 ring-2 ring-offset-1 ring-blue-500' : 'opacity-50'}`}
                aria-pressed={active}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Source dropdown */}
      <div>
        <label
          htmlFor="audit-filter-source"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Source
          {!canViewGdprAudit && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              (GDPR restricted — admin/compliance/DPO only)
            </span>
          )}
        </label>
        <select
          id="audit-filter-source"
          value={filters.source ?? ''}
          onChange={(e) =>
            setFilter('source', (e.target.value || undefined) as AuditSource | undefined)
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          aria-label="Filter by source"
        >
          <option value="">All sources</option>
          {visibleSources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* 7. Transaction ID text search */}
      <div>
        <label
          htmlFor="audit-filter-transaction-id"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Transaction ID (bulk grouping)
        </label>
        <input
          id="audit-filter-transaction-id"
          type="text"
          value={filters.transactionId ?? ''}
          onChange={(e) => setFilter('transactionId', e.target.value || undefined)}
          placeholder="tx-12345"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          aria-label="Filter by transaction ID"
        />
      </div>

      {/* 8. Date range */}
      <div>
        <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date Range
        </p>
        <div className="flex gap-2">
          <input
            type="date"
            value={
              filters.dateRange ? new Date(filters.dateRange[0]).toISOString().slice(0, 10) : ''
            }
            onChange={(e) => {
              const from = e.target.value ? new Date(e.target.value).getTime() : undefined;
              const to = filters.dateRange?.[1];
              setFilter(
                'dateRange',
                from && to ? [from, to] : from ? [from, Date.now()] : undefined
              );
            }}
            className="flex-1 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            aria-label="Filter by date range start"
          />
          <input
            type="date"
            value={
              filters.dateRange ? new Date(filters.dateRange[1]).toISOString().slice(0, 10) : ''
            }
            onChange={(e) => {
              const to = e.target.value ? new Date(e.target.value).getTime() : undefined;
              const from = filters.dateRange?.[0];
              setFilter(
                'dateRange',
                from && to
                  ? [from, to]
                  : to
                    ? [Date.now() - 30 * 24 * 60 * 60 * 1000, to]
                    : undefined
              );
            }}
            className="flex-1 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            aria-label="Filter by date range end"
          />
        </div>
      </div>

      {/* 10. Full-text search */}
      <div>
        <label
          htmlFor="audit-filter-full-text"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Full-text Search
        </label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            id="audit-filter-full-text"
            type="text"
            value={filters.fullTextSearch ?? ''}
            onChange={(e) => setFilter('fullTextSearch', e.target.value || undefined)}
            placeholder="id, userId, lineItemId, metadata..."
            className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            aria-label="Full-text search"
          />
        </div>
      </div>

      {/* 11 + 12. Has version + Has GDPR consent (GDPR gate F-CLIO-7) */}
      <div className="space-y-2">
        <label
          htmlFor="audit-filter-has-version"
          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
        >
          <input
            id="audit-filter-has-version"
            type="checkbox"
            checked={filters.hasVersion ?? false}
            onChange={(e) => setFilter('hasVersion', e.target.checked || undefined)}
            className="h-4 w-4 rounded border-gray-300"
            aria-label="Has Part 140 version"
          />
          Has version (Part 140 Cell Versioning)
        </label>
        {canViewGdprAudit && (
          <label
            htmlFor="audit-filter-has-consent"
            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <input
              id="audit-filter-has-consent"
              type="checkbox"
              checked={filters.hasConsent ?? false}
              onChange={(e) => setFilter('hasConsent', e.target.checked || undefined)}
              className="h-4 w-4 rounded border-gray-300"
              aria-label="Has GDPR consent"
            />
            Has GDPR consent (Hades consentRegistry)
          </label>
        )}
      </div>
    </div>
  );
}
