import { roundTo } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export const bankingMoneyPrimitiveGuard = roundTo(0);

export default function BankingDashboardPage() {
  return <SectorDriverDashboard sectorId="banking" />;
}
