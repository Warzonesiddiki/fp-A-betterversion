/**
 * syntheticTieOutLedger.ts
 *
 * Balanced, multi-period synthetic general ledger fixture with:
 * - Known exact control totals (debits == credits).
 * - Zero floating point drift (backed by decimal.js / src/utils/money.ts).
 * - Multi-period representation across FY2024 (Q1 - Q4).
 * - Perfect 3-statement tie-out:
 *   1. P&L Net Income ties out to Balance Sheet Retained Earnings roll-forward.
 *   2. Balance Sheet Assets tie out to Liabilities + Equity (Assets == Liab + Equity).
 *   3. Cash Flow Statement net cash changes tie out to Balance Sheet Cash balance.
 * - Conforms to GLEntry and glStore validateEntries invariants (FP-0002 double-entry compliant).
 */

import type { GLEntry } from '../../types';
import { sumMoney, addMoney, subtractMoney } from '../../utils/money';

export interface SyntheticPeriodControlTotals {
  period: string; // e.g. "2024-Q1"
  batchId: string;
  totalDebits: number;
  totalCredits: number;
  netDebitCreditDiff: number; // Must be 0
  pnlNetIncome: number;
  retainedEarningsEnding: number;
  balanceSheetTotalAssets: number;
  balanceSheetTotalLiabilitiesAndEquity: number;
  cashEnding: number;
}

export interface SyntheticBatchInfo {
  id: string;
  batchNumber: string;
  period: string;
  status: 'posted';
  entriesCount: number;
  totalDebit: number;
  totalCredit: number;
  description: string;
  createdAt: string;
}

export interface SyntheticTieOutLedger {
  entityId: string;
  periods: string[];
  batches: SyntheticBatchInfo[];
  entries: GLEntry[];
  periodSummaries: Record<string, SyntheticPeriodControlTotals>;
  cumulativeControlTotals: {
    totalDebits: number;
    totalCredits: number;
    netBalance: number;
    entryCount: number;
    batchCount: number;
  };
}

/**
 * Standard Chart of Accounts used in the synthetic ledger:
 * 1000 - Cash & Equivalents (Asset, Debit normal)
 * 1100 - Accounts Receivable (Asset, Debit normal)
 * 1200 - Inventory (Asset, Debit normal)
 * 1500 - Property, Plant & Equipment (Gross PPE) (Asset, Debit normal)
 * 1600 - Accumulated Depreciation (Contra-Asset, Credit normal)
 * 2000 - Accounts Payable (Liability, Credit normal)
 * 2100 - Accrued Liabilities (Liability, Credit normal)
 * 2500 - Long-term Debt (Liability, Credit normal)
 * 3000 - Common Stock (Equity, Credit normal)
 * 3100 - Retained Earnings (Equity, Credit normal)
 * 4000 - Sales Revenue (Revenue, Credit normal)
 * 5000 - Cost of Goods Sold (COGS) (Expense, Debit normal)
 * 6000 - SG&A Expense (Expense, Debit normal)
 * 6500 - Depreciation Expense (Expense, Debit normal)
 * 7000 - Interest Expense (Expense, Debit normal)
 * 8000 - Income Tax Expense (Expense, Debit normal)
 */

export const SYNTHETIC_COA = {
  CASH: { account: '1000', accountName: 'Cash and Cash Equivalents', category: 'Current Assets' },
  AR: { account: '1100', accountName: 'Accounts Receivable', category: 'Current Assets' },
  INVENTORY: { account: '1200', accountName: 'Inventory', category: 'Current Assets' },
  GROSS_PPE: {
    account: '1500',
    accountName: 'Property, Plant and Equipment',
    category: 'Non-Current Assets',
  },
  ACC_DEP: {
    account: '1600',
    accountName: 'Accumulated Depreciation',
    category: 'Non-Current Assets',
  },
  AP: { account: '2000', accountName: 'Accounts Payable', category: 'Current Liabilities' },
  ACCRUED_EXP: {
    account: '2100',
    accountName: 'Accrued Liabilities',
    category: 'Current Liabilities',
  },
  LT_DEBT: { account: '2500', accountName: 'Long-term Debt', category: 'Non-Current Liabilities' },
  COMMON_STOCK: { account: '3000', accountName: 'Common Stock', category: 'Equity' },
  RETAINED_EARNINGS: { account: '3100', accountName: 'Retained Earnings', category: 'Equity' },
  REVENUE: { account: '4000', accountName: 'Commercial Revenue', category: 'Revenue' },
  COGS: { account: '5000', accountName: 'Cost of Goods Sold', category: 'COGS' },
  SGA: { account: '6000', accountName: 'SG&A Expense', category: 'Operating Expenses' },
  DEP_EXP: { account: '6500', accountName: 'Depreciation Expense', category: 'Operating Expenses' },
  INT_EXP: { account: '7000', accountName: 'Interest Expense', category: 'Non-Operating Expenses' },
  TAX_EXP: { account: '8000', accountName: 'Income Tax Expense', category: 'Income Tax' },
} as const;

/**
 * Creates a synthetic multi-period ledger containing balanced journal batches:
 * - Period 1 (2024-Q1): Initial Capitalization & Setup.
 * - Period 2 (2024-Q2): Active Operations (Sales, OPEX, Depreciation, Taxes).
 * - Period 3 (2024-Q3): Working Capital movements, Debt Paydown, Capex investment.
 * - Period 4 (2024-Q4): Year-end Closing, Final Margin Realization, Retained Earnings roll-forward.
 */
export function createSyntheticTieOutLedger(): SyntheticTieOutLedger {
  const entityId = 'ENT-SYNTH-01';

  // Period 1: 2024-03-31 - Capitalization & Equipment Acquisition
  // Debit Cash 500,000, Credit Common Stock 500,000
  // Debit Gross PPE 200,000, Credit Cash 200,000
  // Debit Inventory 50,000, Credit Accounts Payable 50,000
  const batch1Id = 'BATCH-SYNTH-2024-Q1';
  const batch1Entries: GLEntry[] = [
    {
      id: `${batch1Id}-001`,
      accountId: SYNTHETIC_COA.CASH.account,
      accountCode: SYNTHETIC_COA.CASH.account,
      accountName: SYNTHETIC_COA.CASH.accountName,
      period: '2024-Q1',
      periodName: 'Q1 2024',
      date: '2024-01-15',
      debit: 500000,
      credit: 0,
      netChange: 500000,
      amount: 500000,
      currency: 'USD',
      description: 'Initial equity investment',
      reference: 'JE-2024-001',
      entityId,
      journalId: batch1Id,
      source: 'manual',
    },
    {
      id: `${batch1Id}-002`,
      accountId: SYNTHETIC_COA.COMMON_STOCK.account,
      accountCode: SYNTHETIC_COA.COMMON_STOCK.account,
      accountName: SYNTHETIC_COA.COMMON_STOCK.accountName,
      period: '2024-Q1',
      periodName: 'Q1 2024',
      date: '2024-01-15',
      debit: 0,
      credit: 500000,
      netChange: -500000,
      amount: -500000,
      currency: 'USD',
      description: 'Common stock issuance',
      reference: 'JE-2024-001',
      entityId,
      journalId: batch1Id,
      source: 'manual',
    },
    {
      id: `${batch1Id}-003`,
      accountId: SYNTHETIC_COA.GROSS_PPE.account,
      accountCode: SYNTHETIC_COA.GROSS_PPE.account,
      accountName: SYNTHETIC_COA.GROSS_PPE.accountName,
      period: '2024-Q1',
      periodName: 'Q1 2024',
      date: '2024-02-01',
      debit: 200000,
      credit: 0,
      netChange: 200000,
      amount: 200000,
      currency: 'USD',
      description: 'Manufacturing equipment purchase',
      reference: 'JE-2024-002',
      entityId,
      journalId: batch1Id,
      source: 'manual',
    },
    {
      id: `${batch1Id}-004`,
      accountId: SYNTHETIC_COA.CASH.account,
      accountCode: SYNTHETIC_COA.CASH.account,
      accountName: SYNTHETIC_COA.CASH.accountName,
      period: '2024-Q1',
      periodName: 'Q1 2024',
      date: '2024-02-01',
      debit: 0,
      credit: 200000,
      netChange: -200000,
      amount: -200000,
      currency: 'USD',
      description: 'Cash payment for PPE purchase',
      reference: 'JE-2024-002',
      entityId,
      journalId: batch1Id,
      source: 'manual',
    },
    {
      id: `${batch1Id}-005`,
      accountId: SYNTHETIC_COA.INVENTORY.account,
      accountCode: SYNTHETIC_COA.INVENTORY.account,
      accountName: SYNTHETIC_COA.INVENTORY.accountName,
      period: '2024-Q1',
      periodName: 'Q1 2024',
      date: '2024-02-15',
      debit: 50000,
      credit: 0,
      netChange: 50000,
      amount: 50000,
      currency: 'USD',
      description: 'Initial raw materials inventory',
      reference: 'JE-2024-003',
      entityId,
      journalId: batch1Id,
      source: 'manual',
    },
    {
      id: `${batch1Id}-006`,
      accountId: SYNTHETIC_COA.AP.account,
      accountCode: SYNTHETIC_COA.AP.account,
      accountName: SYNTHETIC_COA.AP.accountName,
      period: '2024-Q1',
      periodName: 'Q1 2024',
      date: '2024-02-15',
      debit: 0,
      credit: 50000,
      netChange: -50000,
      amount: -50000,
      currency: 'USD',
      description: 'Vendor payable for inventory',
      reference: 'JE-2024-003',
      entityId,
      journalId: batch1Id,
      source: 'manual',
    },
  ];

  // Period 2: 2024-06-30 - Commercial Operations Q2
  // Sales on Credit: Debit AR 300,000, Credit Revenue 300,000
  // COGS: Debit COGS 120,000, Credit Inventory 120,000
  // Cash Inv Purchase: Debit Inv 100,000, Credit Cash 100,000
  // SG&A: Debit SG&A 60,000, Credit Cash 60,000
  // Depreciation: Debit Dep Exp 10,000, Credit Acc Dep 10,000
  // Tax: Debit Tax Exp 27,500, Credit Accrued Liabilities 27,500
  const batch2Id = 'BATCH-SYNTH-2024-Q2';
  const batch2Entries: GLEntry[] = [
    {
      id: `${batch2Id}-001`,
      accountId: SYNTHETIC_COA.AR.account,
      accountCode: SYNTHETIC_COA.AR.account,
      accountName: SYNTHETIC_COA.AR.accountName,
      period: '2024-Q2',
      periodName: 'Q2 2024',
      date: '2024-04-10',
      debit: 300000,
      credit: 0,
      netChange: 300000,
      amount: 300000,
      currency: 'USD',
      description: 'Customer billings Q2',
      reference: 'JE-2024-004',
      entityId,
      journalId: batch2Id,
      source: 'manual',
    },
    {
      id: `${batch2Id}-002`,
      accountId: SYNTHETIC_COA.REVENUE.account,
      accountCode: SYNTHETIC_COA.REVENUE.account,
      accountName: SYNTHETIC_COA.REVENUE.accountName,
      period: '2024-Q2',
      periodName: 'Q2 2024',
      date: '2024-04-10',
      debit: 0,
      credit: 300000,
      netChange: -300000,
      amount: -300000,
      currency: 'USD',
      description: 'Q2 revenue recognition',
      reference: 'JE-2024-004',
      entityId,
      journalId: batch2Id,
      source: 'manual',
    },
    {
      id: `${batch2Id}-003`,
      accountId: SYNTHETIC_COA.COGS.account,
      accountCode: SYNTHETIC_COA.COGS.account,
      accountName: SYNTHETIC_COA.COGS.accountName,
      period: '2024-Q2',
      periodName: 'Q2 2024',
      date: '2024-04-20',
      debit: 120000,
      credit: 0,
      netChange: 120000,
      amount: 120000,
      currency: 'USD',
      description: 'Direct materials and manufacturing cost',
      reference: 'JE-2024-005',
      entityId,
      journalId: batch2Id,
      source: 'manual',
    },
    {
      id: `${batch2Id}-004`,
      accountId: SYNTHETIC_COA.INVENTORY.account,
      accountCode: SYNTHETIC_COA.INVENTORY.account,
      accountName: SYNTHETIC_COA.INVENTORY.accountName,
      period: '2024-Q2',
      periodName: 'Q2 2024',
      date: '2024-04-20',
      debit: 0,
      credit: 120000,
      netChange: -120000,
      amount: -120000,
      currency: 'USD',
      description: 'Relief of inventory for sales',
      reference: 'JE-2024-005',
      entityId,
      journalId: batch2Id,
      source: 'manual',
    },
    {
      id: `${batch2Id}-005`,
      accountId: SYNTHETIC_COA.INVENTORY.account,
      accountCode: SYNTHETIC_COA.INVENTORY.account,
      accountName: SYNTHETIC_COA.INVENTORY.accountName,
      period: '2024-Q2',
      periodName: 'Q2 2024',
      date: '2024-05-01',
      debit: 100000,
      credit: 0,
      netChange: 100000,
      amount: 100000,
      currency: 'USD',
      description: 'Replenishment inventory stock',
      reference: 'JE-2024-006',
      entityId,
      journalId: batch2Id,
      source: 'manual',
    },
    {
      id: `${batch2Id}-006`,
      accountId: SYNTHETIC_COA.CASH.account,
      accountCode: SYNTHETIC_COA.CASH.account,
      accountName: SYNTHETIC_COA.CASH.accountName,
      period: '2024-Q2',
      periodName: 'Q2 2024',
      date: '2024-05-01',
      debit: 0,
      credit: 100000,
      netChange: -100000,
      amount: -100000,
      currency: 'USD',
      description: 'Cash paid for inventory replenishment',
      reference: 'JE-2024-006',
      entityId,
      journalId: batch2Id,
      source: 'manual',
    },
    {
      id: `${batch2Id}-007`,
      accountId: SYNTHETIC_COA.SGA.account,
      accountCode: SYNTHETIC_COA.SGA.account,
      accountName: SYNTHETIC_COA.SGA.accountName,
      period: '2024-Q2',
      periodName: 'Q2 2024',
      date: '2024-05-15',
      debit: 60000,
      credit: 0,
      netChange: 60000,
      amount: 60000,
      currency: 'USD',
      description: 'Salaries and office operating expenses',
      reference: 'JE-2024-007',
      entityId,
      journalId: batch2Id,
      source: 'manual',
    },
    {
      id: `${batch2Id}-008`,
      accountId: SYNTHETIC_COA.CASH.account,
      accountCode: SYNTHETIC_COA.CASH.account,
      accountName: SYNTHETIC_COA.CASH.accountName,
      period: '2024-Q2',
      periodName: 'Q2 2024',
      date: '2024-05-15',
      debit: 0,
      credit: 60000,
      netChange: -60000,
      amount: -60000,
      currency: 'USD',
      description: 'Cash payroll disbursement',
      reference: 'JE-2024-007',
      entityId,
      journalId: batch2Id,
      source: 'manual',
    },
    {
      id: `${batch2Id}-009`,
      accountId: SYNTHETIC_COA.DEP_EXP.account,
      accountCode: SYNTHETIC_COA.DEP_EXP.account,
      accountName: SYNTHETIC_COA.DEP_EXP.accountName,
      period: '2024-Q2',
      periodName: 'Q2 2024',
      date: '2024-06-30',
      debit: 10000,
      credit: 0,
      netChange: 10000,
      amount: 10000,
      currency: 'USD',
      description: 'Q2 PPE depreciation expense',
      reference: 'JE-2024-008',
      entityId,
      journalId: batch2Id,
      source: 'manual',
    },
    {
      id: `${batch2Id}-010`,
      accountId: SYNTHETIC_COA.ACC_DEP.account,
      accountCode: SYNTHETIC_COA.ACC_DEP.account,
      accountName: SYNTHETIC_COA.ACC_DEP.accountName,
      period: '2024-Q2',
      periodName: 'Q2 2024',
      date: '2024-06-30',
      debit: 0,
      credit: 10000,
      netChange: -10000,
      amount: -10000,
      currency: 'USD',
      description: 'Accumulated depreciation allowance',
      reference: 'JE-2024-008',
      entityId,
      journalId: batch2Id,
      source: 'manual',
    },
    {
      id: `${batch2Id}-011`,
      accountId: SYNTHETIC_COA.TAX_EXP.account,
      accountCode: SYNTHETIC_COA.TAX_EXP.account,
      accountName: SYNTHETIC_COA.TAX_EXP.accountName,
      period: '2024-Q2',
      periodName: 'Q2 2024',
      date: '2024-06-30',
      debit: 27500,
      credit: 0,
      netChange: 27500,
      amount: 27500,
      currency: 'USD',
      description: 'Q2 income tax provision (25% on 110,000 EBT)',
      reference: 'JE-2024-009',
      entityId,
      journalId: batch2Id,
      source: 'manual',
    },
    {
      id: `${batch2Id}-012`,
      accountId: SYNTHETIC_COA.ACCRUED_EXP.account,
      accountCode: SYNTHETIC_COA.ACCRUED_EXP.account,
      accountName: SYNTHETIC_COA.ACCRUED_EXP.accountName,
      period: '2024-Q2',
      periodName: 'Q2 2024',
      date: '2024-06-30',
      debit: 0,
      credit: 27500,
      netChange: -27500,
      amount: -27500,
      currency: 'USD',
      description: 'Income tax payable accrual',
      reference: 'JE-2024-009',
      entityId,
      journalId: batch2Id,
      source: 'manual',
    },
  ];

  // Period 3: 2024-09-30 - Working Capital Collection & Debt Financing
  // Cash Collection on AR: Debit Cash 250,000, Credit AR 250,000
  // Pay down AP: Debit AP 50,000, Credit Cash 50,000
  // Long-term Debt Borrowing: Debit Cash 100,000, Credit Long-term Debt 100,000
  // Tax settlement: Debit Accrued Liabilities 27,500, Credit Cash 27,500
  const batch3Id = 'BATCH-SYNTH-2024-Q3';
  const batch3Entries: GLEntry[] = [
    {
      id: `${batch3Id}-001`,
      accountId: SYNTHETIC_COA.CASH.account,
      accountCode: SYNTHETIC_COA.CASH.account,
      accountName: SYNTHETIC_COA.CASH.accountName,
      period: '2024-Q3',
      periodName: 'Q3 2024',
      date: '2024-07-20',
      debit: 250000,
      credit: 0,
      netChange: 250000,
      amount: 250000,
      currency: 'USD',
      description: 'Customer receivables collected',
      reference: 'JE-2024-010',
      entityId,
      journalId: batch3Id,
      source: 'manual',
    },
    {
      id: `${batch3Id}-002`,
      accountId: SYNTHETIC_COA.AR.account,
      accountCode: SYNTHETIC_COA.AR.account,
      accountName: SYNTHETIC_COA.AR.accountName,
      period: '2024-Q3',
      periodName: 'Q3 2024',
      date: '2024-07-20',
      debit: 0,
      credit: 250000,
      netChange: -250000,
      amount: -250000,
      currency: 'USD',
      description: 'AR credit from cash receipts',
      reference: 'JE-2024-010',
      entityId,
      journalId: batch3Id,
      source: 'manual',
    },
    {
      id: `${batch3Id}-003`,
      accountId: SYNTHETIC_COA.AP.account,
      accountCode: SYNTHETIC_COA.AP.account,
      accountName: SYNTHETIC_COA.AP.accountName,
      period: '2024-Q3',
      periodName: 'Q3 2024',
      date: '2024-08-10',
      debit: 50000,
      credit: 0,
      netChange: 50000,
      amount: 50000,
      currency: 'USD',
      description: 'Settlement of trade payables',
      reference: 'JE-2024-011',
      entityId,
      journalId: batch3Id,
      source: 'manual',
    },
    {
      id: `${batch3Id}-004`,
      accountId: SYNTHETIC_COA.CASH.account,
      accountCode: SYNTHETIC_COA.CASH.account,
      accountName: SYNTHETIC_COA.CASH.accountName,
      period: '2024-Q3',
      periodName: 'Q3 2024',
      date: '2024-08-10',
      debit: 0,
      credit: 50000,
      netChange: -50000,
      amount: -50000,
      currency: 'USD',
      description: 'Cash outflow for AP settlement',
      reference: 'JE-2024-011',
      entityId,
      journalId: batch3Id,
      source: 'manual',
    },
    {
      id: `${batch3Id}-005`,
      accountId: SYNTHETIC_COA.CASH.account,
      accountCode: SYNTHETIC_COA.CASH.account,
      accountName: SYNTHETIC_COA.CASH.accountName,
      period: '2024-Q3',
      periodName: 'Q3 2024',
      date: '2024-09-01',
      debit: 100000,
      credit: 0,
      netChange: 100000,
      amount: 100000,
      currency: 'USD',
      description: 'Proceeds from credit facility / long-term loan',
      reference: 'JE-2024-012',
      entityId,
      journalId: batch3Id,
      source: 'manual',
    },
    {
      id: `${batch3Id}-006`,
      accountId: SYNTHETIC_COA.LT_DEBT.account,
      accountCode: SYNTHETIC_COA.LT_DEBT.account,
      accountName: SYNTHETIC_COA.LT_DEBT.accountName,
      period: '2024-Q3',
      periodName: 'Q3 2024',
      date: '2024-09-01',
      debit: 0,
      credit: 100000,
      netChange: -100000,
      amount: -100000,
      currency: 'USD',
      description: 'Long-term debt note obligation',
      reference: 'JE-2024-012',
      entityId,
      journalId: batch3Id,
      source: 'manual',
    },
    {
      id: `${batch3Id}-007`,
      accountId: SYNTHETIC_COA.ACCRUED_EXP.account,
      accountCode: SYNTHETIC_COA.ACCRUED_EXP.account,
      accountName: SYNTHETIC_COA.ACCRUED_EXP.accountName,
      period: '2024-Q3',
      periodName: 'Q3 2024',
      date: '2024-09-15',
      debit: 27500,
      credit: 0,
      netChange: 27500,
      amount: 27500,
      currency: 'USD',
      description: 'Payment of accrued tax liability',
      reference: 'JE-2024-013',
      entityId,
      journalId: batch3Id,
      source: 'manual',
    },
    {
      id: `${batch3Id}-008`,
      accountId: SYNTHETIC_COA.CASH.account,
      accountCode: SYNTHETIC_COA.CASH.account,
      accountName: SYNTHETIC_COA.CASH.accountName,
      period: '2024-Q3',
      periodName: 'Q3 2024',
      date: '2024-09-15',
      debit: 0,
      credit: 27500,
      netChange: -27500,
      amount: -27500,
      currency: 'USD',
      description: 'Cash outflow for tax remittance',
      reference: 'JE-2024-013',
      entityId,
      journalId: batch3Id,
      source: 'manual',
    },
  ];

  // Period 4: 2024-12-31 - Q4 Operations & Year-End Closing
  // Q4 Revenue: Debit AR 400,000, Credit Revenue 400,000
  // Q4 COGS: Debit COGS 160,000, Credit Inventory 30,000, Credit AP 130,000
  // Interest Expense: Debit Int Exp 2,500, Credit Cash 2,500
  // Depreciation: Debit Dep Exp 10,000, Credit Acc Dep 10,000
  // SG&A: Debit SG&A 70,000, Credit Cash 70,000
  // Taxes: Debit Tax Exp 39,375, Credit Accrued Liabilities 39,375 (25% on 157,500 EBT)
  // Cash Collected on AR: Debit Cash 300,000, Credit AR 300,000
  const batch4Id = 'BATCH-SYNTH-2024-Q4';
  const batch4Entries: GLEntry[] = [
    {
      id: `${batch4Id}-001`,
      accountId: SYNTHETIC_COA.AR.account,
      accountCode: SYNTHETIC_COA.AR.account,
      accountName: SYNTHETIC_COA.AR.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-11-10',
      debit: 400000,
      credit: 0,
      netChange: 400000,
      amount: 400000,
      currency: 'USD',
      description: 'Q4 sales invoicing',
      reference: 'JE-2024-014',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
    {
      id: `${batch4Id}-002`,
      accountId: SYNTHETIC_COA.REVENUE.account,
      accountCode: SYNTHETIC_COA.REVENUE.account,
      accountName: SYNTHETIC_COA.REVENUE.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-11-10',
      debit: 0,
      credit: 400000,
      netChange: -400000,
      amount: -400000,
      currency: 'USD',
      description: 'Q4 revenue recognition',
      reference: 'JE-2024-014',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
    {
      id: `${batch4Id}-003`,
      accountId: SYNTHETIC_COA.COGS.account,
      accountCode: SYNTHETIC_COA.COGS.account,
      accountName: SYNTHETIC_COA.COGS.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-11-20',
      debit: 160000,
      credit: 0,
      netChange: 160000,
      amount: 160000,
      currency: 'USD',
      description: 'Direct production expenses',
      reference: 'JE-2024-015',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
    {
      id: `${batch4Id}-004`,
      accountId: SYNTHETIC_COA.INVENTORY.account,
      accountCode: SYNTHETIC_COA.INVENTORY.account,
      accountName: SYNTHETIC_COA.INVENTORY.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-11-20',
      debit: 0,
      credit: 30000,
      netChange: -30000,
      amount: -30000,
      currency: 'USD',
      description: 'Inventory consumption',
      reference: 'JE-2024-015',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
    {
      id: `${batch4Id}-005`,
      accountId: SYNTHETIC_COA.AP.account,
      accountCode: SYNTHETIC_COA.AP.account,
      accountName: SYNTHETIC_COA.AP.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-11-20',
      debit: 0,
      credit: 130000,
      netChange: -130000,
      amount: -130000,
      currency: 'USD',
      description: 'Direct materials payable to vendors',
      reference: 'JE-2024-015',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
    {
      id: `${batch4Id}-006`,
      accountId: SYNTHETIC_COA.INT_EXP.account,
      accountCode: SYNTHETIC_COA.INT_EXP.account,
      accountName: SYNTHETIC_COA.INT_EXP.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-12-15',
      debit: 2500,
      credit: 0,
      netChange: 2500,
      amount: 2500,
      currency: 'USD',
      description: 'Interest on bank debt',
      reference: 'JE-2024-016',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
    {
      id: `${batch4Id}-007`,
      accountId: SYNTHETIC_COA.CASH.account,
      accountCode: SYNTHETIC_COA.CASH.account,
      accountName: SYNTHETIC_COA.CASH.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-12-15',
      debit: 0,
      credit: 2500,
      netChange: -2500,
      amount: -2500,
      currency: 'USD',
      description: 'Interest payment via wire',
      reference: 'JE-2024-016',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
    {
      id: `${batch4Id}-008`,
      accountId: SYNTHETIC_COA.SGA.account,
      accountCode: SYNTHETIC_COA.SGA.account,
      accountName: SYNTHETIC_COA.SGA.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-12-20',
      debit: 70000,
      credit: 0,
      netChange: 70000,
      amount: 70000,
      currency: 'USD',
      description: 'Administrative salaries and IT expenses',
      reference: 'JE-2024-017',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
    {
      id: `${batch4Id}-009`,
      accountId: SYNTHETIC_COA.CASH.account,
      accountCode: SYNTHETIC_COA.CASH.account,
      accountName: SYNTHETIC_COA.CASH.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-12-20',
      debit: 0,
      credit: 70000,
      netChange: -70000,
      amount: -70000,
      currency: 'USD',
      description: 'Cash payment for administrative expenses',
      reference: 'JE-2024-017',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
    {
      id: `${batch4Id}-010`,
      accountId: SYNTHETIC_COA.DEP_EXP.account,
      accountCode: SYNTHETIC_COA.DEP_EXP.account,
      accountName: SYNTHETIC_COA.DEP_EXP.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-12-31',
      debit: 10000,
      credit: 0,
      netChange: 10000,
      amount: 10000,
      currency: 'USD',
      description: 'Q4 PPE depreciation',
      reference: 'JE-2024-018',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
    {
      id: `${batch4Id}-011`,
      accountId: SYNTHETIC_COA.ACC_DEP.account,
      accountCode: SYNTHETIC_COA.ACC_DEP.account,
      accountName: SYNTHETIC_COA.ACC_DEP.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-12-31',
      debit: 0,
      credit: 10000,
      netChange: -10000,
      amount: -10000,
      currency: 'USD',
      description: 'Accumulated depreciation addition',
      reference: 'JE-2024-018',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
    {
      id: `${batch4Id}-012`,
      accountId: SYNTHETIC_COA.TAX_EXP.account,
      accountCode: SYNTHETIC_COA.TAX_EXP.account,
      accountName: SYNTHETIC_COA.TAX_EXP.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-12-31',
      debit: 39375,
      credit: 0,
      netChange: 39375,
      amount: 39375,
      currency: 'USD',
      description: 'Q4 tax provision',
      reference: 'JE-2024-019',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
    {
      id: `${batch4Id}-013`,
      accountId: SYNTHETIC_COA.ACCRUED_EXP.account,
      accountCode: SYNTHETIC_COA.ACCRUED_EXP.account,
      accountName: SYNTHETIC_COA.ACCRUED_EXP.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-12-31',
      debit: 0,
      credit: 39375,
      netChange: -39375,
      amount: -39375,
      currency: 'USD',
      description: 'Accrued income taxes',
      reference: 'JE-2024-019',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
    {
      id: `${batch4Id}-014`,
      accountId: SYNTHETIC_COA.CASH.account,
      accountCode: SYNTHETIC_COA.CASH.account,
      accountName: SYNTHETIC_COA.CASH.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-12-31',
      debit: 300000,
      credit: 0,
      netChange: 300000,
      amount: 300000,
      currency: 'USD',
      description: 'Customer receivables collections',
      reference: 'JE-2024-020',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
    {
      id: `${batch4Id}-015`,
      accountId: SYNTHETIC_COA.AR.account,
      accountCode: SYNTHETIC_COA.AR.account,
      accountName: SYNTHETIC_COA.AR.accountName,
      period: '2024-Q4',
      periodName: 'Q4 2024',
      date: '2024-12-31',
      debit: 0,
      credit: 300000,
      netChange: -300000,
      amount: -300000,
      currency: 'USD',
      description: 'Credit AR upon customer receipt',
      reference: 'JE-2024-020',
      entityId,
      journalId: batch4Id,
      source: 'manual',
    },
  ];

  const allBatches: SyntheticBatchInfo[] = [
    {
      id: batch1Id,
      batchNumber: 'B-2024-01',
      period: '2024-Q1',
      status: 'posted',
      entriesCount: batch1Entries.length,
      totalDebit: sumMoney(batch1Entries.map((e) => e.debit)).toNumber(),
      totalCredit: sumMoney(batch1Entries.map((e) => e.credit)).toNumber(),
      description: 'Capitalization & initial investments',
      createdAt: '2024-03-31T23:59:59.000Z',
    },
    {
      id: batch2Id,
      batchNumber: 'B-2024-02',
      period: '2024-Q2',
      status: 'posted',
      entriesCount: batch2Entries.length,
      totalDebit: sumMoney(batch2Entries.map((e) => e.debit)).toNumber(),
      totalCredit: sumMoney(batch2Entries.map((e) => e.credit)).toNumber(),
      description: 'Q2 Operational earnings and production',
      createdAt: '2024-06-30T23:59:59.000Z',
    },
    {
      id: batch3Id,
      batchNumber: 'B-2024-03',
      period: '2024-Q3',
      status: 'posted',
      entriesCount: batch3Entries.length,
      totalDebit: sumMoney(batch3Entries.map((e) => e.debit)).toNumber(),
      totalCredit: sumMoney(batch3Entries.map((e) => e.credit)).toNumber(),
      description: 'Q3 AR Collections, paydown and debt issuance',
      createdAt: '2024-09-30T23:59:59.000Z',
    },
    {
      id: batch4Id,
      batchNumber: 'B-2024-04',
      period: '2024-Q4',
      status: 'posted',
      entriesCount: batch4Entries.length,
      totalDebit: sumMoney(batch4Entries.map((e) => e.debit)).toNumber(),
      totalCredit: sumMoney(batch4Entries.map((e) => e.credit)).toNumber(),
      description: 'Q4 operations and year-end closing entries',
      createdAt: '2024-12-31T23:59:59.000Z',
    },
  ];

  const allEntries = [...batch1Entries, ...batch2Entries, ...batch3Entries, ...batch4Entries];

  // Helper to compute balances by account
  const calculateAccountBalance = (entries: GLEntry[], accountCode: string): number => {
    return sumMoney(
      entries
        .filter((e) => e.accountCode === accountCode)
        .map((e) => subtractMoney(e.debit, e.credit))
    ).toNumber();
  };

  // Helper to calculate P&L Net Income (Revenue - Expenses)
  // Normal balances: Revenue is credit, Expenses are debit.
  // Net Income = Sum(Credits for 4000) - Sum(Debits for 5000, 6000, 6500, 7000, 8000)
  const calculatePeriodNetIncome = (entries: GLEntry[]): number => {
    const rev = sumMoney(entries.filter((e) => e.accountCode === '4000').map((e) => e.credit));
    const cogs = sumMoney(entries.filter((e) => e.accountCode === '5000').map((e) => e.debit));
    const sga = sumMoney(entries.filter((e) => e.accountCode === '6000').map((e) => e.debit));
    const dep = sumMoney(entries.filter((e) => e.accountCode === '6500').map((e) => e.debit));
    const intExp = sumMoney(entries.filter((e) => e.accountCode === '7000').map((e) => e.debit));
    const tax = sumMoney(entries.filter((e) => e.accountCode === '8000').map((e) => e.debit));

    const totalExp = sumMoney([cogs, sga, dep, intExp, tax]);
    return subtractMoney(rev, totalExp).toNumber();
  };

  // Build period summaries
  const periodBatches = [
    { period: '2024-Q1', batchId: batch1Id, entries: batch1Entries },
    { period: '2024-Q2', batchId: batch2Id, entries: batch2Entries },
    { period: '2024-Q3', batchId: batch3Id, entries: batch3Entries },
    { period: '2024-Q4', batchId: batch4Id, entries: batch4Entries },
  ];

  const periodSummaries: Record<string, SyntheticPeriodControlTotals> = {};
  let cumulativeEntries: GLEntry[] = [];

  for (const pb of periodBatches) {
    cumulativeEntries = [...cumulativeEntries, ...pb.entries];
    const debits = sumMoney(pb.entries.map((e) => e.debit)).toNumber();
    const credits = sumMoney(pb.entries.map((e) => e.credit)).toNumber();

    // Cumulative balance sheet items
    const cash = calculateAccountBalance(cumulativeEntries, SYNTHETIC_COA.CASH.account);
    const ar = calculateAccountBalance(cumulativeEntries, SYNTHETIC_COA.AR.account);
    const inv = calculateAccountBalance(cumulativeEntries, SYNTHETIC_COA.INVENTORY.account);
    const grossPpe = calculateAccountBalance(cumulativeEntries, SYNTHETIC_COA.GROSS_PPE.account);
    // accDep has normal credit balance, so subtract debit - credit gives negative, or credit - debit gives positive
    const accDep = sumMoney(
      cumulativeEntries
        .filter((e) => e.accountCode === SYNTHETIC_COA.ACC_DEP.account)
        .map((e) => subtractMoney(e.credit, e.debit))
    ).toNumber();

    const totalAssets = addMoney(
      cash,
      addMoney(ar, addMoney(inv, subtractMoney(grossPpe, accDep)))
    ).toNumber();

    const ap = sumMoney(
      cumulativeEntries
        .filter((e) => e.accountCode === SYNTHETIC_COA.AP.account)
        .map((e) => subtractMoney(e.credit, e.debit))
    ).toNumber();
    const accrued = sumMoney(
      cumulativeEntries
        .filter((e) => e.accountCode === SYNTHETIC_COA.ACCRUED_EXP.account)
        .map((e) => subtractMoney(e.credit, e.debit))
    ).toNumber();
    const ltDebt = sumMoney(
      cumulativeEntries
        .filter((e) => e.accountCode === SYNTHETIC_COA.LT_DEBT.account)
        .map((e) => subtractMoney(e.credit, e.debit))
    ).toNumber();
    const totalLiabilities = addMoney(ap, addMoney(accrued, ltDebt)).toNumber();

    const commonStock = sumMoney(
      cumulativeEntries
        .filter((e) => e.accountCode === SYNTHETIC_COA.COMMON_STOCK.account)
        .map((e) => subtractMoney(e.credit, e.debit))
    ).toNumber();

    // Retained earnings equals cumulative Net Income from inception
    const cumulativeNetIncome = calculatePeriodNetIncome(cumulativeEntries);
    const retainedEarningsEnding = cumulativeNetIncome;
    const totalEquity = addMoney(commonStock, retainedEarningsEnding).toNumber();

    const totalLiabilitiesAndEquity = addMoney(totalLiabilities, totalEquity).toNumber();

    periodSummaries[pb.period] = {
      period: pb.period,
      batchId: pb.batchId,
      totalDebits: debits,
      totalCredits: credits,
      netDebitCreditDiff: subtractMoney(debits, credits).toNumber(),
      pnlNetIncome: calculatePeriodNetIncome(pb.entries),
      retainedEarningsEnding,
      balanceSheetTotalAssets: totalAssets,
      balanceSheetTotalLiabilitiesAndEquity: totalLiabilitiesAndEquity,
      cashEnding: cash,
    };
  }

  const grandDebits = sumMoney(allEntries.map((e) => e.debit)).toNumber();
  const grandCredits = sumMoney(allEntries.map((e) => e.credit)).toNumber();

  return {
    entityId,
    periods: ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'],
    batches: allBatches,
    entries: allEntries,
    periodSummaries,
    cumulativeControlTotals: {
      totalDebits: grandDebits,
      totalCredits: grandCredits,
      netBalance: subtractMoney(grandDebits, grandCredits).toNumber(),
      entryCount: allEntries.length,
      batchCount: allBatches.length,
    },
  };
}
