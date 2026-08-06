import type { MoneyInput } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export type educationMoneyPrimitiveGuard = MoneyInput;

export function EducationDashboardPage() {
  return <SectorDriverDashboard sectorId="education" />;
}

export default EducationDashboardPage;
