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
  const { activeSector } = useSector();
  const sectorId = SUPPORTED_DRIVER_SECTORS.has(activeSector) ? activeSector : 'technology';
  return <SectorDriverDashboard sectorId={sectorId as SectorDriverId} />;
}
