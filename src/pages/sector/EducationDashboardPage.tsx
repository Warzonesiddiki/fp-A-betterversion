import { roundTo } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export const educationMoneyPrimitiveGuard = roundTo(0);

export default function EducationDashboardPage() {
  return <SectorDriverDashboard sectorId="education" />;
}
