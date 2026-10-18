/**
 * Pure row-to-entry parser for the GL import path (Gate 2, FR-002 / UX-002).
 *
 * Lifted out of `GLUploadPage` so the validation contract is testable with
 * fixtures and reusable by any other import surface (connector, CLI, API).
 * Behaviour is identical to the wizard's previous inline logic:
 *
 *  - Account code and posting date are required; a row missing either is
 *    rejected with a reason naming the field.
 *  - Dates go through `parseImportDate` (canonical YYYY-MM-DD or reject), or
 *    through `parseD365Date` when the headers identify a Dynamics 365 export,
 *    which additionally accepts `dd-MMM-yyyy` and ISO timestamps and still
 *    rejects calendar-invalid dates.
 *  - Amounts go through `parseFinancialAmount`; blank cells are 0; anything
 *    unparseable rejects the row. A field with no column mapping is 0.
 *  - Debit and credit are magnitudes: a signed cell (``(500)``, ``-75.5``)
 *    rejects the row. The store enforces `debit >= 0` / `credit >= 0`
 *    (docs/agent/03_DOMAIN_RULES.md); rejecting here keeps the preview and
 *    the import from disagreeing about a row the ledger can never accept.
 *  - Optional facts the file carries — account name, currency, entity,
 *    department, description, reference — are copied onto the entry when the
 *    user mapped a column to them. An unmapped or blank optional column stays
 *    absent: a name falls back to the account code, a currency is not invented.
 *  - A row collects every reason that applies (one `ImportRejection` per
 *    reason) and is excluded from `entries` — nothing is silently dropped.
 *  - `sourceRows[i]` is the 1-based source-file row of `entries[i]`
 *    (header = row 1, so the first data row is 2).
 *
 * The function does not touch the clock, the store, or React.
 */
import type { GLEntry, ImportRejection } from '@/types';
import { parseFinancialAmount } from '@/utils/parseFinancialAmount';
import { parseImportDate } from '@/utils/parseImportDate';
import {
  detectD365Flavor,
  isNonTransactionRow,
  parseD365Date,
  type D365Flavor,
} from './d365Parser';

/**
 * Field keys the wizard can map a source column onto.
 *
 * Every key here is a fact a real GL export can carry and `GLEntry` can hold.
 * `accountName` and `currency` were added because dropping them is not
 * neutral: the ledger then reports the account code as the account name, and
 * the import scope reports the currency as unavailable — which the Done screen
 * renders as "not in file" for a column that IS in the file. Both stay
 * optional; an absent column is absent, never defaulted.
 */
export type GLImportField =
  | 'accountCode'
  | 'accountName'
  | 'postDate'
  | 'debit'
  | 'credit'
  | 'currency'
  | 'description'
  | 'reference'
  | 'entityId'
  | 'departmentId';

/** Fields that must be mapped before parsing can produce any entry. */
export const REQUIRED_GL_IMPORT_FIELDS: readonly GLImportField[] = ['accountCode', 'postDate'];

export type GLColumnMappings = Readonly<Partial<Record<GLImportField, string>>>;

export interface ParseGLRowsResult {
  /** Entries ready for `importGLData`, in source order. */
  readonly entries: Partial<GLEntry>[];
  /** 1-based source-file row for each entry, aligned by index. */
  readonly sourceRows: number[];
  /** Every rejected row with a machine code and a human reason. */
  readonly rejections: ImportRejection[];
  /** Human-readable `Row N: reason` lines (same facts as `rejections`). */
  readonly rowErrors: string[];
}

/** Required fields that have no source column mapped, in declaration order. */
export function missingRequiredMappings(mappings: GLColumnMappings): GLImportField[] {
  return REQUIRED_GL_IMPORT_FIELDS.filter((f) => !mappings[f]);
}

export interface ParseGLRowsOptions {
  /**
   * Source dialect. Omit to detect it from the row headers — the preview and
   * the import must agree, and detection inside the parser is what guarantees
   * that without every call site repeating it. Pass `null` to force the
   * generic dialect even when the headers look like a D365 export.
   */
  readonly flavor?: D365Flavor | null;
}

/**
 * Parse raw CSV/XLSX rows (as produced by the upload step) into GL entries
 * using the user's column mappings.
 *
 * @param rawData  one object per data row, keyed by source column header
 * @param mappings field → source column header
 * @param firstRowNumber source-file row number of `rawData[0]` (default 2: header is row 1)
 * @param options dialect override; detected from the headers when omitted
 */
export function parseGLRows(
  rawData: readonly Readonly<Record<string, string | undefined>>[],
  mappings: GLColumnMappings,
  firstRowNumber = 2,
  options: ParseGLRowsOptions = {}
): ParseGLRowsResult {
  const entries: Partial<GLEntry>[] = [];
  const sourceRows: number[] = [];
  const rejections: ImportRejection[] = [];
  const rowErrors: string[] = [];

  // A recognised Dynamics 365 export (F&O or Business Central) adds two
  // dialect facts, both from `d365Parser` — the one place D365 column names,
  // date formats and non-transaction lines are defined:
  //   * posting dates may be `dd-MMM-yyyy` ("31-Jan-2026") as well as the
  //     canonical and US formats, and are still calendar-validated;
  //   * a grand-total or opening/closing-balance line is not a posting, so it
  //     is rejected by source row instead of becoming an account.
  // Any other header set keeps exactly the generic behaviour.
  const headers = rawData.length > 0 && rawData[0] ? Object.keys(rawData[0]) : [];
  const flavor = options.flavor === undefined ? detectD365Flavor(headers) : options.flavor;

  rawData.forEach((row, idx) => {
    const rowNum = idx + firstRowNumber;
    const getVal = (field: GLImportField): string | undefined => {
      const col = mappings[field];
      return col ? row[col] : undefined;
    };

    const reject = (reason: string): void => {
      rowErrors.push(`Row ${rowNum}: ${reason}`);
      rejections.push({ row: rowNum, code: 'VALIDATION', reason });
    };

    const accountCode = (getVal('accountCode') ?? '').trim();
    if (!accountCode) reject('missing accountCode');

    if (flavor && accountCode && isNonTransactionRow(accountCode)) {
      reject(`non-transaction summary or header row "${accountCode}"`);
      return;
    }

    const rawDate = String(getVal('postDate') ?? '').trim();
    const postDate = flavor ? parseD365Date(rawDate) : parseImportDate(rawDate);
    if (!postDate) {
      reject(rawDate === '' ? 'missing posting date' : `unparseable posting date "${rawDate}"`);
    }

    const parseCellAmount = (field: 'debit' | 'credit'): number => {
      if (!mappings[field]) return 0;
      const cell = String(getVal(field) ?? '').trim();
      if (cell === '') return 0;
      const value = parseFinancialAmount(cell);
      if (Number.isNaN(value)) {
        reject(`unparseable ${field} amount "${cell}"`);
        return Number.NaN;
      }
      if (value < 0) {
        reject(`${field} must be a non-negative amount (got "${cell}")`);
        return Number.NaN;
      }
      return value;
    };
    const debit = parseCellAmount('debit');
    const credit = parseCellAmount('credit');

    if (!accountCode || !postDate || Number.isNaN(debit) || Number.isNaN(credit)) return;

    const period = postDate.slice(0, 7); // canonical YYYY-MM
    // A blank or unmapped name column falls back to the code (the store does
    // the same); a blank currency stays absent so the import scope reports it
    // as unavailable rather than as an empty string.
    const mappedName = (getVal('accountName') ?? '').trim();
    const mappedCurrency = (getVal('currency') ?? '').trim();
    sourceRows.push(rowNum);
    entries.push({
      id: '',
      accountId: accountCode,
      accountCode,
      accountName: mappedName || accountCode,
      period,
      periodName: period,
      debit,
      credit,
      netChange: 0,
      amount: 0,
      date: postDate,
      postDate,
      description: getVal('description') || '',
      reference: getVal('reference') || '',
      entityId: getVal('entityId') || '',
      departmentId: getVal('departmentId') || '',
      ...(mappedCurrency ? { currency: mappedCurrency } : {}),
    });
  });

  return { entries, sourceRows, rejections, rowErrors };
}
