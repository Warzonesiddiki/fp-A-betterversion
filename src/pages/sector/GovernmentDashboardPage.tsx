import type { MoneyInput } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export type governmentMoneyPrimitiveGuard = MoneyInput;

export function GovernmentDashboardPage() {
  return <SectorDriverDashboard sectorId="government" />;
}

export default GovernmentDashboardPage;
