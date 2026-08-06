import type { MoneyInput } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export type realestateMoneyPrimitiveGuard = MoneyInput;

export function RealEstateDashboardPage() {
  return <SectorDriverDashboard sectorId="realestate" />;
}

export default RealEstateDashboardPage;
