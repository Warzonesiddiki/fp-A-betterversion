/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  Banknote,
  Download,
  FileText,
  Table as TableIcon,
  AlertCircle,
  CheckCircle,
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
  LineChart,
  Line,
} from 'recharts';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const mockDebt = [
  {
    id: 'DEBT-001',
    lender: 'Chase Bank',
    type: 'Term Loan',
    principal: 15000000,
    rate: 5.25,
    maturity: '2028-06-30',
    monthlyPayment: 285000,
    remaining: 12400000,
    status: 'current',
  },
  {
    id: 'DEBT-002',
    lender: 'Wells Fargo',
    type: 'Revolving LOC',
    principal: 8000000,
    rate: 4.75,
    maturity: '2027-03-15',
    monthlyPayment: 0,
    remaining: 3200000,
    status: 'current',
  },
  {
    id: 'DEBT-003',
    lender: 'Goldman Sachs',
    type: 'Senior Notes',
    principal: 25000000,
    rate: 6.5,
    maturity: '2030-12-01',
    monthlyPayment: 135417,
    remaining: 25000000,
    status: 'current',
  },
  {
    id: 'DEBT-004',
    lender: 'Bank of America',
    type: 'Equipment Finance',
    principal: 2500000,
    rate: 7.25,
    maturity: '2027-09-30',
    monthlyPayment: 72000,
    remaining: 1800000,
    status: 'current',
  },
  {
    id: 'DEBT-005',
    lender: 'JP Morgan',
    type: 'Bridge Loan',
    principal: 10000000,
    rate: 8.0,
    maturity: '2026-03-31',
    monthlyPayment: 0,
    remaining: 10000000,
    status: 'watch',
  },
];

const amortizationData = [
  { year: '2026', principal: 3200000, interest: 2800000, balance: 49200000 },
  { year: '2027', principal: 5800000, interest: 2400000, balance: 43400000 },
  { year: '2028', principal: 7200000, interest: 1900000, balance: 36200000 },
  { year: '2029', principal: 8500000, interest: 1400000, balance: 27700000 },
  { year: '2030', principal: 27700000, interest: 800000, balance: 0 },
];

export default function DebtSchedulePage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Debt Schedule';
  }, []);

  const totalDebt = mockDebt.reduce((s, d) => s + d.remaining, 0);
  const weightedRate = mockDebt.reduce((s, d) => s + d.rate * d.remaining, 0) / totalDebt;
  const totalMonthlyPayment = mockDebt.reduce((s, d) => s + d.monthlyPayment, 0);
  const annualDebtService = totalMonthlyPayment * 12;
  const ebitda = 18000000;
  const dscr = ebitda / annualDebtService;

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center">
        <Banknote className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to analyze debt schedule.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const columns: Column[] = useMemo(
    () => [
      { key: 'id', header: 'ID', width: '100px' },
      { key: 'lender', header: 'Lender', sortable: true },
      { key: 'type', header: 'Type', sortable: true },
      {
        key: 'principal',
        header: 'Principal',
        align: 'right',
        render: (v) => formatCurrency(v as number),
      },
      {
        key: 'rate',
        header: 'Rate',
        align: 'right',
        render: (v) => `${(v as number).toFixed(2)}%`,
      },
      { key: 'maturity', header: 'Maturity', sortable: true },
      {
        key: 'monthlyPayment',
        header: 'Monthly Pmt',
        align: 'right',
        render: (v) => formatCurrency(v as number),
      },
      {
        key: 'remaining',
        header: 'Remaining',
        align: 'right',
        render: (v) => formatCurrency(v as number),
      },
      {
        key: 'status',
        header: 'Status',
        render: (v) => {
          const status = v as string;
          const icon =
            status === 'current' ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : status === 'watch' ? (
              <Clock className="h-4 w-4 text-yellow-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            );
          return (
            <span className="flex items-center gap-1.5">
              {icon}
              {status === 'current' ? 'Current' : status === 'watch' ? 'Watch' : 'Past Due'}
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
        headers: ['Lender', 'Type', 'Principal', 'Rate', 'Maturity', 'Remaining'],
        rows: mockDebt.map((d) => [
          d.lender,
          d.type,
          formatCurrency(d.principal),
          `${d.rate}%`,
          d.maturity,
          formatCurrency(d.remaining),
        ]),
      },
      { title: 'Debt Schedule' }
    );
  };

  const handleExportExcel = () => {
    ExportEngine.exportToExcel(
      {
        headers: [
          'ID',
          'Lender',
          'Type',
          'Principal',
          'Rate',
          'Maturity',
          'Monthly Payment',
          'Remaining',
          'Status',
        ],
        rows: mockDebt.map((d) => [
          d.id,
          d.lender,
          d.type,
          d.principal,
          d.rate,
          d.maturity,
          d.monthlyPayment,
          d.remaining,
          d.status,
        ]),
      },
      { title: 'Debt_Schedule' }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Debt Schedule</h1>
          <p className="text-sm text-slate-400 mt-1">Loan portfolio and amortization tracking</p>
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
        <KPIValue label="Total Debt" value={formatCurrency(totalDebt)} />
        <KPIValue label="Weighted Avg Rate" value={`${weightedRate.toFixed(2)}%`} />
        <KPIValue label="Annual Debt Service" value={formatCurrency(annualDebtService)} />
        <KPIValue
          label="DSCR"
          value={dscr.toFixed(2)}
          trend={dscr >= 1.25 ? 'up' : 'down'}
          changeLabel="Target: 1.25x"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Amortization Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={amortizationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(v: any) => formatCurrency(v)}
                />
                <Legend />
                <Bar dataKey="principal" fill="#3b82f6" name="Principal" stackId="a" />
                <Bar dataKey="interest" fill="#ef4444" name="Interest" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={amortizationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(v: any) => formatCurrency(v)}
                />
                <Line
                  dataKey="balance"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b' }}
                  name="Balance"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debt Instruments</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={mockDebt as unknown as Record<string, unknown>[]}
            pageSize={10}
            caption="Debt instruments amortization schedule"
            ariaLabel="Debt instruments schedule table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
