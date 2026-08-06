/**
 * Collaboration / Approval exact-money metric model (Wave 9 Phase 4 — Enterprise Governance).
 *
 * Pure, falsifiable KPIs computed exclusively through the canonical money
 * primitives (decimal.js-backed) in @/utils/money. No raw IEEE-754
 * financial arithmetic.
 */
import { divideMoney, multiplyMoney, roundTo, sumMoney, toDecimal } from '@/utils/money';

export interface ApprovalItem {
  readonly amount: number;
  readonly status: 'Pending' | 'Approved' | 'Rejected' | 'ChangesRequested' | string;
}

export interface ApprovalMetrics {
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  approvalRatePct: number;
}

/**
 * Aggregate fractional approval request amounts exactly (0.1 + 0.2 = 0.3).
 */
export function sumApprovalAmounts(amounts: readonly number[]): number {
  return roundTo(sumMoney(amounts), 2);
}

/**
 * Scale driver amount half-up (0.335 * 3 = 1.01).
 */
export function computeApprovalThreshold(amount: number, multiplier: number): number {
  return roundTo(multiplyMoney(amount, multiplier), 2);
}

/**
 * Exact percentage share, guarding a zero denominator.
 */
export function computeApprovalRatePct(approvedCount: number, totalCount: number): number {
  if (!toDecimal(totalCount).gt(0)) return 0;
  return roundTo(divideMoney(approvedCount, totalCount).times(100), 2);
}

export function computeApprovalMetrics(items: readonly ApprovalItem[]): ApprovalMetrics {
  const totalAmount = sumApprovalAmounts(items.map((i) => i.amount));
  const pendingAmount = sumApprovalAmounts(
    items.filter((i) => i.status === 'Pending').map((i) => i.amount)
  );
  const approvedAmount = sumApprovalAmounts(
    items.filter((i) => i.status === 'Approved').map((i) => i.amount)
  );
  const approvedCount = items.filter((i) => i.status === 'Approved').length;
  const approvalRatePct = computeApprovalRatePct(approvedCount, items.length);

  return {
    totalAmount,
    pendingAmount,
    approvedAmount,
    approvalRatePct,
  };
}
