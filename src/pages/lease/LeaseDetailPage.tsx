/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
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
import { LeaseEngine, type LeaseContract } from '@/engines/LeaseEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

const AS_OF = new Date('2026-01-01T00:00:00Z');

interface LeaseInput {
  id: string;
  property: string;
  lessee: string;
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  interestRatePct: number;
  leaseType: 'Operating' | 'Finance';
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
  /** REAL right-of-use asset = PV of payments (LeaseEngine.generateDisclosure). */
  rouAsset: number;
  /** REAL lease liability = PV of payments. */
  liability: number;
  status: 'Active' | 'Expired' | 'Terminated';
  contract: LeaseContract;
}

const LEASE_INPUTS: LeaseInput[] = [
  {
    id: 'L001',
    property: 'HQ Office - Floor 12',
    lessee: 'FinPlan Corp',
    startDate: '2024-01-01',
    endDate: '2029-12-31',
    monthlyPayment: 45000,
    interestRatePct: 5.2,
    leaseType: 'Finance',
  },
  {
    id: 'L002',
    property: 'Warehouse - East',
    lessee: 'FinPlan Logistics',
    startDate: '2023-06-01',
    endDate: '2028-05-31',
    monthlyPayment: 28000,
    interestRatePct: 4.8,
    leaseType: 'Operating',
  },
  {
    id: 'L003',
    property: 'Data Center - North',
    lessee: 'FinPlan Tech',
    startDate: '2025-01-01',
    endDate: '2030-12-31',
    monthlyPayment: 62000,
    interestRatePct: 5.5,
    leaseType: 'Finance',
  },
  {
    id: 'L004',
    property: 'Retail - Downtown',
    lessee: 'FinPlan Retail',
    startDate: '2022-03-01',
    endDate: '2027-02-28',
    monthlyPayment: 18000,
    interestRatePct: 4.5,
    leaseType: 'Operating',
  },
  {
    id: 'L005',
    property: 'Office - West Wing',
    lessee: 'FinPlan Corp',
    startDate: '2021-01-01',
    endDate: '2025-12-31',
    monthlyPayment: 35000,
    interestRatePct: 5.0,
    leaseType: 'Finance',
  },
];

function buildRecord(input: LeaseInput): LeaseRecord {
  const leaseTerm = Math.max(1, monthsBetween(new Date(input.startDate), new Date(input.endDate)));
  const contract: LeaseContract = {
    id: input.id,
    assetDescription: input.property,
    commencementDate: input.startDate,
    leaseTerm,
    leasePayments: Array.from({ length: leaseTerm }, () => input.monthlyPayment),
    discountRate: input.interestRatePct / 100,
  };
  const disclosure = LeaseEngine.generateDisclosure(contract);
  const status: LeaseRecord['status'] = new Date(input.endDate) < AS_OF ? 'Expired' : 'Active';
  return {
    ...input,
    interestRate: input.interestRatePct,
    rouAsset: disclosure.rightOfUseAsset,
    liability: disclosure.leaseLiability,
    status,
    contract,
  };
}

const LEASES: LeaseRecord[] = LEASE_INPUTS.map(buildRecord);

interface AmortRow {
  month: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

// REAL liability amortization from LeaseEngine (first 12 periods). Replaces the
// old local raw-float generator that started from a hardcoded liability.
function liabilityAmortization(contract: LeaseContract): AmortRow[] {
  return LeaseEngine.calculateLeaseLiability(contract)
    .slice(0, 12)
    .map((e) => ({
      month: e.period,
      payment: Math.round(e.payment),
      principal: Math.round(e.reduction),
      interest: Math.round(e.interest),
      balance: Math.round(e.closingBalance),
    }));
}

interface DepRow {
  year: string;
  bookValue: number;
  depreciation: number;
  accumulated: number;
}

// REAL ROU-asset depreciation from LeaseEngine.calculateROUAsset, aggregated to
// annual. Replaces the old local straight-line-on-a-fake-asset generator.
function rouDepreciation(contract: LeaseContract, rouAsset: number): DepRow[] {
  const sched = LeaseEngine.calculateROUAsset(contract);
  const years = Math.min(8, Math.ceil(sched.length / 12));
  return Array.from({ length: years }, (_, i) => {
    const endMonth = (i + 1) * 12;
    const entry = sched[Math.min(endMonth, sched.length) - 1];
    const bookValue = entry ? entry.closingBalance : 0;
    const depreciation = sched.slice(i * 12, endMonth).reduce((s, e) => s + e.depreciation, 0);
    return {
      year: `Year ${i + 1}`,
      bookValue: Math.round(bookValue),
      depreciation: Math.round(depreciation),
      accumulated: Math.round(rouAsset - bookValue),
    };
  });
}

export default function LeaseDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedLease, setSelectedLease] = useState<LeaseRecord>(LEASES[0]!);

  useEffect(() => {
    document.title = 'FinPlan Pro - Lease Detail';
    if (id) {
      const found = LEASES.find((l) => l.id === id);
      if (found && found.id !== selectedLease.id) setSelectedLease(found);
    }
  }, [id, selectedLease.id]);

  const amortization = useMemo(
    () => liabilityAmortization(selectedLease.contract),
    [selectedLease]
  );
  const depreciation = useMemo(
    () => rouDepreciation(selectedLease.contract, selectedLease.rouAsset),
    [selectedLease]
  );

  const active = LEASES.filter((l) => l.status === 'Active');
  const totalLiability = active.reduce((s, l) => s + l.liability, 0);
  const totalRouAsset = active.reduce((s, l) => s + l.rouAsset, 0);
  const avgRate = active.length
    ? active.reduce((s, l) => s + l.interestRate, 0) / active.length
    : 0;

  const amortColumns: Column<AmortRow>[] = [
    { key: 'month', header: 'Month', sortable: true },
    { key: 'payment', header: 'Payment', render: (r) => formatCurrency(r.payment) },
    { key: 'principal', header: 'Principal', render: (r) => formatCurrency(r.principal) },
    { key: 'interest', header: 'Interest', render: (r) => formatCurrency(r.interest) },
    { key: 'balance', header: 'Balance', render: (r) => formatCurrency(r.balance) },
  ];

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Month', 'Payment', 'Principal', 'Interest', 'Balance'],
        rows: amortization.map((r) => [r.month, r.payment, r.principal, r.interest, r.balance]),
      },
      { title: `Lease Amortization - ${selectedLease.property}` }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Month', 'Payment', 'Principal', 'Interest', 'Balance'],
        rows: amortization.map((r) => [r.month, r.payment, r.principal, r.interest, r.balance]),
      },
      { title: `Lease_Amortization_${selectedLease.id}` }
    ).catch(reportExportFailure);
  };

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
            <p className="text-sm text-slate-400">
              {selectedLease.property} — schedules computed by LeaseEngine (not mock data)
            </p>
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
          value={String(active.length)}
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
          <DataTable
            data={amortization}
            columns={amortColumns}
            pageSize={6}
            caption="Lease amortization schedule: payment, principal, interest, and closing balance for each period"
            ariaLabel="Lease amortization schedule"
          />
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
              <div className="text-lg font-semibold" data-testid={`rou-${selectedLease.id}`}>
                {formatCurrency(selectedLease.rouAsset)}
              </div>
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
            {LEASES.map((lease) => (
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
                      className={`text-xs px-2 py-0.5 rounded-full ${lease.status === 'Active' ? 'bg-green-900/50 text-green-400' : 'bg-slate-700 text-slate-400'}`}
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
