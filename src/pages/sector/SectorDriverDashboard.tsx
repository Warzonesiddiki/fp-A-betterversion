import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Decimal from 'decimal.js';
import { Activity, Database, Layers, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { useGLStore } from '@/store/glStore';
import { getSectorConfig, type SectorConfig, type SectorKPI } from '@/config/sectors';
import {
  divideMoney,
  formatMoney,
  multiplyMoney,
  percentOf,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
  variancePct,
} from '@/utils/money';
import { formatNumber } from '@/utils/formatters';
import { formatPercent } from '@/utils/financialFormatting';

export type SectorDriverId =
  | 'technology'
  | 'manufacturing'
  | 'banking'
  | 'retail'
  | 'energy'
  | 'construction'
  | 'logistics'
  | 'healthcare'
  | 'government'
  | 'education'
  | 'realestate';

export interface SectorLedgerEntry {
  accountCode?: string;
  accountName?: string;
  debit?: number;
  credit?: number;
  netChange?: number;
  period?: string;
}

export interface SectorDrivers {
  growthPct: number;
  efficiencyPct: number;
  capacityPct: number;
  riskPct: number;
}

export interface SectorMetricResult {
  id: string;
  label: string;
  format: SectorKPI['format'];
  target: number;
  value: number;
  varianceToTargetPct: number;
  lowerIsBetter?: boolean;
}

export interface SectorDriverModelResult {
  sectorId: string;
  totalRevenue: number;
  modeledRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  ebitda: number;
  assetBase: number;
  driverNetImpact: number;
  metrics: SectorMetricResult[];
  accountSignals: Array<{ label: string; value: number; format: SectorKPI['format'] }>;
}

const DEFAULT_DRIVERS: SectorDrivers = {
  growthPct: 8,
  efficiencyPct: 92,
  capacityPct: 86,
  riskPct: 5,
};

function textOf(entry: SectorLedgerEntry): string {
  return `${entry.accountCode ?? ''} ${entry.accountName ?? ''}`.toLowerCase();
}

function absEntryAmount(entry: SectorLedgerEntry): Decimal {
  const debit = toDecimal(entry.debit ?? 0);
  const credit = toDecimal(entry.credit ?? 0);
  const netChange =
    entry.netChange === undefined ? debit.minus(credit) : toDecimal(entry.netChange);
  const debitCreditMagnitude = debit.minus(credit).abs();
  return Decimal.max(debitCreditMagnitude, netChange.abs());
}

function sumBy(
  entries: readonly SectorLedgerEntry[],
  matcher: (entry: SectorLedgerEntry) => boolean
) {
  return sumMoney(entries.filter(matcher).map(absEntryAmount));
}

function positiveCredit(entries: readonly SectorLedgerEntry[]) {
  return sumMoney(
    entries.filter((entry) => (entry.credit ?? 0) > (entry.debit ?? 0)).map((e) => e.credit ?? 0)
  );
}

function positiveDebit(entries: readonly SectorLedgerEntry[]) {
  return sumMoney(
    entries.filter((entry) => (entry.debit ?? 0) > (entry.credit ?? 0)).map((e) => e.debit ?? 0)
  );
}

function clampDecimal(value: Decimal, min: number, max: number): Decimal {
  return Decimal.min(max, Decimal.max(min, value));
}

function ratioPct(
  numerator: Decimal | number | string,
  denominator: Decimal | number | string,
  fallback = 0
): Decimal {
  const d = toDecimal(denominator);
  if (d.isZero()) return toDecimal(fallback);
  return divideMoney(numerator, d).times(100);
}

function ratio(
  numerator: Decimal | number | string,
  denominator: Decimal | number | string,
  fallback = 0
): Decimal {
  const d = toDecimal(denominator);
  if (d.isZero()) return toDecimal(fallback);
  return divideMoney(numerator, d);
}

function targetVariance(value: Decimal, target: number, lowerIsBetter?: boolean): number {
  if (target === 0) return 0;
  const variance = roundTo(variancePct(value, Math.abs(target)), 2);
  return lowerIsBetter ? -variance : variance;
}

function pushMetric(
  metrics: SectorMetricResult[],
  config: SectorConfig,
  id: string,
  value: Decimal,
  fallback?: { label: string; format: SectorKPI['format']; target: number; lowerIsBetter?: boolean }
) {
  const kpi = config.defaultKPIs.find((item) => item.id === id) ?? fallback;
  if (!kpi) return;
  metrics.push({
    id,
    label: kpi.label,
    format: kpi.format,
    target: kpi.target,
    value: roundTo(value, kpi.format === 'currency' ? 2 : 2),
    varianceToTargetPct: targetVariance(value, kpi.target, kpi.lowerIsBetter),
    lowerIsBetter: kpi.lowerIsBetter,
  });
}

export function computeSectorDriverModel(params: {
  sectorId: SectorDriverId | string;
  config: SectorConfig;
  entries: readonly SectorLedgerEntry[];
  drivers?: Partial<SectorDrivers>;
}): SectorDriverModelResult {
  const { sectorId, config, entries } = params;
  const drivers = { ...DEFAULT_DRIVERS, ...params.drivers };
  const revenueTagged = sumBy(entries, (entry) =>
    /revenue|sales|subscription|tuition|grant|rent|lease|interest income|premium/.test(
      textOf(entry)
    )
  );
  const expenseTagged = sumBy(entries, (entry) =>
    /expense|cost|cogs|payroll|salary|opex|fuel|claims|maintenance|depreciation|interest expense/.test(
      textOf(entry)
    )
  );
  const assetTagged = sumBy(entries, (entry) =>
    /asset|cash|inventory|property|equipment|loan|receivable|plant|reserve/.test(textOf(entry))
  );
  const debtTagged = sumBy(entries, (entry) =>
    /debt|liabil|deposit|payable|borrowing|loan payable/.test(textOf(entry))
  );
  const equityTagged = sumBy(entries, (entry) => /equity|capital|retained/.test(textOf(entry)));
  const productionTagged = sumBy(entries, (entry) =>
    /production|throughput|shipment|patient|student|citizen|mile|bed|store|unit/.test(textOf(entry))
  );

  const totalRevenue = revenueTagged.isZero() ? positiveCredit(entries) : revenueTagged;
  const totalExpenses = expenseTagged.isZero() ? positiveDebit(entries) : expenseTagged;
  const assetBase = assetTagged.isZero()
    ? Decimal.max(totalRevenue.times(2), totalExpenses)
    : assetTagged;
  const debtBase = debtTagged.isZero() ? totalExpenses.times(0.55) : debtTagged;
  const equityBase = equityTagged.isZero()
    ? Decimal.max(assetBase.minus(debtBase), totalRevenue.times(0.35))
    : equityTagged;
  const productionBase = productionTagged.isZero()
    ? Decimal.max(totalRevenue.div(100), 1)
    : productionTagged;

  const growthFactor = toDecimal(1).plus(toDecimal(drivers.growthPct).div(100));
  const efficiencyFactor = toDecimal(drivers.efficiencyPct).div(100);
  const capacityFactor = toDecimal(drivers.capacityPct).div(100);
  const riskFactor = toDecimal(drivers.riskPct).div(100);
  const modeledRevenue = totalRevenue.times(growthFactor).times(capacityFactor);
  const modeledExpenses = totalExpenses
    .times(toDecimal(2).minus(efficiencyFactor))
    .times(toDecimal(1).plus(riskFactor.div(2)));
  const grossProfit = modeledRevenue.minus(modelledCogs(totalExpenses, efficiencyFactor));
  const ebitda = modeledRevenue.minus(modeledExpenses);
  const driverNetImpact = subtractMoney(ebitda, subtractMoney(totalRevenue, totalExpenses));
  const metrics: SectorMetricResult[] = [];

  switch (sectorId) {
    case 'technology': {
      const arr = modeledRevenue.times(12);
      const nrr = clampDecimal(
        toDecimal(100)
          .plus(drivers.growthPct)
          .minus(drivers.riskPct / 2),
        0,
        200
      );
      const churn = clampDecimal(
        toDecimal(drivers.riskPct)
          .times(0.72)
          .plus(toDecimal(100).minus(drivers.efficiencyPct).times(0.08)),
        0,
        100
      );
      const grossMargin = ratioPct(grossProfit, modeledRevenue);
      const quickRatio = ratio(
        growthFactor.plus(efficiencyFactor),
        Decimal.max(riskFactor.times(4), 0.01)
      );
      pushMetric(metrics, config, 'arr', arr);
      pushMetric(metrics, config, 'nrr', nrr);
      pushMetric(metrics, config, 'churn', churn);
      pushMetric(metrics, config, 'quick_ratio', quickRatio);
      pushMetric(metrics, config, 'gross_margin', grossMargin);
      break;
    }
    case 'manufacturing': {
      const availability = capacityFactor.times(100);
      const performance = efficiencyFactor.times(100);
      const quality = toDecimal(100).minus(riskFactor.times(100).times(0.6));
      const oee = availability.times(performance).times(quality).div(10000);
      pushMetric(metrics, config, 'oee', oee);
      pushMetric(metrics, config, 'scrap_rate', riskFactor.times(100).times(0.6));
      pushMetric(
        metrics,
        config,
        'inventory_turnover',
        ratio(modeledExpenses, Decimal.max(assetBase.times(0.22), 1))
      );
      pushMetric(metrics, config, 'unit_cost', ratio(modeledExpenses, productionBase));
      pushMetric(metrics, config, 'yield_rate', quality);
      break;
    }
    case 'banking': {
      const interestIncome = sumBy(entries, (entry) =>
        /interest income|loan income|yield/.test(textOf(entry))
      );
      const interestExpense = sumBy(entries, (entry) =>
        /interest expense|deposit cost|cost of funds/.test(textOf(entry))
      );
      const netInterest = (
        interestIncome.isZero() ? totalRevenue.times(0.62) : interestIncome
      ).minus(interestExpense);
      pushMetric(metrics, config, 'nim', ratioPct(netInterest, Decimal.max(assetBase, 1)));
      pushMetric(
        metrics,
        config,
        'cet1',
        ratioPct(equityBase.times(efficiencyFactor), Decimal.max(assetBase.times(0.72), 1))
      );
      pushMetric(metrics, config, 'npl_ratio', riskFactor.times(100).times(0.4));
      pushMetric(
        metrics,
        config,
        'efficiency_ratio',
        ratioPct(modeledExpenses, Decimal.max(modeledRevenue, 1))
      );
      pushMetric(
        metrics,
        config,
        'loan_deposit_ratio',
        ratioPct(assetBase.times(0.68), Decimal.max(debtBase, 1))
      );
      break;
    }
    case 'retail': {
      const transactions = Decimal.max(productionBase, 1);
      pushMetric(metrics, config, 'sss', toDecimal(drivers.growthPct).times(capacityFactor));
      pushMetric(
        metrics,
        config,
        'conversion_rate',
        clampDecimal(efficiencyFactor.times(4.2).minus(riskFactor.times(2)), 0, 100)
      );
      pushMetric(metrics, config, 'atv', ratio(modeledRevenue, transactions));
      pushMetric(
        metrics,
        config,
        'gmroi',
        ratio(grossProfit, Decimal.max(assetBase.times(0.28), 1))
      );
      pushMetric(
        metrics,
        config,
        'inventory_turnover',
        ratio(modeledExpenses, Decimal.max(assetBase.times(0.32), 1))
      );
      break;
    }
    case 'energy': {
      const productionVolume = productionBase.times(capacityFactor);
      pushMetric(metrics, config, 'production_volume', productionVolume);
      pushMetric(metrics, config, 'boe_per_day', productionVolume);
      pushMetric(
        metrics,
        config,
        'lifting_cost',
        ratio(modeledExpenses, Decimal.max(productionVolume, 1))
      );
      pushMetric(
        metrics,
        config,
        'carbon_intensity',
        riskFactor.times(240).plus(toDecimal(100).minus(drivers.efficiencyPct).times(0.35))
      );
      pushMetric(metrics, config, 'availability_factor', capacityFactor.times(100));
      pushMetric(metrics, config, 'renewable_mix', efficiencyFactor.times(45));
      break;
    }
    case 'construction': {
      const backlog = modeledRevenue.times(toDecimal(1).plus(riskFactor));
      pushMetric(metrics, config, 'backlog', backlog);
      pushMetric(metrics, config, 'completion_percent', capacityFactor.times(100));
      pushMetric(
        metrics,
        config,
        'gross_margin_per_project',
        ratioPct(grossProfit, modeledRevenue)
      );
      pushMetric(metrics, config, 'change_order_ratio', riskFactor.times(100).times(1.4));
      pushMetric(metrics, config, 'utilization', efficiencyFactor.times(100));
      pushMetric(
        metrics,
        config,
        'wip',
        percentOf(backlog, toDecimal(100).minus(drivers.capacityPct))
      );
      break;
    }
    case 'logistics': {
      const miles = Decimal.max(productionBase, 1);
      pushMetric(metrics, config, 'cost_per_mile', ratio(modeledExpenses, miles));
      pushMetric(
        metrics,
        config,
        'on_time_delivery',
        clampDecimal(efficiencyFactor.times(100).minus(riskFactor.times(100).times(0.5)), 0, 100)
      );
      pushMetric(metrics, config, 'fleet_utilization', capacityFactor.times(100));
      pushMetric(
        metrics,
        config,
        'warehousing_cost_pct',
        ratioPct(modeledExpenses.times(0.22), modeledRevenue)
      );
      pushMetric(
        metrics,
        config,
        'empty_miles_pct',
        toDecimal(100).minus(drivers.capacityPct).times(0.55)
      );
      break;
    }
    case 'healthcare': {
      const patientVolume = Decimal.max(productionBase, 1);
      pushMetric(metrics, config, 'occupancy', capacityFactor.times(100));
      pushMetric(metrics, config, 'denial_rate', riskFactor.times(100).times(0.55));
      pushMetric(
        metrics,
        config,
        'ar_days',
        toDecimal(45).times(toDecimal(2).minus(efficiencyFactor))
      );
      pushMetric(metrics, config, 'ebitdar', ratioPct(ebitda, modeledRevenue));
      pushMetric(metrics, config, 'readmission_rate', riskFactor.times(100).times(1.2));
      pushMetric(
        metrics,
        config,
        'case_mix_index',
        ratio(modeledRevenue, patientVolume.times(10000), 1)
      );
      break;
    }
    case 'government': {
      pushMetric(metrics, config, 'budget_utilization', capacityFactor.times(100));
      pushMetric(metrics, config, 'service_efficiency', efficiencyFactor.times(10));
      pushMetric(
        metrics,
        config,
        'grant_disbursement_rate',
        growthFactor.times(capacityFactor).times(82)
      );
      pushMetric(
        metrics,
        config,
        'compliance_audit_score',
        toDecimal(100).minus(riskFactor.times(100).times(0.4))
      );
      pushMetric(
        metrics,
        config,
        'cost_per_citizen',
        ratio(modeledExpenses, Decimal.max(productionBase, 1))
      );
      pushMetric(metrics, config, 'revenue_collection_gap', riskFactor.times(100).times(0.5));
      break;
    }
    case 'education': {
      const students = Decimal.max(productionBase, 1);
      pushMetric(
        metrics,
        config,
        'student_retention_rate',
        clampDecimal(efficiencyFactor.times(100).minus(riskFactor.times(25)), 0, 100)
      );
      pushMetric(metrics, config, 'revenue_per_student', ratio(modeledRevenue, students));
      pushMetric(
        metrics,
        config,
        'faculty_to_student_ratio',
        ratio(students, Decimal.max(modeledExpenses.div(90000), 1))
      );
      pushMetric(
        metrics,
        config,
        'research_grant_win_rate',
        growthFactor.times(efficiencyFactor).times(24)
      );
      pushMetric(
        metrics,
        config,
        'endowment_growth_rate',
        toDecimal(drivers.growthPct).times(0.85)
      );
      break;
    }
    case 'realestate':
    default: {
      const noi = modeledRevenue.minus(modeledExpenses.times(0.72));
      const portfolioValue = Decimal.max(assetBase, noi.times(16));
      pushMetric(metrics, config, 'noi', noi);
      pushMetric(metrics, config, 'cap_rate', ratioPct(noi, portfolioValue));
      pushMetric(metrics, config, 'occupancy', capacityFactor.times(100));
      pushMetric(metrics, config, 'ltv', ratioPct(debtBase, portfolioValue));
      pushMetric(metrics, config, 'ffo', noi.minus(modeledExpenses.times(0.08)));
      pushMetric(metrics, config, 'dscr', ratio(noi, Decimal.max(debtBase.times(0.08), 1)));
      break;
    }
  }

  const filledMetrics =
    metrics.length >= 5
      ? metrics
      : config.defaultKPIs.slice(0, 5).map((kpi) => ({
          id: kpi.id,
          label: kpi.label,
          format: kpi.format,
          target: kpi.target,
          value: roundTo(multiplyMoney(kpi.target, growthFactor).times(efficiencyFactor), 2),
          varianceToTargetPct: targetVariance(
            multiplyMoney(kpi.target, growthFactor).times(efficiencyFactor),
            kpi.target,
            kpi.lowerIsBetter
          ),
          lowerIsBetter: kpi.lowerIsBetter,
        }));

  return {
    sectorId,
    totalRevenue: roundTo(totalRevenue, 2),
    modeledRevenue: roundTo(modeledRevenue, 2),
    totalExpenses: roundTo(totalExpenses, 2),
    grossProfit: roundTo(grossProfit, 2),
    ebitda: roundTo(ebitda, 2),
    assetBase: roundTo(assetBase, 2),
    driverNetImpact: roundTo(driverNetImpact, 2),
    metrics: filledMetrics,
    accountSignals: [
      { label: 'Revenue signal', value: roundTo(totalRevenue, 2), format: 'currency' },
      { label: 'Expense signal', value: roundTo(totalExpenses, 2), format: 'currency' },
      { label: 'Asset signal', value: roundTo(assetBase, 2), format: 'currency' },
      {
        label: 'Operating margin',
        value: roundTo(ratioPct(ebitda, modeledRevenue), 2),
        format: 'percent',
      },
    ],
  };
}

function modelledCogs(totalExpenses: Decimal, efficiencyFactor: Decimal): Decimal {
  return totalExpenses.times(toDecimal(1.18).minus(efficiencyFactor.times(0.35)));
}

function formatMetricValue(metric: { format: SectorKPI['format']; value: number }): string {
  if (metric.format === 'currency')
    return formatMoney(metric.value, { currency: 'USD', places: 0 });
  if (metric.format === 'percent') return formatPercent(metric.value, 1);
  return formatNumber(metric.value);
}

export function SectorDriverDashboard({ sectorId }: { sectorId: SectorDriverId }) {
  const glState = useGLStore();
  const entries = useMemo(
    () => (Array.isArray(glState.entries) ? glState.entries : []),
    [glState.entries]
  );
  const navigate = useNavigate();
  const config = getSectorConfig(sectorId);
  const [drivers, setDrivers] = useState<SectorDrivers>(DEFAULT_DRIVERS);

  useEffect(() => {
    if (config) document.title = `FinPlan Pro — ${config.name} Driver Model`;
  }, [config]);

  const model = useMemo(() => {
    if (!config) return null;
    return computeSectorDriverModel({ sectorId, config, entries, drivers });
  }, [config, drivers, entries, sectorId]);

  if (!config || !model) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Sector driver model unavailable">
        <Layers className="mx-auto mb-4 h-10 w-10 text-slate-400" />
        <h2 className="mb-2 text-xl font-semibold">Sector configuration unavailable</h2>
      </main>
    );
  }

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label={`${config.name} - No Data`}>
        <Database className="mx-auto mb-4 h-10 w-10 text-slate-400" />
        <h2 className="mb-2 text-xl font-semibold">{config.name} — No GL Data</h2>
        <p className="mb-6 text-slate-400">
          Import GL data to calculate live sector KPIs and driver scenarios.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  const updateDriver = (key: keyof SectorDrivers, value: number) => {
    setDrivers((current) => ({ ...current, [key]: value }));
  };

  const driverControls: Array<{
    key: keyof SectorDrivers;
    label: string;
    min: number;
    max: number;
    step: number;
  }> = [
    { key: 'growthPct', label: 'Demand / price growth', min: -25, max: 45, step: 0.5 },
    { key: 'efficiencyPct', label: 'Operating efficiency', min: 60, max: 115, step: 0.5 },
    { key: 'capacityPct', label: 'Capacity / utilization', min: 45, max: 120, step: 0.5 },
    { key: 'riskPct', label: 'Risk / leakage', min: 0, max: 30, step: 0.5 },
  ];

  return (
    <main
      className="space-y-6 p-6"
      role="main"
      aria-label={`${config.name} data-driven driver model`}
    >
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-500">
            Phase 3 Sector Depth
          </p>
          <h1 className="text-2xl font-bold">{config.name} Driver Modeling Dashboard</h1>
          <p className="text-sm text-slate-400">
            {config.description} — KPIs are recomputed from imported GL entries plus live driver
            controls.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setDrivers(DEFAULT_DRIVERS)}>
          Reset drivers
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4" aria-label="Driver controls">
        {driverControls.map((control) => (
          <Card key={control.key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <SlidersHorizontal className="h-4 w-4 text-blue-500" />
                {control.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-2xl font-black tabular-nums">
                  {formatPercent(drivers[control.key], 1)}
                </span>
                <span className="text-xs text-slate-400">live</span>
              </div>
              <input
                aria-label={control.label}
                className="w-full accent-blue-600"
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={drivers[control.key]}
                onChange={(event) => updateDriver(control.key, Number(event.currentTarget.value))}
              />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4" aria-label="Financial signals">
        <KPIValue
          label="Actual Revenue Signal"
          value={formatMoney(model.totalRevenue, { currency: 'USD', places: 0 })}
          icon={<Activity className="h-4 w-4" />}
        />
        <KPIValue
          label="Modeled Revenue"
          value={formatMoney(model.modeledRevenue, { currency: 'USD', places: 0 })}
          change={drivers.growthPct}
        />
        <KPIValue
          label="Modeled EBITDA"
          value={formatMoney(model.ebitda, { currency: 'USD', places: 0 })}
          change={roundTo(ratioPct(model.ebitda, model.modeledRevenue), 1)}
        />
        <KPIValue
          label="Driver Net Impact"
          value={formatMoney(model.driverNetImpact, { currency: 'USD', places: 0 })}
        />
      </section>

      <section
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-label="Sector KPIs"
      >
        {model.metrics.map((metric) => (
          <KPIValue
            key={metric.id}
            label={metric.label}
            value={formatMetricValue(metric)}
            change={metric.varianceToTargetPct}
            changeLabel={`Target ${metric.format === 'currency' ? formatMoney(metric.target, { currency: 'USD', places: 0 }) : metric.format === 'percent' ? formatPercent(metric.target, 1) : formatNumber(metric.target)}`}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data lineage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {model.accountSignals.map((signal) => (
              <div
                key={signal.label}
                className="flex items-center justify-between border-b border-slate-200/60 py-2 last:border-0 dark:border-slate-700/60"
              >
                <span className="text-sm text-slate-500">{signal.label}</span>
                <span className="font-mono text-sm">{formatMetricValue(signal)}</span>
              </div>
            ))}
            <div className="pt-2 text-xs text-slate-400">
              Source: {formatNumber(entries.length)} GL rows. Sector UI modules:{' '}
              {config.enabledModules.join(', ')}.
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sector-config driven sidebar preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
              {config.sidebarOrder.map((item, index) => (
                <div
                  key={item}
                  className="rounded-lg border border-slate-200/70 px-3 py-2 dark:border-slate-700/70"
                >
                  <span className="mr-2 text-xs text-slate-400">{index + 1}</span>
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default SectorDriverDashboard;
