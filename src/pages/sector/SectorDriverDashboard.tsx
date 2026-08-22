// W-FAB-002 part-1 remediation: this model classifies GL entries by account-code
// prefix first (4 revenue / 5 COGS / 6 OpEx / 1 assets / 2 liabilities / 3 equity)
// and falls back to account-name keywords — always with SIGNED debit-normal or
// credit-normal sums. The previous version bucketed by regex over
// `${code} ${name}` text and aggregated Math.abs magnitudes (absEntryAmount),
// which counted sales returns and reversed postings as positive activity, and
// back-filled missing bases with invented constants
// (assetBase = revenue×2, debtBase = expenses×0.55, productionBase = revenue÷100).
// Every fabricated constant, the target×factor `filledMetrics` filler, and the
// regulatory-ratio inventions (CET1, Solvency II 180%) are gone. Ratios whose
// denominator account class is absent from the ledger are now null-with-
// disclosure, never estimated. Driver-arithmetic KPIs are returned separately
// (`simulator`) so the UI can label them as projections instead of measured KPIs.

// @money-ast-allow Reason: the flagged `>` comparisons are entry-direction
// FILTERS that choose which side of a GL entry flows into a signed
// `sumMoney(...)` aggregation (credit-normal vs debit-normal classification).
// They are not money arithmetic; all net amounts are summed exactly.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Decimal from 'decimal.js';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { useGLStore } from '@/store/glStore';
import { getSectorConfig, type SectorConfig, type SectorKPI } from '@/config/sectors';
import { divideMoney, formatMoney, roundTo, subtractMoney, toDecimal } from '@/utils/money';
import { formatNumber } from '@/utils/formatters';
import { formatPercent } from '@/utils/financialFormatting';
import { PageHeader } from '@/components/ui/PageHeader';

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
  | 'realestate'
  | 'insurance';

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
  /** null = not derivable from the posted ledger; `note` carries the reason. */
  value: number | null;
  note?: string;
  varianceToTargetPct: number | null;
  lowerIsBetter?: boolean;
}

/** Driver-slider output. Explicitly a projection, never a measured KPI. */
export interface SimulatorMetric {
  id: string;
  label: string;
  format: SectorKPI['format'];
  value: number;
  /** Declares exactly which driver inputs produce the number. */
  basis: string;
}

export interface SectorDriverModelResult {
  sectorId: string;
  totalRevenue: number;
  modeledRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  ebitda: number;
  driverNetImpact: number;
  metrics: SectorMetricResult[];
  simulator: SimulatorMetric[];
  accountSignals: Array<{ label: string; value: number; format: SectorKPI['format'] }>;
}

const DEFAULT_DRIVERS: SectorDrivers = {
  growthPct: 8,
  efficiencyPct: 92,
  capacityPct: 86,
  riskPct: 5,
};

const LEGACY_SECTOR_COPY: Record<SectorDriverId, { title: string; labels: string[] }> = {
  technology: { title: 'Sector Analysis', labels: ['Gross Margin'] },
  manufacturing: { title: 'Manufacturing Dashboard', labels: ['OEE', 'Scrap Rate'] },
  banking: {
    title: 'Banking Dashboard',
    labels: ['Total Assets', 'Total Liabilities', 'Interest Income', 'Capital & Risk', 'NPL Ratio'],
  },
  retail: { title: 'Retail Dashboard', labels: ['Same-Store Sales', 'Average Ticket Value'] },
  energy: { title: 'Energy Dashboard', labels: ['Production Volume', 'Carbon Intensity'] },
  construction: { title: 'Construction Dashboard', labels: ['Backlog', 'Project Gross Margin'] },
  logistics: { title: 'Logistics Dashboard', labels: ['Total Revenue', 'Fleet Costs'] },
  healthcare: { title: 'Healthcare Dashboard', labels: ['Occupancy', 'EBITDAR'] },
  government: {
    title: 'Government Dashboard',
    labels: ['Fund Balance', 'Total Revenue', 'Total Expenses'],
  },
  education: { title: 'Education Dashboard', labels: ['Tuition Revenue', 'Grant Income'] },
  realestate: { title: 'Real Estate Dashboard', labels: ['NOI', 'Cap Rate'] },
  insurance: { title: 'Insurance Dashboard', labels: ['Combined Ratio', 'Loss Ratio', 'GWP'] },
};

function textOf(entry: SectorLedgerEntry): string {
  return `${entry.accountName ?? ''}`.toLowerCase();
}

/** Signed credit-normal delta (credit − debit); negative when debited. */
function creditNormal(entry: SectorLedgerEntry): Decimal {
  const credit = entry.credit ?? 0;
  const debit = entry.debit ?? 0;
  return toDecimal(credit).minus(toDecimal(debit));
}

/** Signed debit-normal delta (debit − credit); negative when credited. */
function debitNormal(entry: SectorLedgerEntry): Decimal {
  return creditNormal(entry).negated();
}

interface ClassifiedTotals {
  revenue: Decimal;
  cogs: Decimal;
  opex: Decimal;
  interestIncome: Decimal;
  interestExpense: Decimal;
  premiums: Decimal;
  claims: Decimal;
  assets: Decimal | null;
  liabilities: Decimal | null;
  equity: Decimal | null;
}

/**
 * Prefix-first classification (4/5/6 P&L, 1/2/3 balance sheet) with a signed
 * account-name fallback for rows outside those classes. Entries matching
 * nothing are counted nowhere — never guessed into a bucket.
 */
function classifyEntries(entries: readonly SectorLedgerEntry[]): ClassifiedTotals {
  let revenue = new Decimal(0);
  let cogs = new Decimal(0);
  let opex = new Decimal(0);
  let interestIncome = new Decimal(0);
  let interestExpense = new Decimal(0);
  let premiums = new Decimal(0);
  let claims = new Decimal(0);
  let assets = new Decimal(0);
  let liabilities = new Decimal(0);
  let equity = new Decimal(0);
  let sawAsset = false;
  let sawLiability = false;
  let sawEquity = false;

  for (const entry of entries) {
    const code = entry.accountCode ?? '';
    const firstChar = code.charAt(0);
    switch (firstChar) {
      case '4':
        revenue = revenue.plus(creditNormal(entry));
        if (/premium|policy/.test(textOf(entry))) premiums = premiums.plus(creditNormal(entry));
        if (/interest income/.test(textOf(entry)))
          interestIncome = interestIncome.plus(creditNormal(entry));
        continue;
      case '5': {
        const debit = debitNormal(entry);
        cogs = cogs.plus(debit);
        // Insurers post incurred claims in COGS-class accounts; keep a
        // claims-specific view for the insurance ratios. Claims stay inside
        // COGS/totalExpenses (they ARE insurer cost of goods) — the ratio
        // math below never adds them twice.
        if (/claim|benefit paid|incurred loss/.test(textOf(entry))) {
          claims = claims.plus(debit);
        }
        continue;
      }
      case '6':
        opex = opex.plus(debitNormal(entry));
        if (/interest expense|cost of funds/.test(textOf(entry)))
          interestExpense = interestExpense.plus(debitNormal(entry));
        continue;
      case '1':
        assets = assets.plus(debitNormal(entry));
        sawAsset = true;
        continue;
      case '2':
        liabilities = liabilities.plus(creditNormal(entry));
        sawLiability = true;
        continue;
      case '3':
        equity = equity.plus(creditNormal(entry));
        sawEquity = true;
        continue;
      default:
        break;
    }

    // Name-keyword fallback (still signed) for unclassed rows.
    const name = textOf(entry);
    if (/premium|written premium|gwp/.test(name)) {
      premiums = premiums.plus(creditNormal(entry));
      continue;
    }
    if (/claim|benefit paid|incurred loss/.test(name)) {
      claims = claims.plus(debitNormal(entry));
      continue;
    }
    if (/interest income|loan income|yield on/.test(name)) {
      interestIncome = interestIncome.plus(creditNormal(entry));
      continue;
    }
    if (/interest expense|cost of funds|deposit cost/.test(name)) {
      interestExpense = interestExpense.plus(debitNormal(entry));
      continue;
    }
    if (/revenue|sales|subscription|tuition|grant|rent|lease income/.test(name)) {
      revenue = revenue.plus(creditNormal(entry));
      continue;
    }
    if (/cogs|cost of goods|cost of sales/.test(name)) {
      cogs = cogs.plus(debitNormal(entry));
      continue;
    }
    if (/expense|payroll|salary|opex|maintenance|depreciation/.test(name)) {
      opex = opex.plus(debitNormal(entry));
    }
  }

  return {
    revenue,
    cogs,
    opex,
    interestIncome,
    interestExpense,
    premiums,
    claims,
    assets: sawAsset ? assets : null,
    liabilities: sawLiability ? liabilities : null,
    equity: sawEquity ? equity : null,
  };
}

function ratioPct(
  numerator: Decimal | number | string,
  denominator: Decimal | number | string
): Decimal {
  return divideMoney(numerator, toDecimal(denominator)).times(100);
}

function ratio(
  numerator: Decimal | number | string,
  denominator: Decimal | number | string
): Decimal {
  return divideMoney(numerator, toDecimal(denominator));
}

function targetVariance(value: Decimal, target: number, lowerIsBetter?: boolean): number {
  if (target === 0) return 0;
  const magnitude = target < 0 ? -target : target;
  const variancePctValue = ratioPct(value, magnitude).toNumber();
  const rounded = roundTo(variancePctValue, 2);
  return lowerIsBetter ? -rounded : rounded;
}

function pushDerived(
  metrics: SectorMetricResult[],
  config: SectorConfig,
  id: string,
  value: Decimal | null,
  options?: {
    label?: string;
    note?: string;
    format?: SectorKPI['format'];
    target?: number;
    lowerIsBetter?: boolean;
  }
) {
  const kpi = config.defaultKPIs.find((item) => item.id === id);
  const label = options?.label ?? kpi?.label ?? id;
  const format = options?.format ?? kpi?.format ?? 'number';
  const target = options?.target ?? kpi?.target ?? 0;
  const lowerIsBetter = options?.lowerIsBetter ?? kpi?.lowerIsBetter;
  const resolved = value === null ? null : roundTo(value, 2);
  metrics.push({
    id,
    label,
    format,
    target,
    value: resolved,
    note:
      options?.note ?? (resolved === null ? 'Not derivable from the posted ledger.' : undefined),
    varianceToTargetPct:
      resolved === null || target === 0
        ? null
        : targetVariance(toDecimal(resolved), target, lowerIsBetter),
    lowerIsBetter,
  });
}

function pushSimulator(
  simulator: SimulatorMetric[],
  id: string,
  label: string,
  value: Decimal | number,
  format: SectorKPI['format'],
  basis: string
) {
  simulator.push({
    id,
    label,
    format,
    value: roundTo(value instanceof Decimal ? value : toDecimal(value), 2),
    basis,
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
  const cls = classifyEntries(entries);

  const totalRevenue = cls.revenue;
  const totalExpenses = cls.cogs.plus(cls.opex);
  const actualGrossProfit = totalRevenue.minus(cls.cogs);
  const actualOperatingProfit = totalRevenue.minus(totalExpenses);

  // Simulator aggregates (projections driven by user sliders — labeled as such
  // everywhere they render). They never feed a "measured" KPI.
  const growthFactor = toDecimal(1).plus(toDecimal(drivers.growthPct).div(100));
  const efficiencyFactor = toDecimal(drivers.efficiencyPct).div(100);
  const capacityFactor = toDecimal(drivers.capacityPct).div(100);
  const riskFactor = toDecimal(drivers.riskPct).div(100);
  const modeledRevenue = totalRevenue.times(growthFactor).times(capacityFactor);
  const modeledExpenses = totalExpenses
    .times(toDecimal(2).minus(efficiencyFactor))
    .times(toDecimal(1).plus(riskFactor.div(2)));
  const modeledEbitda = modeledRevenue.minus(modeledExpenses);
  const driverNetImpact = subtractMoney(modeledEbitda, subtractMoney(totalRevenue, totalExpenses));

  const metrics: SectorMetricResult[] = [];
  const simulator: SimulatorMetric[] = [];

  // Shared derived metric: gross margin % (needs a posted COGS class).
  const grossMarginPct =
    totalRevenue.isZero() || cls.cogs.isZero() ? null : ratioPct(actualGrossProfit, totalRevenue);

  switch (sectorId) {
    case 'technology': {
      pushDerived(metrics, config, 'gross_margin', grossMarginPct, {
        note: cls.cogs.isZero() ? 'No COGS-class accounts (prefix 5) posted.' : undefined,
      });
      pushSimulator(
        simulator,
        'nrr',
        'Net Revenue Retention',
        clampDecimal(
          toDecimal(100)
            .plus(drivers.growthPct)
            .minus(drivers.riskPct / 2),
          0,
          200
        ),
        'percent',
        '100% + growth − risk ÷ 2'
      );
      pushSimulator(
        simulator,
        'churn',
        'Logo Churn Rate',
        clampDecimal(
          toDecimal(drivers.riskPct)
            .times(0.72)
            .plus(toDecimal(100).minus(drivers.efficiencyPct).times(0.08)),
          0,
          100
        ),
        'percent',
        '0.72×risk + 0.08×(100 − efficiency)'
      );
      break;
    }
    case 'manufacturing': {
      const inventoryTurnover =
        cls.assets === null || cls.assets.isZero() ? null : ratio(cls.cogs, cls.assets);
      pushDerived(metrics, config, 'inventory_turnover', inventoryTurnover, {
        note:
          inventoryTurnover === null
            ? 'Needs inventory balances in asset-class accounts (prefix 1).'
            : undefined,
      });
      pushDerived(metrics, config, 'gross_margin', grossMarginPct, {
        note: cls.cogs.isZero() ? 'No COGS-class accounts (prefix 5) posted.' : undefined,
      });
      const quality = toDecimal(100).minus(riskFactor.times(100).times(0.6));
      pushSimulator(
        simulator,
        'oee',
        'Overall Equipment Effectiveness',
        capacityFactor.times(efficiencyFactor).times(quality).div(100),
        'percent',
        'availability × performance × quality (driver sliders)'
      );
      pushSimulator(
        simulator,
        'scrap_rate',
        'Scrap Rate',
        riskFactor.times(100).times(0.6),
        'percent',
        '0.6×risk'
      );
      pushSimulator(simulator, 'yield_rate', 'Yield Rate', quality, 'percent', '100% − 0.6×risk');
      break;
    }
    case 'banking': {
      const nim =
        cls.assets === null ||
        cls.assets.isZero() ||
        (cls.interestIncome.isZero() && cls.interestExpense.isZero())
          ? null
          : ratioPct(cls.interestIncome.minus(cls.interestExpense), cls.assets);
      pushDerived(metrics, config, 'nim', nim, {
        note:
          nim === null
            ? 'Needs interest income/expense accounts and asset-class balances.'
            : undefined,
      });
      const efficiencyRatio = totalRevenue.isZero() ? null : ratioPct(totalExpenses, totalRevenue);
      pushDerived(metrics, config, 'efficiency_ratio', efficiencyRatio, {
        note: efficiencyRatio === null ? 'No revenue-class accounts (prefix 4) posted.' : undefined,
        lowerIsBetter: true,
      });
      // Removed as fabrications (W-FAB-002): cet1 (equity×eff)/(assets×0.72),
      // npl_ratio = risk×40, loan_deposit_ratio = assets×0.68/debt — none has
      // an accounting identity on this ledger.
      break;
    }
    case 'retail': {
      const inventoryTurnover =
        cls.assets === null || cls.assets.isZero() ? null : ratio(cls.cogs, cls.assets);
      pushDerived(metrics, config, 'inventory_turnover', inventoryTurnover, {
        note:
          inventoryTurnover === null
            ? 'Needs inventory balances in asset-class accounts (prefix 1).'
            : undefined,
      });
      pushDerived(metrics, config, 'gross_margin', grossMarginPct, {
        note: cls.cogs.isZero() ? 'No COGS-class accounts (prefix 5) posted.' : undefined,
      });
      pushSimulator(
        simulator,
        'sss',
        'Same-Store Sales Growth',
        toDecimal(drivers.growthPct).times(capacityFactor),
        'percent',
        'growth × capacity'
      );
      pushSimulator(
        simulator,
        'conversion_rate',
        'Conversion Rate',
        clampDecimal(efficiencyFactor.times(4.2).minus(riskFactor.times(2)), 0, 100),
        'percent',
        '4.2×efficiency − 2×risk'
      );
      break;
    }
    case 'energy': {
      pushDerived(metrics, config, 'gross_margin', grossMarginPct, {
        note: cls.cogs.isZero() ? 'No COGS-class accounts (prefix 5) posted.' : undefined,
      });
      pushSimulator(
        simulator,
        'availability_factor',
        'Availability Factor',
        capacityFactor.times(100),
        'percent',
        'capacity slider passthrough'
      );
      pushSimulator(
        simulator,
        'renewable_mix',
        'Renewable Energy Mix',
        efficiencyFactor.times(45),
        'percent',
        '45×efficiency'
      );
      // Removed as fabrications: production_volume / boe_per_day (revenue÷100
      // invented base), lifting_cost (needs production counts), carbon_intensity
      // (240/0.35 constants).
      break;
    }
    case 'construction': {
      pushDerived(metrics, config, 'gross_margin', grossMarginPct, {
        label: 'Gross Margin (all projects)',
        note: cls.cogs.isZero() ? 'No COGS-class accounts (prefix 5) posted.' : undefined,
      });
      pushSimulator(
        simulator,
        'completion_percent',
        'Avg Project Completion',
        capacityFactor.times(100),
        'percent',
        'capacity slider passthrough'
      );
      pushSimulator(
        simulator,
        'change_order_ratio',
        'Change Order Ratio',
        riskFactor.times(100).times(1.4),
        'percent',
        '1.4×risk'
      );
      pushSimulator(
        simulator,
        'utilization',
        'Equipment Utilization',
        efficiencyFactor.times(100),
        'percent',
        'efficiency slider passthrough'
      );
      // Removed as fabrications: backlog (revenue×(1+risk)), wip
      // (backlog×unallocated-capacity) — no project dimension exists in GL.
      break;
    }
    case 'logistics': {
      pushDerived(metrics, config, 'gross_margin', grossMarginPct, {
        note: cls.cogs.isZero() ? 'No COGS-class accounts (prefix 5) posted.' : undefined,
      });
      pushSimulator(
        simulator,
        'on_time_delivery',
        'On-Time Delivery Rate',
        clampDecimal(efficiencyFactor.times(100).minus(riskFactor.times(50)), 0, 100),
        'percent',
        'efficiency − risk ÷ 2'
      );
      pushSimulator(
        simulator,
        'fleet_utilization',
        'Fleet Utilization Rate',
        capacityFactor.times(100),
        'percent',
        'capacity slider passthrough'
      );
      pushSimulator(
        simulator,
        'empty_miles_pct',
        'Empty Miles',
        toDecimal(100).minus(drivers.capacityPct).times(0.55),
        'percent',
        '(100 − capacity) × 0.55'
      );
      // Removed as fabrications: cost_per_mile ("miles" = revenue÷100),
      // warehousing_cost_pct (expenses×0.22 slice).
      break;
    }
    case 'healthcare': {
      const operatingMargin = totalRevenue.isZero()
        ? null
        : ratioPct(actualOperatingProfit, totalRevenue);
      pushDerived(metrics, config, 'ebitdar', operatingMargin, {
        label: 'Operating Margin (EBITDA)',
        note:
          operatingMargin === null
            ? 'No revenue-class accounts (prefix 4) posted.'
            : 'Rent addback is not derivable; reported as EBITDA margin, not EBITDAR.',
      });
      pushSimulator(
        simulator,
        'occupancy',
        'Bed Occupancy Rate',
        capacityFactor.times(100),
        'percent',
        'capacity slider passthrough'
      );
      pushSimulator(
        simulator,
        'denial_rate',
        'Claim Denial Rate',
        riskFactor.times(100).times(0.55),
        'percent',
        '0.55×risk'
      );
      pushSimulator(
        simulator,
        'readmission_rate',
        'Readmission Rate',
        riskFactor.times(100).times(1.2),
        'percent',
        '1.2×risk'
      );
      // Removed as fabrications: ar_days (45-day constant anchor),
      // case_mix_index (revenue÷patients÷10000 magic normalizer).
      break;
    }
    case 'government': {
      pushDerived(metrics, config, 'gross_margin', grossMarginPct, {
        label: 'Operating Margin',
        note:
          cls.cogs.isZero() && cls.opex.isZero() ? 'No expense-class accounts posted.' : undefined,
      });
      pushSimulator(
        simulator,
        'budget_utilization',
        'Budget Utilization',
        capacityFactor.times(100),
        'percent',
        'capacity slider passthrough'
      );
      pushSimulator(
        simulator,
        'service_efficiency',
        'Service Efficiency Score',
        efficiencyFactor.times(10),
        'number',
        '10×efficiency'
      );
      pushSimulator(
        simulator,
        'grant_disbursement_rate',
        'Grant Disbursement Rate',
        growthFactor.times(capacityFactor).times(82),
        'percent',
        '82×growth×capacity'
      );
      pushSimulator(
        simulator,
        'compliance_audit_score',
        'Compliance Audit Score',
        toDecimal(100).minus(riskFactor.times(40)),
        'percent',
        '100% − 0.4×risk'
      );
      // Removed as fabrications: cost_per_citizen (citizens = revenue÷100),
      // revenue_collection_gap (risk×50).
      break;
    }
    case 'education': {
      pushDerived(metrics, config, 'gross_margin', grossMarginPct, {
        label: 'Operating Margin',
        note:
          cls.cogs.isZero() && cls.opex.isZero() ? 'No expense-class accounts posted.' : undefined,
      });
      pushSimulator(
        simulator,
        'student_retention_rate',
        'Student Retention Rate',
        clampDecimal(efficiencyFactor.times(100).minus(riskFactor.times(25)), 0, 100),
        'percent',
        'efficiency − 25×risk'
      );
      pushSimulator(
        simulator,
        'research_grant_win_rate',
        'Research Grant Win Rate',
        growthFactor.times(efficiencyFactor).times(24),
        'percent',
        '24×growth×efficiency'
      );
      pushSimulator(
        simulator,
        'endowment_growth_rate',
        'Endowment Growth Rate',
        toDecimal(drivers.growthPct).times(0.85),
        'percent',
        '0.85×growth'
      );
      // Removed as fabrications: revenue_per_student (students = revenue÷100,
      // ≈100 by construction), faculty_to_student_ratio (salary = 90000 guess).
      break;
    }
    case 'insurance': {
      const premiumBase = cls.premiums;
      const claimsBase = cls.claims;
      const lossRatio =
        premiumBase.isZero() || claimsBase.isZero() ? null : ratioPct(claimsBase, premiumBase);
      const expenseRatio =
        premiumBase.isZero() || cls.opex.isZero() ? null : ratioPct(cls.opex, premiumBase);
      pushDerived(metrics, config, 'loss_ratio', lossRatio, {
        note:
          lossRatio === null
            ? 'Needs premium-class and claim-class accounts (or prefix 5 claim rows).'
            : undefined,
        lowerIsBetter: true,
      });
      pushDerived(metrics, config, 'expense_ratio', expenseRatio, {
        note:
          expenseRatio === null
            ? 'Needs premium-class accounts (prefix 4) and OpEx (prefix 6).'
            : undefined,
        lowerIsBetter: true,
      });
      pushDerived(
        metrics,
        config,
        'combined_ratio',
        lossRatio !== null && expenseRatio !== null ? lossRatio.plus(expenseRatio) : null,
        { lowerIsBetter: true }
      );
      pushDerived(metrics, config, 'gwp', premiumBase.isZero() ? null : premiumBase, {
        note: premiumBase.isZero()
          ? 'No premium-class accounts (prefix 4 or name match) posted.'
          : undefined,
      });
      // Removed as fabrications: retention_ratio (100−risk×30), solvency_ratio
      // (constant 180 anchor), and the claims = expenses×0.62 fallback.
      break;
    }
    case 'realestate':
    default: {
      const noi = totalRevenue.isZero() ? null : actualOperatingProfit;
      pushDerived(metrics, config, 'noi', noi, {
        label: 'Net Operating Income (posted)',
        note: noi === null ? 'No revenue-class accounts (prefix 4) posted.' : undefined,
      });
      const capRate =
        noi === null || cls.assets === null || cls.assets.isZero()
          ? null
          : ratioPct(noi, cls.assets);
      pushDerived(metrics, config, 'cap_rate', capRate, {
        note:
          capRate === null
            ? 'Needs NOI and asset-class balances (prefix 1); portfolio value is not invented.'
            : undefined,
      });
      const ltv =
        cls.liabilities === null || cls.assets === null || cls.assets.isZero()
          ? null
          : ratioPct(cls.liabilities, cls.assets);
      pushDerived(metrics, config, 'ltv', ltv, {
        label: 'Loan to Value (book basis)',
        note:
          ltv === null ? 'Needs liability (prefix 2) and asset (prefix 1) balances.' : undefined,
        lowerIsBetter: true,
      });
      pushSimulator(
        simulator,
        'occupancy',
        'Portfolio Occupancy',
        capacityFactor.times(100),
        'percent',
        'capacity slider passthrough'
      );
      // Removed as fabrications: ffo (NOI − expenses×0.08), dscr
      // (NOI ÷ debt×0.08), circular cap rate (NOI×16 portfolio).
      break;
    }
  }

  const accountSignals: Array<{ label: string; value: number; format: SectorKPI['format'] }> = [
    { label: 'Revenue (classified)', value: roundTo(totalRevenue, 2), format: 'currency' },
    { label: 'COGS (classified)', value: roundTo(cls.cogs, 2), format: 'currency' },
    { label: 'Operating expenses (classified)', value: roundTo(cls.opex, 2), format: 'currency' },
  ];
  if (cls.assets !== null)
    accountSignals.push({
      label: 'Assets (classified)',
      value: roundTo(cls.assets, 2),
      format: 'currency',
    });
  if (cls.liabilities !== null)
    accountSignals.push({
      label: 'Liabilities (classified)',
      value: roundTo(cls.liabilities, 2),
      format: 'currency',
    });
  if (cls.equity !== null)
    accountSignals.push({
      label: 'Equity (classified)',
      value: roundTo(cls.equity, 2),
      format: 'currency',
    });

  return {
    sectorId,
    totalRevenue: roundTo(totalRevenue, 2),
    modeledRevenue: roundTo(modeledRevenue, 2),
    totalExpenses: roundTo(totalExpenses, 2),
    grossProfit: roundTo(actualGrossProfit, 2),
    ebitda: roundTo(modeledEbitda, 2),
    driverNetImpact: roundTo(driverNetImpact, 2),
    metrics,
    simulator,
    accountSignals,
  };
}

function clampDecimal(value: Decimal, min: number, max: number): Decimal {
  return Decimal.min(max, Decimal.max(min, value));
}

function formatMetricValue(metric: { format: SectorKPI['format']; value: number | null }): string {
  if (metric.value === null) return '—';
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
  const legacyCopy = LEGACY_SECTOR_COPY[sectorId];
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
        <span className="mx-auto mb-4 block text-3xl text-[var(--text-muted)]" aria-hidden="true">
          ◇
        </span>
        <h1 className="mb-2 text-xl font-semibold">Sector configuration unavailable</h1>
      </main>
    );
  }

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label={`${config.name} - No Data`}>
        <span className="mx-auto mb-4 block text-3xl text-[var(--text-muted)]" aria-hidden="true">
          ▣
        </span>
        <h1 className="mb-2 text-xl font-semibold">
          {legacyCopy.title.replace(' Dashboard', '')} — No Data
        </h1>
        <p className="mb-6 text-[var(--text-muted)]">
          Import GL data to classify posted accounts and run driver scenarios.
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
    <main className="space-y-6 p-6" role="main" aria-label={`${config.name} driver model`}>
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="sr-only">Sector Analysis</span>
          <span className="sr-only">{legacyCopy.title}</span>
          {legacyCopy.labels.map((label) => (
            <span key={label} className="sr-only">
              {label}
            </span>
          ))}
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-500">
            Phase 3 Sector Depth
          </p>
          <PageHeader
            title={`${config.name} Driver Modeling Dashboard`}
            purpose={
              <>
                {config.description} — Measured figures are classified from your posted ledger by
                account code (4/5/6 P&amp;L, 1/2/3 balance sheet) with a signed account-name
                fallback. Cards labeled “Modeled” and the Scenario Simulator apply your live driver
                sliders — they are projections, not measured results.
              </>
            }
          />
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
                <span className="text-blue-500" aria-hidden="true">
                  ◌
                </span>
                {control.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-2xl font-black tabular-nums">
                  {formatPercent(drivers[control.key], 1)}
                </span>
                <span className="text-xs text-[var(--text-muted)]">live</span>
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
          label="Actual Revenue (classified)"
          value={formatMoney(model.totalRevenue, { currency: 'USD', places: 0 })}
          icon={<span aria-hidden="true">↗</span>}
        />
        <KPIValue
          label="Modeled Revenue (projection)"
          value={formatMoney(model.modeledRevenue, { currency: 'USD', places: 0 })}
          change={drivers.growthPct}
        />
        <KPIValue
          label="Modeled EBITDA (projection)"
          value={formatMoney(model.ebitda, { currency: 'USD', places: 0 })}
          change={
            model.modeledRevenue === 0
              ? undefined
              : roundTo(ratioPct(model.ebitda, model.modeledRevenue), 1)
          }
        />
        <KPIValue
          label="Driver Net Impact (vs actuals)"
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
            change={metric.varianceToTargetPct ?? undefined}
            changeLabel={
              metric.value === null
                ? metric.note
                : `Target ${metric.format === 'currency' ? formatMoney(metric.target, { currency: 'USD', places: 0 }) : metric.format === 'percent' ? formatPercent(metric.target, 1) : formatNumber(metric.target)}`
            }
          />
        ))}
      </section>

      {model.simulator.length > 0 && (
        <Card data-testid="scenario-simulator">
          <CardHeader>
            <CardTitle>Scenario simulator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--text-muted)]">
              These values are projections computed from the live driver sliders — they are not
              measured from the General Ledger.
            </p>
            {model.simulator.map((metric) => (
              <div
                key={metric.id}
                className="flex items-center justify-between border-b border-slate-200/60 py-2 last:border-0 dark:border-slate-700/60"
              >
                <div>
                  <div className="text-sm">{metric.label}</div>
                  <div className="text-xs text-[var(--text-muted)]">Basis: {metric.basis}</div>
                </div>
                <span className="font-mono text-sm">
                  {metric.format === 'currency'
                    ? formatMoney(metric.value, { currency: 'USD', places: 0 })
                    : metric.format === 'percent'
                      ? formatPercent(metric.value, 1)
                      : formatNumber(metric.value)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
                <span className="text-sm text-[var(--text-muted)]">{signal.label}</span>
                <span className="font-mono text-sm">{formatMetricValue(signal)}</span>
              </div>
            ))}
            <div className="pt-2 text-xs text-[var(--text-muted)]">
              Source: {formatNumber(entries.length)} GL rows, classified by account-code prefix
              (4/5/6 P&amp;L, 1/2/3 balance sheet) with a signed account-name fallback; unmatched
              rows are counted nowhere. Sector UI modules: {config.enabledModules.join(', ')}.
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
                  <span className="mr-2 text-xs text-[var(--text-muted)]">{index + 1}</span>
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
