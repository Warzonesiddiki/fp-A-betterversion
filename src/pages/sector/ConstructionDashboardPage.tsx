import { roundTo } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export const constructionMoneyPrimitiveGuard = roundTo(0);

export default function ConstructionDashboardPage() {
  return <SectorDriverDashboard sectorId="construction" />;
}
