import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { XLSXTokenizationError, stageGLXlsxImport, tokenizeGLXlsxBytes } from './glXlsxTokenizer';
import { createGLStagingRepository, type StagingStoragePort } from './glStagingRepository';
import { ingestGLRows } from '@/engines/SmartImportMapper';
import type { GLIngestChunkInput } from '@/types/glIngestion';

function memoryPort(): StagingStoragePort {
  const map = new Map<string, string>();
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => {
      map.set(key, value);
    },
    removeItem: async (key) => {
      map.delete(key);
    },
  };
}

const baseConfig: Omit<GLIngestChunkInput, 'rows' | 'firstRowNumber' | 'rowNumbers'> = {
  headers: ['AccountCode', 'PostDate', 'Debit', 'Credit', 'EntityId', 'Currency', 'JournalId'],
  sourceId: 'd365-xlsx-gl',
  knownAccountCodes: ['1000', '2000', '4000'],
  knownEntityIds: ['US01'],
  expectedCurrency: 'USD',
  dateOrder: 'ISO_ONLY',
};

async function buildWorkbookBytes(
  populate: (sheet: ExcelJS.Worksheet, workbook: ExcelJS.Workbook) => void
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('GL Export');
  populate(sheet, workbook);
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

describe('tokenizeGLXlsxBytes & stageGLXlsxImport', () => {
  it('streams worksheet rows in chunks with physical Excel row numbers across blank rows and Date cells', async () => {
    const bytes = await buildWorkbookBytes((sheet) => {
      sheet.getRow(1).values = [
        'AccountCode',
        'PostDate',
        'Debit',
        'Credit',
        'EntityId',
        'Currency',
        'JournalId',
      ];
      sheet.getRow(2).values = [
        '1000',
        new Date(Date.UTC(2026, 2, 31)),
        '0.10',
        '0.00',
        'US01',
        'USD',
        'J-100',
      ];
      sheet.getRow(2).getCell(2).numFmt = 'yyyy-mm-dd';
      // Row 3 intentionally left blank
      sheet.getRow(4).values = ['1000', '2026-03-31', '0.20', '0.00', 'US01', 'USD', 'J-100'];
      sheet.getRow(5).values = ['2000', '2026-03-31', '0.00', '0.30', 'US01', 'USD', 'J-100'];
    });

    const tokenStream = await tokenizeGLXlsxBytes(bytes, {
      sheetName: 'GL Export',
      maxRowsPerChunk: 2,
    });
    expect(tokenStream.sheetName).toBe('GL Export');
    expect(tokenStream.headerLine).toBe(1);
    expect(tokenStream.headers).toEqual([
      'AccountCode',
      'PostDate',
      'Debit',
      'Credit',
      'EntityId',
      'Currency',
      'JournalId',
    ]);

    const chunks = [];
    for await (const chunk of tokenStream.chunks) {
      chunks.push(chunk);
    }
    expect(chunks).toHaveLength(2);
    expect(chunks[0]!.rowNumbers).toEqual([2, 4]);
    expect(chunks[0]!.rows[0]!.PostDate).toBe('2026-03-31');
    expect(chunks[1]!.rowNumbers).toEqual([5]);

    const repository = createGLStagingRepository(memoryPort());
    const manifest = await stageGLXlsxImport({
      batchId: 'xlsx-stage-1',
      source: bytes,
      sheetName: 'GL Export',
      maxRowsPerChunk: 2,
      config: baseConfig,
      repository,
      compute: async (chunk) => ingestGLRows(chunk),
    });

    expect(manifest.status).toBe('ready');
    expect(manifest.chunkCount).toBe(2);
    expect(manifest.acceptedCount).toBe(3);
    expect(manifest.controlTotals).toEqual({
      debit: '0.30',
      credit: '0.30',
      imbalance: '0.00',
    });
  });

  it('preserves beyond-IEEE-754 exact numeric cell lexemes from worksheet XML without float precision loss', async () => {
    const bytes = await buildWorkbookBytes((sheet) => {
      sheet.getRow(1).values = [
        'AccountCode',
        'PostDate',
        'Debit',
        'Credit',
        'EntityId',
        'Currency',
        'JournalId',
      ];
      sheet.getRow(2).values = ['1000', '2026-03-31', 123.45, 0, 'US01', 'USD', 'J-BIG'];
      sheet.getRow(3).values = ['2000', '2026-03-31', 0, 123.45, 'US01', 'USD', 'J-BIG'];
    });

    // Replace 123.45 in the worksheet XML with 9007199254740993.15 (which IEEE-754 parseFloat corrupts to 9007199254740992)
    const patchedBytes = await replaceWorksheetXmlText(
      bytes,
      '<v>123.45</v>',
      '<v>9007199254740993.15</v>'
    );

    const repository = createGLStagingRepository(memoryPort());
    const manifest = await stageGLXlsxImport({
      batchId: 'xlsx-exact-lexeme',
      source: patchedBytes,
      config: baseConfig,
      repository,
      compute: async (chunk) => ingestGLRows(chunk),
    });

    expect(manifest.status).toBe('ready');
    expect(manifest.controlTotals).toEqual({
      debit: '9007199254740993.15',
      credit: '9007199254740993.15',
      imbalance: '0.00',
    });
  });

  it('fails closed on corrupt ZIP archives, missing sheets, duplicate headers, and unevaluated formulas', async () => {
    await expect(
      tokenizeGLXlsxBytes(new Uint8Array([0x00, 0x01, 0x02, 0x03]))
    ).rejects.toBeInstanceOf(XLSXTokenizationError);

    const dupHeaderBytes = await buildWorkbookBytes((sheet) => {
      sheet.getRow(1).values = ['AccountCode', 'AccountCode'];
      sheet.getRow(2).values = ['1000', '2000'];
    });
    await expect(tokenizeGLXlsxBytes(dupHeaderBytes)).rejects.toMatchObject({
      code: 'DUPLICATE_HEADER',
    });

    const missingSheetBytes = await buildWorkbookBytes((sheet) => {
      sheet.getRow(1).values = ['AccountCode'];
      sheet.getRow(2).values = ['1000'];
    });
    await expect(
      tokenizeGLXlsxBytes(missingSheetBytes, { sheetName: 'NonExistent' })
    ).rejects.toMatchObject({
      code: 'SHEET_NOT_FOUND',
    });

    const unevaluatedFormulaBytes = await buildWorkbookBytes((sheet) => {
      sheet.getRow(1).values = ['AccountCode', 'Debit'];
      sheet.getRow(2).getCell(1).value = '1000';
      sheet.getRow(2).getCell(2).value = { formula: 'SUM(A1:A1)' } as ExcelJS.CellFormulaValue;
    });
    const tokenStream = await tokenizeGLXlsxBytes(unevaluatedFormulaBytes);
    await expect(
      (async () => {
        for await (const _chunk of tokenStream.chunks) {
          // consume
        }
      })()
    ).rejects.toMatchObject({
      code: 'UNEVALUATED_FORMULA_CELL',
    });
  });
});

async function replaceWorksheetXmlText(
  zipBytes: Uint8Array,
  search: string,
  replacement: string
): Promise<Uint8Array> {
  const { rewriteZipEntryText } = await import('./glXlsxTokenizer');
  return rewriteZipEntryText(zipBytes, 'xl/worksheets/sheet1.xml', (xml) =>
    xml.split(search).join(replacement)
  );
}
