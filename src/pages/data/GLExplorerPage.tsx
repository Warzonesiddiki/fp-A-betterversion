/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useMemo, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Database, Search } from 'lucide-react';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
}

export default function GLExplorerPage() {
  const { entries, accounts } = useGLStore();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const filtered = useMemo(() => {
    let list = entries;
    if (typeFilter !== 'all')
      list = list.filter((e) => (e.accountCode || '').startsWith(typeFilter));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.accountCode?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.accountName?.toLowerCase().includes(q)
      );
    }
    return list.slice(0, 200);
  }, [entries, typeFilter, search]);
  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <Database className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No GL Data</h2>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">GL Explorer</h1>
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
            placeholder="Explore entries..."
            value={search}
            onChange={(e) => startTransition(() => setSearch(e.target.value))}
          />
        </div>
        <select
          className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="1">Assets</option>
          <option value="2">Liabilities</option>
          <option value="3">Equity</option>
          <option value="4">Revenue</option>
          <option value="5">COGS</option>
          <option value="6">Expenses</option>
        </select>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm" aria-label="General ledger explorer">
              <caption className="sr-only">Detailed GL general ledger explorer</caption>
              <thead className="sticky top-0 bg-slate-900">
                <tr className="text-left text-slate-400 text-xs uppercase">
                  <th scope="col" className="px-4 py-3">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Account
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Description
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Debit
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-800 ${isPending ? 'opacity-60' : ''}`}>
                {filtered.map((e, i) => (
                  <tr key={e.id || i} className="hover:bg-slate-900/50">
                    <td className="px-4 py-2 text-xs text-slate-400">{e.date || e.period}</td>
                    <td className="px-4 py-2 font-mono text-xs">{e.accountCode}</td>
                    <td className="px-4 py-2 text-xs max-w-[200px] truncate">
                      {e.description || '-'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-blue-400 text-xs">
                      {e.debit > 0 ? formatCurrency(e.debit) : ''}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-green-400 text-xs">
                      {e.credit > 0 ? formatCurrency(e.credit) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-slate-500">
        {entries.length.toLocaleString()} total · showing first {filtered.length}
      </p>
      {/* B2: Quick export from explorer */}
      <Button size="sm" variant="ghost" onClick={() => {
        const csv = ['Date,Account,Description,Debit,Credit'];
        filtered.forEach(e => csv.push([e.date||e.period, e.accountCode, `"${(e.description||'').replace(/"/g,'""')}"`, e.debit, e.credit].join(',')));
        const blob = new Blob([csv.join('\n')], {type:'text/csv'});
        const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download='gl-explorer.csv';a.click();
      }}>Export visible rows</Button>
    </div>
  );
}
