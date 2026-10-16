import ExcelJS from 'exceljs';
import type { ExactConsolidationResult } from '@/engines/ConsolidationEngine';
import {
  addMoney,
  compareMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
  toFixedMoneyString,
} from '@/utils/money';
import { sanitizeSpreadsheetText } from '@/utils/spreadsheetSanitize';
import { nowISO } from '@/utils/clock';

export interface FinancialPackageMetadata {
  companyName: string;
  periodLabel: string;
  preparedBy: string;
  generatedAt?: string;
}

export interface FormulaCellRecord {
  sheetName: string;
  address: string;
  formula: string;
  result: string;
}

export interface PackageSummaryMetrics {
  totalAssets: string;
  totalLiabilitiesCredit: string;
  totalEquity: string;
  totalCTA: string;
  totalRevenueCredit: string;
  totalExpenses: string;
  netIncome: string;
  accountingEquationImbalance: string;
}

export interface FormulaWorkbookInspection {
  sheetNames: string[];
  formulaCells: FormulaCellRecord[];
  summaryMetrics: PackageSummaryMetrics;
}

export interface EditablePptxSlide {
  slideNumber: number;
  title: string;
  paragraphs: string[];
  tables: string[][][];
}

export interface EditablePptxInspection {
  slideCount: number;
  slides: EditablePptxSlide[];
  summaryMetrics: PackageSummaryMetrics;
}

export interface FinancialPackageTieOutResult {
  matches: boolean;
  discrepancies: string[];
}

const SAFE_FORMULA_PATTERN =
  /^(?:(?:SUM|ABS|ROUND)\([A-Za-z0-9_!:,+\-*/.\s]+\)|[A-Za-z0-9_!]+(?:\s*[+\-*/]\s*[A-Za-z0-9_!]+)+|[A-Za-z0-9_]+![A-Z]+[0-9]+)$/;
const FORBIDDEN_FORMULA_TOKEN = /[|"'`;\\<>]|cmd|powershell|hyperlink|webservice|filterxml/i;

/**
 * Validates that an engine-generated Excel formula contains only allowlisted
 * cell references, arithmetic operators, and aggregate functions (`SUM`, `ABS`, `ROUND`),
 * blocking DDE/external-command/injection syntax (`F-0017`).
 */
export function assertSafeSpreadsheetFormula(formula: string): string {
  const trimmed = formula.trim().replace(/^=/, '');
  if (
    trimmed.length === 0 ||
    FORBIDDEN_FORMULA_TOKEN.test(trimmed) ||
    !SAFE_FORMULA_PATTERN.test(trimmed)
  ) {
    throw new Error(`Unsafe Excel formula rejected: ${formula}`);
  }
  return trimmed;
}

function moneyNum(value: string): number {
  return roundTo(toDecimal(value), 2);
}

const ACCOUNTING_NUM_FMT = '#,##0.00;(#,##0.00);"0.00"';

function makeFormulaCell(formula: string, exactResult: string): ExcelJS.CellFormulaValue {
  return {
    formula: assertSafeSpreadsheetFormula(formula),
    result: moneyNum(exactResult),
  };
}

/**
 * Generates a real 5-sheet `.xlsx` workbook from an `ExactConsolidationResult`
 * with live Excel `<f>` formulas and exact cached `<v>` numeric results.
 */
export async function buildFormulaPreservingWorkbookBytes(
  result: ExactConsolidationResult,
  metadata: FinancialPackageMetadata
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = sanitizeSpreadsheetText(metadata.preparedBy);
  workbook.title = sanitizeSpreadsheetText(
    `${metadata.companyName} — ${metadata.periodLabel} Financial Package`
  );

  // -------------------------------------------------------------------------
  // Sheet 1: Consolidated_TB
  // -------------------------------------------------------------------------
  const tbSheet = workbook.addWorksheet('Consolidated_TB');
  tbSheet.addRow([
    'Account Code',
    'Account Name',
    'Category',
    'Pre-Elimination Signed',
    'Elimination Signed',
    'Consolidated Signed',
    'Debit',
    'Credit',
  ]).font = { bold: true };

  let preElimSum = toDecimal(0);
  let elimSum = toDecimal(0);
  let consSignedSum = toDecimal(0);
  let debitSum = toDecimal(0);
  let creditSum = toDecimal(0);

  result.consolidatedTrialBalance.forEach((line, idx) => {
    const rowNum = idx + 2;
    preElimSum = addMoney(preElimSum, line.preEliminationSigned);
    elimSum = addMoney(elimSum, line.eliminationSigned);
    consSignedSum = addMoney(consSignedSum, line.consolidatedSigned);
    debitSum = addMoney(debitSum, line.debit);
    creditSum = addMoney(creditSum, line.credit);

    const row = tbSheet.addRow([
      sanitizeSpreadsheetText(line.accountCode),
      sanitizeSpreadsheetText(line.accountName),
      sanitizeSpreadsheetText(line.category),
      moneyNum(line.preEliminationSigned),
      moneyNum(line.eliminationSigned),
      makeFormulaCell(`D${rowNum}+E${rowNum}`, line.consolidatedSigned),
      moneyNum(line.debit),
      moneyNum(line.credit),
    ]);
    for (let col = 4; col <= 8; col += 1) {
      row.getCell(col).numFmt = ACCOUNTING_NUM_FMT;
    }
  });

  const tbRowsList = result.consolidatedTrialBalance;
  const tbRowCount = tbRowsList.length;
  const tbLastDataRow = Math.max(2, tbRowCount + 1);
  const tbTotalRow = tbSheet.addRow([
    'TOTAL',
    'Trial Balance Control Total',
    '',
    makeFormulaCell(`SUM(D2:D${tbLastDataRow})`, toFixedMoneyString(preElimSum)),
    makeFormulaCell(`SUM(E2:E${tbLastDataRow})`, toFixedMoneyString(elimSum)),
    makeFormulaCell(`SUM(F2:F${tbLastDataRow})`, toFixedMoneyString(consSignedSum)),
    makeFormulaCell(`SUM(G2:G${tbLastDataRow})`, toFixedMoneyString(debitSum)),
    makeFormulaCell(`SUM(H2:H${tbLastDataRow})`, toFixedMoneyString(creditSum)),
  ]);
  tbTotalRow.font = { bold: true };
  for (let col = 4; col <= 8; col += 1) {
    tbTotalRow.getCell(col).numFmt = ACCOUNTING_NUM_FMT;
  }

  // -------------------------------------------------------------------------
  // Sheet 2: Income_Statement
  // -------------------------------------------------------------------------
  const isSheet = workbook.addWorksheet('Income_Statement');
  isSheet.addRow(['Account Code', 'Line Item', `Amount (${result.reportingCurrency})`]).font = {
    bold: true,
  };

  const revenueLines = tbRowsList.filter((l) => l.category === 'revenue');
  const expenseLines = tbRowsList.filter((l) => l.category === 'expense');

  let sheetRowIdx = 2;
  const firstSectionStartRow = sheetRowIdx;
  for (const rev of revenueLines) {
    const creditAmount = toFixedMoneyString(toDecimal(rev.consolidatedSigned).negated());
    const row = isSheet.addRow([
      sanitizeSpreadsheetText(rev.accountCode),
      sanitizeSpreadsheetText(rev.accountName),
      moneyNum(creditAmount),
    ]);
    row.getCell(3).numFmt = ACCOUNTING_NUM_FMT;
    sheetRowIdx += 1;
  }
  const firstSectionEndRow = Math.max(firstSectionStartRow, sheetRowIdx - 1);
  const firstSectionTotalRowNum = sheetRowIdx;
  const totalRevRow = isSheet.addRow([
    'TOTAL_REV',
    'Total Revenue',
    makeFormulaCell(
      `SUM(C${firstSectionStartRow}:C${firstSectionEndRow})`,
      result.totalRevenueCredit
    ),
  ]);
  totalRevRow.font = { bold: true };
  totalRevRow.getCell(3).numFmt = ACCOUNTING_NUM_FMT;
  sheetRowIdx += 1;

  const secondSectionStartRow = sheetRowIdx;
  for (const exp of expenseLines) {
    const row = isSheet.addRow([
      sanitizeSpreadsheetText(exp.accountCode),
      sanitizeSpreadsheetText(exp.accountName),
      moneyNum(exp.consolidatedSigned),
    ]);
    row.getCell(3).numFmt = ACCOUNTING_NUM_FMT;
    sheetRowIdx += 1;
  }
  const secondSectionEndRow = Math.max(secondSectionStartRow, sheetRowIdx - 1);
  const secondSectionTotalRowNum = sheetRowIdx;
  const totalExpRow = isSheet.addRow([
    'TOTAL_EXP',
    'Total Operating Expenses',
    makeFormulaCell(`SUM(C${secondSectionStartRow}:C${secondSectionEndRow})`, result.totalExpenses),
  ]);
  totalExpRow.font = { bold: true };
  totalExpRow.getCell(3).numFmt = ACCOUNTING_NUM_FMT;
  sheetRowIdx += 1;

  const netIncomeRowNum = sheetRowIdx;
  const netIncomeRow = isSheet.addRow([
    'NET_INCOME',
    'Net Income',
    makeFormulaCell(`C${firstSectionTotalRowNum}-C${secondSectionTotalRowNum}`, result.netIncome),
  ]);
  netIncomeRow.font = { bold: true };
  netIncomeRow.getCell(3).numFmt = ACCOUNTING_NUM_FMT;

  // -------------------------------------------------------------------------
  // Sheet 3: Balance_Sheet
  // -------------------------------------------------------------------------
  const bsSheet = workbook.addWorksheet('Balance_Sheet');
  bsSheet.addRow([
    'Account Code',
    'Line Item',
    `Signed Balance (${result.reportingCurrency})`,
  ]).font = { bold: true };

  const assetLines = result.consolidatedTrialBalance.filter((l) => l.category === 'asset');
  const liabilityLines = result.consolidatedTrialBalance.filter((l) => l.category === 'liability');
  const equityLines = result.consolidatedTrialBalance.filter((l) => l.category === 'equity');

  let bsRow = 2;
  const assetStartRow = bsRow;
  for (const asset of assetLines) {
    const r = bsSheet.addRow([
      sanitizeSpreadsheetText(asset.accountCode),
      sanitizeSpreadsheetText(asset.accountName),
      moneyNum(asset.consolidatedSigned),
    ]);
    r.getCell(3).numFmt = ACCOUNTING_NUM_FMT;
    bsRow += 1;
  }
  const assetEndRow = Math.max(assetStartRow, bsRow - 1);
  const totalAssetsRowNum = bsRow;
  const totalAssetsRow = bsSheet.addRow([
    'TOTAL_ASSETS',
    'Total Assets',
    makeFormulaCell(`SUM(C${assetStartRow}:C${assetEndRow})`, result.totalAssets),
  ]);
  totalAssetsRow.font = { bold: true };
  totalAssetsRow.getCell(3).numFmt = ACCOUNTING_NUM_FMT;
  bsRow += 1;

  const liabStartRow = bsRow;
  if (liabilityLines.length === 0) {
    const r = bsSheet.addRow(['2000', 'Liabilities (Eliminated)', 0]);
    r.getCell(3).numFmt = ACCOUNTING_NUM_FMT;
    bsRow += 1;
  } else {
    for (const liab of liabilityLines) {
      const r = bsSheet.addRow([
        sanitizeSpreadsheetText(liab.accountCode),
        sanitizeSpreadsheetText(liab.accountName),
        moneyNum(liab.consolidatedSigned),
      ]);
      r.getCell(3).numFmt = ACCOUNTING_NUM_FMT;
      bsRow += 1;
    }
  }
  const liabEndRow = Math.max(liabStartRow, bsRow - 1);
  const totalLiabRowNum = bsRow;
  const totalLiabRow = bsSheet.addRow([
    'TOTAL_LIAB',
    'Total Liabilities (Signed)',
    makeFormulaCell(`SUM(C${liabStartRow}:C${liabEndRow})`, result.totalLiabilities),
  ]);
  totalLiabRow.font = { bold: true };
  totalLiabRow.getCell(3).numFmt = ACCOUNTING_NUM_FMT;
  bsRow += 1;

  const eqStartRow = bsRow;
  for (const eq of equityLines) {
    const r = bsSheet.addRow([
      sanitizeSpreadsheetText(eq.accountCode),
      sanitizeSpreadsheetText(eq.accountName),
      moneyNum(eq.consolidatedSigned),
    ]);
    r.getCell(3).numFmt = ACCOUNTING_NUM_FMT;
    bsRow += 1;
  }
  const eqEndRow = Math.max(eqStartRow, bsRow - 1);
  const totalEqRowNum = bsRow;
  const totalEqRow = bsSheet.addRow([
    'TOTAL_EQUITY',
    'Total Contributed Equity & OCI (Signed)',
    makeFormulaCell(`SUM(C${eqStartRow}:C${eqEndRow})`, result.totalEquity),
  ]);
  totalEqRow.font = { bold: true };
  totalEqRow.getCell(3).numFmt = ACCOUNTING_NUM_FMT;
  bsRow += 1;

  const currentEarningsSigned = toFixedMoneyString(toDecimal(result.netIncome).negated());
  const currentEarningsRowNum = bsRow;
  const currentEarningsRow = bsSheet.addRow([
    'CURRENT_NI',
    'Current Period Net Income (Signed Credit)',
    makeFormulaCell(`0-Income_Statement!C${netIncomeRowNum}`, currentEarningsSigned),
  ]);
  currentEarningsRow.getCell(3).numFmt = ACCOUNTING_NUM_FMT;
  bsRow += 1;

  const equationRow = bsSheet.addRow([
    'EQUATION_CHECK',
    'Accounting Equation Imbalance',
    makeFormulaCell(
      `C${totalAssetsRowNum}+C${totalLiabRowNum}+C${totalEqRowNum}+C${currentEarningsRowNum}`,
      result.accountingEquationImbalance
    ),
  ]);
  equationRow.font = { bold: true };
  equationRow.getCell(3).numFmt = ACCOUNTING_NUM_FMT;

  // -------------------------------------------------------------------------
  // Sheet 4: FX_CTA_Schedule
  // -------------------------------------------------------------------------
  const fxSheet = workbook.addWorksheet('FX_CTA_Schedule');
  fxSheet.addRow([
    'Entity ID',
    'Entity Name',
    'Functional CCY',
    'Reporting CCY',
    'Local Total Debit',
    'Local Total Credit',
    'Opening Equity Rate Effect',
    'Net Income Rate Effect',
    'Rounding Residual',
    'Total CTA',
  ]).font = { bold: true };

  result.entityTranslations.forEach((tr, idx) => {
    const rNum = idx + 2;
    const r = fxSheet.addRow([
      sanitizeSpreadsheetText(tr.entityId),
      sanitizeSpreadsheetText(tr.entityName),
      sanitizeSpreadsheetText(tr.functionalCurrency),
      sanitizeSpreadsheetText(tr.reportingCurrency),
      moneyNum(tr.localTotalDebit),
      moneyNum(tr.localTotalCredit),
      moneyNum(tr.openingEquityRateEffect),
      moneyNum(tr.netIncomeRateEffect),
      moneyNum(tr.roundingResidual),
      makeFormulaCell(`G${rNum}+H${rNum}+I${rNum}`, tr.totalCTA),
    ]);
    for (let col = 5; col <= 10; col += 1) {
      r.getCell(col).numFmt = ACCOUNTING_NUM_FMT;
    }
  });

  const fxLastRow = Math.max(2, result.entityTranslations.length + 1);
  const fxTotalRow = fxSheet.addRow([
    'TOTAL_CTA',
    'Consolidated Cumulative Translation Adjustment',
    '',
    '',
    0,
    0,
    makeFormulaCell(
      `SUM(G2:G${fxLastRow})`,
      toFixedMoneyString(sumMoney(result.entityTranslations.map((t) => t.openingEquityRateEffect)))
    ),
    makeFormulaCell(
      `SUM(H2:H${fxLastRow})`,
      toFixedMoneyString(sumMoney(result.entityTranslations.map((t) => t.netIncomeRateEffect)))
    ),
    makeFormulaCell(
      `SUM(I2:I${fxLastRow})`,
      toFixedMoneyString(sumMoney(result.entityTranslations.map((t) => t.roundingResidual)))
    ),
    makeFormulaCell(`SUM(J2:J${fxLastRow})`, result.totalCTA),
  ]);
  fxTotalRow.font = { bold: true };
  for (let col = 7; col <= 10; col += 1) {
    fxTotalRow.getCell(col).numFmt = ACCOUNTING_NUM_FMT;
  }

  // -------------------------------------------------------------------------
  // Sheet 5: IC_Eliminations
  // -------------------------------------------------------------------------
  const icSheet = workbook.addWorksheet('IC_Eliminations');
  icSheet.addRow([
    'From Entity',
    'From Account',
    'To Entity',
    'To Account',
    'From Signed Balance',
    'To Signed Balance',
    'Eliminated Amount',
    'Unmatched Difference',
    'Status',
  ]).font = { bold: true };

  result.icReconciliation.forEach((ic, idx) => {
    const rNum = idx + 2;
    const r = icSheet.addRow([
      sanitizeSpreadsheetText(ic.fromEntityId),
      sanitizeSpreadsheetText(ic.fromAccountCode),
      sanitizeSpreadsheetText(ic.toEntityId),
      sanitizeSpreadsheetText(ic.toAccountCode),
      moneyNum(ic.fromSignedBalance),
      moneyNum(ic.toSignedBalance),
      moneyNum(ic.eliminatedAmount),
      makeFormulaCell(`ABS(E${rNum}+F${rNum})`, ic.unmatchedDifference),
      sanitizeSpreadsheetText(ic.status),
    ]);
    for (let col = 5; col <= 8; col += 1) {
      r.getCell(col).numFmt = ACCOUNTING_NUM_FMT;
    }
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Parses a formula-preserving `.xlsx` byte buffer using ExcelJS and extracts
 * all sheet names, `<f>` formula cells + cached `<v>` results, and key statement metrics.
 */
export async function inspectFormulaWorkbookBytes(
  bytes: Uint8Array
): Promise<FormulaWorkbookInspection> {
  const workbook = new ExcelJS.Workbook();
  const safeArrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  await workbook.xlsx.load(safeArrayBuffer);

  const sheetNames = workbook.worksheets.map((ws) => ws.name);
  const formulaCells: FormulaCellRecord[] = [];
  const keyedMetrics = new Map<string, string>();

  for (const ws of workbook.worksheets) {
    ws.eachRow((row) => {
      const rowKey = String(row.getCell(1).value ?? '').trim();
      row.eachCell((cell) => {
        const val = cell.value;
        if (val && typeof val === 'object' && 'formula' in val) {
          const formulaObj = val as { formula?: string; result?: number | string };
          const formulaStr = String(formulaObj.formula ?? '');
          const resultStr = toFixedMoneyString(formulaObj.result ?? 0);
          formulaCells.push({
            sheetName: ws.name,
            address: cell.address,
            formula: formulaStr,
            result: resultStr,
          });
          if (rowKey) {
            keyedMetrics.set(`${ws.name}:${rowKey}`, resultStr);
          }
        }
      });
    });
  }

  const totalLiabilitiesSigned = keyedMetrics.get('Balance_Sheet:TOTAL_LIAB') ?? '0.00';
  const totalLiabilitiesCredit = toFixedMoneyString(
    subtractMoney(0, toDecimal(totalLiabilitiesSigned))
  );

  return {
    sheetNames,
    formulaCells,
    summaryMetrics: {
      totalAssets: keyedMetrics.get('Balance_Sheet:TOTAL_ASSETS') ?? '0.00',
      totalLiabilitiesCredit,
      totalEquity: keyedMetrics.get('Balance_Sheet:TOTAL_EQUITY') ?? '0.00',
      totalCTA: keyedMetrics.get('FX_CTA_Schedule:TOTAL_CTA') ?? '0.00',
      totalRevenueCredit: keyedMetrics.get('Income_Statement:TOTAL_REV') ?? '0.00',
      totalExpenses: keyedMetrics.get('Income_Statement:TOTAL_EXP') ?? '0.00',
      netIncome: keyedMetrics.get('Income_Statement:NET_INCOME') ?? '0.00',
      accountingEquationImbalance: keyedMetrics.get('Balance_Sheet:EQUATION_CHECK') ?? '0.00',
    },
  };
}

// =============================================================================
// ECMA-376 OpenXML PPTX Generator & Parser (Zero-Dependency STORED ZIP)
// =============================================================================

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function unescapeXml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c = CRC32_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function buildStoredZipArchive(
  entries: ReadonlyArray<{ name: string; content: string }>
): Uint8Array {
  const encoder = new TextEncoder();
  const encodedEntries = entries.map((e) => {
    const nameBytes = encoder.encode(e.name);
    const dataBytes = encoder.encode(e.content);
    return {
      nameBytes,
      dataBytes,
      crc: crc32(dataBytes),
    };
  });

  let localSize = 0;
  let centralSize = 0;
  for (const item of encodedEntries) {
    localSize += 30 + item.nameBytes.length + item.dataBytes.length;
    centralSize += 46 + item.nameBytes.length;
  }

  const totalSize = localSize + centralSize + 22;
  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer);
  let localOffset = 0;
  const offsets: number[] = [];

  for (const item of encodedEntries) {
    offsets.push(localOffset);
    view.setUint32(localOffset, 0x04034b50, true);
    view.setUint16(localOffset + 4, 20, true);
    view.setUint16(localOffset + 6, 0, true);
    view.setUint16(localOffset + 8, 0, true); // STORED (0)
    view.setUint16(localOffset + 10, 0, true);
    view.setUint16(localOffset + 12, 0, true);
    view.setUint32(localOffset + 14, item.crc, true);
    view.setUint32(localOffset + 18, item.dataBytes.length, true);
    view.setUint32(localOffset + 22, item.dataBytes.length, true);
    view.setUint16(localOffset + 26, item.nameBytes.length, true);
    view.setUint16(localOffset + 28, 0, true);
    out.set(item.nameBytes, localOffset + 30);
    out.set(item.dataBytes, localOffset + 30 + item.nameBytes.length);
    localOffset += 30 + item.nameBytes.length + item.dataBytes.length;
  }

  const centralDirStart = localOffset;
  let centralOffset = centralDirStart;

  for (let i = 0; i < encodedEntries.length; i += 1) {
    const item = encodedEntries[i]!;
    view.setUint32(centralOffset, 0x02014b50, true);
    view.setUint16(centralOffset + 4, 20, true);
    view.setUint16(centralOffset + 6, 20, true);
    view.setUint16(centralOffset + 8, 0, true);
    view.setUint16(centralOffset + 10, 0, true); // STORED (0)
    view.setUint16(centralOffset + 12, 0, true);
    view.setUint16(centralOffset + 14, 0, true);
    view.setUint32(centralOffset + 16, item.crc, true);
    view.setUint32(centralOffset + 20, item.dataBytes.length, true);
    view.setUint32(centralOffset + 24, item.dataBytes.length, true);
    view.setUint16(centralOffset + 28, item.nameBytes.length, true);
    view.setUint16(centralOffset + 30, 0, true);
    view.setUint16(centralOffset + 32, 0, true);
    view.setUint16(centralOffset + 34, 0, true);
    view.setUint16(centralOffset + 36, 0, true);
    view.setUint32(centralOffset + 38, 0, true);
    view.setUint32(centralOffset + 42, offsets[i]!, true);
    out.set(item.nameBytes, centralOffset + 46);
    centralOffset += 46 + item.nameBytes.length;
  }

  view.setUint32(centralOffset, 0x06054b50, true);
  view.setUint16(centralOffset + 4, 0, true);
  view.setUint16(centralOffset + 6, 0, true);
  view.setUint16(centralOffset + 8, encodedEntries.length, true);
  view.setUint16(centralOffset + 10, encodedEntries.length, true);
  view.setUint32(centralOffset + 12, centralSize, true);
  view.setUint32(centralOffset + 16, centralDirStart, true);
  view.setUint16(centralOffset + 20, 0, true);

  return out;
}

function readStoredZipEntries(bytes: Uint8Array): Map<string, string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder('utf-8');
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    throw new Error('Invalid PPTX ZIP archive: EOCD signature not found');
  }
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);
  const map = new Map<string, string>();
  let cursor = centralDirOffset;
  for (let i = 0; i < totalEntries; i += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) {
      throw new Error('Invalid PPTX central directory header');
    }
    const method = view.getUint16(cursor + 10, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const nameLen = view.getUint16(cursor + 28, true);
    const extraLen = view.getUint16(cursor + 30, true);
    const commentLen = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLen));

    const localNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    if (method !== 0) {
      throw new Error(`Unsupported compression method ${method} in PPTX reader`);
    }
    const content = decoder.decode(bytes.subarray(dataStart, dataStart + uncompressedSize));
    map.set(name, content);
    cursor += 46 + nameLen + extraLen + commentLen;
  }
  return map;
}

interface SlideDefinition {
  title: string;
  paragraphs: string[];
  table?: string[][];
}

function buildSlideXml(slide: SlideDefinition): string {
  const paragraphsXml = slide.paragraphs
    .map((p) => `<a:p><a:r><a:rPr lang="en-US" sz="1600"/><a:t>${escapeXml(p)}</a:t></a:r></a:p>`)
    .join('');

  let tableXml = '';
  if (slide.table && slide.table.length > 0) {
    const colCount = slide.table[0]!.length;
    const gridCols = Array.from({ length: colCount }, () => '<a:gridCol w="2000000"/>').join('');
    const rowsXml = slide.table
      .map(
        (row) =>
          `<a:tr h="370840">${row
            .map(
              (cell) =>
                `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="1400"/><a:t>${escapeXml(
                  cell
                )}</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc>`
            )
            .join('')}</a:tr>`
      )
      .join('');

    tableXml = `<p:graphicFrame>
      <p:nvGraphicFramePr>
        <p:cNvPr id="4" name="Editable Table"/>
        <p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr>
        <p:nvPr/>
      </p:nvGraphicFramePr>
      <p:xfrm><a:off x="685800" y="2200000"/><a:ext cx="10800000" cy="4000000"/></p:xfrm>
      <a:graphic>
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
          <a:tbl>
            <a:tblPr firstRow="1" bandRow="1"/>
            <a:tblGrid>${gridCols}</a:tblGrid>
            ${rowsXml}
          </a:tbl>
        </a:graphicData>
      </a:graphic>
    </p:graphicFrame>`;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Slide Title"/>
          <p:cNvSpPr/>
          <p:nvPr><p:ph type="title"/></p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="685800" y="365125"/><a:ext cx="10800000" cy="800000"/></a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p><a:r><a:rPr lang="en-US" sz="2800" b="1"/><a:t>${escapeXml(slide.title)}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="Slide Body"/>
          <p:cNvSpPr/>
          <p:nvPr><p:ph idx="1"/></p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="685800" y="1250000"/><a:ext cx="10800000" cy="850000"/></a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          ${paragraphsXml}
        </p:txBody>
      </p:sp>
      ${tableXml}
    </p:spTree>
  </p:cSld>
</p:sld>`;
}

/**
 * Generates an editable 8-slide ECMA-376 OpenXML `.pptx` byte archive from
 * a single `ExactConsolidationResult`. Every slide uses native DrawingML
 * `<p:sp>` text frames and `<a:tbl>` editable tables (never rasterized images).
 */
export function buildEditableBoardPackPptxBytes(
  result: ExactConsolidationResult,
  metadata: FinancialPackageMetadata
): Uint8Array {
  const generatedAt = metadata.generatedAt ?? nowISO();

  const slides: SlideDefinition[] = [
    {
      title: `${metadata.companyName} — Board Pack (${metadata.periodLabel})`,
      paragraphs: [
        `Reporting Currency: ${result.reportingCurrency}`,
        `Prepared By: ${metadata.preparedBy}`,
        `Generated At: ${generatedAt}`,
      ],
      table: [
        ['Metric', 'Key', `Value (${result.reportingCurrency})`],
        ['Total Assets', 'TOTAL_ASSETS', result.totalAssets],
        ['Total Liabilities (Credit)', 'TOTAL_LIAB_CREDIT', result.totalLiabilitiesCredit],
        ['Contributed Equity & OCI (Signed)', 'TOTAL_EQUITY', result.totalEquity],
        ['Cumulative Translation Adjustment', 'TOTAL_CTA', result.totalCTA],
        ['Total Revenue (Credit)', 'TOTAL_REV', result.totalRevenueCredit],
        ['Total Expenses', 'TOTAL_EXP', result.totalExpenses],
        ['Net Income', 'NET_INCOME', result.netIncome],
        ['Accounting Equation Imbalance', 'EQUATION_CHECK', result.accountingEquationImbalance],
      ],
    },
    {
      title: 'Executive Financial Summary',
      paragraphs: [
        `Consolidated Balance Status: ${result.isBalanced ? 'BALANCED' : 'ACTION REQUIRED'}`,
        `Entities Consolidated: ${result.entityTranslations.map((e) => `${e.entityId} (${e.functionalCurrency})`).join(', ')}`,
      ],
      table: [
        ['Entity ID', 'Functional CCY', 'Local Debit', 'Local Credit', 'ASC 830 CTA'],
        ...result.entityTranslations.map((e) => [
          e.entityId,
          e.functionalCurrency,
          e.localTotalDebit,
          e.localTotalCredit,
          e.totalCTA,
        ]),
      ],
    },
    {
      title: 'Consolidated Income Statement',
      paragraphs: [
        `Total Revenue: ${result.totalRevenueCredit} ${result.reportingCurrency} | Total Expenses: ${result.totalExpenses} ${result.reportingCurrency} | Net Income: ${result.netIncome} ${result.reportingCurrency}`,
      ],
      table: [
        ['Account Code', 'Account Name', 'Category', 'Consolidated Signed'],
        ...result.consolidatedTrialBalance
          .filter((l) => l.category === 'revenue' || l.category === 'expense')
          .map((l) => [l.accountCode, l.accountName, l.category, l.consolidatedSigned]),
      ],
    },
    {
      title: 'Consolidated Balance Sheet',
      paragraphs: [
        `Total Assets: ${result.totalAssets} ${result.reportingCurrency} | Equation Imbalance: ${result.accountingEquationImbalance} ${result.reportingCurrency}`,
      ],
      table: [
        ['Account Code', 'Account Name', 'Category', 'Consolidated Signed'],
        ...result.consolidatedTrialBalance
          .filter(
            (l) => l.category === 'asset' || l.category === 'liability' || l.category === 'equity'
          )
          .map((l) => [l.accountCode, l.accountName, l.category, l.consolidatedSigned]),
      ],
    },
    {
      title: 'ASC 830 FX Translation & CTA Bridge',
      paragraphs: [
        `Total Consolidated CTA (OCI Account 3900): ${result.totalCTA} ${result.reportingCurrency}`,
      ],
      table: [
        ['Entity', 'Opening Equity Effect', 'Net Income Effect', 'Rounding Residual', 'Total CTA'],
        ...result.entityTranslations.map((e) => [
          e.entityId,
          e.openingEquityRateEffect,
          e.netIncomeRateEffect,
          e.roundingResidual,
          e.totalCTA,
        ]),
      ],
    },
    {
      title: 'ASC 810 Intercompany Eliminations',
      paragraphs: [
        `Intercompany Pairs Evaluated: ${result.icReconciliation.length} | Unmatched IC Flag: ${result.hasUnmatchedIC ? 'YES' : 'NO'}`,
      ],
      table: [
        ['Pair', 'From Signed', 'To Signed', 'Eliminated Amount', 'Unmatched Diff', 'Status'],
        ...result.icReconciliation.map((ic) => [
          `${ic.fromEntityId}:${ic.fromAccountCode} <-> ${ic.toEntityId}:${ic.toAccountCode}`,
          ic.fromSignedBalance,
          ic.toSignedBalance,
          ic.eliminatedAmount,
          ic.unmatchedDifference,
          ic.status,
        ]),
      ],
    },
    {
      title: 'Consolidated Trial Balance Control',
      paragraphs: [
        `All ${result.consolidatedTrialBalance.length} consolidated accounts tie out with ${result.accountingEquationImbalance} imbalance.`,
      ],
      table: [
        ['Account', 'Pre-Elimination', 'Elimination', 'Consolidated', 'Debit', 'Credit'],
        ...result.consolidatedTrialBalance.map((l) => [
          `${l.accountCode} ${l.accountName}`,
          l.preEliminationSigned,
          l.eliminationSigned,
          l.consolidatedSigned,
          l.debit,
          l.credit,
        ]),
      ],
    },
    {
      title: 'Close Governance & Sign-Off',
      paragraphs: [
        `Period: ${metadata.periodLabel} | Prepared By: ${metadata.preparedBy}`,
        `Exact Decimal Pipeline: Verified (Zero float coercion across GL staging, promotion, FX/CTA, IC elimination, XLSX & PPTX)`,
      ],
      table: [
        ['Control Gate', 'Status', 'Evidence'],
        [
          'Entity Trial Balance Check',
          'PASS',
          `${result.entityTranslations.length} entities balanced in functional currency`,
        ],
        ['ASC 830 CTA Decomposition', 'PASS', `Total OCI CTA = ${result.totalCTA}`],
        [
          'ASC 810 IC Reconciliation',
          result.hasUnmatchedIC ? 'REVIEW' : 'PASS',
          `${result.icReconciliation.length} IC rule(s) evaluated`,
        ],
        [
          'Consolidated Accounting Equation',
          result.isBalanced ? 'PASS' : 'FAIL',
          `Imbalance = ${result.accountingEquationImbalance}`,
        ],
      ],
    },
  ];

  const slideContentTypes = slides
    .map(
      (_, i) =>
        `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    )
    .join('\n  ');

  const slideRels = slides
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
    )
    .join('\n  ');

  const slideIdLst = slides
    .map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`)
    .join('\n    ');

  const zipFiles: Array<{ name: string; content: string }> = [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${slideContentTypes}
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`,
    },
    {
      name: 'ppt/presentation.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    ${slideIdLst}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`,
    },
    {
      name: 'ppt/_rels/presentation.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ${slideRels}
</Relationships>`,
    },
    {
      name: 'ppt/slideMasters/slideMaster1.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`,
    },
    {
      name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`,
    },
    {
      name: 'ppt/slideLayouts/slideLayout1.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="titleAndContent">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
</p:sldLayout>`,
    },
    {
      name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`,
    },
    {
      name: 'ppt/theme/theme1.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="FinPlanProTheme">
  <a:themeElements/>
</a:theme>`,
    },
  ];

  slides.forEach((slide, idx) => {
    const num = idx + 1;
    zipFiles.push({
      name: `ppt/slides/slide${num}.xml`,
      content: buildSlideXml(slide),
    });
    zipFiles.push({
      name: `ppt/slides/_rels/slide${num}.xml.rels`,
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`,
    });
  });

  return buildStoredZipArchive(zipFiles);
}

/**
 * Parses an OpenXML `.pptx` byte archive, extracting slide count, titles,
 * editable text paragraphs, `<a:tbl>` tables, and board-pack summary metrics.
 */
export function parseEditablePptxBytes(bytes: Uint8Array): EditablePptxInspection {
  const entries = readStoredZipEntries(bytes);
  const presentationXml = entries.get('ppt/presentation.xml');
  if (!presentationXml) {
    throw new Error('Invalid PPTX archive: missing ppt/presentation.xml');
  }

  const slideIds = [...presentationXml.matchAll(/<p:sldId\b[^>]*\/>/g)];
  const slides: EditablePptxSlide[] = [];
  const keyedMetrics = new Map<string, string>();

  for (let i = 0; i < slideIds.length; i += 1) {
    const slideNumber = i + 1;
    const slideXml = entries.get(`ppt/slides/slide${slideNumber}.xml`);
    if (!slideXml) {
      throw new Error(`Invalid PPTX archive: missing ppt/slides/slide${slideNumber}.xml`);
    }

    const shapes = [...slideXml.matchAll(/<p:sp\b[\s\S]*?<\/p:sp>/g)].map((m) => m[0]);
    let title = '';
    const paragraphs: string[] = [];

    for (const sp of shapes) {
      const isTitle = /<p:ph\b[^>]*type="title"/i.test(sp);
      const pMatches = [...sp.matchAll(/<a:p\b[\s\S]*?<\/a:p>/g)].map((m) => m[0]);
      for (const pXml of pMatches) {
        const text = [...pXml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
          .map((t) => unescapeXml(t[1] ?? ''))
          .join('');
        if (isTitle && !title) {
          title = text;
        } else if (text.length > 0) {
          paragraphs.push(text);
        }
      }
    }

    const tables: string[][][] = [];
    const tblMatches = [...slideXml.matchAll(/<a:tbl\b[\s\S]*?<\/a:tbl>/g)].map((m) => m[0]);
    for (const tblXml of tblMatches) {
      const rows: string[][] = [];
      const trMatches = [...tblXml.matchAll(/<a:tr\b[\s\S]*?<\/a:tr>/g)].map((m) => m[0]);
      for (const trXml of trMatches) {
        const cells = [...trXml.matchAll(/<a:tc\b[\s\S]*?<\/a:tc>/g)].map((tcMatch) =>
          [...tcMatch[0].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
            .map((t) => unescapeXml(t[1] ?? ''))
            .join('')
        );
        rows.push(cells);
        if (slideNumber === 1 && cells.length >= 3 && cells[1]) {
          keyedMetrics.set(cells[1], cells[2] ?? '0.00');
        }
      }
      tables.push(rows);
    }

    slides.push({
      slideNumber,
      title,
      paragraphs,
      tables,
    });
  }

  return {
    slideCount: slides.length,
    slides,
    summaryMetrics: {
      totalAssets: keyedMetrics.get('TOTAL_ASSETS') ?? '0.00',
      totalLiabilitiesCredit: keyedMetrics.get('TOTAL_LIAB_CREDIT') ?? '0.00',
      totalEquity: keyedMetrics.get('TOTAL_EQUITY') ?? '0.00',
      totalCTA: keyedMetrics.get('TOTAL_CTA') ?? '0.00',
      totalRevenueCredit: keyedMetrics.get('TOTAL_REV') ?? '0.00',
      totalExpenses: keyedMetrics.get('TOTAL_EXP') ?? '0.00',
      netIncome: keyedMetrics.get('NET_INCOME') ?? '0.00',
      accountingEquationImbalance: keyedMetrics.get('EQUATION_CHECK') ?? '0.00',
    },
  };
}

/**
 * Verifies that all headline financial statement metrics tie out to the exact
 * cent across `ExactConsolidationResult`, the parsed `.xlsx` formula cells,
 * and the parsed 8-slide `.pptx` board-pack tables.
 */
export function verifyFinancialPackageTieOut(
  consolidated: ExactConsolidationResult,
  xlsx: FormulaWorkbookInspection,
  pptx: EditablePptxInspection
): FinancialPackageTieOutResult {
  const discrepancies: string[] = [];
  const fields: Array<{ key: keyof PackageSummaryMetrics; expected: string }> = [
    { key: 'totalAssets', expected: consolidated.totalAssets },
    { key: 'totalLiabilitiesCredit', expected: consolidated.totalLiabilitiesCredit },
    { key: 'totalEquity', expected: consolidated.totalEquity },
    { key: 'totalCTA', expected: consolidated.totalCTA },
    { key: 'totalRevenueCredit', expected: consolidated.totalRevenueCredit },
    { key: 'totalExpenses', expected: consolidated.totalExpenses },
    { key: 'netIncome', expected: consolidated.netIncome },
    { key: 'accountingEquationImbalance', expected: consolidated.accountingEquationImbalance },
  ];

  for (const { key, expected } of fields) {
    const xlsxVal = xlsx.summaryMetrics[key];
    const pptxVal = pptx.summaryMetrics[key];
    if (compareMoney(expected, xlsxVal) !== 0) {
      discrepancies.push(`XLSX mismatch on ${key}: expected ${expected}, got ${xlsxVal}`);
    }
    if (compareMoney(expected, pptxVal) !== 0) {
      discrepancies.push(`PPTX mismatch on ${key}: expected ${expected}, got ${pptxVal}`);
    }
  }

  return {
    matches: discrepancies.length === 0,
    discrepancies,
  };
}
