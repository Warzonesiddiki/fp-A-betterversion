/* eslint-disable jsx-a11y/label-has-associated-control */
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CellAuditTrailEngine } from '@/engines/CellAuditTrailEngine';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ScrollText, Download, RefreshCw } from 'lucide-react';

const auditEngine = new CellAuditTrailEngine();

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  return new Date(timestamp).toLocaleDateString();
}

export default function AuditTrailPage() {
  useEffect(() => {
    document.title = 'FinPlan Pro — Audit Trail';
  }, []);

  const navigate = useNavigate();
  const [entries, setEntries] = useState(() => auditEngine.getAllEntries());
  const [filters, setFilters] = useState({ startDate: '', endDate: '', user: '', action: '' });
  const [sortField] = useState<'timestamp' | 'userName'>('timestamp');
  const [sortDir] = useState<'asc' | 'desc'>('desc');
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setEntries(auditEngine.getAllEntries());
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

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
    list.sort((a, b) => {
      const aVal = String(a[sortField] ?? '');
      const bVal = String(b[sortField] ?? '');
      const cmp = aVal < bVal ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [entries, filters, sortField, sortDir]);

  const handleExport = useCallback(() => {
    const headers = ['Timestamp', 'User', 'Account', 'Old Value', 'New Value', 'Reason'];
    const rows = filtered.map((e) => [
      e.timestamp,
      e.userName,
      e.accountName || e.accountId,
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
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="text-sm text-slate-400 mt-1">{entries.length} total entries</p>
        </div>
        <div className="flex gap-2">
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

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs text-slate-500 mb-1">From</label>
              <input
                type="date"
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm w-36"
                value={filters.startDate}
                onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">To</label>
              <input
                type="date"
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm w-36"
                value={filters.endDate}
                onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">User</label>
              <input
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm w-40"
                placeholder="Filter by user..."
                value={filters.user}
                onChange={(e) => setFilters((f) => ({ ...f, user: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Action</label>
              <input
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm w-40"
                placeholder="Filter by action..."
                value={filters.action}
                onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilters({ startDate: '', endDate: '', user: '', action: '' })}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                  <th className="px-4 py-3 w-32">Timestamp</th>
                  <th className="px-4 py-3 w-24">User</th>
                  <th className="px-4 py-3 w-24">Account</th>
                  <th className="px-4 py-3 text-right w-24">Old Value</th>
                  <th className="px-4 py-3 text-right w-24">New Value</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No entries match filters.
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 500).map((e, i) => (
                    <tr key={e.id || i} className="hover:bg-slate-900/50">
                      <td
                        className="px-4 py-2 text-xs text-slate-400 whitespace-nowrap"
                        title={e.timestamp}
                      >
                        {formatRelativeTime(e.timestamp)}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-300">{e.userName}</td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-400">
                        {e.accountName || e.accountId}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-400">
                        {e.oldValue !== undefined && e.oldValue !== null
                          ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(
                              Number(e.oldValue)
                            )
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
                          ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(
                              Number(e.newValue)
                            )
                          : '-'}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">{e.reason || '-'}</td>
                    </tr>
                  ))
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
