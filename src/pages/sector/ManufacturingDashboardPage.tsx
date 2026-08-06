import type { MoneyInput } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export type manufacturingMoneyPrimitiveGuard = MoneyInput;

export function ManufacturingDashboardPage() {
  return <SectorDriverDashboard sectorId="manufacturing" />;
}

export default ManufacturingDashboardPage;
