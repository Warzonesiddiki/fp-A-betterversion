/**
 * FR-006 / D365 standard export parser for General Ledger ingestion.
 *
 * Supports:
 * 1. Microsoft Dynamics 365 Finance & Operations (GeneralJournalAccountEntryEntity)
 * 2. Microsoft Dynamics 365 Business Central (G/L Entries)
 *
 * Enforces:
 * - Deterministic parsing & exact column mapping
 * - Date validation (ISO, US, and D365 dd-MMM-yyyy) with calendar round-trip checks
 * - Strict money integrity: missing != 0, negative debits/credits rejected, NaN rejected
 * - Non-transaction summary row detection and rejection
 * - 1-based source row lineage with machine code and descriptive reason (FR-002)
 */

import type { GLEntry, ImportRejection } from '@/types';
import { parseFinancialAmount } from '@/utils/parseFinancialAmount';
import { subtractMoney, roundTo } from '@/utils/money';
import { parseImportDate } from '@/utils/parseImportDate';

export type D365Flavor = 'd365_fo' | 'd365_bc';

export interface D365ParseOptions {
  readonly flavor?: D365Flavor;
  readonly defaultCurrency?: string;
  readonly defaultEntity?: string;
}

export interface D365ParseResult {
  readonly flavor: D365Flavor;
  readonly entries: Partial<GLEntry>[];
  readonly sourceRows: number[];
  readonly rejections: ImportRejection[];
  readonly rowErrors: string[];
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const D365_TEXT_DATE = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/;
const ISO_TIMESTAMP = /^(\d{4}-\d{2}-\d{2})[T ]/;

function validateCalendarDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function parseD365Date(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (s === '') return null;

  // 1. ISO date-time prefix (e.g. "2023-11-15T00:00:00Z" or "2023-11-15 00:00:00")
  const tsMatch = ISO_TIMESTAMP.exec(s);
  if (tsMatch) {
    return parseImportDate(tsMatch[1] ?? '');
  }

  // 2. Standard ISO YYYY-MM-DD or US M/D/YYYY
  const standard = parseImportDate(s);
  if (standard) return standard;

  // 3. D365 dd-MMM-yyyy format (e.g. "11-Nov-2023", "01-Jan-2024")
  const textMatch = D365_TEXT_DATE.exec(s);
  if (textMatch) {
    const day = Number(textMatch[1]);
    const monthStr = (textMatch[2] ?? '').toLowerCase();
    const month = MONTH_NAMES[monthStr];
    const year = Number(textMatch[3]);
    if (!month) return null;
    return validateCalendarDate(year, month, day);
  }

  return null;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function detectD365Flavor(headers: readonly string[]): D365Flavor | null {
  const normalized = new Set(headers.map(normalizeKey));

  const foMarkers = [
    'ledgeraccount',
    'accountingdate',
    'accountingcurrencydebitamount',
    'accountingcurrencycreditamount',
    'subledgervoucher',
    'generaljournalaccountentry',
    'dataareaid',
  ];

  const bcMarkers = [
    'glaccountno',
    'postingdate',
    'debitamount',
    'creditamount',
    'documentno',
    'entryno',
  ];

  const foScore = foMarkers.filter((m) => normalized.has(m)).length;
  const bcScore = bcMarkers.filter((m) => normalized.has(m)).length;

  if (foScore >= 2 && foScore >= bcScore) return 'd365_fo';
  if (bcScore >= 2) return 'd365_bc';
  return null;
}

function getFirstMatchingField(
  row: Record<string, unknown>,
  candidates: readonly string[]
): { value: unknown; found: boolean } {
  for (const candidate of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, candidate)) {
      return { value: row[candidate], found: true };
    }
  }
  const normCandidates = candidates.map(normalizeKey);
  for (const [key, value] of Object.entries(row)) {
    const nk = normalizeKey(key);
    if (normCandidates.includes(nk)) {
      return { value, found: true };
    }
  }
  return { value: undefined, found: false };
}

const FO_ACCOUNT_CANDIDATES = [
  'MainAccount',
  'MainAccountId',
  'LedgerAccount',
  'Account',
  'AccountNum',
];
const FO_ACCOUNT_NAME_CANDIDATES = ['MainAccountName', 'AccountName'];
const FO_DATE_CANDIDATES = [
  'AccountingDate',
  'TransactionDate',
  'PostingDate',
  'TRANSDATE',
  'Date',
];
const FO_VOUCHER_CANDIDATES = [
  'SubledgerVoucher',
  'Voucher',
  'GeneralJournalEntryNumber',
  'JournalNumber',
];
const FO_DESC_CANDIDATES = ['Text', 'Description', 'TransactionText'];
const FO_DEBIT_CANDIDATES = [
  'AccountingCurrencyDebitAmount',
  'TransactionCurrencyDebitAmount',
  'DebitAmount',
  'Debit',
];
const FO_CREDIT_CANDIDATES = [
  'AccountingCurrencyCreditAmount',
  'TransactionCurrencyCreditAmount',
  'CreditAmount',
  'Credit',
];
const FO_CURRENCY_CANDIDATES = ['TransactionCurrencyCode', 'AccountingCurrencyCode', 'Currency'];
const FO_ENTITY_CANDIDATES = ['DataAreaId', 'LegalEntity', 'Company'];

const BC_ACCOUNT_CANDIDATES = [
  'G/L Account No.',
  'G_L_Account_No',
  'GL Account No.',
  'GLAccountNo',
  'Account No.',
  'Account_No',
];
const BC_ACCOUNT_NAME_CANDIDATES = [
  'G/L Account Name',
  'G_L_Account_Name',
  'GL Account Name',
  'Account Name',
];
const BC_DATE_CANDIDATES = ['Posting Date', 'Posting_Date', 'PostingDate', 'Document Date', 'Date'];
const BC_VOUCHER_CANDIDATES = [
  'Document No.',
  'Document_No',
  'DocumentNo',
  'External Document No.',
  'Entry No.',
  'Entry_No',
];
const BC_DESC_CANDIDATES = ['Description'];
const BC_DEBIT_CANDIDATES = ['Debit Amount', 'Debit_Amount', 'DebitAmount', 'Debit'];
const BC_CREDIT_CANDIDATES = ['Credit Amount', 'Credit_Amount', 'CreditAmount', 'Credit'];
const BC_AMOUNT_CANDIDATES = ['Amount'];
const BC_ENTITY_CANDIDATES = ['Business Unit Code', 'Global Dimension 1 Code', 'Department Code'];

function isNonTransactionRow(accountRaw: string): boolean {
  const lower = accountRaw.toLowerCase();
  return (
    lower.startsWith('total') ||
    lower.includes('opening balance') ||
    lower.includes('closing balance') ||
    lower.includes('accumulated balance') ||
    lower.startsWith('summary')
  );
}

export function parseD365Rows(
  rows: readonly Record<string, unknown>[],
  options?: D365ParseOptions
): D365ParseResult {
  const headers = rows.length > 0 && rows[0] ? Object.keys(rows[0]) : [];
  const flavor = options?.flavor ?? detectD365Flavor(headers) ?? 'd365_fo';

  const entries: Partial<GLEntry>[] = [];
  const sourceRows: number[] = [];
  const rejections: ImportRejection[] = [];
  const rowErrors: string[] = [];

  const reject = (row: number, reason: string): void => {
    rejections.push({ row, code: 'VALIDATION', reason });
    rowErrors.push(`Row ${row}: ${reason}`);
  };

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // Row 1 is header, first data row is 2

    // 1. Resolve Account
    const accField = getFirstMatchingField(
      row,
      flavor === 'd365_fo' ? FO_ACCOUNT_CANDIDATES : BC_ACCOUNT_CANDIDATES
    );
    const rawAccount = String(accField.value ?? '').trim();
    if (!rawAccount) {
      reject(rowNum, 'missing account code');
      return;
    }

    if (isNonTransactionRow(rawAccount)) {
      reject(rowNum, `non-transaction summary or header row "${rawAccount}"`);
      return;
    }

    // In F&O, LedgerAccount often combines MainAccount-Department-CostCenter (e.g. "110110-001-023")
    let accountCode = rawAccount;
    if (flavor === 'd365_fo' && rawAccount.includes('-')) {
      const parts = rawAccount.split('-');
      if (parts[0] && parts[0].trim().length > 0) {
        accountCode = parts[0].trim();
      }
    }

    // 2. Resolve Account Name
    const nameField = getFirstMatchingField(
      row,
      flavor === 'd365_fo' ? FO_ACCOUNT_NAME_CANDIDATES : BC_ACCOUNT_NAME_CANDIDATES
    );
    const accountName =
      nameField.found && nameField.value ? String(nameField.value).trim() : undefined;

    // 3. Resolve Posting Date
    const dateField = getFirstMatchingField(
      row,
      flavor === 'd365_fo' ? FO_DATE_CANDIDATES : BC_DATE_CANDIDATES
    );
    const rawDate = String(dateField.value ?? '').trim();
    if (!rawDate) {
      reject(rowNum, 'missing posting date');
      return;
    }

    const postDate = parseD365Date(rawDate);
    if (!postDate) {
      reject(rowNum, `unparseable posting date "${rawDate}"`);
      return;
    }

    // 4. Resolve Amounts
    const debitField = getFirstMatchingField(
      row,
      flavor === 'd365_fo' ? FO_DEBIT_CANDIDATES : BC_DEBIT_CANDIDATES
    );
    const creditField = getFirstMatchingField(
      row,
      flavor === 'd365_fo' ? FO_CREDIT_CANDIDATES : BC_CREDIT_CANDIDATES
    );
    const amountField =
      flavor === 'd365_bc'
        ? getFirstMatchingField(row, BC_AMOUNT_CANDIDATES)
        : { value: undefined, found: false };

    const rawDebit =
      debitField.found && debitField.value !== null ? String(debitField.value).trim() : '';
    const rawCredit =
      creditField.found && creditField.value !== null ? String(creditField.value).trim() : '';
    const rawAmount =
      amountField.found && amountField.value !== null ? String(amountField.value).trim() : '';

    if (rawDebit === '' && rawCredit === '' && rawAmount === '') {
      reject(rowNum, 'missing debit, credit, or amount; not adopted as 0.00');
      return;
    }

    let debit = 0;
    let credit = 0;

    if (rawDebit !== '' || rawCredit !== '') {
      if (rawDebit !== '') {
        const parsedDebit = parseFinancialAmount(rawDebit);
        if (Number.isNaN(parsedDebit)) {
          reject(rowNum, `unparseable debit amount "${rawDebit}"`);
          return;
        }
        if (parsedDebit < 0) {
          reject(rowNum, `debit must be non-negative: ${parsedDebit}`);
          return;
        }
        debit = parsedDebit;
      }

      if (rawCredit !== '') {
        const parsedCredit = parseFinancialAmount(rawCredit);
        if (Number.isNaN(parsedCredit)) {
          reject(rowNum, `unparseable credit amount "${rawCredit}"`);
          return;
        }
        if (parsedCredit < 0) {
          reject(rowNum, `credit must be non-negative: ${parsedCredit}`);
          return;
        }
        credit = parsedCredit;
      }
    } else if (rawAmount !== '') {
      const parsedAmount = parseFinancialAmount(rawAmount);
      if (Number.isNaN(parsedAmount)) {
        reject(rowNum, `unparseable amount "${rawAmount}"`);
        return;
      }
      if (parsedAmount >= 0) {
        debit = parsedAmount;
        credit = 0;
      } else {
        debit = 0;
        credit = Math.abs(parsedAmount);
      }
    }

    // 5. Resolve Voucher / Reference / Journal ID
    const voucherField = getFirstMatchingField(
      row,
      flavor === 'd365_fo' ? FO_VOUCHER_CANDIDATES : BC_VOUCHER_CANDIDATES
    );
    const voucher =
      voucherField.found && voucherField.value ? String(voucherField.value).trim() : undefined;

    // 6. Resolve Description
    const descField = getFirstMatchingField(
      row,
      flavor === 'd365_fo' ? FO_DESC_CANDIDATES : BC_DESC_CANDIDATES
    );
    const description =
      descField.found && descField.value ? String(descField.value).trim() : undefined;

    // 7. Resolve Entity
    const entityField = getFirstMatchingField(
      row,
      flavor === 'd365_fo' ? FO_ENTITY_CANDIDATES : BC_ENTITY_CANDIDATES
    );
    const entityId =
      entityField.found && entityField.value
        ? String(entityField.value).trim()
        : options?.defaultEntity;

    // 8. Resolve Currency
    const currField =
      flavor === 'd365_fo'
        ? getFirstMatchingField(row, FO_CURRENCY_CANDIDATES)
        : { value: undefined, found: false };
    const currency =
      currField.found && currField.value
        ? String(currField.value).trim()
        : options?.defaultCurrency;

    const entry: Partial<GLEntry> = {
      accountCode,
      ...(accountName ? { accountName } : {}),
      date: postDate,
      postDate,
      period: postDate.slice(0, 7),
      debit,
      credit,
      amount: roundTo(subtractMoney(debit, credit)),
      netChange: roundTo(subtractMoney(debit, credit)),
      ...(voucher ? { journalId: voucher, reference: voucher } : {}),
      ...(description ? { description } : {}),
      ...(entityId ? { entityId } : {}),
      ...(currency ? { currency } : {}),
    };

    entries.push(entry);
    sourceRows.push(rowNum);
  });

  return {
    flavor,
    entries,
    sourceRows,
    rejections,
    rowErrors,
  };
}
