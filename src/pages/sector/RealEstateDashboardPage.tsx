import { roundTo } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export const realestateMoneyPrimitiveGuard = roundTo(0);

export default function RealEstateDashboardPage() {
  return <SectorDriverDashboard sectorId="realestate" />;
}
