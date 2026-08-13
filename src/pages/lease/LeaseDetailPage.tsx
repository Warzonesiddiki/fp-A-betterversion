import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  Download,
  FileText,
  Calendar,
  DollarSign,
  Percent,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
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
import { useLeaseStore, type LeaseInput } from '@/store/leaseStore';
import { LeaseForm } from '@/components/lease/LeaseForm';
import { roundTo, sumMoney } from '@/utils/money';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
const AS_OF = new Date('2026-01-01T00:00:00Z');

interface LeaseRecord {
  id: string;
  property: string;
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

/** Derive the lease end date from commencement + term (store schema has no endDate). */
function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * Build the display/schedule record from a stored lease. The store is the
 * single source of truth (GAP-NEW-A) — this page no longer keeps its own
 * hardcoded array with a divergent schema. endDate, ROU asset, liability and
 * status are all DERIVED, never entered.
 */
function buildRecord(input: LeaseInput): LeaseRecord {
  const leaseTerm = Math.max(1, input.leaseTerm);
  const contract: LeaseContract = {
    id: input.id,
    assetDescription: input.property,
    commencementDate: input.commencementDate,
    leaseTerm,
    leasePayments: Array.from({ length: leaseTerm }, () => input.payment),
    discountRate: input.discountRate,
  };
  const disclosure = LeaseEngine.generateDisclosure(contract);
  const endDate = addMonths(input.commencementDate, leaseTerm);
  const status: LeaseRecord['status'] = new Date(endDate) < AS_OF ? 'Expired' : 'Active';
  return {
    id: input.id,
    property: input.property,
    startDate: input.commencementDate,
    endDate,
    monthlyPayment: input.payment,
    // Stored as a rate (0.06); displayed as a percentage (6.0).
    interestRate: input.discountRate * 100,
    leaseType: input.type,
    rouAsset: disclosure.rightOfUseAsset,
    liability: disclosure.leaseLiability,
    status,
    contract,
  };
}

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
    const depreciation = roundTo(
      sumMoney(sched.slice(i * 12, endMonth).map((e) => e.depreciation)),
      2
    );
    return {
      year: `Year ${i + 1}`,
      bookValue: Math.round(bookValue),
      depreciation: Math.round(depreciation),
      accumulated: Math.round(rouAsset - bookValue),
    };
  });
}

export default function LeaseDetailPage() {
  const fmt = useCurrencyFormatter();
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  // The dashboard links with ?id=..., the route may also carry /:id.
  const requestedId = routeId ?? searchParams.get('id') ?? undefined;

  // Single source of truth: the persisted, RBAC-gated lease store.
  const leaseInputs = useLeaseStore((s) => s.leases);
  const addLease = useLeaseStore((s) => s.addLease);
  const updateLease = useLeaseStore((s) => s.updateLease);
  const removeLease = useLeaseStore((s) => s.removeLease);

  const LEASES = useMemo(() => leaseInputs.map(buildRecord), [leaseInputs]);

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [formMode, setFormMode] = useState<'closed' | 'add' | 'edit'>('closed');

  useEffect(() => {
    document.title = 'FinPlan Pro - Lease Detail';
  }, []);

  // Resolve the selection against live store data so a deleted lease cannot
  // leave the page pointing at a record that no longer exists.
  const selectedLease = useMemo(
    () =>
      LEASES.find((l) => l.id === selectedId) ??
      LEASES.find((l) => l.id === requestedId) ??
      LEASES[0],
    [LEASES, selectedId, requestedId]
  );

  const editingInput = useMemo(
    () => leaseInputs.find((l) => l.id === selectedLease?.id),
    [leaseInputs, selectedLease]
  );

  const handleAdd = useCallback(
    (lease: LeaseInput) => {
      addLease(lease);
      setSelectedId(lease.id);
      setFormMode('closed');
    },
    [addLease]
  );

  const handleEdit = useCallback(
    (lease: LeaseInput) => {
      updateLease(lease.id, lease);
      setSelectedId(lease.id);
      setFormMode('closed');
    },
    [updateLease]
  );

  const handleRemove = useCallback(
    (id: string) => {
      removeLease(id);
      setSelectedId(undefined);
      setFormMode('closed');
    },
    [removeLease]
  );

  const amortization = useMemo(
    () => (selectedLease ? liabilityAmortization(selectedLease.contract) : []),
    [selectedLease]
  );
  const depreciation = useMemo(
    () => (selectedLease ? rouDepreciation(selectedLease.contract, selectedLease.rouAsset) : []),
    [selectedLease]
  );

  const active = LEASES.filter((l) => l.status === 'Active');
  const totalLiability = roundTo(sumMoney(active.map((l) => l.liability)), 2);
  const totalRouAsset = roundTo(sumMoney(active.map((l) => l.rouAsset)), 2);
  const avgRate = active.length
    ? roundTo(sumMoney(active.map((l) => l.interestRate)), 2) / active.length
    : 0;

  const amortColumns: Column<AmortRow>[] = [
    { key: 'month', header: 'Month', sortable: true },
    { key: 'payment', header: 'Payment', render: (_, r) => fmt.currency0(r.payment) },
    { key: 'principal', header: 'Principal', render: (_, r) => fmt.currency0(r.principal) },
    { key: 'interest', header: 'Interest', render: (_, r) => fmt.currency0(r.interest) },
    { key: 'balance', header: 'Balance', render: (_, r) => fmt.currency0(r.balance) },
  ];

  const handleExportPDF = () => {
    if (!selectedLease) return;
    void ExportEngine.exportToPDF(
      {
        headers: ['Month', 'Payment', 'Principal', 'Interest', 'Balance'],
        rows: amortization.map((r) => [r.month, r.payment, r.principal, r.interest, r.balance]),
      },
      { title: `Lease Amortization - ${selectedLease.property}` }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!selectedLease) return;
    void ExportEngine.exportToExcel(
      {
        headers: ['Month', 'Payment', 'Principal', 'Interest', 'Balance'],
        rows: amortization.map((r) => [r.month, r.payment, r.principal, r.interest, r.balance]),
      },
      { title: `Lease_Amortization_${selectedLease.id}` }
    ).catch(reportExportFailure);
  };

  const leaseForm = (
    <Card>
      <CardHeader>
        <CardTitle>{formMode === 'edit' ? 'Edit Lease' : 'Add Lease'}</CardTitle>
      </CardHeader>
      <CardContent>
        <LeaseForm
          initialValue={formMode === 'edit' ? editingInput : undefined}
          existingIds={leaseInputs.map((l) => l.id)}
          onSubmit={formMode === 'edit' ? handleEdit : handleAdd}
          onCancel={() => setFormMode('closed')}
        />
      </CardContent>
    </Card>
  );

  // Reachable empty state: the portfolio can legitimately be empty (a user can
  // delete every lease), and the only sensible action is to add one.
  if (!selectedLease) {
    return (
      <div className="p-6 space-y-6">
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
            <p className="text-sm text-[var(--text-muted)]">No leases in the portfolio yet</p>
          </div>
        </div>

        {formMode === 'closed' ? (
          <Card>
            <CardContent>
              <div className="py-10 text-center space-y-3">
                <p className="text-[var(--text-muted)]">
                  No Lease Data — add a lease to compute its ASC 842 / IFRS 16 schedules.
                </p>
                <Button size="sm" onClick={() => setFormMode('add')}>
                  <Plus className="h-4 w-4 mr-1" /> Add Lease
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          leaseForm
        )}
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
            <p className="text-sm text-[var(--text-muted)]">
              {selectedLease.property} — schedules computed by LeaseEngine (not mock data)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setFormMode('add')}>
            <Plus className="h-4 w-4 mr-1" /> Add Lease
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFormMode('edit')}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRemove(selectedLease.id)}
            aria-label={`Delete lease ${selectedLease.property}`}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      {formMode !== 'closed' && leaseForm}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue
          label="Total Liability"
          value={fmt.currency0(totalLiability)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="ROU Asset"
          value={fmt.currency0(totalRouAsset)}
          icon={<FileText className="h-4 w-4" />}
        />
        <KPIValue
          label="Avg Interest Rate"
          value={`${formatPercent(avgRate, 1)}`}
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
                  tickFormatter={(v) => `$${formatCompact(v)}`}
                />
                <Tooltip
                  formatter={(v) => fmt.currency0(Number(v))}
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
                  tickFormatter={(v) => `$${v ? formatCompact(v) : '—'}`}
                />
                <Tooltip
                  formatter={(v) => fmt.currency0(Number(v))}
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
                {fmt.currency0(selectedLease.rouAsset)}
              </div>
              <div className="text-xs text-green-400 mt-1">Recognized on balance sheet</div>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Lease Liability</div>
              <div className="text-lg font-semibold">{fmt.currency0(selectedLease.liability)}</div>
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
                onClick={() => setSelectedId(lease.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedId(lease.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{lease.property}</div>
                    <div className="text-xs text-slate-400">
                      {lease.leaseType} | {lease.startDate} to {lease.endDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{fmt.currency0(lease.monthlyPayment)}/mo</div>
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
