import { roundTo } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export const logisticsMoneyPrimitiveGuard = roundTo(0);

export default function LogisticsDashboardPage() {
  return <SectorDriverDashboard sectorId="logistics" />;
}
