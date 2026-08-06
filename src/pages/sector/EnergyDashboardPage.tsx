import { roundTo } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export const energyMoneyPrimitiveGuard = roundTo(0);

export default function EnergyDashboardPage() {
  return <SectorDriverDashboard sectorId="energy" />;
}
