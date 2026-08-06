import type { MoneyInput } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export type retailMoneyPrimitiveGuard = MoneyInput;

export function RetailDashboardPage() {
  return <SectorDriverDashboard sectorId="retail" />;
}

export default RetailDashboardPage;
