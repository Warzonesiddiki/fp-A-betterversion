import type { FXRateEntry } from '@/engines/FXEngine';

export type HedgeStatus = 'Active' | 'Expired' | 'Settled';
export type HedgeType = 'Fair Value' | 'Cash Flow' | 'Net Investment';

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR', 'BRL'];

export const INSTRUMENTS = [
  'Forward Contract',
  'Currency Option',
  'Cross-Currency Swap',
  'Non-Deliverable Forward',
];

export const HEDGE_TYPES: HedgeType[] = ['Fair Value', 'Cash Flow', 'Net Investment'];

export const SOURCE_LABEL: Record<FXRateEntry['source'], string> = {
  manual: 'Manual',
  api: 'API',
  feed: 'Feed',
};

export const SOURCE_VARIANT: Record<FXRateEntry['source'], 'default' | 'secondary' | 'outline'> = {
  manual: 'default',
  api: 'secondary',
  feed: 'outline',
};

export const STATUS_VARIANT: Record<HedgeStatus, 'default' | 'secondary' | 'outline'> = {
  Active: 'default',
  Expired: 'secondary',
  Settled: 'outline',
};

export const HEDGE_TYPE_VARIANT: Record<HedgeType, 'default' | 'secondary' | 'destructive'> = {
  'Fair Value': 'default',
  'Cash Flow': 'secondary',
  'Net Investment': 'destructive',
};

export function formatMoney(n: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
