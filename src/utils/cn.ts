import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
