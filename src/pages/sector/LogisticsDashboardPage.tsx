import type { MoneyInput } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export type logisticsMoneyPrimitiveGuard = MoneyInput;

export function LogisticsDashboardPage() {
  return <SectorDriverDashboard sectorId="logistics" />;
}

export default LogisticsDashboardPage;
