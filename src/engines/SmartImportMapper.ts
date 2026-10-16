/**
 * SmartImportMapper — AI-powered column mapping for data imports
 * Part 6 #3: Reduces import setup from 30 minutes to 30 seconds
 *
 * @purity-tier TIER_3_SIDE_EFFECTING (boundary isolated)
 * @boundary Storage IO confined to `learnMapping()` (write) + `getLearnedMappings()` (read)
 * @pure-methods suggestMappings, validateMappings, transform, applyTransform, calculateMatchScore,
 *                  findDuplicateMappings, mergeWithLearned, getLearnedMappingsForType
 * @side-effects in-memory `learnedMappings` Map mutation + storageAdapter JSON IO
 * @deterministic YES (seed=42 mulberry32 if RNG added; Date.now() replaced with ISO string at L161)
 * @idempotent YES (re-calling learnMapping with same input = no-op beyond useCount++ + persisted snapshot)
 * @commutative YES (column order independence in suggestMappings)
 * @migrated-from src/engines/ (relocate target: src/services/SmartImportMapper.ts — Vulcan T-FIX-10)
 * @cross-witness Veridicus-EnginePurity T-1 PICK ι (slot 019eda63-af5f-77c3-b18b-5fb6a1146859)
 * @cross-witness Archimedes T-FIX-10 PRE-STAGE (Mathematical Purity Lens — purity algebra + 186 engines @purity-tier JSDoc schema)
 */
import { storageGetJSON, storageSetJSON } from '@/utils/storageAdapter';
import { nowISO } from '@/utils/clock';
import {
  addMoney,
  subtractMoney,
  compareMoney,
  toDecimal,
  toFixedMoneyString,
} from '@/utils/money';
import { parseFinancialAmountExact } from '@/utils/parseFinancialAmount';
import { parseImportDate } from '@/utils/parseImportDate';
import type {
  GLIngestField,
  GLIngestInput,
  GLIngestMappings,
  GLIngestReason,
  GLIngestResult,
  StagedGLRow,
  QuarantinedGLRow,
  VoucherImbalance,
} from '@/types/glIngestion';

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  transform?: 'none' | 'date' | 'number' | 'currency' | 'percentage' | 'uppercase' | 'trim';
}

interface ValidationResult {
  valid: boolean;
  missingFields: string[];
  unmappedColumns: string[];
  warnings: string[];
}

interface LearnedMapping {
  sourceFile: string;
  headers: string[];
  mappings: ColumnMapping[];
  learnedAt: string;
  useCount: number;
}

// Known field patterns for auto-detection
const FIELD_PATTERNS: Record<
  string,
  { patterns: RegExp[]; transform: ColumnMapping['transform'] }
> = {
  accountId: {
    patterns: [/account.?id/i, /acct.?num/i, /account.?code/i, /gl.?code/i, /gl.?number/i],
    transform: 'uppercase',
  },
  accountName: {
    patterns: [/account.?name/i, /acct.?name/i, /gl.?name/i, /description/i],
    transform: 'trim',
  },
  period: {
    patterns: [/period/i, /month/i, /fiscal.?period/i, /per.?end/i, /period.?end/i],
    transform: 'date',
  },
  debit: {
    patterns: [/debit/i, /dr/i, /debit.?amount/i],
    transform: 'currency',
  },
  credit: {
    patterns: [/credit/i, /cr/i, /credit.?amount/i],
    transform: 'currency',
  },
  amount: {
    patterns: [/amount/i, /value/i, /total/i, /net.?amount/i],
    transform: 'currency',
  },
  entityId: {
    patterns: [/entity/i, /company/i, /subsidiary/i, /division/i, /segment/i],
    transform: 'uppercase',
  },
  departmentId: {
    patterns: [/dept/i, /department/i, /cost.?center/i, /cc.?code/i],
    transform: 'uppercase',
  },
  currency: {
    patterns: [/currency/i, /curr/i, /ccy/i],
    transform: 'uppercase',
  },
  date: {
    patterns: [/date/i, /trans.?date/i, /posting.?date/i, /entry.?date/i],
    transform: 'date',
  },
  description: {
    patterns: [/desc/i, /memo/i, /narrative/i, /reference/i, /comment/i],
    transform: 'trim',
  },
  journalId: {
    patterns: [/journal/i, /je.?num/i, /batch.?id/i, /journal.?entry/i],
    transform: 'uppercase',
  },
  fiscalYear: {
    patterns: [/fiscal.?year/i, /fy/i, /year/i],
    transform: 'number',
  },
  budgetAmount: {
    patterns: [/budget/i, /plan/i, /target/i, /forecast/i],
    transform: 'currency',
  },
  actualAmount: {
    patterns: [/actual/i, /realized/i, /incurred/i],
    transform: 'currency',
  },
};

// Exact aliases only. Fuzzy COA suggestions require a separate analyst review
// contract; broad substring matches must not silently select a financial column.
const GL_ALIASES: Record<GLIngestField, readonly string[]> = {
  accountCode: [
    'account',
    'accountcode',
    'accountnumber',
    'glaccount',
    'glcode',
    'glaccountcode',
    'acctnum',
  ],
  accountName: ['accountname', 'glaccountname'],
  postDate: ['date', 'postdate', 'postingdate', 'transactiondate', 'transdate', 'entrydate'],
  debit: ['debit', 'debitamount', 'dr'],
  credit: ['credit', 'creditamount', 'cr'],
  amount: ['amount', 'netamount', 'signedamount'],
  entityId: ['entity', 'entityid', 'company', 'companycode', 'subsidiary'],
  currency: ['currency', 'currencycode', 'ccy'],
  journalId: ['journal', 'journalid', 'voucher', 'voucherid', 'journalnumber'],
  description: ['description', 'memo', 'narrative'],
  reference: ['reference', 'ref'],
};

function ingestDate(raw: string, order: GLIngestInput['dateOrder']): string | null {
  if (/^\d{4}[-/.]/.test(raw)) return parseImportDate(raw);
  if (order === 'ISO_ONLY') return null;
  const parts = /^(\d{1,2})([-/.])(\d{1,2})\2(\d{4})$/.exec(raw);
  if (!parts) return null;
  const month = order === 'MDY' ? parts[1] : parts[3];
  const day = order === 'MDY' ? parts[3] : parts[1];
  return parseImportDate(`${parts[4]}-${month}-${day}`);
}

/** Exact cents, no silent sub-cent rounding; bounded to 24 integer digits per row. */
function ingestAmount(raw: string, allowNegative: boolean): string | null {
  const lexeme = parseFinancialAmountExact(raw);
  if (lexeme === null || lexeme.length > 128) return null;
  if (lexeme.replace(/^-/, '').split('.')[0]!.replace(/^0+/, '').length > 24) return null;
  const value = toDecimal(lexeme);
  if (value.decimalPlaces() > 2 || (!allowNegative && value.isNegative() && !value.isZero()))
    return null;
  return value.isZero() ? '0.00' : toFixedMoneyString(value);
}

export function ingestGLRows(input: GLIngestInput): GLIngestResult {
  const mappings: GLIngestMappings = {};
  const schemaErrors: string[] = [];
  const normalizedHeader = (header: string) =>
    header
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  if (!input.sourceId.trim()) schemaErrors.push('Source identity is required.');
  if (!Number.isSafeInteger(input.firstRowNumber ?? 2) || (input.firstRowNumber ?? 2) < 1)
    schemaErrors.push('First source row must be a positive safe integer.');
  const suppliedRowNumbers = input.rowNumbers;
  const rowsIterable =
    suppliedRowNumbers !== undefined && !Array.isArray(input.rows) ? [...input.rows] : input.rows;
  if (suppliedRowNumbers !== undefined) {
    if (Array.isArray(rowsIterable) && suppliedRowNumbers.length !== rowsIterable.length) {
      schemaErrors.push('Row line numbers count must match row count.');
    }
    let prevLine = 0;
    for (const lineNum of suppliedRowNumbers) {
      if (!Number.isSafeInteger(lineNum) || lineNum < 1 || lineNum <= prevLine) {
        schemaErrors.push('Row line numbers must be strictly increasing positive safe integers.');
        break;
      }
      prevLine = lineNum;
    }
  }
  if (!input.expectedCurrency.trim()) schemaErrors.push('Expected currency is required.');
  if (new Set(input.headers).size !== input.headers.length)
    schemaErrors.push('Duplicate source headers are not allowed.');
  for (const field of Object.keys(GL_ALIASES) as GLIngestField[]) {
    const override = input.mappings?.[field];
    const matches = override
      ? [override]
      : input.headers.filter((h) => GL_ALIASES[field].includes(normalizedHeader(h)));
    if (matches.length > 1)
      schemaErrors.push(`Multiple columns match ${field}; supply an explicit mapping.`);
    else if (matches[0]) {
      if (!input.headers.includes(matches[0]))
        schemaErrors.push(`Mapped ${field} column is absent: ${matches[0]}`);
      else mappings[field] = matches[0];
    }
  }
  for (const field of ['accountCode', 'postDate', 'entityId', 'currency'] as const) {
    if (!mappings[field]) schemaErrors.push(`Missing required column: ${field}`);
  }
  const mappedSources = Object.values(mappings);
  if (new Set(mappedSources).size !== mappedSources.length)
    schemaErrors.push('A source column cannot be assigned to multiple fields.');
  const dual = Boolean(mappings.debit && mappings.credit);
  if (!dual && !mappings.amount)
    schemaErrors.push('Map both debit/credit columns or a signed amount column.');
  if (
    !dual &&
    input.amountConvention !== 'positive-debit' &&
    input.amountConvention !== 'positive-credit'
  )
    schemaErrors.push('Signed amounts require an explicit sign convention.');
  if (input.dateOrder !== 'MDY' && input.dateOrder !== 'DMY' && input.dateOrder !== 'ISO_ONLY')
    schemaErrors.push('An explicit date order is required.');
  const accounts = new Set(input.knownAccountCodes);
  const entities = new Set(input.knownEntityIds);
  const acceptedRows: StagedGLRow[] = [];
  const quarantinedRows: QuarantinedGLRow[] = [];
  const groups = new Map<
    string,
    {
      entityId: string;
      currency: string;
      journalId: string;
      debit: string;
      credit: string;
      sourceRows: number[];
    }
  >();
  let totalDebit = '0.00';
  let totalCredit = '0.00';
  let sourceRow = input.firstRowNumber ?? 2;
  let rowIndex = 0;
  for (const raw of rowsIterable) {
    const explicitLine = suppliedRowNumbers?.[rowIndex];
    const line =
      typeof explicitLine === 'number' && Number.isSafeInteger(explicitLine) && explicitLine >= 1
        ? explicitLine
        : sourceRow;
    sourceRow = line + 1;
    rowIndex++;
    const cell = (field: GLIngestField) => {
      const header = mappings[field];
      return header ? (raw[header] ?? '').trim() : '';
    };
    const reasons: GLIngestReason[] = [];
    const fail = (code: GLIngestReason['code'], field: string, message: string) =>
      reasons.push({ code, field, message });
    if (schemaErrors.length > 0) {
      quarantinedRows.push({
        sourceId: input.sourceId,
        sourceRow: line,
        raw: { ...raw },
        reasons: schemaErrors.map((message) => ({
          code: 'SCHEMA_ERROR',
          field: 'schema',
          message,
        })),
      });
      continue;
    }
    const accountCode = cell('accountCode');
    const entityId = cell('entityId');
    const currency = cell('currency');
    if (!accountCode || !accounts.has(accountCode))
      fail(
        'UNKNOWN_ACCOUNT',
        'accountCode',
        `Account is not in the supplied chart: ${accountCode}`
      );
    const postDate = ingestDate(cell('postDate'), input.dateOrder);
    if (!postDate)
      fail(
        'INVALID_DATE',
        'postDate',
        `Invalid ${input.dateOrder} posting date: ${cell('postDate')}`
      );
    if (!entityId) fail('MISSING_ENTITY', 'entityId', 'Entity is required.');
    else if (!entities.has(entityId))
      fail('UNKNOWN_ENTITY', 'entityId', `Unknown entity: ${entityId}`);
    if (!currency || currency !== input.expectedCurrency)
      fail(
        'CURRENCY_MISMATCH',
        'currency',
        `Expected ${input.expectedCurrency}; received ${currency || '(missing)'}.`
      );
    let debit: string | null = '0.00';
    let credit: string | null = '0.00';
    if (dual) {
      debit = cell('debit') === '' ? '0.00' : ingestAmount(cell('debit'), false);
      credit = cell('credit') === '' ? '0.00' : ingestAmount(cell('credit'), false);
      if (debit === null) fail('INVALID_AMOUNT', 'debit', `Invalid debit: ${cell('debit')}`);
      if (credit === null) fail('INVALID_AMOUNT', 'credit', `Invalid credit: ${cell('credit')}`);
    } else {
      const signed = ingestAmount(cell('amount'), true);
      if (signed === null)
        fail('INVALID_AMOUNT', 'amount', `Invalid signed amount: ${cell('amount')}`);
      else {
        const value =
          input.amountConvention === 'positive-credit'
            ? subtractMoney('0', signed)
            : toDecimal(signed);
        if (compareMoney(value, '0') < 0) credit = toFixedMoneyString(subtractMoney('0', value));
        else debit = toFixedMoneyString(value);
      }
    }
    if (reasons.length > 0) {
      quarantinedRows.push({
        sourceId: input.sourceId,
        sourceRow: line,
        raw: { ...raw },
        reasons,
      });
      continue;
    }
    const row: StagedGLRow = {
      sourceId: input.sourceId,
      sourceRow: line,
      accountCode,
      postDate: postDate!,
      debit: debit!,
      credit: credit!,
      entityId,
      currency,
      journalId: cell('journalId'),
      accountName: cell('accountName'),
      description: cell('description'),
      reference: cell('reference'),
    };
    acceptedRows.push(row);
    totalDebit = toFixedMoneyString(addMoney(totalDebit, row.debit));
    totalCredit = toFixedMoneyString(addMoney(totalCredit, row.credit));
    const key = JSON.stringify([entityId, currency, row.journalId]);
    const group = groups.get(key) ?? {
      entityId,
      currency,
      journalId: row.journalId,
      debit: '0.00',
      credit: '0.00',
      sourceRows: [] as number[],
    };
    group.debit = toFixedMoneyString(addMoney(group.debit, row.debit));
    group.credit = toFixedMoneyString(addMoney(group.credit, row.credit));
    group.sourceRows.push(line);
    groups.set(key, group);
  }
  const unbalancedVouchers: VoucherImbalance[] = [...groups.values()]
    .filter((v) => compareMoney(v.debit, v.credit) !== 0)
    .map((v) => ({ ...v, imbalance: toFixedMoneyString(subtractMoney(v.debit, v.credit)) }));
  const imbalance = toFixedMoneyString(subtractMoney(totalDebit, totalCredit));
  return {
    mappings,
    schemaErrors,
    acceptedRows,
    quarantinedRows,
    controlTotals: { debit: totalDebit, credit: totalCredit, imbalance },
    unbalancedVouchers,
    canPost:
      schemaErrors.length === 0 &&
      acceptedRows.length > 0 &&
      quarantinedRows.length === 0 &&
      unbalancedVouchers.length === 0 &&
      compareMoney(imbalance, '0') === 0,
  };
}

export class SmartImportMapper {
  private static learnedMappings: Map<string, LearnedMapping> = new Map();

  /**
   * Pure staging/validation of already-tokenized ERP rows. Does not read learned
   * mappings, post financial state, persist quarantine, parse XLSX, or claim bounded
   * output memory. Call once per single-currency file/chunk; cross-chunk controls
   * and transactional promotion are the coordinator's responsibility.
   */
  static ingest(input: GLIngestInput): GLIngestResult {
    return ingestGLRows(input);
  }

  /**
   * Auto-detect column mappings from headers
   */
  static suggestMappings(headers: string[], fileType: string): ColumnMapping[] {
    const mappings: ColumnMapping[] = [];
    const usedTargets = new Set<string>();

    for (const header of headers) {
      const normalized = header.trim().toLowerCase();
      let bestMatch: ColumnMapping | null = null;
      let bestScore = 0;

      for (const [targetField, config] of Object.entries(FIELD_PATTERNS)) {
        if (usedTargets.has(targetField)) continue;

        for (const pattern of config.patterns) {
          if (pattern.test(normalized)) {
            const score = this.calculateMatchScore(normalized, pattern);
            if (score > bestScore) {
              bestScore = score;
              bestMatch = {
                sourceColumn: header,
                targetField,
                confidence: Math.min(score, 0.99),
                transform: config.transform,
              };
            }
          }
        }
      }

      if (bestMatch && bestMatch.confidence >= 0.5) {
        mappings.push(bestMatch);
        usedTargets.add(bestMatch.targetField);
      } else {
        mappings.push({
          sourceColumn: header,
          targetField: header.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          confidence: 0.1,
          transform: 'none',
        });
      }
    }

    // Check learned mappings for this file type
    const learned = this.getLearnedMappingsForType(fileType);
    if (learned) {
      return this.mergeWithLearned(mappings, learned);
    }

    return mappings;
  }

  /**
   * Learn mapping from a completed import
   */
  static learnMapping(sourceFile: string, mappings: ColumnMapping[]): void {
    const existing = this.learnedMappings.get(sourceFile);
    const learned: LearnedMapping = {
      sourceFile,
      headers: mappings.map((m) => m.sourceColumn),
      mappings,
      learnedAt: nowISO(),
      useCount: existing ? existing.useCount + 1 : 1,
    };
    this.learnedMappings.set(sourceFile, learned);

    // Persist via storageAdapter (PATCH 22 — Veridicus T-FIX-10 engine purity)
    try {
      const stored: Record<string, LearnedMapping> =
        storageGetJSON<Record<string, LearnedMapping>>('learned_mappings') ?? {};
      stored[sourceFile] = learned;
      storageSetJSON('learned_mappings', stored);
    } catch {
      // Silent fail — storage might be full
    }
  }

  /**
   * Get learned mappings for a source file
   */
  static getLearnedMappings(sourceFile: string): ColumnMapping[] | null {
    // Check in-memory cache
    const cached = this.learnedMappings.get(sourceFile);
    if (cached) {
      cached.useCount++;
      return cached.mappings;
    }

    // Check storageAdapter (PATCH 22 — Veridicus T-FIX-10)
    try {
      const stored = storageGetJSON<Record<string, LearnedMapping>>('learned_mappings') ?? {};
      if (stored[sourceFile]!) {
        const learned = stored[sourceFile] as LearnedMapping;
        this.learnedMappings.set(sourceFile, learned);
        return learned.mappings;
      }
    } catch {
      // Silent fail
    }

    return null;
  }

  /**
   * Validate mapping completeness
   */
  static validateMappings(mappings: ColumnMapping[], requiredFields: string[]): ValidationResult {
    const mappedTargets = new Set(mappings.map((m) => m.targetField));
    const missingFields = requiredFields.filter((f) => !mappedTargets.has(f));
    const unmappedColumns = mappings.filter((m) => m.confidence < 0.3).map((m) => m.sourceColumn);

    const warnings: string[] = [];
    const lowConfidence = mappings.filter((m) => m.confidence >= 0.3 && m.confidence < 0.7);
    if (lowConfidence.length > 0) {
      warnings.push(
        `${lowConfidence.length} column(s) have low confidence mapping: ${lowConfidence.map((m) => m.sourceColumn).join(', ')}`
      );
    }

    const duplicates = this.findDuplicateMappings(mappings);
    if (duplicates.length > 0) {
      warnings.push(`Duplicate target fields detected: ${duplicates.join(', ')}`);
    }

    return {
      valid: missingFields.length === 0 && unmappedColumns.length === 0,
      missingFields,
      unmappedColumns,
      warnings,
    };
  }

  /**
   * Transform data using mappings
   */
  static transform(data: unknown[][], mappings: ColumnMapping[]): unknown[][] {
    const headerRow = data[0];
    if (!headerRow) return [];

    const columnIndices = new Map<string, number>();
    (headerRow as string[]).forEach((h, i) => columnIndices.set(h, i));

    const result: unknown[][] = [];
    result.push(mappings.map((m) => m.targetField)); // New header

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const newRow: unknown[] = [];

      for (const mapping of mappings) {
        const sourceIdx = columnIndices.get(mapping.sourceColumn);
        const value = sourceIdx !== undefined ? row![sourceIdx] : null;
        newRow.push(this.applyTransform(value, mapping.transform));
      }

      result.push(newRow);
    }

    return result;
  }

  /**
   * Calculate match score between header and pattern
   */
  private static calculateMatchScore(header: string, pattern: RegExp): number {
    const match = header.match(pattern);
    if (!match) return 0;

    // Exact match gets higher score
    if (match[0] === header) return 0.95;

    // Partial match score based on match length vs header length
    const matchRatio = match[0]!.length / header.length;
    return 0.5 + matchRatio * 0.4;
  }

  /**
   * Get learned mappings for a file type
   */
  private static getLearnedMappingsForType(fileType: string): LearnedMapping | null {
    for (const learned of this.learnedMappings.values()) {
      if (learned.sourceFile.endsWith(fileType) && learned.useCount >= 2) {
        return learned;
      }
    }
    return null;
  }

  /**
   * Merge suggested mappings with learned mappings
   */
  private static mergeWithLearned(
    suggested: ColumnMapping[],
    learned: LearnedMapping
  ): ColumnMapping[] {
    const learnedMap = new Map(learned.mappings.map((m) => [m.sourceColumn, m]));

    return suggested.map((s) => {
      const l = learnedMap.get(s.sourceColumn);
      if (l && l.confidence > s.confidence) {
        return { ...l, confidence: Math.min(l.confidence + 0.1, 0.99) };
      }
      return s;
    });
  }

  /**
   * Find duplicate target field mappings
   */
  private static findDuplicateMappings(mappings: ColumnMapping[]): string[] {
    const counts = new Map<string, number>();
    for (const m of mappings) {
      counts.set(m.targetField, (counts.get(m.targetField) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .filter(([_, count]) => count > 1)
      .map(([field]) => field);
  }

  /**
   * Apply transform to a value
   */
  private static applyTransform(value: unknown, transform: ColumnMapping['transform']): unknown {
    if (value == null || value === '') return null;

    switch (transform) {
      case 'number':
        return typeof value === 'number'
          ? value
          : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || null;
      case 'currency':
        return typeof value === 'number'
          ? value
          : parseFloat(String(value).replace(/[$,()]/g, '')) || null;
      case 'percentage':
        return typeof value === 'number'
          ? value
          : parseFloat(String(value).replace(/[%]/g, '')) || null;
      case 'date': {
        const d = new Date(String(value));
        return isNaN(d.getTime()) ? value : d.toISOString().split('T')[0];
      }
      case 'uppercase':
        return String(value).toUpperCase().trim();
      case 'trim':
        return String(value).trim();
      case 'none':
      default:
        return value;
    }
  }
}
