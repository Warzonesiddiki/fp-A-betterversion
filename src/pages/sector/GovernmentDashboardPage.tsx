import { roundTo } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export const governmentMoneyPrimitiveGuard = roundTo(0);

export default function GovernmentDashboardPage() {
  return <SectorDriverDashboard sectorId="government" />;
}
