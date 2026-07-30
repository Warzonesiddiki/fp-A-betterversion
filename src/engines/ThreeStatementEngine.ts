// =============================================================================
// THREE-STATEMENT ENGINE — Auto-link P&L, Balance Sheet, Cash Flow
// "If the three statements don't balance, the model is fiction."
// Pure TypeScript, deterministic, testable
//
// MONEY PRIMITIVE: All financial amounts use decimal.js via @/utils/money.
// IEEE-754 float arithmetic is NOT used for financial truth.
// Number inputs are treated as DECIMAL LITERALS via their shortest round-trip
// string form. Rounding mode: ROUND_HALF_UP for currency.
// =============================================================================

import Decimal from 'decimal.js';
import { toDecimal, roundMoney, sumMoney, DEFAULT_CURRENCY_PLACES } from '@/utils/money';

// --- Type Definitions ---

export type StatementType = 'income' | 'balance_sheet' | 'cash_flow';

export interface AccountEntry {
  readonly accountCode: string;
  readonly accountName: string;
  readonly amount: number;
  readonly category: AccountCategory;
  readonly subcategory?: string;
}

export type AccountCategory =
  | 'revenue'
  | 'cogs'
  | 'opex'
  | 'depreciation'
  | 'amortization'
  | 'interest'
  | 'tax'
  | 'other_income'
  | 'other_expense'
  | 'current_asset'
  | 'non_current_asset'
  | 'current_liability'
  | 'non_current_liability'
  | 'equity'
  | 'retained_earnings'
  | 'capex'
  | 'working_capital';

export interface IncomeStatementData {
  readonly revenue: AccountEntry[];
  readonly cogs: AccountEntry[];
  readonly grossProfit: number;
  readonly opex: AccountEntry[];
  readonly depreciation: AccountEntry[];
  readonly amortization: AccountEntry[];
  readonly operatingIncome: number;
  readonly interestExpense: AccountEntry[];
  readonly interestIncome: AccountEntry[];
  readonly ebit: number;
  readonly taxExpense: AccountEntry[];
  readonly otherIncome: AccountEntry[];
  readonly otherExpense: AccountEntry[];
  readonly netIncome: number;
  readonly period: string;
}

export interface BalanceSheetData {
  readonly currentAssets: AccountEntry[];
  readonly cash: number;
  readonly accountsReceivable: number;
  readonly inventory: number;
  readonly prepaidExpenses: number;
  readonly otherCurrentAssets: number;
  readonly totalCurrentAssets: number;
  readonly nonCurrentAssets: AccountEntry[];
  readonly propertyPlantEquipment: number;
  readonly accumulatedDepreciation: number;
  readonly netFixedAssets: number;
  readonly intangibleAssets: number;
  readonly goodwill: number;
  readonly otherNonCurrentAssets: number;
  readonly totalNonCurrentAssets: number;
  readonly totalAssets: number;
  readonly currentLiabilities: AccountEntry[];
  readonly accountsPayable: number;
  readonly accruedExpenses: number;
  readonly shortTermDebt: number;
  readonly currentPortionLongTermDebt: number;
  readonly otherCurrentLiabilities: number;
  readonly totalCurrentLiabilities: number;
  readonly nonCurrentLiabilities: AccountEntry[];
  readonly longTermDebt: number;
  readonly deferredTaxLiability: number;
  readonly otherNonCurrentLiabilities: number;
  readonly totalNonCurrentLiabilities: number;
  readonly totalLiabilities: number;
  readonly equity: AccountEntry[];
  readonly commonStock: number;
  readonly additionalPaidInCapital: number;
  readonly retainedEarnings: number;
  readonly accumulatedOtherComprehensiveIncome: number;
  readonly treasuryStock: number;
  readonly totalEquity: number;
  readonly totalLiabilitiesAndEquity: number;
  readonly period: string;
}

export interface CashFlowData {
  readonly operatingActivities: CashFlowLineItem[];
  readonly netCashFromOperations: number;
  readonly investingActivities: CashFlowLineItem[];
  readonly netCashFromInvesting: number;
  readonly financingActivities: CashFlowLineItem[];
  readonly netCashFromFinancing: number;
  readonly netChangeInCash: number;
  readonly beginningCash: number;
  readonly endingCash: number;
  readonly period: string;
}

export interface CashFlowLineItem {
  readonly accountCode: string;
  readonly accountName: string;
  readonly amount: number;
  readonly description?: string;
}

export interface LinkedAccount {
  readonly accountCode: string;
  readonly accountName: string;
  readonly plAmount: number;
  readonly bsAmount: number;
  readonly cfAmount: number;
  readonly linkType: LinkType;
  readonly isLinked: boolean;
  readonly discrepancy: number;
}

export type LinkType =
  | 'net_income_to_retained_earnings'
  | 'depreciation_to_accumulated_depreciation'
  | 'capex_to_fixed_assets'
  | 'working_capital_to_operations'
  | 'debt_to_financing'
  | 'equity_to_financing'
  | 'interest_to_operations'
  | 'tax_to_operations'
  | 'dividends_to_retained_earnings'
  | 'amortization_to_intangibles'
  | 'unlinked';

export interface Discrepancy {
  readonly linkType: LinkType;
  readonly description: string;
  readonly plAmount: number;
  readonly bsAmount: number;
  readonly cfAmount: number;
  readonly discrepancy: number;
  readonly severity: 'warning' | 'error';
}

export interface BalanceCheck {
  readonly isBalanced: boolean;
  readonly totalAssets: number;
  readonly totalLiabilities: number;
  readonly totalEquity: number;
  readonly totalLiabilitiesAndEquity: number;
  readonly imbalance: number;
  readonly tolerance: number;
}

export interface ThreeStatementResult {
  readonly linkedAccounts: LinkedAccount[];
  readonly discrepancies: Discrepancy[];
  readonly balanceCheck: BalanceCheck;
  readonly retainedEarningsFromPL: number;
  readonly netIncome: number;
  readonly beginningRetainedEarnings: number;
  readonly dividendsDeclared: number;
  readonly endingRetainedEarnings: number;
  readonly cashFromOperations: number;
  readonly cashFromInvesting: number;
  readonly cashFromFinancing: number;
  readonly netChangeInCash: number;
  readonly isValid: boolean;
  readonly validationErrors: string[];
}

export interface DividendEntry {
  readonly accountCode: string;
  readonly accountName: string;
  readonly amount: number;
}

// =============================================================================
// ACCOUNT CODE MAPPING — Standard Chart of Accounts
// =============================================================================

const ACCOUNT_CODE_MAP: Record<string, { category: AccountCategory; statement: StatementType }> = {
  // Revenue (P&L)
  '4000': { category: 'revenue', statement: 'income' },
  '4100': { category: 'revenue', statement: 'income' },
  '4200': { category: 'revenue', statement: 'income' },
  '4300': { category: 'revenue', statement: 'income' },
  '4400': { category: 'revenue', statement: 'income' },
  '4500': { category: 'revenue', statement: 'income' },
  '4900': { category: 'other_income', statement: 'income' },

  // COGS (P&L)
  '5000': { category: 'cogs', statement: 'income' },
  '5100': { category: 'cogs', statement: 'income' },
  '5200': { category: 'cogs', statement: 'income' },
  '5300': { category: 'cogs', statement: 'income' },

  // Operating Expenses (P&L)
  '6000': { category: 'opex', statement: 'income' },
  '6100': { category: 'opex', statement: 'income' },
  '6200': { category: 'opex', statement: 'income' },
  '6300': { category: 'opex', statement: 'income' },
  '6400': { category: 'opex', statement: 'income' },
  '6500': { category: 'opex', statement: 'income' },
  '6600': { category: 'opex', statement: 'income' },
  '6700': { category: 'opex', statement: 'income' },
  '6800': { category: 'opex', statement: 'income' },
  '6900': { category: 'opex', statement: 'income' },

  // Depreciation & Amortization (P&L)
  '6810': { category: 'depreciation', statement: 'income' },
  '6820': { category: 'amortization', statement: 'income' },

  // Interest (P&L)
  '7000': { category: 'interest', statement: 'income' },
  '7100': { category: 'interest', statement: 'income' },

  // Tax (P&L)
  '8000': { category: 'tax', statement: 'income' },
  '8100': { category: 'tax', statement: 'income' },

  // Current Assets (BS)
  '1000': { category: 'current_asset', statement: 'balance_sheet' },
  '1010': { category: 'current_asset', statement: 'balance_sheet' },
  '1100': { category: 'current_asset', statement: 'balance_sheet' },
  '1200': { category: 'current_asset', statement: 'balance_sheet' },
  '1300': { category: 'current_asset', statement: 'balance_sheet' },
  '1400': { category: 'current_asset', statement: 'balance_sheet' },
  '1500': { category: 'current_asset', statement: 'balance_sheet' },

  // Non-Current Assets (BS)
  '1600': { category: 'non_current_asset', statement: 'balance_sheet' },
  '1610': { category: 'non_current_asset', statement: 'balance_sheet' },
  '1620': { category: 'non_current_asset', statement: 'balance_sheet' },
  '1700': { category: 'non_current_asset', statement: 'balance_sheet' },
  '1800': { category: 'non_current_asset', statement: 'balance_sheet' },
  '1900': { category: 'non_current_asset', statement: 'balance_sheet' },

  // Current Liabilities (BS)
  '2000': { category: 'current_liability', statement: 'balance_sheet' },
  '2100': { category: 'current_liability', statement: 'balance_sheet' },
  '2200': { category: 'current_liability', statement: 'balance_sheet' },
  '2300': { category: 'current_liability', statement: 'balance_sheet' },
  '2400': { category: 'current_liability', statement: 'balance_sheet' },

  // Non-Current Liabilities (BS)
  '2500': { category: 'non_current_liability', statement: 'balance_sheet' },
  '2600': { category: 'non_current_liability', statement: 'balance_sheet' },
  '2700': { category: 'non_current_liability', statement: 'balance_sheet' },

  // Equity (BS)
  '3000': { category: 'equity', statement: 'balance_sheet' },
  '3100': { category: 'equity', statement: 'balance_sheet' },
  '3200': { category: 'equity', statement: 'balance_sheet' },
  '3300': { category: 'retained_earnings', statement: 'balance_sheet' },
  '3400': { category: 'equity', statement: 'balance_sheet' },
  '3500': { category: 'equity', statement: 'balance_sheet' },
};

// =============================================================================
// INTERNAL HELPERS — Decimal-based financial arithmetic
// =============================================================================

/** Sum AccountEntry amounts using Decimal for precision. */
function sumEntries(entries: readonly AccountEntry[]): Decimal {
  return sumMoney(entries.map((e) => e.amount));
}

/** Sum CashFlowLineItem amounts using Decimal for precision. */
function sumCashFlowItems(items: readonly CashFlowLineItem[]): Decimal {
  return sumMoney(items.map((i) => i.amount));
}

/** Sum DividendEntry amounts using Decimal for precision. */
function sumDividends(dividends: readonly DividendEntry[]): Decimal {
  return sumMoney(dividends.map((d) => d.amount));
}

/** Convert Decimal to a display string with 2 decimal places. */
function fmt(value: Decimal | number): string {
  return roundMoney(value, DEFAULT_CURRENCY_PLACES).toFixed(DEFAULT_CURRENCY_PLACES);
}

/** Check if a Decimal is within tolerance of zero. */
function isWithinTolerance(value: Decimal): boolean {
  return value.abs().lte(new Decimal('0.01'));
}

/** Absolute value of a Decimal. */
function absDecimal(value: Decimal): Decimal {
  return value.abs();
}

// =============================================================================
// THREE-STATEMENT ENGINE
// =============================================================================

export class ThreeStatementEngine {
  private static readonly BALANCE_TOLERANCE_DECIMAL = new Decimal('0.01');

  /**
   * Main entry point — link P&L, Balance Sheet, and Cash Flow statements
   */
  static link(
    incomeStatement: IncomeStatementData,
    balanceSheet: BalanceSheetData,
    cashFlow: CashFlowData,
    dividends: DividendEntry[] = [],
    beginningRetainedEarnings: number = 0
  ): ThreeStatementResult {
    // Input validation
    this.validateInputs(incomeStatement, balanceSheet, cashFlow);

    const linkedAccounts: LinkedAccount[] = [];
    const discrepancies: Discrepancy[] = [];
    const validationErrors: string[] = [];

    // --- Link 1: Net Income → Retained Earnings ---
    const netIncomeLink = this.linkNetIncomeToRetainedEarnings(
      incomeStatement,
      balanceSheet,
      beginningRetainedEarnings,
      dividends
    );
    linkedAccounts.push(netIncomeLink.linkedAccount);
    if (netIncomeLink.discrepancy) {
      discrepancies.push(netIncomeLink.discrepancy);
    }

    // --- Link 2: Depreciation → Accumulated Depreciation → CF Operating ---
    const depreciationLink = this.linkDepreciation(incomeStatement, balanceSheet, cashFlow);
    linkedAccounts.push(depreciationLink.linkedAccount);
    if (depreciationLink.discrepancy) {
      discrepancies.push(depreciationLink.discrepancy);
    }

    // --- Link 3: Amortization → Intangible Assets → CF Operating ---
    const amortizationLink = this.linkAmortization(incomeStatement, balanceSheet, cashFlow);
    linkedAccounts.push(amortizationLink.linkedAccount);
    if (amortizationLink.discrepancy) {
      discrepancies.push(amortizationLink.discrepancy);
    }

    // --- Link 4: CapEx → Fixed Assets ---
    const capexLink = this.linkCapEx(balanceSheet, cashFlow);
    linkedAccounts.push(capexLink.linkedAccount);
    if (capexLink.discrepancy) {
      discrepancies.push(capexLink.discrepancy);
    }

    // --- Link 5: Working Capital → CF Operating ---
    const workingCapitalLinks = this.linkWorkingCapital(balanceSheet, cashFlow);
    linkedAccounts.push(...workingCapitalLinks.linkedAccounts);
    discrepancies.push(...workingCapitalLinks.discrepancies);

    // --- Link 6: Debt → CF Financing ---
    const debtLink = this.linkDebt(balanceSheet, cashFlow);
    linkedAccounts.push(debtLink.linkedAccount);
    if (debtLink.discrepancy) {
      discrepancies.push(debtLink.discrepancy);
    }

    // --- Link 7: Equity → CF Financing ---
    const equityLink = this.linkEquity(balanceSheet, cashFlow);
    linkedAccounts.push(equityLink.linkedAccount);
    if (equityLink.discrepancy) {
      discrepancies.push(equityLink.discrepancy);
    }

    // --- Link 8: Interest → CF Operating ---
    const interestLink = this.linkInterest(incomeStatement, cashFlow);
    linkedAccounts.push(interestLink.linkedAccount);
    if (interestLink.discrepancy) {
      discrepancies.push(interestLink.discrepancy);
    }

    // --- Link 9: Tax → CF Operating ---
    const taxLink = this.linkTax(incomeStatement, cashFlow);
    linkedAccounts.push(taxLink.linkedAccount);
    if (taxLink.discrepancy) {
      discrepancies.push(taxLink.discrepancy);
    }

    // --- Link 10: Dividends → Retained Earnings ---
    const dividendLink = this.linkDividends(
      dividends,
      balanceSheet,
      cashFlow,
      beginningRetainedEarnings,
      incomeStatement.netIncome
    );
    if (dividendLink.linkedAccount) {
      linkedAccounts.push(dividendLink.linkedAccount);
    }
    if (dividendLink.discrepancy) {
      discrepancies.push(dividendLink.discrepancy);
    }

    // --- Balance Check: Assets = Liabilities + Equity ---
    const balanceCheck = this.verifyBalance(balanceSheet);

    // --- Validate Cash Flow Consistency ---
    const cashFlowValidation = this.validateCashFlowConsistency(cashFlow);
    validationErrors.push(...cashFlowValidation.errors);

    // --- Calculate Retained Earnings Roll-Forward (Decimal) ---
    const totalDividendsDecimal = sumDividends(dividends);
    const beginningRE = toDecimal(beginningRetainedEarnings, 'beginningRetainedEarnings');
    const netIncomeDecimal = toDecimal(incomeStatement.netIncome, 'netIncome');
    const endingRetainedEarningsDecimal = beginningRE
      .plus(netIncomeDecimal)
      .minus(totalDividendsDecimal);

    // --- Validate Balance Sheet Balance ---
    if (!balanceCheck.isBalanced) {
      validationErrors.push(
        `Balance sheet does not balance. Assets (${fmt(toDecimal(balanceCheck.totalAssets))}) ≠ Liabilities + Equity (${fmt(toDecimal(balanceCheck.totalLiabilitiesAndEquity))}). Imbalance: ${fmt(toDecimal(balanceCheck.imbalance))}`
      );
    }

    // --- Validate Cash Flow Ending Cash = BS Cash (Decimal) ---
    const cashDiscrepancy = toDecimal(cashFlow.endingCash, 'endingCash').minus(
      toDecimal(balanceSheet.cash, 'cash')
    );
    if (!isWithinTolerance(cashDiscrepancy)) {
      validationErrors.push(
        `Cash flow ending cash (${fmt(toDecimal(cashFlow.endingCash))}) does not match balance sheet cash (${fmt(toDecimal(balanceSheet.cash))}). Discrepancy: ${fmt(cashDiscrepancy)}`
      );
    }

    return {
      linkedAccounts,
      discrepancies,
      balanceCheck,
      retainedEarningsFromPL: incomeStatement.netIncome,
      netIncome: incomeStatement.netIncome,
      beginningRetainedEarnings,
      dividendsDeclared: totalDividendsDecimal.toNumber(),
      endingRetainedEarnings: endingRetainedEarningsDecimal.toNumber(),
      cashFromOperations: cashFlow.netCashFromOperations,
      cashFromInvesting: cashFlow.netCashFromInvesting,
      cashFromFinancing: cashFlow.netCashFromFinancing,
      netChangeInCash: cashFlow.netChangeInCash,
      isValid:
        validationErrors.length === 0 &&
        discrepancies.filter((d) => d.severity === 'error').length === 0,
      validationErrors,
    };
  }

  // =============================================================================
  // LINK IMPLEMENTATIONS
  // =============================================================================

  /**
   * Link 1: Net Income → Retained Earnings
   * P&L net income flows into BS retained earnings
   * Uses Decimal arithmetic for financial truth.
   */
  private static linkNetIncomeToRetainedEarnings(
    income: IncomeStatementData,
    bs: BalanceSheetData,
    beginningRE: number,
    dividends: DividendEntry[]
  ): { linkedAccount: LinkedAccount; discrepancy: Discrepancy | null } {
    const totalDividendsDecimal = sumDividends(dividends);
    const beginningREDecimal = toDecimal(beginningRE, 'beginningRE');
    const netIncomeDecimal = toDecimal(income.netIncome, 'netIncome');
    const bsRetainedEarnings = toDecimal(bs.retainedEarnings, 'retainedEarnings');

    const expectedEndingRE = beginningREDecimal.plus(netIncomeDecimal).minus(totalDividendsDecimal);
    const discrepancy = bsRetainedEarnings.minus(expectedEndingRE);

    const linkedAccount: LinkedAccount = {
      accountCode: '3300',
      accountName: 'Retained Earnings',
      plAmount: income.netIncome,
      bsAmount: bs.retainedEarnings,
      cfAmount: 0,
      linkType: 'net_income_to_retained_earnings',
      isLinked: isWithinTolerance(discrepancy),
      discrepancy: discrepancy.toNumber(),
    };

    const discrepancyEntry: Discrepancy | null = !isWithinTolerance(discrepancy)
      ? {
          linkType: 'net_income_to_retained_earnings',
          description: `Retained Earnings mismatch: Expected ${fmt(expectedEndingRE)} (Beg RE ${fmt(beginningREDecimal)} + Net Income ${fmt(netIncomeDecimal)} - Dividends ${fmt(totalDividendsDecimal)}), Actual ${fmt(bsRetainedEarnings)}`,
          plAmount: income.netIncome,
          bsAmount: bs.retainedEarnings,
          cfAmount: 0,
          discrepancy: discrepancy.toNumber(),
          severity: absDecimal(discrepancy).greaterThan(1) ? 'error' : 'warning',
        }
      : null;

    return { linkedAccount, discrepancy: discrepancyEntry };
  }

  /**
   * Link 2: Depreciation → Accumulated Depreciation → CF Operating
   * Uses Decimal arithmetic for financial truth.
   */
  private static linkDepreciation(
    income: IncomeStatementData,
    bs: BalanceSheetData,
    cf: CashFlowData
  ): { linkedAccount: LinkedAccount; discrepancy: Discrepancy | null } {
    const plDepreciation = sumEntries(income.depreciation);

    // Find depreciation in CF operating activities (should be a positive add-back)
    const cfDepreciation = sumCashFlowItems(
      cf.operatingActivities.filter(
        (item) =>
          item.accountName.toLowerCase().includes('depreciation') || item.accountCode === '6810'
      )
    );

    const _bsAccumDepreciation = toDecimal(bs.accumulatedDepreciation, 'accumulatedDepreciation');
    const cfPlDiff = cfDepreciation.minus(plDepreciation);

    const linkedAccount: LinkedAccount = {
      accountCode: '6810',
      accountName: 'Depreciation',
      plAmount: plDepreciation.toNumber(),
      bsAmount: bs.accumulatedDepreciation,
      cfAmount: cfDepreciation.toNumber(),
      linkType: 'depreciation_to_accumulated_depreciation',
      isLinked: isWithinTolerance(cfPlDiff),
      discrepancy: cfPlDiff.toNumber(),
    };

    const discrepancy: Discrepancy | null = !isWithinTolerance(cfPlDiff)
      ? {
          linkType: 'depreciation_to_accumulated_depreciation',
          description: `Depreciation mismatch: P&L ${fmt(plDepreciation)}, CF Operating ${fmt(cfDepreciation)}`,
          plAmount: plDepreciation.toNumber(),
          bsAmount: bs.accumulatedDepreciation,
          cfAmount: cfDepreciation.toNumber(),
          discrepancy: cfPlDiff.toNumber(),
          severity: 'warning',
        }
      : null;

    return { linkedAccount, discrepancy };
  }

  /**
   * Link 3: Amortization → Intangible Assets → CF Operating
   * Uses Decimal arithmetic for financial truth.
   */
  private static linkAmortization(
    income: IncomeStatementData,
    bs: BalanceSheetData,
    cf: CashFlowData
  ): { linkedAccount: LinkedAccount; discrepancy: Discrepancy | null } {
    const plAmortization = sumEntries(income.amortization);

    const cfAmortization = sumCashFlowItems(
      cf.operatingActivities.filter(
        (item) =>
          item.accountName.toLowerCase().includes('amortization') || item.accountCode === '6820'
      )
    );

    const cfPlDiff = cfAmortization.minus(plAmortization);

    const linkedAccount: LinkedAccount = {
      accountCode: '6820',
      accountName: 'Amortization',
      plAmount: plAmortization.toNumber(),
      bsAmount: bs.intangibleAssets,
      cfAmount: cfAmortization.toNumber(),
      linkType: 'amortization_to_intangibles',
      isLinked: isWithinTolerance(cfPlDiff),
      discrepancy: cfPlDiff.toNumber(),
    };

    const discrepancy: Discrepancy | null = !isWithinTolerance(cfPlDiff)
      ? {
          linkType: 'amortization_to_intangibles',
          description: `Amortization mismatch: P&L ${fmt(plAmortization)}, CF Operating ${fmt(cfAmortization)}`,
          plAmount: plAmortization.toNumber(),
          bsAmount: bs.intangibleAssets,
          cfAmount: cfAmortization.toNumber(),
          discrepancy: cfPlDiff.toNumber(),
          severity: 'warning',
        }
      : null;

    return { linkedAccount, discrepancy };
  }

  /**
   * Link 4: CapEx → Fixed Assets
   * CF Investing capex → BS gross PP&E increase
   */
  private static linkCapEx(
    bs: BalanceSheetData,
    cf: CashFlowData
  ): { linkedAccount: LinkedAccount; discrepancy: Discrepancy | null } {
    // CapEx appears as negative in CF Investing (cash outflow)
    const cfCapEx = sumCashFlowItems(
      cf.investingActivities.filter(
        (item) =>
          item.accountName.toLowerCase().includes('capital expenditure') ||
          item.accountName.toLowerCase().includes('capex') ||
          item.accountName.toLowerCase().includes('purchase of') ||
          item.accountCode === '1600'
      )
    );

    const _bsGrossPPAndE = toDecimal(bs.propertyPlantEquipment, 'propertyPlantEquipment');

    const linkedAccount: LinkedAccount = {
      accountCode: '1600',
      accountName: 'Capital Expenditures',
      plAmount: 0,
      bsAmount: bs.propertyPlantEquipment,
      cfAmount: cfCapEx.toNumber(),
      linkType: 'capex_to_fixed_assets',
      isLinked: true, // CapEx relationship is directional, not always equal
      discrepancy: 0,
    };

    return { linkedAccount, discrepancy: null };
  }

  /**
   * Link 5: Working Capital → CF Operating
   * BS working capital changes → CF Operating adjustments
   */
  private static linkWorkingCapital(
    bs: BalanceSheetData,
    cf: CashFlowData
  ): { linkedAccounts: LinkedAccount[]; discrepancies: Discrepancy[] } {
    const linkedAccounts: LinkedAccount[] = [];
    const discrepancies: Discrepancy[] = [];

    // Accounts Receivable change
    const arLink = this.linkWorkingCapitalItem(
      '1100',
      'Accounts Receivable',
      bs.accountsReceivable,
      cf.operatingActivities,
      'accounts receivable',
      'working_capital_to_operations'
    );
    linkedAccounts.push(arLink.linkedAccount);
    if (arLink.discrepancy) discrepancies.push(arLink.discrepancy);

    // Inventory change
    const invLink = this.linkWorkingCapitalItem(
      '1200',
      'Inventory',
      bs.inventory,
      cf.operatingActivities,
      'inventory',
      'working_capital_to_operations'
    );
    linkedAccounts.push(invLink.linkedAccount);
    if (invLink.discrepancy) discrepancies.push(invLink.discrepancy);

    // Accounts Payable change
    const apLink = this.linkWorkingCapitalItem(
      '2100',
      'Accounts Payable',
      bs.accountsPayable,
      cf.operatingActivities,
      'accounts payable',
      'working_capital_to_operations'
    );
    linkedAccounts.push(apLink.linkedAccount);
    if (apLink.discrepancy) discrepancies.push(apLink.discrepancy);

    // Accrued Expenses change
    const accrualsLink = this.linkWorkingCapitalItem(
      '2200',
      'Accrued Expenses',
      bs.accruedExpenses,
      cf.operatingActivities,
      'accrued',
      'working_capital_to_operations'
    );
    linkedAccounts.push(accrualsLink.linkedAccount);
    if (accrualsLink.discrepancy) discrepancies.push(accrualsLink.discrepancy);

    return { linkedAccounts, discrepancies };
  }

  private static linkWorkingCapitalItem(
    accountCode: string,
    accountName: string,
    bsAmount: number,
    cfOperatingItems: CashFlowLineItem[],
    searchKeyword: string,
    linkType: LinkType
  ): { linkedAccount: LinkedAccount; discrepancy: Discrepancy | null } {
    const cfItem = cfOperatingItems.find(
      (item) =>
        item.accountName.toLowerCase().includes(searchKeyword) || item.accountCode === accountCode
    );
    const cfAmount = cfItem?.amount ?? 0;

    const linkedAccount: LinkedAccount = {
      accountCode,
      accountName,
      plAmount: 0,
      bsAmount,
      cfAmount,
      linkType,
      isLinked: cfItem !== undefined,
      discrepancy: 0,
    };

    return { linkedAccount, discrepancy: null };
  }

  /**
   * Link 6: Debt → CF Financing
   * CF Financing debt proceeds/payments → BS debt balances
   * Uses Decimal arithmetic for debt totals.
   */
  private static linkDebt(
    bs: BalanceSheetData,
    cf: CashFlowData
  ): { linkedAccount: LinkedAccount; discrepancy: Discrepancy | null } {
    const cfDebtItems = cf.financingActivities.filter(
      (item) =>
        item.accountName.toLowerCase().includes('debt') ||
        item.accountName.toLowerCase().includes('borrow') ||
        item.accountName.toLowerCase().includes('repay') ||
        item.accountName.toLowerCase().includes('loan') ||
        item.accountName.toLowerCase().includes('note')
    );
    const cfDebtTotal = sumCashFlowItems(cfDebtItems);

    const bsTotalDebt = toDecimal(bs.shortTermDebt, 'shortTermDebt')
      .plus(toDecimal(bs.longTermDebt, 'longTermDebt'))
      .plus(toDecimal(bs.currentPortionLongTermDebt, 'currentPortionLongTermDebt'));

    const linkedAccount: LinkedAccount = {
      accountCode: '2500',
      accountName: 'Long-term Debt',
      plAmount: 0,
      bsAmount: bsTotalDebt.toNumber(),
      cfAmount: cfDebtTotal.toNumber(),
      linkType: 'debt_to_financing',
      isLinked: cfDebtItems.length > 0,
      discrepancy: 0,
    };

    return { linkedAccount, discrepancy: null };
  }

  /**
   * Link 7: Equity → CF Financing
   * CF Financing equity transactions → BS equity accounts
   * Uses Decimal arithmetic for equity totals.
   */
  private static linkEquity(
    bs: BalanceSheetData,
    cf: CashFlowData
  ): { linkedAccount: LinkedAccount; discrepancy: Discrepancy | null } {
    const cfEquityItems = cf.financingActivities.filter(
      (item) =>
        item.accountName.toLowerCase().includes('equity') ||
        item.accountName.toLowerCase().includes('stock') ||
        item.accountName.toLowerCase().includes('share') ||
        item.accountName.toLowerCase().includes('issuance') ||
        item.accountName.toLowerCase().includes('buyback') ||
        item.accountName.toLowerCase().includes('repurchase')
    );
    const cfEquityTotal = sumCashFlowItems(cfEquityItems);

    const bsTotalEquity = toDecimal(bs.commonStock, 'commonStock')
      .plus(toDecimal(bs.additionalPaidInCapital, 'additionalPaidInCapital'))
      .minus(toDecimal(bs.treasuryStock, 'treasuryStock'));

    const linkedAccount: LinkedAccount = {
      accountCode: '3000',
      accountName: 'Equity',
      plAmount: 0,
      bsAmount: bsTotalEquity.toNumber(),
      cfAmount: cfEquityTotal.toNumber(),
      linkType: 'equity_to_financing',
      isLinked: cfEquityItems.length > 0,
      discrepancy: 0,
    };

    return { linkedAccount, discrepancy: null };
  }

  /**
   * Link 8: Interest → CF Operating
   * P&L interest expense → CF Operating
   * Uses Decimal arithmetic for interest totals.
   */
  private static linkInterest(
    income: IncomeStatementData,
    cf: CashFlowData
  ): { linkedAccount: LinkedAccount; discrepancy: Discrepancy | null } {
    const plInterest = sumEntries(income.interestExpense);
    const plInterestIncome = sumEntries(income.interestIncome);
    const netPLInterest = plInterest.minus(plInterestIncome);

    const cfInterest = sumCashFlowItems(
      cf.operatingActivities.filter(
        (item) =>
          item.accountName.toLowerCase().includes('interest') ||
          item.accountCode === '7000' ||
          item.accountCode === '7100'
      )
    );

    const linkedAccount: LinkedAccount = {
      accountCode: '7000',
      accountName: 'Interest',
      plAmount: netPLInterest.toNumber(),
      bsAmount: 0,
      cfAmount: cfInterest.toNumber(),
      linkType: 'interest_to_operations',
      isLinked: true,
      discrepancy: 0,
    };

    return { linkedAccount, discrepancy: null };
  }

  /**
   * Link 9: Tax → CF Operating
   * P&L tax expense → CF Operating tax paid
   * Uses Decimal arithmetic for tax totals.
   */
  private static linkTax(
    income: IncomeStatementData,
    cf: CashFlowData
  ): { linkedAccount: LinkedAccount; discrepancy: Discrepancy | null } {
    const plTax = sumEntries(income.taxExpense);

    const cfTax = sumCashFlowItems(
      cf.operatingActivities.filter(
        (item) =>
          item.accountName.toLowerCase().includes('tax') ||
          item.accountCode === '8000' ||
          item.accountCode === '8100'
      )
    );

    const linkedAccount: LinkedAccount = {
      accountCode: '8000',
      accountName: 'Income Tax',
      plAmount: plTax.toNumber(),
      bsAmount: 0,
      cfAmount: cfTax.toNumber(),
      linkType: 'tax_to_operations',
      isLinked: true,
      discrepancy: 0,
    };

    return { linkedAccount, discrepancy: null };
  }

  /**
   * Link 10: Dividends → Retained Earnings → CF Financing
   * Uses Decimal arithmetic for dividend totals and retained earnings.
   */
  private static linkDividends(
    dividends: DividendEntry[],
    bs: BalanceSheetData,
    cf: CashFlowData,
    beginningRE: number,
    netIncome: number
  ): { linkedAccount: LinkedAccount | null; discrepancy: Discrepancy | null } {
    if (dividends.length === 0) return { linkedAccount: null, discrepancy: null };

    const totalDividendsDecimal = sumDividends(dividends);

    const cfDividends = sumCashFlowItems(
      cf.financingActivities.filter(
        (item) =>
          item.accountName.toLowerCase().includes('dividend') ||
          item.accountName.toLowerCase().includes('distribution')
      )
    );

    const expectedEndingRE = toDecimal(beginningRE, 'beginningRE')
      .plus(toDecimal(netIncome, 'netIncome'))
      .minus(totalDividendsDecimal);
    const bsRetainedEarnings = toDecimal(bs.retainedEarnings, 'retainedEarnings');
    const reDiscrepancy = bsRetainedEarnings.minus(expectedEndingRE);

    const linkedAccount: LinkedAccount = {
      accountCode: '3300',
      accountName: 'Dividends → Retained Earnings',
      plAmount: 0,
      bsAmount: bs.retainedEarnings,
      cfAmount: cfDividends.toNumber(),
      linkType: 'dividends_to_retained_earnings',
      isLinked: isWithinTolerance(reDiscrepancy),
      discrepancy: reDiscrepancy.toNumber(),
    };

    const cfDividendDiff = cfDividends.minus(totalDividendsDecimal);
    const discrepancy: Discrepancy | null = !isWithinTolerance(cfDividendDiff)
      ? {
          linkType: 'dividends_to_retained_earnings',
          description: `Dividends mismatch: Declared ${fmt(totalDividendsDecimal)}, CF Financing ${fmt(cfDividends)}`,
          plAmount: 0,
          bsAmount: bs.retainedEarnings,
          cfAmount: cfDividends.toNumber(),
          discrepancy: cfDividendDiff.toNumber(),
          severity: 'warning',
        }
      : null;

    return { linkedAccount, discrepancy };
  }

  // =============================================================================
  // BALANCE CHECK — Decimal-based
  // =============================================================================

  /**
   * Verify Assets = Liabilities + Equity
   * Uses Decimal arithmetic for financial truth.
   */
  static verifyBalance(bs: BalanceSheetData): BalanceCheck {
    const totalAssets = toDecimal(bs.totalAssets, 'totalAssets');
    const totalLiabilities = toDecimal(bs.totalLiabilities, 'totalLiabilities');
    const totalEquity = toDecimal(bs.totalEquity, 'totalEquity');
    const totalLiabilitiesAndEquity = totalLiabilities.plus(totalEquity);
    const imbalance = totalAssets.minus(totalLiabilitiesAndEquity);

    return {
      isBalanced: isWithinTolerance(imbalance),
      totalAssets: totalAssets.toNumber(),
      totalLiabilities: totalLiabilities.toNumber(),
      totalEquity: totalEquity.toNumber(),
      totalLiabilitiesAndEquity: totalLiabilitiesAndEquity.toNumber(),
      imbalance: imbalance.toNumber(),
      tolerance: this.BALANCE_TOLERANCE_DECIMAL.toNumber(),
    };
  }

  // =============================================================================
  // CASH FLOW VALIDATION — Decimal-based
  // =============================================================================

  /**
   * Validate cash flow statement consistency
   * Uses Decimal arithmetic for financial truth.
   */
  private static validateCashFlowConsistency(cf: CashFlowData): { errors: string[] } {
    const errors: string[] = [];

    // Verify: Operating + Investing + Financing = Net Change in Cash (Decimal)
    const operating = toDecimal(cf.netCashFromOperations, 'netCashFromOperations');
    const investing = toDecimal(cf.netCashFromInvesting, 'netCashFromInvesting');
    const financing = toDecimal(cf.netCashFromFinancing, 'netCashFromFinancing');
    const calculatedNetChange = operating.plus(investing).plus(financing);
    const netChangeInCash = toDecimal(cf.netChangeInCash, 'netChangeInCash');

    const netChangeDiff = calculatedNetChange.minus(netChangeInCash);
    if (!isWithinTolerance(netChangeDiff)) {
      errors.push(
        `Cash flow sections do not sum to net change in cash. ` +
          `Operating (${fmt(operating)}) + Investing (${fmt(investing)}) + Financing (${fmt(financing)}) = ${fmt(calculatedNetChange)}, ` +
          `but Net Change = ${fmt(netChangeInCash)}`
      );
    }

    // Verify: Beginning Cash + Net Change = Ending Cash (Decimal)
    const beginningCash = toDecimal(cf.beginningCash, 'beginningCash');
    const calculatedEndingCash = beginningCash.plus(netChangeInCash);
    const endingCash = toDecimal(cf.endingCash, 'endingCash');

    const endingDiff = calculatedEndingCash.minus(endingCash);
    if (!isWithinTolerance(endingDiff)) {
      errors.push(
        `Beginning cash (${fmt(beginningCash)}) + Net change (${fmt(netChangeInCash)}) = ${fmt(calculatedEndingCash)}, but Ending cash = ${fmt(endingCash)}`
      );
    }

    return { errors };
  }

  // =============================================================================
  // INPUT VALIDATION
  // =============================================================================

  private static validateInputs(
    income: IncomeStatementData,
    bs: BalanceSheetData,
    cf: CashFlowData
  ): void {
    if (!income) throw new Error('Income statement data is required');
    if (!bs) throw new Error('Balance sheet data is required');
    if (!cf) throw new Error('Cash flow data is required');

    if (typeof income.netIncome !== 'number' || !isFinite(income.netIncome)) {
      throw new Error('Net income must be a finite number');
    }

    if (typeof bs.totalAssets !== 'number' || !isFinite(bs.totalAssets)) {
      throw new Error('Total assets must be a finite number');
    }

    if (typeof bs.totalLiabilities !== 'number' || !isFinite(bs.totalLiabilities)) {
      throw new Error('Total liabilities must be a finite number');
    }

    if (typeof bs.totalEquity !== 'number' || !isFinite(bs.totalEquity)) {
      throw new Error('Total equity must be a finite number');
    }

    if (typeof cf.netCashFromOperations !== 'number' || !isFinite(cf.netCashFromOperations)) {
      throw new Error('Net cash from operations must be a finite number');
    }

    if (typeof cf.netCashFromInvesting !== 'number' || !isFinite(cf.netCashFromInvesting)) {
      throw new Error('Net cash from investing must be a finite number');
    }

    if (typeof cf.netCashFromFinancing !== 'number' || !isFinite(cf.netCashFromFinancing)) {
      throw new Error('Net cash from financing must be a finite number');
    }
  }

  // =============================================================================
  // HELPERS
  // =============================================================================

  /**
   * Get account category from account code
   */
  static getAccountCategory(accountCode: string): AccountCategory | undefined {
    return ACCOUNT_CODE_MAP[accountCode]?.category;
  }

  /**
   * Get statement type from account code
   */
  static getStatementType(accountCode: string): StatementType | undefined {
    return ACCOUNT_CODE_MAP[accountCode]?.statement;
  }

  /**
   * Build a default empty income statement
   */
  static emptyIncomeStatement(period: string = ''): IncomeStatementData {
    return {
      revenue: [],
      cogs: [],
      grossProfit: 0,
      opex: [],
      depreciation: [],
      amortization: [],
      operatingIncome: 0,
      interestExpense: [],
      interestIncome: [],
      ebit: 0,
      taxExpense: [],
      otherIncome: [],
      otherExpense: [],
      netIncome: 0,
      period,
    };
  }

  /**
   * Build a default empty balance sheet
   */
  static emptyBalanceSheet(period: string = ''): BalanceSheetData {
    return {
      currentAssets: [],
      cash: 0,
      accountsReceivable: 0,
      inventory: 0,
      prepaidExpenses: 0,
      otherCurrentAssets: 0,
      totalCurrentAssets: 0,
      nonCurrentAssets: [],
      propertyPlantEquipment: 0,
      accumulatedDepreciation: 0,
      netFixedAssets: 0,
      intangibleAssets: 0,
      goodwill: 0,
      otherNonCurrentAssets: 0,
      totalNonCurrentAssets: 0,
      totalAssets: 0,
      currentLiabilities: [],
      accountsPayable: 0,
      accruedExpenses: 0,
      shortTermDebt: 0,
      currentPortionLongTermDebt: 0,
      otherCurrentLiabilities: 0,
      totalCurrentLiabilities: 0,
      nonCurrentLiabilities: [],
      longTermDebt: 0,
      deferredTaxLiability: 0,
      otherNonCurrentLiabilities: 0,
      totalNonCurrentLiabilities: 0,
      totalLiabilities: 0,
      equity: [],
      commonStock: 0,
      additionalPaidInCapital: 0,
      retainedEarnings: 0,
      accumulatedOtherComprehensiveIncome: 0,
      treasuryStock: 0,
      totalEquity: 0,
      totalLiabilitiesAndEquity: 0,
      period,
    };
  }

  /**
   * Build a default empty cash flow statement
   */
  static emptyCashFlow(period: string = ''): CashFlowData {
    return {
      operatingActivities: [],
      netCashFromOperations: 0,
      investingActivities: [],
      netCashFromInvesting: 0,
      financingActivities: [],
      netCashFromFinancing: 0,
      netChangeInCash: 0,
      beginningCash: 0,
      endingCash: 0,
      period,
    };
  }
}
