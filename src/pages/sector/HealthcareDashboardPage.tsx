import type { MoneyInput } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export type healthcareMoneyPrimitiveGuard = MoneyInput;

export function HealthcareDashboardPage() {
  return <SectorDriverDashboard sectorId="healthcare" />;
}

export default HealthcareDashboardPage;
