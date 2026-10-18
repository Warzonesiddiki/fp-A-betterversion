import { describe, it, expect } from 'vitest';
import { deriveDirectCashFlow } from './directCashFlow';
import {
  deriveThreeStatement,
  type ThreeStatementGLEntry,
} from '@/pages/reports/threeStatementData';

/**
 * Phase 9 (row 11): direct-method operating cash flow.
 *
 *   receipts from customers   = revenue − Δ receivables
 *   payments to suppliers etc = operating expenses + Δ inventory − Δ payables
 *
 * The fixture is constructed so every line is checkable by hand, and
 * operating + the disclosed investing/financing residual must equal
 * the period's change in cash on the cash account itself.
 */

const ENTRIES: ThreeStatementGLEntry[] = [
  // 2025-12 opening position
  { accountCode: '1000', date: '2025-12-05', debit: 10000, credit: 0 },
  { accountCode: '3000', date: '2025-12-05', debit: 0, credit: 10000 },
  { accountCode: '1200', date: '2025-12-06', debit: 3000, credit: 0 },
  { accountCode: '2100', date: '2025-12-06', debit: 0, credit: 3000 },
  { accountCode: '1100', date: '2025-12-07', debit: 4000, credit: 0 },
  { accountCode: '4010', date: '2025-12-07', debit: 0, credit: 4000 },
  // 2026-01 activity
  { accountCode: '1000', date: '2026-01-10', debit: 3500, credit: 0 }, // collected from customers
  { accountCode: '1100', date: '2026-01-10', debit: 0, credit: 3500 },
  { accountCode: '5010', date: '2026-01-11', debit: 1800, credit: 0 }, // COGS
  { accountCode: '1200', date: '2026-01-11', debit: 0, credit: 1800 },
  { accountCode: '2100', date: '2026-01-12', debit: 2000, credit: 0 }, // paid suppliers
  { accountCode: '1000', date: '2026-01-12', debit: 0, credit: 2000 },
  { accountCode: '6010', date: '2026-01-13', debit: 500, credit: 0 }, // opex paid in cash
  { accountCode: '1000', date: '2026-01-13', debit: 0, credit: 500 },
  { accountCode: '1000', date: '2026-01-14', debit: 1000, credit: 0 }, // cash sale
  { accountCode: '4010', date: '2026-01-14', debit: 0, credit: 1000 },
  { accountCode: '1000', date: '2026-01-20', debit: 5000, credit: 0 }, // new borrowing
  { accountCode: '2300', date: '2026-01-20', debit: 0, credit: 5000 },
];

describe('deriveDirectCashFlow', () => {
  it('hand-computed operating lines and an honest combined residual', () => {
    const r = deriveDirectCashFlow(ENTRIES, '2026-01');
    // Revenue 1,000; AR fell 4,000 -> 500, so collections = 1,000 + 3,500.
    expect(r.receiptsFromCustomers).toBe(4500);
    // Expenses 2,300; inventory fell 1,800; payables fell 2,000 ->
    // payments = 2,300 - 1,800 + 2,000 = 2,500.
    expect(r.paymentsToSuppliersAndEmployees).toBe(2500);
    expect(r.netCashFromOperations).toBe(2000);
    // The borrowing is NOT operating: it lands in the disclosed residual.
    expect(r.investingAndFinancingCombined).toBe(5000);
    expect(r.beginningCash).toBe(10000);
    expect(r.netChangeInCash).toBe(7000);
    expect(r.endingCash).toBe(17000);
  });

  it('ties to the derived cash account balance at the same cutoff', () => {
    const r = deriveDirectCashFlow(ENTRIES, '2026-01');
    const derived = deriveThreeStatement(ENTRIES, '2026-01');
    expect(r.endingCash).toBe(derived.cashFlow.endingCash);
    expect(r.beginningCash + r.netChangeInCash).toBe(r.endingCash);
    expect(r.netCashFromOperations + r.investingAndFinancingCombined).toBe(r.netChangeInCash);
  });
});
