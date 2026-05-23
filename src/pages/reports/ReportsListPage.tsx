import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  FileText,
  BarChart3,
  DollarSign,
  TrendingUp,
  Layers,
  Search,
  Download,
  Scale,
} from 'lucide-react';
import { PivotTableEngine } from '@/engines/PivotTableEngine';
import { ProfessionalExportEngine } from '@/engines/ProfessionalExportEngine';
import { ReportCacheEngine } from '@/engines/ReportCacheEngine';
import { ReportVersionEngine } from '@/engines/ReportVersionEngine';

const reports = [
  { name: 'Profit & Loss', icon: DollarSign, path: '/reports/profit-loss', desc: 'Revenue, expenses, and net income statement', category: 'Financial' },
  { name: 'Balance Sheet', icon: Layers, path: '/reports/balance-sheet', desc: 'Assets, liabilities, and equity position', category: 'Financial' },
  { name: 'Cash Flow', icon: TrendingUp, path: '/reports/cash-flow', desc: 'Operating, investing, and financing activities', category: 'Financial' },
  { name: 'Three-Statement Model', icon: Scale, path: '/reports/three-statement', desc: 'Integrated P&L, Balance Sheet, and Cash Flow with auto-linking', category: 'Financial' },
  { name: 'Budget vs Actual', icon: BarChart3, path: '/reports/budget-vs-actual', desc: 'Compare budgeted amounts to actual performance', category: 'Variance' },
  { name: 'Board Pack', icon: FileText, path: '/reports/board-pack', desc: 'Executive summary for board presentations', category: 'Executive' },
];

export default function ReportsListPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'FinPlan Pro — Reports';
  }, []);

  const filtered = useMemo(() => {
    if (!search) return reports;
    const q = search.toLowerCase();
    return reports.filter(r => r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
  }, [search]);

  const categories = useMemo(() => {
    const cats = new Map<string, typeof reports>();
    filtered.forEach(r => {
      if (!cats.has(r.category)) cats.set(r.category, []);
      cats.get(r.category)!.push(r);
    });
    return cats;
  }, [filtered]);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <FileText className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
        <p className="text-slate-400 mb-6">Import GL data to generate financial reports.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-slate-400 mt-1">{entries.length.toLocaleString()} GL entries available</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm w-60"
              aria-label="Search reports"
            />
          </div>
        </div>
      </div>

      {[...categories.entries()].map(([category, items]) => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{category}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map(r => (
              <Card key={r.name} className="cursor-pointer hover:border-blue-500/50 transition-all" onClick={() => navigate(r.path)}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg shrink-0">
                    <r.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{r.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No reports match "{search}"</p>
        </div>
      )}
    </div>
  );
}
