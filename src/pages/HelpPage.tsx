import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  HelpCircle,
  Search,
  Keyboard,
  BookOpen,
  FileText,
  Upload,
  Calculator,
  BarChart3,
  Settings,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function HelpPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const topics = [
    {
      icon: Upload,
      title: 'Importing Data',
      desc: 'Upload CSV or Excel files with GL data',
      path: '/data/gl-upload',
    },
    {
      icon: BookOpen,
      title: 'Chart of Accounts',
      desc: 'Manage your account structure',
      path: '/data/chart-of-accounts',
    },
    {
      icon: Keyboard,
      title: 'Keyboard Shortcuts',
      desc: 'Ctrl+S save, Ctrl+Z undo, Ctrl+K command palette',
      path: '',
    },
    {
      icon: FileText,
      title: 'Creating Budgets',
      desc: 'Set up and manage budgets with variance tracking',
      path: '/budgets/create',
    },
    {
      icon: Calculator,
      title: 'Formulas',
      desc: '245+ Excel-compatible formula functions',
      path: '',
    },
    {
      icon: BarChart3,
      title: 'Reports & Charts',
      desc: 'Build reports with waterfall, variance, sparkline charts',
      path: '/reports',
    },
    {
      icon: Settings,
      title: 'Settings',
      desc: 'Configure currency, fiscal year, preferences',
      path: '/settings',
    },
    {
      icon: Shield,
      title: 'Roles & Permissions',
      desc: 'Admin, Manager, Analyst, Dept Head, Viewer',
      path: '/settings',
    },
  ];

  const filteredTopics = useMemo(() => {
    if (!search.trim()) return topics;
    const q = search.toLowerCase();
    return topics.filter(
      (t) => t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
    );
  }, [search]);

  const shortcuts = [
    { key: 'Ctrl+S', desc: 'Save current budget' },
    { key: 'Ctrl+Z', desc: 'Undo last change' },
    { key: 'Ctrl+Shift+Z', desc: 'Redo' },
    { key: 'Ctrl+K', desc: 'Open command palette' },
    { key: 'Ctrl+N', desc: 'Create new item' },
    { key: 'Ctrl+E', desc: 'Export current view' },
    { key: 'Ctrl+P', desc: 'Print / PDF export' },
    { key: 'Ctrl+/', desc: 'Show keyboard shortcuts' },
    { key: 'F2', desc: 'Edit selected cell' },
    { key: 'Escape', desc: 'Close modal / cancel edit' },
    { key: '/', desc: 'Focus search' },
  ];

  const faqs = [
    {
      q: 'How do I import data from Excel?',
      a: 'Go to Data > GL Upload, select your .xlsx or .csv file. The system auto-detects column mappings for GL accounts, dates, and amounts.',
    },
    {
      q: 'How do I create a budget?',
      a: 'Navigate to Budgets > Create. Choose a template or start from scratch. Use the formula bar with Excel-compatible functions like SUM, IF, VLOOKUP.',
    },
    {
      q: 'How do I run a variance report?',
      a: 'Go to Reports > Budget vs Actual. Select budget version and period range. Variances are color-coded: green for favorable, red for unfavorable.',
    },
    {
      q: 'Can I export reports to PDF/Excel?',
      a: 'Yes. Click the export buttons in any report view, or use Ctrl+E for Excel, Ctrl+P for PDF.',
    },
    {
      q: 'How do I set up multi-entity consolidation?',
      a: 'Go to Consolidation > Entities. Add subsidiaries with their base currencies. The consolidation engine handles FX translation (ASC 830) and intercompany eliminations.',
    },
    {
      q: 'What roles are available?',
      a: 'Admin (full access), Manager (approve budgets), Analyst (create/edit), Dept Head (view department), Viewer (read-only). Configure in Settings > Users & Roles.',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Help Center</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm"
          placeholder="Search help topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTopics.map((t, i) => (
          <Card
            key={i}
            className="cursor-pointer hover:border-blue-500/50 transition-colors"
            onClick={() => t.path && navigate(t.path)}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2 bg-slate-800 rounded-lg">
                <t.icon className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{t.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
            {shortcuts.map((s) => (
              <div key={s.key} className="flex items-center gap-2 py-0.5">
                <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-200 min-w-[80px] text-center">
                  {s.key}
                </kbd>
                <span className="text-slate-400">{s.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-sm font-medium">{faq.q}</span>
                  {expandedFaq === i ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
                  <div className="px-3 pb-3 text-sm text-slate-400 border-t border-slate-700 pt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
