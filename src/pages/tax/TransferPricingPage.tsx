/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ArrowLeftRight,
  Download,
  FileText,
  Table as TableIcon,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const mockTransactions = [
  {
    id: 'TP-001',
    from: 'US Parent',
    to: 'UK Sub',
    service: 'Management Fees',
    amount: 2500000,
    method: 'TNMM',
    margin: 8.5,
    armRange: '7-12',
    status: 'compliant',
  },
  {
    id: 'TP-002',
    from: 'US Parent',
    to: 'DE Sub',
    service: 'R&D Services',
    amount: 1800000,
    method: 'CUP',
    margin: 10.2,
    armRange: '8-15',
    status: 'compliant',
  },
  {
    id: 'TP-003',
    from: 'US Parent',
    to: 'JP Sub',
    service: 'Royalties',
    amount: 3200000,
    method: 'RPM',
    margin: 12.1,
    armRange: '10-18',
    status: 'review',
  },
  {
    id: 'TP-004',
    from: 'UK Sub',
    to: 'SG Sub',
    service: 'IT Services',
    amount: 950000,
    method: 'TNMM',
    margin: 6.8,
    armRange: '7-12',
    status: 'non-compliant',
  },
  {
    id: 'TP-005',
    from: 'US Parent',
    to: 'BR Sub',
    service: 'Technical Assistance',
    amount: 1200000,
    method: 'CPM',
    margin: 9.5,
    armRange: '8-14',
    status: 'compliant',
  },
  {
    id: 'TP-006',
    from: 'DE Sub',
    to: 'IN Sub',
    service: 'Manufacturing',
    amount: 4500000,
    method: 'TNMM',
    margin: 11.3,
    armRange: '9-15',
    status: 'compliant',
  },
];

const methodDistribution = [
  { method: 'TNMM', count: 3, amount: 7950000 },
  { method: 'CUP', count: 1, amount: 1800000 },
  { method: 'RPM', count: 1, amount: 3200000 },
  { method: 'CPM', count: 1, amount: 1200000 },
];

export default function TransferPricingPage() {
  const { entries } = useGLStore();
  const _navigate = useNavigate();
  const [methodFilter, setMethodFilter] = useState<string>('all');

  useEffect(() => {
    document.title = 'FinPlan Pro — Transfer Pricing';
  }, []);

  const filtered = useMemo(() => {
    if (methodFilter === 'all') return mockTransactions;
    return mockTransactions.filter((t) => t.method === methodFilter);
  }, [methodFilter]);

  const totalIntercompany = mockTransactions.reduce((s, t) => s + t.amount, 0);
  const compliantCount = mockTransactions.filter((t) => t.status === 'compliant').length;
  const complianceRate = (compliantCount / mockTransactions.length) * 100;

  const columns: Column[] = useMemo(
    () => [
      { key: 'id', header: 'ID', width: '80px' },
      { key: 'from', header: 'From Entity', sortable: true },
      { key: 'to', header: 'To Entity', sortable: true },
      { key: 'service', header: 'Service Type', sortable: true },
      {
        key: 'amount',
        header: 'Amount',
        align: 'right',
        render: (v) => formatCurrency(v as number),
      },
      { key: 'method', header: 'Method', width: '80px' },
      {
        key: 'margin',
        header: 'Margin %',
        align: 'right',
        render: (v) => `${(v as number).toFixed(1)}%`,
      },
      { key: 'armRange', header: "Arm's Range", align: 'center' },
      {
        key: 'status',
        header: 'Status',
        render: (v) => {
          const status = v as string;
          const icon =
            status === 'compliant' ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : status === 'review' ? (
              <Clock className="h-4 w-4 text-yellow-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            );
          const label =
            status === 'compliant'
              ? 'Compliant'
              : status === 'review'
                ? 'Under Review'
                : 'Non-Compliant';
          return (
            <span className="flex items-center gap-1.5">
              {icon}
              {label}
            </span>
          );
        },
      },
    ],
    []
  );

  const handleExportPDF = () => {
    ExportEngine.exportToPDF(
      {
        headers: ['ID', 'From', 'To', 'Service', 'Amount', 'Method', 'Status'],
        rows: filtered.map((t) => [
          t.id,
          t.from,
          t.to,
          t.service,
          formatCurrency(t.amount),
          t.method,
          t.status,
        ]),
      },
      { title: 'Transfer Pricing Report' }
    );
  };

  const handleExportExcel = () => {
    ExportEngine.exportToExcel(
      {
        headers: ['ID', 'From', 'To', 'Service', 'Amount', 'Method', 'Margin', 'Status'],
        rows: filtered.map((t) => [
          t.id,
          t.from,
          t.to,
          t.service,
          t.amount,
          t.method,
          t.margin,
          t.status,
        ]),
      },
      { title: 'Transfer_Pricing_Report' }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transfer Pricing</h1>
          <p className="text-sm text-slate-400 mt-1">
            Intercompany transaction analysis and compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleExportPDF}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportExcel}>
            <TableIcon className="h-3.5 w-3.5 mr-1.5" />
            Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KPIValue label="Total Intercompany" value={formatCurrency(totalIntercompany)} />
        <KPIValue label="Transactions" value={String(mockTransactions.length)} />
        <KPIValue
          label="Compliance Rate"
          value={`${complianceRate.toFixed(0)}%`}
          trend={complianceRate >= 80 ? 'up' : 'down'}
        />
        <KPIValue label="Methods Used" value="4" changeLabel="TNMM, CUP, RPM, CPM" />
      </div>

      <div className="flex gap-2">
        {['all', 'TNMM', 'CUP', 'RPM', 'CPM'].map((m) => (
          <Button
            key={m}
            size="sm"
            variant={methodFilter === m ? 'default' : 'ghost'}
            onClick={() => setMethodFilter(m)}
          >
            {m === 'all' ? 'All Methods' : m}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Method Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={methodDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="method" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                formatter={(v: any) => formatCurrency(v)}
              />
              <Bar dataKey="amount" fill="#3b82f6" name="Total Amount" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Intercompany Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filtered as unknown as Record<string, unknown>[]}
            pageSize={10}
            caption="Intercompany transactions table"
            ariaLabel="Intercompany transactions data table for transfer pricing"
          />
        </CardContent>
      </Card>
    </div>
  );
}
