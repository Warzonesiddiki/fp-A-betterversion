import type { MoneyInput } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export type constructionMoneyPrimitiveGuard = MoneyInput;

export function ConstructionDashboardPage() {
  return <SectorDriverDashboard sectorId="construction" />;
}

export default ConstructionDashboardPage;
