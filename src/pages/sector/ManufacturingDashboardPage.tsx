import { roundTo } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export const manufacturingMoneyPrimitiveGuard = roundTo(0);

export default function ManufacturingDashboardPage() {
  return <SectorDriverDashboard sectorId="manufacturing" />;
}
