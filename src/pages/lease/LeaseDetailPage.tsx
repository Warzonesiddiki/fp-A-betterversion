import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Download, FileText, Calendar, DollarSign, Percent, ArrowLeft } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { ExportEngine } from '@/engines/ExportEngine';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface LeaseRecord {
  id: string;
  property: string;
  lessee: string;
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  interestRate: number;
  leaseType: 'Operating' | 'Finance';
  rouAsset: number;
  liability: number;
  status: 'Active' | 'Expired' | 'Terminated';
}

const mockLeases: LeaseRecord[] = [
  {
    id: 'L001',
    property: 'HQ Office - Floor 12',
    lessee: 'FinPlan Corp',
    startDate: '2024-01-01',
    endDate: '2029-12-31',
    monthlyPayment: 45000,
    interestRate: 5.2,
    leaseType: 'Finance',
    rouAsset: 2400000,
    liability: 2100000,
    status: 'Active',
  },
  {
    id: 'L002',
    property: 'Warehouse - East',
    lessee: 'FinPlan Logistics',
    startDate: '2023-06-01',
    endDate: '2028-05-31',
    monthlyPayment: 28000,
    interestRate: 4.8,
    leaseType: 'Operating',
    rouAsset: 1500000,
    liability: 1350000,
    status: 'Active',
  },
  {
    id: 'L003',
    property: 'Data Center - North',
    lessee: 'FinPlan Tech',
    startDate: '2025-01-01',
    endDate: '2030-12-31',
    monthlyPayment: 62000,
    interestRate: 5.5,
    leaseType: 'Finance',
    rouAsset: 3200000,
    liability: 2900000,
    status: 'Active',
  },
  {
    id: 'L004',
    property: 'Retail - Downtown',
    lessee: 'FinPlan Retail',
    startDate: '2022-03-01',
    endDate: '2027-02-28',
    monthlyPayment: 18000,
    interestRate: 4.5,
    leaseType: 'Operating',
    rouAsset: 950000,
    liability: 720000,
    status: 'Active',
  },
  {
    id: 'L005',
    property: 'Office - West Wing',
    lessee: 'FinPlan Corp',
    startDate: '2021-01-01',
    endDate: '2025-12-31',
    monthlyPayment: 35000,
    interestRate: 5.0,
    leaseType: 'Finance',
    rouAsset: 1800000,
    liability: 450000,
    status: 'Expired',
  },
];

function generateAmortizationSchedule(lease: LeaseRecord) {
  const months = Math.ceil(
    (new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) /
      (1000 * 60 * 60 * 24 * 30)
  );
  const schedule = [];
  let balance = lease.liability;
  const monthlyRate = lease.interestRate / 100 / 12;

  for (let i = 0; i < Math.min(months, 12); i++) {
    const interest = balance * monthlyRate;
    const principal = lease.monthlyPayment - interest;
    balance = Math.max(0, balance - principal);
    schedule.push({
      month: `Month ${i + 1}`,
      payment: lease.monthlyPayment,
      principal: Math.round(principal),
      interest: Math.round(interest),
      balance: Math.round(balance),
    });
  }
  return schedule;
}

function generateDepreciationData(lease: LeaseRecord) {
  const years = Math.ceil(
    (new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365)
  );
  const annualDep = lease.rouAsset / years;
  const data = [];
  let bookValue = lease.rouAsset;

  for (let i = 0; i < Math.min(years, 8); i++) {
    bookValue = Math.max(0, bookValue - annualDep);
    data.push({
      year: `Year ${i + 1}`,
      bookValue: Math.round(bookValue),
      depreciation: Math.round(annualDep),
      accumulated: Math.round(lease.rouAsset - bookValue),
    });
  }
  return data;
}

export default function LeaseDetailPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedLease, setSelectedLease] = useState<LeaseRecord>(mockLeases[0]);

  useEffect(() => {
    document.title = 'FinPlan Pro - Lease Detail';
    if (id) {
      const found = mockLeases.find((l) => l.id === id);
      if (found && found.id !== selectedLease.id) {
        setSelectedLease(found);
      }
    }
  }, [id, selectedLease.id]);

  const glLeaseTotal = useMemo(
    () =>
      entries
        .filter((e) => (e.description || '').toLowerCase().includes('lease'))
        .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0),
    [entries]
  );

  const amortization = useMemo(() => generateAmortizationSchedule(selectedLease), [selectedLease]);
  const depreciation = useMemo(() => generateDepreciationData(selectedLease), [selectedLease]);

  const totalLiability = mockLeases
    .filter((l) => l.status === 'Active')
    .reduce((s, l) => s + l.liability, 0);
  const totalRouAsset = mockLeases
    .filter((l) => l.status === 'Active')
    .reduce((s, l) => s + l.rouAsset, 0);
  const avgRate =
    mockLeases.filter((l) => l.status === 'Active').reduce((s, l) => s + l.interestRate, 0) /
    mockLeases.filter((l) => l.status === 'Active').length;

  const amortColumns: Column<(typeof amortization)[0]>[] = [
    { key: 'month', header: 'Month', sortable: true },
    { key: 'payment', header: 'Payment', render: (r) => formatCurrency(r.payment) },
    { key: 'principal', header: 'Principal', render: (r) => formatCurrency(r.principal) },
    { key: 'interest', header: 'Interest', render: (r) => formatCurrency(r.interest) },
    { key: 'balance', header: 'Balance', render: (r) => formatCurrency(r.balance) },
  ];

  const handleExportPDF = () => {
    ExportEngine.exportToPDF(
      {
        headers: ['Month', 'Payment', 'Principal', 'Interest', 'Balance'],
        rows: amortization.map((r) => [r.month, r.payment, r.principal, r.interest, r.balance]),
      },
      { title: `Lease Amortization - ${selectedLease.property}` }
    );
  };

  const handleExportExcel = () => {
    ExportEngine.exportToExcel(
      {
        headers: ['Month', 'Payment', 'Principal', 'Interest', 'Balance'],
        rows: amortization.map((r) => [r.month, r.payment, r.principal, r.interest, r.balance]),
      },
      { title: `Lease_Amortization_${selectedLease.id}` }
    );
  };

  if (entries.length === 0 && glLeaseTotal === 0) {
    return (
      <div className="p-12 text-center">
        <FileText className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Lease Data</h2>
        <p className="text-slate-400 mb-6">Import GL data with lease entries to view details.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/lease/dashboard')}
            aria-label="Back to lease dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Lease Detail</h1>
            <p className="text-sm text-slate-400">{selectedLease.property}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue
          label="Total Liability"
          value={formatCurrency(totalLiability)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="ROU Asset"
          value={formatCurrency(totalRouAsset)}
          icon={<FileText className="h-4 w-4" />}
        />
        <KPIValue
          label="Avg Interest Rate"
          value={`${avgRate.toFixed(1)}%`}
          icon={<Percent className="h-4 w-4" />}
        />
        <KPIValue
          label="Active Leases"
          value={String(mockLeases.filter((l) => l.status === 'Active').length)}
          icon={<Calendar className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Right-of-Use Asset Depreciation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={depreciation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(v: any) => formatCurrency(v)}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bookValue"
                  stroke="#3b82f6"
                  name="Book Value"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="accumulated"
                  stroke="#10b981"
                  name="Accumulated Dep."
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lease Liability Payment Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={amortization}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(v: any) => formatCurrency(v)}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Bar dataKey="principal" fill="#3b82f6" name="Principal" stackId="a" />
                <Bar dataKey="interest" fill="#f59e0b" name="Interest" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Amortization Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={amortization} columns={amortColumns} pageSize={6} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ASC 842 / IFRS 16 Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Lease Classification</div>
              <div className="text-lg font-semibold">{selectedLease.leaseType}</div>
              <div className="text-xs text-slate-500 mt-1">
                {selectedLease.leaseType === 'Finance' ? 'ASC 842-20 / IFRS 16' : 'ASC 842-10'}
              </div>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">ROU Asset</div>
              <div className="text-lg font-semibold">{formatCurrency(selectedLease.rouAsset)}</div>
              <div className="text-xs text-green-400 mt-1">Recognized on balance sheet</div>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Lease Liability</div>
              <div className="text-lg font-semibold">{formatCurrency(selectedLease.liability)}</div>
              <div className="text-xs text-yellow-400 mt-1">Present value of payments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Leases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockLeases.map((lease) => (
              <div
                key={lease.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedLease.id === lease.id
                    ? 'bg-blue-900/30 border border-blue-500/30'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                onClick={() => setSelectedLease(lease)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedLease(lease);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{lease.property}</div>
                    <div className="text-xs text-slate-400">
                      {lease.lessee} | {lease.startDate} to {lease.endDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(lease.monthlyPayment)}/mo</div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        lease.status === 'Active'
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {lease.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
