// @money-ast-allow Reason: this file is the sector-aggregator page. The
// flagged `>` comparisons (`entry.credit > entry.debit` and
// `entry.debit > entry.credit`) are entry-direction FILTERS used to
// choose whether a GL entry is revenue (credit-side) or expense
// (debit-side). They are not money arithmetic; they select which entries
// flow into the downstream `sumMoney(...)` aggregation in the canonical
// money primitive. Net amounts are summed exactly.

import { useSector } from '@/hooks/useSector';
import type { GLEntry } from '@/types';
import { divideMoney, roundTo, subtractMoney, sumMoney } from '@/utils/money';
import { SectorDriverDashboard, type SectorDriverId } from './SectorDriverDashboard';

const SUPPORTED_DRIVER_SECTORS = new Set<string>([
  'technology',
  'manufacturing',
  'banking',
  'retail',
  'energy',
  'construction',
  'logistics',
  'healthcare',
  'government',
  'education',
  'realestate',
]);

export function computeSectorKPIDefaults(entries: readonly GLEntry[]): {
  gross_margin: number;
  revenue: number;
  net_income: number;
} {
  const totalRevenue = roundTo(
    sumMoney(entries.filter((entry) => entry.credit > entry.debit).map((entry) => entry.credit)),
    2
  );
  const totalExpenses = roundTo(
    sumMoney(entries.filter((entry) => entry.debit > entry.credit).map((entry) => entry.debit)),
    2
  );
  const netIncome = roundTo(subtractMoney(totalRevenue, totalExpenses), 2);
  const grossMargin =
    totalRevenue > 0
      ? roundTo(divideMoney(subtractMoney(totalRevenue, totalExpenses), totalRevenue).times(100), 2)
      : 0;

  return {
    gross_margin: grossMargin,
    revenue: totalRevenue,
    net_income: netIncome,
  };
}

export default function SectorPage() {
  const { activeSector, sectorConfig } = useSector();

  if (sectorConfig === null) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Loading Sector">
        <h1 className="text-xl font-semibold">Loading Sector...</h1>
      </main>
    );
  }

  const inferredSector =
    activeSector ?? (sectorConfig?.name?.toLowerCase().includes('banking') ? 'banking' : undefined);
  const sectorId =
    inferredSector && SUPPORTED_DRIVER_SECTORS.has(inferredSector) ? inferredSector : 'technology';
  return <SectorDriverDashboard sectorId={sectorId as SectorDriverId} />;
}
