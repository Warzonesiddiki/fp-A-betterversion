import type { MoneyInput } from '@/utils/money';
import { SectorDriverDashboard } from './SectorDriverDashboard';

export type bankingMoneyPrimitiveGuard = MoneyInput;

export function BankingDashboardPage() {
  return <SectorDriverDashboard sectorId="banking" />;
}

export default BankingDashboardPage;
