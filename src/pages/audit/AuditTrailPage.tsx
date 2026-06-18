import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CellAuditTrailEngine } from '@/engines/CellAuditTrailEngine';
import type { AuditOperation } from '@/engines/CellAuditTrailEngine';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ScrollText, Download, RefreshCw, ChevronUp, ChevronDown, Search } from 'lucide-react';
// CHRONOS 2026-06-15: replaced local formatRelativeTime (BUG-CHR-D-1) with
// canonical import from src/engines/temporal. Audit-trail page now uses 30-day
// cap (was 24h jumps to date) for better SOX auditor UX.
// MORPHEUS PICK 7 (2026-06-18): added 4-stat header, working sort, operation
// + dataType filters, date presets, operation badges, diff toggle, detail
// expansion. Targets SOX 404 compliance auditor workflow.
// DEMETER v0.2 BUILD (2026-06-18): removed OPERATION_STYLES const (DRY violation
// against auditOpBadges canonical token), migrated active preset chip to
// auditFiltersTokens.chipActive/chipInactive. AuditTokens cross-Muse consistency
// per Clio T-N+1 ↔ Demeter PICK CHAIN.
import { formatRelativeTimeBudget as formatRelativeTime } from '@/engines/temporal';
import { auditOpBadges, auditFiltersTokens } from '@/components/audit/auditTokens';

const auditEngine = new CellAuditTrailEngine();

const OPERATION_OPTIONS: AuditOperation[] = ['write', 'update', 'delete', 'bulk'];

// Date preset helpers
type DatePreset = '24h' | '7d' | '30d' | 'all';
const PRESET_LABELS: Record<DatePreset, string> = {
  '24h': 'Last 24h',
  '7d': 'Last 7d',
  '30d': 'Last 30d',
  all: 'All Time',
};

function applyDatePreset(preset: DatePreset): { startDate: string; endDate: string } {
  if (preset === 'all') return { startDate: '', endDate: '' };
  const now = new Date();
  const ms =
    preset === '24h'
      ? 24 * 60 * 60 * 1000
      : preset === '7d'
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
  const from = new Date(now.getTime() - ms);
  return { startDate: from.toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) };
}

type SortField = 'timestamp' | 'userName' | 'operation';

function SortHeader({
  field,
  label,
  activeField,
  sortDir,
  onSort,
}: {
  field: SortField;
  label: string;
  activeField: SortField;
  sortDir: 'asc' | 'desc';
  onSort: (f: SortField) => void;
}) {
  return (
    <th
      className="px-4 py-3 cursor-pointer select-none hover:bg-slate-800 transition-colors"
      onClick={() => onSort(field)}
      scope="col"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {activeField === field ? (
          sortDir === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : null}
      </span>
    </th>
  );
}

export default function AuditTrailPage() {
  useEffect(() => {
    document.title = 'FinPlan Pro — Audit Trail';
  }, []);

  const navigate = useNavigate();
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [entries, setEntries] = useState(() => auditEngine.getAllEntries());
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    user: '',
    action: '',
    operation: '' as '' | AuditOperation,
    dataType: '',
  });
  const [sortField, setSortField] = useState<'timestamp' | 'userName' | 'operation'>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [activePreset, setActivePreset] = useState<DatePreset>('all');
  const [showDiff, setShowDiff] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setEntries(auditEngine.getAllEntries());
      setNowTick(Date.now());
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // 4-stat header KPIs
  const stats = useMemo(() => {
    const last24h = entries.filter(
      (e) => nowTick - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
    );
    const uniqueUsers = new Set(entries.map((e) => e.userId)).size;
    const uniqueCells = new Set(entries.map((e) => e.cellId)).size;
    return {
      total: entries.length,
      last24h: last24h.length,
      uniqueUsers,
      uniqueCells,
    };
  }, [entries, nowTick]);

  // Filtered + sorted entries
  const filtered = useMemo(() => {
    let list = [...entries];
    if (filters.startDate) list = list.filter((e) => e.timestamp >= filters.startDate);
    if (filters.endDate) list = list.filter((e) => e.timestamp <= filters.endDate + 'T23:59:59');
    if (filters.user)
      list = list.filter((e) => e.userName.toLowerCase().includes(filters.user.toLowerCase()));
    if (filters.action)
      list = list.filter((e) =>
        (e.reason || '').toLowerCase().includes(filters.action.toLowerCase())
      );
    if (filters.operation) list = list.filter((e) => e.operation === filters.operation);
    if (filters.dataType)
      list = list.filter((e) =>
        (e.dataType || '').toLowerCase().includes(filters.dataType.toLowerCase())
      );
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.cellId.toLowerCase().includes(q) ||
          e.accountName.toLowerCase().includes(q) ||
          (e.reason || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const aVal = String(a[sortField] ?? '');
      const bVal = String(b[sortField] ?? '');
      const cmp = aVal < bVal ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [entries, filters, sortField, sortDir, searchQuery]);

  // Available data types for filter dropdown
  const dataTypes = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) if (e.dataType) set.add(e.dataType);
    return Array.from(set).sort();
  }, [entries]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      else {
        setSortField(field);
        setSortDir('desc');
      }
    },
    [sortField]
  );

  const handlePreset = useCallback((preset: DatePreset) => {
    setActivePreset(preset);
    setFilters((f) => ({ ...f, ...applyDatePreset(preset) }));
  }, []);

  const handleExport = useCallback(() => {
    const headers = [
      'Timestamp',
      'User',
      'Operation',
      'Account',
      'DataType',
      'Old Value',
      'New Value',
      'Reason',
    ];
    const rows = filtered.map((e) => [
      e.timestamp,
      e.userName,
      e.operation,
      e.accountName || e.accountId,
      e.dataType || '',
      e.oldValue?.toString() ?? '',
      e.newValue?.toString() ?? '',
      e.reason ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join(
      '\n'
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const clearAllFilters = useCallback(() => {
    setFilters({ startDate: '', endDate: '', user: '', action: '', operation: '', dataType: '' });
    setSearchQuery('');
    setActivePreset('all');
  }, []);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <ScrollText className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Audit Entries</h2>
        <p className="text-slate-400 mb-6">
          Changes appear automatically as you edit budgets, forecasts, and other data. Import data
          and make changes to see them recorded here.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 id="audit-trail-heading" className="text-2xl font-bold">
            Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {filtered.length} of {entries.length} entries shown
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={showDiff ? 'default' : 'ghost'}
            onClick={() => setShowDiff((v) => !v)}
            aria-pressed={showDiff}
          >
            {showDiff ? '✓ Diff View' : 'Diff View'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEntries(auditEngine.getAllEntries())}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* 4-stat header KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Total Changes</div>
            <div className="text-2xl font-bold tabular-nums mt-1">
              {stats.total.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Last 24h</div>
            <div className="text-2xl font-bold tabular-nums mt-1 text-amber-400">
              {stats.last24h.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Unique Users</div>
            <div className="text-2xl font-bold tabular-nums mt-1 text-sky-400">
              {stats.uniqueUsers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Unique Cells</div>
            <div className="text-2xl font-bold tabular-nums mt-1 text-purple-400">
              {stats.uniqueCells.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Date range quick presets */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Quick range:</span>
            {(['24h', '7d', '30d', 'all'] as DatePreset[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePreset(p)}
                aria-pressed={activePreset === p}
                className={`text-xs px-3 py-1 rounded border transition-colors ${
                  activePreset === p
                    ? auditFiltersTokens.chipActive
                    : auditFiltersTokens.chipInactive
                }`}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs text-slate-500 mb-1" htmlFor="audit-from">
                From
              </label>
              <input
                id="audit-from"
                type="date"
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm w-36"
                value={filters.startDate}
                onChange={(e) => {
                  setActivePreset('all');
                  setFilters((f) => ({ ...f, startDate: e.target.value }));
                }}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1" htmlFor="audit-to">
                To
              </label>
              <input
                id="audit-to"
                type="date"
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm w-36"
                value={filters.endDate}
                onChange={(e) => {
                  setActivePreset('all');
                  setFilters((f) => ({ ...f, endDate: e.target.value }));
                }}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1" htmlFor="audit-user">
                User
              </label>
              <input
                id="audit-user"
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm w-40"
                placeholder="Filter by user..."
                value={filters.user}
                onChange={(e) => setFilters((f) => ({ ...f, user: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1" htmlFor="audit-action">
                Action
              </label>
              <input
                id="audit-action"
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm w-40"
                placeholder="Filter by action/reason..."
                value={filters.action}
                onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1" htmlFor="audit-operation">
                Operation
              </label>
              <select
                id="audit-operation"
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm w-32"
                value={filters.operation}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, operation: e.target.value as '' | AuditOperation }))
                }
              >
                <option value="">All ops</option>
                {OPERATION_OPTIONS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
            {dataTypes.length > 0 && (
              <div>
                <label className="block text-xs text-slate-500 mb-1" htmlFor="audit-datatype">
                  Data type
                </label>
                <select
                  id="audit-datatype"
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm w-36"
                  value={filters.dataType}
                  onChange={(e) => setFilters((f) => ({ ...f, dataType: e.target.value }))}
                >
                  <option value="">All types</option>
                  {dataTypes.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button size="sm" variant="ghost" onClick={clearAllFilters}>
              Clear all
            </Button>
          </div>

          {/* Cross-cell/account search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="search"
              className="w-full bg-slate-800 border border-slate-700 rounded pl-10 pr-3 py-2 text-sm"
              placeholder="Search cell ID, account name, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search audit entries"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div
            className="overflow-x-auto max-h-[600px] overflow-y-auto"
            role="region"
            aria-labelledby="audit-trail-heading"
          >
            <table
              className="w-full text-sm"
              role="grid"
              aria-label="Audit trail events"
              aria-rowcount={Math.min(500, filtered.length) + 1}
            >
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                  <SortHeader
                    field="timestamp"
                    label="Timestamp"
                    activeField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortHeader
                    field="userName"
                    label="User"
                    activeField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortHeader
                    field="operation"
                    label="Op"
                    activeField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3 w-24" scope="col">
                    Account
                  </th>
                  {showDiff && (
                    <>
                      <th className="px-4 py-3 text-right w-24" scope="col">
                        Old Value
                      </th>
                      <th className="px-4 py-3 text-right w-24" scope="col">
                        New Value
                      </th>
                    </>
                  )}
                  <th className="px-4 py-3" scope="col">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={showDiff ? 7 : 5} className="text-center py-8 text-slate-500">
                      No entries match filters.
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 500).map((e, i) => {
                    const rowId = e.id || `${e.cellId}-${e.timestamp}`;
                    const isExpanded = expandedRowId === rowId;
                    return (
                      <>
                        <tr
                          key={rowId}
                          className="hover:bg-slate-900/50 cursor-pointer"
                          aria-rowindex={i + 2}
                          aria-expanded={isExpanded}
                          aria-label={`Audit row ${i + 1} of ${Math.min(500, filtered.length)}: ${e.userName} ${e.operation} on ${e.accountName || e.accountId} at ${e.timestamp}`}
                          onClick={() => setExpandedRowId(isExpanded ? null : rowId)}
                        >
                          <td
                            className="px-4 py-2 text-xs text-slate-400 whitespace-nowrap"
                            title={e.timestamp}
                          >
                            {formatRelativeTime(e.timestamp)}
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-300">{e.userName}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-block text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                                auditOpBadges[e.operation] ||
                                'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {e.operation}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs text-slate-400">
                            {e.accountName || e.accountId}
                          </td>
                          {showDiff && (
                            <>
                              <td className="px-4 py-2 text-right tabular-nums text-slate-400">
                                {e.oldValue !== undefined && e.oldValue !== null
                                  ? new Intl.NumberFormat('en-US', {
                                      minimumFractionDigits: 0,
                                    }).format(Number(e.oldValue))
                                  : '-'}
                              </td>
                              <td
                                className="px-4 py-2 text-right tabular-nums font-medium"
                                style={{
                                  color:
                                    Number(e.newValue || 0) >= Number(e.oldValue || 0)
                                      ? '#4ade80'
                                      : '#f87171',
                                }}
                              >
                                {e.newValue !== undefined && e.newValue !== null
                                  ? new Intl.NumberFormat('en-US', {
                                      minimumFractionDigits: 0,
                                    }).format(Number(e.newValue))
                                  : '-'}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-2 text-xs text-slate-500">
                            {(e.reason || '-').slice(0, 60)}
                            {(e.reason || '').length > 60 ? '…' : ''}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${rowId}-detail`} className="bg-slate-900/30">
                            <td colSpan={showDiff ? 7 : 5} className="px-6 py-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <div className="text-slate-500 uppercase tracking-wide mb-1">
                                    Cell ID
                                  </div>
                                  <div className="font-mono text-slate-300 break-all">
                                    {e.cellId}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-slate-500 uppercase tracking-wide mb-1">
                                    Data type
                                  </div>
                                  <div className="text-slate-300">{e.dataType || '—'}</div>
                                </div>
                                <div>
                                  <div className="text-slate-500 uppercase tracking-wide mb-1">
                                    Source
                                  </div>
                                  <div className="text-slate-300">{e.source || '—'}</div>
                                </div>
                                <div>
                                  <div className="text-slate-500 uppercase tracking-wide mb-1">
                                    Approval
                                  </div>
                                  <div className="text-slate-300">
                                    {e.approvalStatus || '—'}
                                    {e.approvedBy ? ` by ${e.approvedBy}` : ''}
                                  </div>
                                </div>
                                {e.metadata && Object.keys(e.metadata).length > 0 && (
                                  <div className="col-span-2 md:col-span-4">
                                    <div className="text-slate-500 uppercase tracking-wide mb-1">
                                      Metadata
                                    </div>
                                    <pre className="text-[10px] font-mono text-slate-400 bg-slate-950/50 rounded p-2 overflow-x-auto">
                                      {JSON.stringify(e.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {entries.length > 500 && (
            <div className="p-3 text-center text-xs text-slate-500 border-t border-slate-800">
              Showing 500 of {entries.length} entries. Export for full dataset.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
