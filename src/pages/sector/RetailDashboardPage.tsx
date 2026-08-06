import { roundTo } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export const retailMoneyPrimitiveGuard = roundTo(0);

export default function RetailDashboardPage() {
  return <SectorDriverDashboard sectorId="retail" />;
}
