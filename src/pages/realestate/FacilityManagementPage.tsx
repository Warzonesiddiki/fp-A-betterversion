import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react';
import { AlertTriangle, Droplets, Settings, Wrench, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
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
import type { FiscalPeriod } from '@/types';
import { useGLStore } from '@/store/glStore';
import { useRealEstateStore } from '@/store/realEstateStore';
import { roundTo, sumMoney } from '@/utils/money';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

const mockPeriods: FiscalPeriod[] = buildFiscalPeriods();

/**
 * Facility Operations (session 028, replaces fabricated session-022 version).
 *
 * Pre-session-028 page rendered six months of fictional planned/reactive
 * maintenance splits, four named facilities with hand-typed opex/sqft,
 * utility costs and energy ratings, and three literal benchmark values
 * (electricity avg, water/sewage avg, SLA compliance 98.4%, response 42
 * minutes). None was backed by a facilities-management system or the GL.
 *
 * The general ledger does carry utilities/cleaning/maintenance expense as
 * 6xxx accounts, so the page now reports total facility OpEx and a
 * utilities breakout from the GL. Per-square-foot, per-facility splits,
 * energy ratings and SLA compliance require a facilities-management system
 * and are disclosed as not derivable.
 */
export default function FacilityManagementPage() {
  const [periodId, setPeriodId] = useState('P01');
  const { entries } = useGLStore();
  const { maintenanceTrend, facilities } = useRealEstateStore();
  const fmtCurrency = useCurrencyFormatter();

  // Real: total maintenance+utilities+cleaning OpEx from the GL (6xxx).
  // Convention: 61xx utilities, 62xx cleaning, 63xx repair & maintenance,
  // 64xx facilities management fees. We aggregate all 6xxx debits.
  const totalOpEx = useMemo(
    () =>
      roundTo(
        sumMoney(entries.filter((e) => /^6/.test(e.accountCode ?? '')).map((e) => e.debit)),
        2
      ),
    [entries]
  );

  // Real: utilities alone (61xx).
  const utilitiesOpEx = useMemo(
    () =>
      roundTo(
        sumMoney(entries.filter((e) => /^61/.test(e.accountCode ?? '')).map((e) => e.debit)),
        2
      ),
    [entries]
  );

  // Real: maintenance alone (63xx).
  const maintenanceOpEx = useMemo(
    () =>
      roundTo(
        sumMoney(entries.filter((e) => /^63/.test(e.accountCode ?? '')).map((e) => e.debit)),
        2
      ),
    [entries]
  );

  // Real: cleaning alone (62xx).
  const cleaningOpEx = useMemo(
    () =>
      roundTo(
        sumMoney(entries.filter((e) => /^62/.test(e.accountCode ?? '')).map((e) => e.debit)),
        2
      ),
    [entries]
  );

  const opexKpi = totalOpEx > 0 ? fmtCurrency.custom({ compact: true })(totalOpEx) : '—';
  const utilitiesKpi =
    utilitiesOpEx > 0 ? fmtCurrency.custom({ compact: true })(utilitiesOpEx) : '—';
  const maintenanceKpi =
    maintenanceOpEx > 0 ? fmtCurrency.custom({ compact: true })(maintenanceOpEx) : '—';
  const cleaningKpi = cleaningOpEx > 0 ? fmtCurrency.custom({ compact: true })(cleaningOpEx) : '—';

  const columns: Column[] = [
    { key: 'name', header: 'Facility Name', sortable: true },
    { key: 'opex_sqft', header: 'OpEx / SqFt', align: 'right' },
    { key: 'utilities', header: 'Utilities', align: 'right' },
    { key: 'cleaning', header: 'Cleaning', align: 'right' },
    { key: 'maintenance', header: 'Maintenance', align: 'right' },
    { key: 'efficiency', header: 'Energy Rating', align: 'center' },
  ];

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-left-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Facility Operations"
          purpose="OpEx tracking from the general ledger. Per-site splits and ratings require a facilities-management feed."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm" disabled>
            <Settings className="h-4 w-4 mr-2" />
            Service Rules
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Facility OpEx (6xxx)"
          value={opexKpi}
          changeLabel={totalOpEx > 0 ? 'sum of 6xxx debits in the GL' : 'no 6xxx entries in the GL'}
        />
        <KPIValue
          label="Utilities (61xx)"
          value={utilitiesKpi}
          changeLabel={utilitiesOpEx > 0 ? 'posted to GL' : 'no 61xx entries in the GL'}
        />
        <KPIValue
          label="Maintenance (63xx)"
          value={maintenanceKpi}
          changeLabel={maintenanceOpEx > 0 ? 'posted to GL' : 'no 63xx entries in the GL'}
        />
        <KPIValue
          label="Cleaning (62xx)"
          value={cleaningKpi}
          changeLabel={cleaningOpEx > 0 ? 'posted to GL' : 'no 62xx entries in the GL'}
        />
      </div>

      {/* Main Analysis */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <CardTitle>Maintenance Spend Mix</CardTitle>
            </div>
            <CardDescription>
              {maintenanceTrend.length > 0
                ? 'Recorded planned vs. reactive maintenance'
                : 'No maintenance trend recorded — connect a facilities-management feed'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              {maintenanceTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={maintenanceTrend} stackOffset="none">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${Number(v) / 1000}k`}
                    />
                    <Tooltip />
                    <Legend verticalAlign="top" align="right" />
                    <Bar
                      dataKey="planned"
                      name="Planned Preventative"
                      fill="#3b82f6"
                      stackId="a"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="reactive"
                      name="Reactive / Repair"
                      fill="#ef4444"
                      stackId="a"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No maintenance trend recorded. Connect a facilities-management feed to populate this chart." />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utility Benchmarking</CardTitle>
            <CardDescription>Posted utilities (61xx) from the GL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                  Electricity (61xx)
                </div>
                <div className="text-lg font-bold">{utilitiesKpi}</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Droplets className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                  Water / Sewage
                </div>
                <div className="text-lg font-bold">—</div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  requires a utility sub-ledger
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider mb-2">
                <AlertTriangle className="h-3 w-3" />
                Per-site splits & SLA
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Per-square-foot opex, energy ratings, SLA compliance, and response times are not
                derivable from the general ledger. They require a facilities-management system with
                work-order tracking.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facility Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Site Operational Ledger</CardTitle>
            <CardDescription>
              {facilities.length > 0
                ? 'Properties recorded in the real-estate store'
                : 'No facilities recorded — connect a facilities-management feed'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {facilities.length > 0 ? (
            <DataTable
              columns={columns}
              data={facilities}
              caption="Site operational ledger table"
              ariaLabel="Site operational ledger data table for facility management"
            />
          ) : (
            <div className="text-sm text-[var(--text-muted)] space-y-2">
              <p>
                Per-facility opex/sqft, utilities, cleaning, maintenance, and energy rating are not
                derivable from the general ledger. They require a facilities-management system that
                records square-footage per property and a utility sub-ledger.
              </p>
              <p>
                Total facility OpEx (6xxx) and a utilities breakout are reported above from the real
                GL.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-[var(--text-muted)]">
      <div className="text-center max-w-sm">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-[var(--text-muted)]" />
        <p>{message}</p>
      </div>
    </div>
  );
}
