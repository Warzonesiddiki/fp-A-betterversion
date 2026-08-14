import { useCallback, useEffect, useMemo, useState } from 'react';
import { activateOnKey } from '@/utils/a11yActivate';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useGLStore } from '@/store/glStore';
import {
  DrillThroughEngine,
  type DrillBreadcrumb,
  type DrillContext,
} from '@/engines/DrillThroughEngine';
import { ChevronRight, ArrowLeft, Layers, Building2, FileText } from 'lucide-react';
import Decimal from 'decimal.js';
import { roundTo, subtractMoney } from '@/utils/money';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

/**
 * GAP-1 (F-0006) — exact-decimal variance-drill department totals.
 *
 * The modal filters GL entries by account prefix, derives `amount = debit
 * - credit` (when the row has no explicit amount), groups by department,
 * and totals each group with `ents.reduce((s, e) => s + e.amount, 0)` —
 * then sorts groups by absolute total to surface the biggest contributors.
 * Those totals drive which department appears first AND are rendered to
 * the user as the "Total Amount" they click to drill further; logic +
 * display. Exported for *.money.test.ts.
 */
export interface DrillEntryLike {
  amount: number;
}

export interface DepartmentTotal {
  department: string;
  total: number;
  count: number;
}

export function deriveDrillAmount(entry: {
  amount?: number | null;
  debit?: number;
  credit?: number;
}): number {
  // Prefer `amount` when set; fall back to debit - credit through the
  // money primitive so a 0.3 debit vs 0.1 + 0.2 credit pair nets to
  // exactly 0 (not 5.55e-17).
  if (entry.amount != null) return entry.amount;
  const d = entry.debit ?? 0;
  const c = entry.credit ?? 0;
  return roundTo(subtractMoney(d, c));
}

export function computeDepartmentTotals(
  entries: readonly { department: string; amount: number }[]
): DepartmentTotal[] {
  const map = new Map<string, { total: Decimal; count: number }>();
  for (const entry of entries) {
    const existing = map.get(entry.department) ?? { total: new Decimal(0), count: 0 };
    existing.total = existing.total.plus(entry.amount);
    existing.count += 1;
    map.set(entry.department, existing);
  }
  return Array.from(map.entries())
    .map(([department, { total, count }]) => ({
      department,
      total: roundTo(total),
      count,
    }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
}
function formatDate(d: string): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface DrillRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  department: string;
  accountCode: string;
  accountName: string;
}

interface DepartmentGroup {
  department: string;
  entries: DrillRow[];
  total: number;
}

type DrillView = 'category' | 'department' | 'transaction';

interface VarianceDrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountLabel: string;
  accountPrefix: string;
  variance: number;
  budget: number;
  actual: number;
}

const engine = new DrillThroughEngine();

export function VarianceDrillModal({
  isOpen,
  onClose,
  accountLabel,
  accountPrefix,
  variance,
  budget,
  actual,
}: VarianceDrillModalProps) {
  const fmt = useCurrencyFormatter();
  const entries = useGLStore((s) => s.entries);
  const [breadcrumbs, setBreadcrumbs] = useState<DrillBreadcrumb[]>([]);
  const [currentView, setCurrentView] = useState<DrillView>('category');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      engine.reset();
      setBreadcrumbs([]);
      setCurrentView('category');
      setSelectedDepartment(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return engine.subscribe((path) => setBreadcrumbs([...path]));
  }, []);

  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => (e.accountCode || '').startsWith(accountPrefix))
      .map((e) => ({
        id: e.id,
        date: e.postDate || e.date,
        description: e.description || '—',
        amount: deriveDrillAmount(e),
        department: e.departmentId || 'Unassigned',
        accountCode: e.accountCode,
        accountName: e.accountName,
      }));
  }, [entries, accountPrefix]);

  const departmentGroups = useMemo((): DepartmentGroup[] => {
    const totals = computeDepartmentTotals(
      filteredEntries.map((e) => ({ department: e.department, amount: e.amount }))
    );
    const map = new Map<string, DrillRow[]>();
    for (const entry of filteredEntries) {
      const list = map.get(entry.department) ?? [];
      list.push(entry);
      map.set(entry.department, list);
    }
    return totals.map(({ department, total }) => ({
      department,
      entries: (map.get(department) ?? []).sort((a, b) => b.date.localeCompare(a.date)),
      total,
    }));
  }, [filteredEntries]);

  const selectedEntries = useMemo(() => {
    if (!selectedDepartment) return [];
    return filteredEntries
      .filter((e) => e.department === selectedDepartment)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredEntries, selectedDepartment]);

  const handleDrillToDepartment = useCallback(
    (dept: string) => {
      const ctx: DrillContext = {
        cellValue: filteredEntries.filter((e) => e.department === dept).length,
        account: accountLabel,
        metric: dept,
      };
      engine.drillDown(ctx);
      setSelectedDepartment(dept);
      setCurrentView('department');
    },
    [filteredEntries, accountLabel]
  );

  const handleDrillToTransaction = useCallback(() => {
    const ctx: DrillContext = {
      cellValue: selectedEntries.length,
      account: accountLabel,
      metric: selectedDepartment ?? 'Transactions',
    };
    engine.drillDown(ctx);
    setCurrentView('transaction');
  }, [selectedEntries, accountLabel, selectedDepartment]);

  const handleBreadcrumbNav = useCallback((targetLevel: string) => {
    engine.drillToLevel(targetLevel as 'summary' | 'detail' | 'journal-entry' | 'source-document');
    if (targetLevel === 'summary') {
      setCurrentView('category');
      setSelectedDepartment(null);
    } else if (targetLevel === 'detail') {
      setCurrentView('department');
    }
  }, []);

  const handleBack = useCallback(() => {
    engine.goBack();
    if (currentView === 'transaction') {
      setCurrentView('department');
    } else if (currentView === 'department') {
      setCurrentView('category');
      setSelectedDepartment(null);
    }
  }, [currentView]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-3xl">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold">{accountLabel} Variance Drill-Through</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Budget: {fmt.currency0(budget)} &middot; Actual: {fmt.currency0(actual)} &middot;
          Variance:{' '}
          <span className={variance >= 0 ? 'text-green-400' : 'text-red-400'}>
            {fmt.currency0(variance)}
          </span>
        </p>

        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mb-3 flex-wrap">
            <button
              onClick={() => handleBreadcrumbNav('summary')}
              className="hover:text-blue-400 transition-colors"
            >
              {accountLabel}
            </button>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                <button
                  onClick={() => handleBreadcrumbNav(crumb.level)}
                  className="hover:text-blue-400 transition-colors"
                >
                  {crumb.label}
                </button>
              </span>
            ))}
          </div>
        )}

        {currentView !== 'category' && (
          <Button size="sm" variant="ghost" onClick={handleBack} className="mb-3">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back
          </Button>
        )}

        {currentView === 'category' && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              {filteredEntries.length} entries across {departmentGroups.length} departments. Click a
              department to drill down.
            </p>
            <div className="overflow-hidden rounded-lg border border-[var(--border-default)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-elevated)] text-left">
                    <th
                      className="px-4 py-2.5 font-medium text-[var(--text-secondary)]"
                      scope="col"
                    >
                      Department
                    </th>
                    <th
                      className="px-4 py-2.5 font-medium text-[var(--text-secondary)] text-right"
                      scope="col"
                    >
                      Entries
                    </th>
                    <th
                      className="px-4 py-2.5 font-medium text-[var(--text-secondary)] text-right"
                      scope="col"
                    >
                      Total Amount
                    </th>
                    <th
                      className="px-4 py-2.5 font-medium text-[var(--text-secondary)] text-right"
                      scope="col"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {departmentGroups.map((group) => (
                    <tr
                      key={group.department}
                      className="hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                      onClick={() => handleDrillToDepartment(group.department)}
                      onKeyDown={activateOnKey(() => handleDrillToDepartment(group.department))}
                      tabIndex={0}
                    >
                      <td className="px-4 py-2.5 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[var(--text-muted)]" />
                        {group.department}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">
                        {group.entries.length}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={group.total >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {fmt.currency0(group.total)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <ChevronRight className="h-4 w-4 text-[var(--text-muted)] inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentView === 'department' && selectedDepartment && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">{selectedDepartment}</span>{' '}
                &middot; {selectedEntries.length} entries
              </p>
              <Button size="sm" variant="ghost" onClick={handleDrillToTransaction}>
                <FileText className="h-3.5 w-3.5 mr-1" />
                View All Transactions
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg border border-[var(--border-default)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-elevated)] text-left">
                    <th
                      className="px-4 py-2.5 font-medium text-[var(--text-secondary)]"
                      scope="col"
                    >
                      Date
                    </th>
                    <th
                      className="px-4 py-2.5 font-medium text-[var(--text-secondary)]"
                      scope="col"
                    >
                      Description
                    </th>
                    <th
                      className="px-4 py-2.5 font-medium text-[var(--text-secondary)] text-right"
                      scope="col"
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {selectedEntries.slice(0, 50).map((entry) => (
                    <tr key={entry.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-4 py-2 text-[var(--text-muted)] whitespace-nowrap">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-4 py-2">{entry.description}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={entry.amount >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {fmt.currency0(entry.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedEntries.length > 50 && (
              <p className="text-xs text-[var(--text-muted)] text-center mt-2">
                Showing 50 of {selectedEntries.length} entries. Click &quot;View All
                Transactions&quot; for full list.
              </p>
            )}
          </div>
        )}

        {currentView === 'transaction' && selectedDepartment && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              All transactions for{' '}
              <span className="font-medium text-[var(--text-primary)]">{selectedDepartment}</span>
            </p>
            <div className="overflow-hidden rounded-lg border border-[var(--border-default)] max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--bg-elevated)] z-10">
                  <tr className="bg-[var(--bg-elevated)] text-left">
                    <th
                      className="px-4 py-2.5 font-medium text-[var(--text-secondary)]"
                      scope="col"
                    >
                      Date
                    </th>
                    <th
                      className="px-4 py-2.5 font-medium text-[var(--text-secondary)]"
                      scope="col"
                    >
                      Account
                    </th>
                    <th
                      className="px-4 py-2.5 font-medium text-[var(--text-secondary)]"
                      scope="col"
                    >
                      Description
                    </th>
                    <th
                      className="px-4 py-2.5 font-medium text-[var(--text-secondary)] text-right"
                      scope="col"
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {selectedEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-4 py-2 text-[var(--text-muted)] whitespace-nowrap">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-4 py-2 text-[var(--text-secondary)] whitespace-nowrap">
                        {entry.accountCode}
                      </td>
                      <td className="px-4 py-2">{entry.description}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={entry.amount >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {fmt.currency0(entry.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-5">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
