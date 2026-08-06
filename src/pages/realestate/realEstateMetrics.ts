/**
 * Real Estate exact-money metric model (Wave 9 Phase 3 — Sector Depth).
 *
 * Pure, falsifiable KPIs computed exclusively through the canonical money
 * primitives (decimal.js-backed) in @/utils/money. No raw IEEE-754
 * financial arithmetic, no static placeholder cards, no Math.random truth.
 */
import {
  addMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '@/utils/money';

export interface RealEstateMetricsInput {
  rentalRevenue: number;
  otherRevenue: number;
  propertyOperatingExpenses: number;
  generalAdminExpenses: number;
  totalRentableSqFt: number;
  occupiedSqFt: number;
  propertyValuation: number;
  totalDebtService: number;
  totalDebt: number;
  capitalExpenditures: number;
}

export interface RealEstateMetrics {
  totalRevenue: number;
  noi: number;
  ebitda: number;
  ffo: number;
  capRatePct: number;
  occupancyRatePct: number;
  dscr: number;
  ltvPct: number;
  noiMarginPct: number;
}

/**
 * Aggregate fractional real estate amounts exactly (0.1 + 0.2 = 0.3).
 */
export function sumRealEstateAmounts(amounts: readonly number[]): number {
  return roundTo(sumMoney(amounts), 2);
}

/**
 * Scale driver amount half-up (0.335 * 3 = 1.01).
 */
export function scaleRealEstateDriver(amount: number, factor: number): number {
  return roundTo(multiplyMoney(amount, factor), 2);
}

/**
 * Exact percentage share, guarding a zero denominator.
 */
export function computeRealEstateRatioPct(numerator: number, denominator: number): number {
  if (!toDecimal(denominator).gt(0)) return 0;
  return roundTo(divideMoney(numerator, denominator).times(100), 2);
}

/**
 * Compute DSCR (Debt Service Coverage Ratio = NOI / Total Debt Service).
 */
export function computeDSCR(noi: number, totalDebtService: number): number {
  if (!toDecimal(totalDebtService).gt(0)) return 0;
  return roundTo(divideMoney(noi, totalDebtService), 2);
}

export function computeRealEstateMetrics(input: RealEstateMetricsInput): RealEstateMetrics {
  const totalRevenue = roundTo(addMoney(input.rentalRevenue, input.otherRevenue), 2);
  const noi = roundTo(subtractMoney(totalRevenue, input.propertyOperatingExpenses), 2);
  const ebitda = roundTo(subtractMoney(noi, input.generalAdminExpenses), 2);
  const ffo = roundTo(subtractMoney(ebitda, input.capitalExpenditures), 2);

  const capRatePct = computeRealEstateRatioPct(noi, input.propertyValuation);
  const occupancyRatePct = computeRealEstateRatioPct(input.occupiedSqFt, input.totalRentableSqFt);
  const dscr = computeDSCR(noi, input.totalDebtService);
  const ltvPct = computeRealEstateRatioPct(input.totalDebt, input.propertyValuation);
  const noiMarginPct = computeRealEstateRatioPct(noi, totalRevenue);

  return {
    totalRevenue,
    noi,
    ebitda,
    ffo,
    capRatePct,
    occupancyRatePct,
    dscr,
    ltvPct,
    noiMarginPct,
  };
}
