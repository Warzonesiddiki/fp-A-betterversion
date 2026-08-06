import { roundTo } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export const healthcareMoneyPrimitiveGuard = roundTo(0);

export default function HealthcareDashboardPage() {
  return <SectorDriverDashboard sectorId="healthcare" />;
}
