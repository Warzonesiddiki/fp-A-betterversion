import type { MoneyInput } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export type energyMoneyPrimitiveGuard = MoneyInput;

export function EnergyDashboardPage() {
  return <SectorDriverDashboard sectorId="energy" />;
}

export default EnergyDashboardPage;
