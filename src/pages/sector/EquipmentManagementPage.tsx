import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Wrench, Gauge } from 'lucide-react';
import {
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import { PageHeader } from '@/components/ui/PageHeader';

/**
 * Equipment management (sector route) — vertical truthfulness sweep (wave 2).
 *
 * This routed copy kept real ledger derivations (equipment value,
 * depreciation, maintenance and their ratios) but decorated them with
 * invented operational figures: an overall-effectiveness percentage, a
 * utilisation rate, an average asset age, a "replacement value" produced by
 * multiplying posted value by a magic 1.3 factor, and monthly downtime
 * hours. Machine telemetry and a fixed-asset register are required for all
 * of those and do not exist here.
 *
 * The ratios that ARE arithmetic on posted amounts stay; the telemetry and
 * register rows are disclosed as not connected. The zero-denominator
 * fallback also changed from `0%` to `—` — an absence is not a zero.
 */

export default function EquipmentManagementPage() {
  const { entries } = useGLStore(useShallow((s) => ({ entries: s.entries })));
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Equipment Management';
  }, []);

  const stats = useMemo(() => {
    const equipment = entries.filter(
      (e) =>
        e.accountName.toLowerCase().includes('equipment') ||
        e.accountName.toLowerCase().includes('machinery')
    );
    const totalValue = roundTo(sumMoney(equipment.map((e) => e.debit)), 2);
    const depreciation = roundTo(
      sumMoney(
        entries.filter((e) => e.accountName.toLowerCase().includes('depreciat')).map((e) => e.debit)
      ),
      2
    );
    const maintenance = roundTo(
      sumMoney(
        entries.filter((e) => e.accountName.toLowerCase().includes('maint')).map((e) => e.debit)
      ),
      2
    );
    return { totalValue, depreciation, maintenance, count: equipment.length };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <main
        className="p-12 text-center"
        role="main"
        aria-label="Equipment Management Dashboard - No Data"
      >
        <Wrench className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Equipment — No Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view equipment postings.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  const maintenanceRatioPct =
    stats.totalValue > 0
      ? roundTo(
          multiplyMoney(
            divideMoney(toDecimal(stats.maintenance), toDecimal(stats.totalValue)),
            100
          ),
          1
        )
      : null;
  const depreciationRatePct =
    stats.totalValue > 0
      ? roundTo(
          multiplyMoney(
            divideMoney(toDecimal(stats.depreciation), toDecimal(stats.totalValue)),
            100
          ),
          1
        )
      : null;
  const netBookValue = roundTo(
    subtractMoney(toDecimal(stats.totalValue), toDecimal(stats.depreciation)),
    2
  );

  return (
    <main className="p-6 space-y-6" role="main">
      <PageHeader
        title="Equipment Management"
        purpose="Posted asset value, depreciation and maintenance amounts from the general ledger."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue label="Equipment Value" value={formatCurrency(stats.totalValue)} />
        <KPIValue label="Depreciation" value={formatCurrency(stats.depreciation)} />
        <KPIValue label="Maintenance" value={formatCurrency(stats.maintenance)} />
        <KPIValue label="Matched Entries" value={formatNumber(stats.count)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset Economics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Maintenance Cost Ratio</span>
                <span className="font-mono tabular-nums">
                  {maintenanceRatioPct === null ? '—' : formatPercent(maintenanceRatioPct, 1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Depreciation Rate</span>
                <span className="font-mono tabular-nums">
                  {depreciationRatePct === null ? '—' : formatPercent(depreciationRatePct, 1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">
                  Net Book Value (value − accumulated depreciation)
                </span>
                <span className="font-mono tabular-nums">{formatCurrency(netBookValue)}</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-4">
              Equipment value groups debits on accounts whose name mentions equipment or machinery.
              `—` means no such value is posted, not a zero rate.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-[var(--text-muted)]" aria-hidden="true" />
              <CardTitle>Operational Telemetry</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--text-muted)]">
              Overall equipment effectiveness, utilisation rate, downtime hours and average asset
              age require machine telematics; replacement value requires a fixed-asset register with
              acquisition costs per asset. A general ledger records posted amounts only, so these
              are omitted rather than estimated.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
