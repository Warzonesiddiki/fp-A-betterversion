/**
 * Streaming-chunked XLSX worksheet tokenizer for exact GL staging (DEC-010 Step 1).
 *
 * Reads OOXML worksheet XML directly from the `.xlsx` ZIP archive via Web
 * `DecompressionStream('deflate-raw')` instead of `ExcelJS.Workbook.xlsx.load`,
 * so numeric `<v>` lexemes (including >53-bit exact decimal strings) are never
 * coerced through IEEE-754 `parseFloat`/`Number`.
 */
import { toDecimal } from '@/utils/money';
import { sha256HexBytes } from '@/utils/sha256';
import { MAX_GL_CHUNK_ROWS } from '@/workers/glIngestionRequest';
import type { GLIngestChunkInput } from '@/types/glIngestion';
import {
  stageGLImport,
  type GLStagingChunkSlice,
  type StageGLImportDependencies,
} from './glStagingCoordinator';
import type { GLStagingManifest } from './glStagingRepository';

export type XLSXTokenizationErrorCode =
  | 'INVALID_XLSX_ARCHIVE'
  | 'SHEET_NOT_FOUND'
  | 'EMPTY_WORKSHEET'
  | 'DUPLICATE_HEADER'
  | 'COLUMN_COUNT_MISMATCH'
  | 'INVALID_SHARED_STRING'
  | 'UNEVALUATED_FORMULA_CELL'
  | 'INVALID_CHUNK_SIZE';

export class XLSXTokenizationError extends Error {
  readonly code: XLSXTokenizationErrorCode;
  readonly physicalRow: number;

  constructor(code: XLSXTokenizationErrorCode, message: string, physicalRow = 1) {
    super(message);
    this.name = 'XLSXTokenizationError';
    this.code = code;
    this.physicalRow = physicalRow;
  }
}

export interface TokenizeGLXlsxOptions {
  readonly sheetName?: string;
  readonly maxRowsPerChunk?: number;
}

export interface TokenizedGLXlsxStream {
  readonly sheetName: string;
  readonly headers: readonly string[];
  readonly headerLine: number;
  readonly chunks: AsyncGenerator<GLStagingChunkSlice, void, undefined>;
}

export interface StageGLXlsxImportInput extends TokenizeGLXlsxOptions {
  readonly batchId: string;
  readonly source: Uint8Array | ArrayBuffer;
  readonly fileHash?: string;
  readonly config: Omit<
    GLIngestChunkInput,
    'rows' | 'headers' | 'firstRowNumber' | 'rowNumbers'
  > & {
    readonly headers?: readonly string[];
  };
  readonly signal?: AbortSignal;
  readonly lockOwnerId?: string;
  readonly lockTtlMs?: number;
}

interface ZipCentralEntry {
  readonly fileName: string;
  readonly compressionMethod: number;
  readonly compressedSize: number;
  readonly uncompressedSize: number;
  readonly localHeaderOffset: number;
}

const BUILTIN_DATE_NUMFMT_IDS = new Set([
  14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51,
  52, 53, 54, 55, 56, 57, 58,
]);

function toUint8Array(input: Uint8Array | ArrayBuffer): Uint8Array {
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }
  return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
}

function readU16LE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

function readU32LE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) |
      ((bytes[offset + 1] ?? 0) << 8) |
      ((bytes[offset + 2] ?? 0) << 16) |
      ((bytes[offset + 3] ?? 0) << 24)) >>>
    0
  );
}

function writeU16LE(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
}

function writeU32LE(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function parseZipCentralDirectory(bytes: Uint8Array): Map<string, ZipCentralEntry> {
  if (bytes.byteLength < 22 || readU32LE(bytes, 0) !== 0x04034b50) {
    throw new XLSXTokenizationError(
      'INVALID_XLSX_ARCHIVE',
      'Input is not a valid XLSX ZIP archive.'
    );
  }
  let eocdOffset = -1;
  const minOffset = Math.max(0, bytes.byteLength - 65557);
  for (let i = bytes.byteLength - 22; i >= minOffset; i--) {
    if (readU32LE(bytes, i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    throw new XLSXTokenizationError(
      'INVALID_XLSX_ARCHIVE',
      'XLSX ZIP End of Central Directory record not found.'
    );
  }
  const totalEntries = readU16LE(bytes, eocdOffset + 10);
  const cdOffset = readU32LE(bytes, eocdOffset + 16);
  const decoder = new TextDecoder('utf-8');
  const entries = new Map<string, ZipCentralEntry>();
  let cursor = cdOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (cursor + 46 > bytes.byteLength || readU32LE(bytes, cursor) !== 0x02014b50) {
      throw new XLSXTokenizationError(
        'INVALID_XLSX_ARCHIVE',
        'Corrupt XLSX ZIP Central Directory header.'
      );
    }
    const compressionMethod = readU16LE(bytes, cursor + 10);
    const compressedSize = readU32LE(bytes, cursor + 20);
    const uncompressedSize = readU32LE(bytes, cursor + 24);
    const fileNameLen = readU16LE(bytes, cursor + 28);
    const extraLen = readU16LE(bytes, cursor + 30);
    const commentLen = readU16LE(bytes, cursor + 32);
    const localHeaderOffset = readU32LE(bytes, cursor + 42);
    const fileName = decoder
      .decode(bytes.subarray(cursor + 46, cursor + 46 + fileNameLen))
      .replace(/^\/+/, '');
    entries.set(fileName, {
      fileName,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });
    cursor += 46 + fileNameLen + extraLen + commentLen;
  }
  return entries;
}

async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  const payload = new Uint8Array(compressed.byteLength);
  payload.set(compressed);
  void writer.write(payload);
  void writer.close();

  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const part = toUint8Array(value);
    chunks.push(part);
    total += part.byteLength;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of chunks) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

async function readZipEntryBytes(archive: Uint8Array, entry: ZipCentralEntry): Promise<Uint8Array> {
  const offset = entry.localHeaderOffset;
  if (offset + 30 > archive.byteLength || readU32LE(archive, offset) !== 0x04034b50) {
    throw new XLSXTokenizationError(
      'INVALID_XLSX_ARCHIVE',
      `Corrupt local header for "${entry.fileName}".`
    );
  }
  const fileNameLen = readU16LE(archive, offset + 26);
  const extraLen = readU16LE(archive, offset + 28);
  const dataStart = offset + 30 + fileNameLen + extraLen;
  const dataEnd = dataStart + entry.compressedSize;
  if (dataEnd > archive.byteLength) {
    throw new XLSXTokenizationError(
      'INVALID_XLSX_ARCHIVE',
      `Truncated ZIP entry "${entry.fileName}".`
    );
  }
  const slice = archive.subarray(dataStart, dataEnd);
  if (entry.compressionMethod === 0) {
    return slice;
  }
  if (entry.compressionMethod === 8) {
    return inflateRawBytes(slice);
  }
  throw new XLSXTokenizationError(
    'INVALID_XLSX_ARCHIVE',
    `Unsupported ZIP compression method ${entry.compressionMethod} in "${entry.fileName}".`
  );
}

async function readZipEntryText(archive: Uint8Array, entry: ZipCentralEntry): Promise<string> {
  const bytes = await readZipEntryBytes(archive, entry);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.byteLength; i++) {
    c ^= bytes[i]!;
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** Deterministic helper to rewrite an XML entry inside an `.xlsx` buffer (used by high-precision lexeme tests). */
export async function rewriteZipEntryText(
  zipBytes: Uint8Array,
  targetEntryName: string,
  transform: (xml: string) => string
): Promise<Uint8Array> {
  const entries = parseZipCentralDirectory(zipBytes);
  const encoder = new TextEncoder();
  const filePayloads: {
    readonly nameBytes: Uint8Array;
    readonly dataBytes: Uint8Array;
    readonly crc: number;
  }[] = [];

  for (const [name, entry] of entries.entries()) {
    const rawBytes =
      name === targetEntryName
        ? encoder.encode(transform(await readZipEntryText(zipBytes, entry)))
        : await readZipEntryBytes(zipBytes, entry);
    filePayloads.push({
      nameBytes: encoder.encode(name),
      dataBytes: rawBytes,
      crc: crc32(rawBytes),
    });
  }

  let localSize = 0;
  let cdSize = 0;
  for (const item of filePayloads) {
    localSize += 30 + item.nameBytes.byteLength + item.dataBytes.byteLength;
    cdSize += 46 + item.nameBytes.byteLength;
  }

  const out = new Uint8Array(localSize + cdSize + 22);
  let localOffset = 0;
  let cdOffset = localSize;

  for (const item of filePayloads) {
    const entryLocalOffset = localOffset;
    writeU32LE(out, localOffset, 0x04034b50);
    writeU16LE(out, localOffset + 4, 20);
    writeU16LE(out, localOffset + 6, 0);
    writeU16LE(out, localOffset + 8, 0); // stored
    writeU16LE(out, localOffset + 10, 0);
    writeU16LE(out, localOffset + 12, 0);
    writeU32LE(out, localOffset + 14, item.crc);
    writeU32LE(out, localOffset + 18, item.dataBytes.byteLength);
    writeU32LE(out, localOffset + 22, item.dataBytes.byteLength);
    writeU16LE(out, localOffset + 26, item.nameBytes.byteLength);
    writeU16LE(out, localOffset + 28, 0);
    out.set(item.nameBytes, localOffset + 30);
    out.set(item.dataBytes, localOffset + 30 + item.nameBytes.byteLength);
    localOffset += 30 + item.nameBytes.byteLength + item.dataBytes.byteLength;

    writeU32LE(out, cdOffset, 0x02014b50);
    writeU16LE(out, cdOffset + 4, 20);
    writeU16LE(out, cdOffset + 6, 20);
    writeU16LE(out, cdOffset + 8, 0);
    writeU16LE(out, cdOffset + 10, 0);
    writeU16LE(out, cdOffset + 12, 0);
    writeU16LE(out, cdOffset + 14, 0);
    writeU32LE(out, cdOffset + 16, item.crc);
    writeU32LE(out, cdOffset + 20, item.dataBytes.byteLength);
    writeU32LE(out, cdOffset + 24, item.dataBytes.byteLength);
    writeU16LE(out, cdOffset + 28, item.nameBytes.byteLength);
    writeU16LE(out, cdOffset + 30, 0);
    writeU16LE(out, cdOffset + 32, 0);
    writeU16LE(out, cdOffset + 34, 0);
    writeU16LE(out, cdOffset + 36, 0);
    writeU32LE(out, cdOffset + 38, 0);
    writeU32LE(out, cdOffset + 42, entryLocalOffset);
    out.set(item.nameBytes, cdOffset + 46);
    cdOffset += 46 + item.nameBytes.byteLength;
  }

  writeU32LE(out, cdOffset, 0x06054b50);
  writeU16LE(out, cdOffset + 4, 0);
  writeU16LE(out, cdOffset + 6, 0);
  writeU16LE(out, cdOffset + 8, filePayloads.length);
  writeU16LE(out, cdOffset + 10, filePayloads.length);
  writeU32LE(out, cdOffset + 12, cdSize);
  writeU32LE(out, cdOffset + 16, localSize);
  writeU16LE(out, cdOffset + 20, 0);

  return out;
}

function decodeXmlText(raw: string): string {
  return raw
    .replace(/_x([0-9A-Fa-f]{4})_/g, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16))
    )
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function getXmlAttr(tagAttrs: string, attrName: string): string | null {
  const regex = new RegExp(`(?:^|\\s)${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`);
  const match = regex.exec(tagAttrs);
  if (!match) return null;
  return decodeXmlText(match[1] ?? match[2] ?? '');
}

function parseSharedStrings(xml: string): string[] {
  const result: string[] = [];
  const siRegex = /<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g;
  let siMatch: RegExpExecArray | null;
  while ((siMatch = siRegex.exec(xml)) !== null) {
    const withoutPhonetic = siMatch[1]!.replace(
      /<(?:\w+:)?rPh\b[^>]*>[\s\S]*?<\/(?:\w+:)?rPh>/g,
      ''
    );
    const tRegex = /<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g;
    const parts: string[] = [];
    let tMatch: RegExpExecArray | null;
    while ((tMatch = tRegex.exec(withoutPhonetic)) !== null) {
      parts.push(decodeXmlText(tMatch[1]!));
    }
    result.push(parts.join(''));
  }
  return result;
}

function isCustomDateFormatCode(formatCode: string): boolean {
  const cleaned = formatCode
    .replace(/"[^"]*"/g, '')
    .replace(/\\./g, '')
    .replace(/\[[^\]]*\]/g, '')
    .toLowerCase();
  return /[ymd]/.test(cleaned) && !/[#0?]/.test(cleaned);
}

function parseDateStyleIndices(stylesXml: string): Set<number> {
  const customDateFmtIds = new Set<number>();
  const numFmtRegex = /<(?:\w+:)?numFmt\b([^>]*?)\/?>/g;
  let fmtMatch: RegExpExecArray | null;
  while ((fmtMatch = numFmtRegex.exec(stylesXml)) !== null) {
    const idStr = getXmlAttr(fmtMatch[1]!, 'numFmtId');
    const code = getXmlAttr(fmtMatch[1]!, 'formatCode');
    if (idStr !== null && code !== null) {
      const id = Number.parseInt(idStr, 10);
      if (Number.isSafeInteger(id) && isCustomDateFormatCode(code)) {
        customDateFmtIds.add(id);
      }
    }
  }

  const dateStyleIndices = new Set<number>();
  const cellXfsMatch = /<(?:\w+:)?cellXfs\b[^>]*>([\s\S]*?)<\/(?:\w+:)?cellXfs>/.exec(stylesXml);
  if (!cellXfsMatch) return dateStyleIndices;

  const xfRegex = /<(?:\w+:)?xf\b([^>]*?)(?:\/>|>[\s\S]*?<\/(?:\w+:)?xf>)/g;
  let xfMatch: RegExpExecArray | null;
  let xfIndex = 0;
  while ((xfMatch = xfRegex.exec(cellXfsMatch[1]!)) !== null) {
    const idStr = getXmlAttr(xfMatch[1]!, 'numFmtId');
    if (idStr !== null) {
      const id = Number.parseInt(idStr, 10);
      if (BUILTIN_DATE_NUMFMT_IDS.has(id) || customDateFmtIds.has(id)) {
        dateStyleIndices.add(xfIndex);
      }
    }
    xfIndex++;
  }
  return dateStyleIndices;
}

function excelSerialToIsoDate(serialLexeme: string, date1904: boolean): string | null {
  const num = Number(serialLexeme);
  if (!Number.isFinite(num) || num < 1 || num > 2958465) return null;
  const wholeDays = Math.floor(num + 1e-9);
  const unixEpochDays = date1904
    ? wholeDays - 24107
    : wholeDays >= 60
      ? wholeDays - 25569
      : wholeDays - 25568;
  const utcMs = unixEpochDays * 86_400_000;
  const d = new Date(utcMs);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function columnLettersToIndex(cellRef: string): number | null {
  const match = /^([A-Za-z]+)\d+$/.exec(cellRef.trim());
  if (!match) return null;
  const letters = match[1]!.toUpperCase();
  let index = 0;
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64);
  }
  return index - 1;
}

function resolveWorksheetEntry(
  entries: Map<string, ZipCentralEntry>,
  workbookXml: string,
  relsXml: string,
  requestedSheetName?: string
): { readonly sheetName: string; readonly entry: ZipCentralEntry; readonly date1904: boolean } {
  const date1904Match = /<(?:\w+:)?workbookPr\b([^>]*?)\/?>/.exec(workbookXml);
  const date1904Attr = date1904Match ? getXmlAttr(date1904Match[1]!, 'date1904') : null;
  const date1904 = date1904Attr === '1' || date1904Attr === 'true';

  const relTargetById = new Map<string, string>();
  const relRegex = /<(?:\w+:)?Relationship\b([^>]*?)\/?>/g;
  let relMatch: RegExpExecArray | null;
  while ((relMatch = relRegex.exec(relsXml)) !== null) {
    const id = getXmlAttr(relMatch[1]!, 'Id');
    const target = getXmlAttr(relMatch[1]!, 'Target');
    if (id && target) {
      const normalized = target.startsWith('/')
        ? target.replace(/^\/+/, '')
        : target.startsWith('xl/')
          ? target
          : `xl/${target.replace(/^\.\//, '')}`;
      relTargetById.set(id, normalized);
    }
  }

  const sheets: { readonly name: string; readonly relId: string }[] = [];
  const sheetRegex = /<(?:\w+:)?sheet\b([^>]*?)\/?>/g;
  let sheetMatch: RegExpExecArray | null;
  while ((sheetMatch = sheetRegex.exec(workbookXml)) !== null) {
    const name = getXmlAttr(sheetMatch[1]!, 'name');
    const relId = getXmlAttr(sheetMatch[1]!, 'r:id') ?? getXmlAttr(sheetMatch[1]!, 'id') ?? '';
    if (name) {
      sheets.push({ name, relId });
    }
  }

  const chosen =
    requestedSheetName !== undefined
      ? sheets.find((s) => s.name === requestedSheetName)
      : sheets[0];
  if (!chosen) {
    throw new XLSXTokenizationError(
      'SHEET_NOT_FOUND',
      requestedSheetName
        ? `Worksheet "${requestedSheetName}" not found in workbook.`
        : 'Workbook contains no worksheets.'
    );
  }

  const targetPath = relTargetById.get(chosen.relId) ?? 'xl/worksheets/sheet1.xml';
  const entry = entries.get(targetPath);
  if (!entry) {
    throw new XLSXTokenizationError(
      'SHEET_NOT_FOUND',
      `Worksheet XML entry "${targetPath}" for sheet "${chosen.name}" is missing from archive.`
    );
  }
  return { sheetName: chosen.name, entry, date1904 };
}

function parseWorksheetRowCells(
  rowAttrs: string,
  rowInnerXml: string,
  fallbackRowNumber: number,
  sharedStrings: readonly string[],
  dateStyleIndices: ReadonlySet<number>,
  date1904: boolean
): { readonly physicalRow: number; readonly values: string[] } {
  const rAttr = getXmlAttr(rowAttrs, 'r');
  const parsedRow = rAttr !== null ? Number.parseInt(rAttr, 10) : fallbackRowNumber;
  const physicalRow =
    Number.isSafeInteger(parsedRow) && parsedRow >= 1 ? parsedRow : fallbackRowNumber;

  const values: string[] = [];
  let nextColIndex = 0;
  const cellRegex = /<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g;
  let cellMatch: RegExpExecArray | null;

  while ((cellMatch = cellRegex.exec(rowInnerXml)) !== null) {
    const cellAttrs = cellMatch[1]!;
    const cellBody = cellMatch[2] ?? '';
    const refAttr = getXmlAttr(cellAttrs, 'r');
    const colIndex =
      refAttr !== null ? (columnLettersToIndex(refAttr) ?? nextColIndex) : nextColIndex;
    nextColIndex = colIndex + 1;
    while (values.length <= colIndex) {
      values.push('');
    }

    const cellType = getXmlAttr(cellAttrs, 't') ?? 'n';
    const styleAttr = getXmlAttr(cellAttrs, 's');
    const styleIdx = styleAttr !== null ? Number.parseInt(styleAttr, 10) : -1;

    const hasFormula = /<(?:\w+:)?f\b/.test(cellBody);
    const vMatch = /<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/.exec(cellBody);
    if (hasFormula && !vMatch) {
      throw new XLSXTokenizationError(
        'UNEVALUATED_FORMULA_CELL',
        `Worksheet row ${physicalRow} contains an unevaluated formula cell without a cached value.`,
        physicalRow
      );
    }

    let cellText = '';
    if (cellType === 'inlineStr') {
      const tRegex = /<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g;
      const parts: string[] = [];
      let tMatch: RegExpExecArray | null;
      while ((tMatch = tRegex.exec(cellBody)) !== null) {
        parts.push(decodeXmlText(tMatch[1]!));
      }
      cellText = parts.join('');
    } else if (cellType === 's') {
      const rawIdx = vMatch ? decodeXmlText(vMatch[1]!).trim() : '';
      const ssIdx = Number.parseInt(rawIdx, 10);
      if (!Number.isSafeInteger(ssIdx) || ssIdx < 0 || ssIdx >= sharedStrings.length) {
        throw new XLSXTokenizationError(
          'INVALID_SHARED_STRING',
          `Invalid shared string index "${rawIdx}" on row ${physicalRow}.`,
          physicalRow
        );
      }
      cellText = sharedStrings[ssIdx]!;
    } else if (cellType === 'b') {
      const rawVal = vMatch ? decodeXmlText(vMatch[1]!).trim() : '';
      cellText = rawVal === '1' || rawVal.toLowerCase() === 'true' ? 'TRUE' : 'FALSE';
    } else if (cellType === 'd') {
      const rawVal = vMatch ? decodeXmlText(vMatch[1]!).trim() : '';
      cellText = /^\d{4}-\d{2}-\d{2}T/.test(rawVal) ? rawVal.slice(0, 10) : rawVal;
    } else if (cellType === 'str' || cellType === 'e') {
      cellText = vMatch ? decodeXmlText(vMatch[1]!) : '';
    } else {
      const rawLexeme = vMatch ? decodeXmlText(vMatch[1]!).trim() : '';
      if (rawLexeme === '') {
        cellText = '';
      } else if (dateStyleIndices.has(styleIdx)) {
        cellText = excelSerialToIsoDate(rawLexeme, date1904) ?? rawLexeme;
      } else if (/^[+-]?\d+(?:\.\d+)?[eE][+-]?\d+$/.test(rawLexeme)) {
        cellText = toDecimal(rawLexeme).toFixed();
      } else {
        cellText = rawLexeme;
      }
    }

    values[colIndex] = cellText;
  }

  return { physicalRow, values };
}

export async function tokenizeGLXlsxBytes(
  source: Uint8Array | ArrayBuffer,
  options: TokenizeGLXlsxOptions = {}
): Promise<TokenizedGLXlsxStream> {
  const maxRowsPerChunk = options.maxRowsPerChunk ?? MAX_GL_CHUNK_ROWS;
  if (
    !Number.isSafeInteger(maxRowsPerChunk) ||
    maxRowsPerChunk < 1 ||
    maxRowsPerChunk > MAX_GL_CHUNK_ROWS
  ) {
    throw new XLSXTokenizationError(
      'INVALID_CHUNK_SIZE',
      `maxRowsPerChunk must be an integer between 1 and ${MAX_GL_CHUNK_ROWS}.`
    );
  }

  const archive = toUint8Array(source);
  const entries = parseZipCentralDirectory(archive);
  const workbookEntry = entries.get('xl/workbook.xml');
  if (!workbookEntry) {
    throw new XLSXTokenizationError(
      'INVALID_XLSX_ARCHIVE',
      'XLSX archive is missing xl/workbook.xml.'
    );
  }
  const workbookXml = await readZipEntryText(archive, workbookEntry);
  const relsEntry = entries.get('xl/_rels/workbook.xml.rels');
  const relsXml = relsEntry ? await readZipEntryText(archive, relsEntry) : '';

  const {
    sheetName,
    entry: worksheetEntry,
    date1904,
  } = resolveWorksheetEntry(entries, workbookXml, relsXml, options.sheetName);

  const sharedStringsEntry = entries.get('xl/sharedStrings.xml');
  const sharedStrings = sharedStringsEntry
    ? parseSharedStrings(await readZipEntryText(archive, sharedStringsEntry))
    : [];

  const stylesEntry = entries.get('xl/styles.xml');
  const dateStyleIndices = stylesEntry
    ? parseDateStyleIndices(await readZipEntryText(archive, stylesEntry))
    : new Set<number>();

  const worksheetXml = await readZipEntryText(archive, worksheetEntry);
  const rowRegex = /<(?:\w+:)?row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?row>)/g;

  let headerMatch: { readonly physicalRow: number; readonly headers: string[] } | null = null;
  let fallbackRow = 1;
  let firstMatch: RegExpExecArray | null;

  while ((firstMatch = rowRegex.exec(worksheetXml)) !== null) {
    const parsed = parseWorksheetRowCells(
      firstMatch[1]!,
      firstMatch[2] ?? '',
      fallbackRow,
      sharedStrings,
      dateStyleIndices,
      date1904
    );
    fallbackRow = parsed.physicalRow + 1;
    // Trim trailing empty header cells
    let lastNonEmpty = parsed.values.length - 1;
    while (lastNonEmpty >= 0 && parsed.values[lastNonEmpty]!.trim() === '') {
      lastNonEmpty--;
    }
    if (lastNonEmpty < 0) continue;

    const headers = parsed.values.slice(0, lastNonEmpty + 1).map((h) => h.trim());
    if (headers.some((h) => h === '')) {
      throw new XLSXTokenizationError(
        'EMPTY_WORKSHEET',
        `Worksheet "${sheetName}" contains an empty header column on row ${parsed.physicalRow}.`,
        parsed.physicalRow
      );
    }
    if (new Set(headers).size !== headers.length) {
      throw new XLSXTokenizationError(
        'DUPLICATE_HEADER',
        `Duplicate header column on worksheet "${sheetName}" row ${parsed.physicalRow}.`,
        parsed.physicalRow
      );
    }
    headerMatch = { physicalRow: parsed.physicalRow, headers };
    break;
  }

  if (!headerMatch) {
    throw new XLSXTokenizationError(
      'EMPTY_WORKSHEET',
      `Worksheet "${sheetName}" contains no header row.`
    );
  }

  const { headers, physicalRow: headerLine } = headerMatch;

  async function* generateChunks(): AsyncGenerator<GLStagingChunkSlice, void, undefined> {
    let chunkRows: Readonly<Record<string, string>>[] = [];
    let chunkRowNumbers: number[] = [];
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRegex.exec(worksheetXml)) !== null) {
      const parsed = parseWorksheetRowCells(
        rowMatch[1]!,
        rowMatch[2] ?? '',
        fallbackRow,
        sharedStrings,
        dateStyleIndices,
        date1904
      );
      fallbackRow = parsed.physicalRow + 1;
      if (parsed.values.every((v) => v.trim() === '')) {
        continue;
      }
      if (parsed.values.length > headers.length) {
        const extraNonEmpty = parsed.values.slice(headers.length).some((v) => v.trim() !== '');
        if (extraNonEmpty) {
          throw new XLSXTokenizationError(
            'COLUMN_COUNT_MISMATCH',
            `Worksheet row ${parsed.physicalRow} has more columns (${parsed.values.length}) than headers (${headers.length}).`,
            parsed.physicalRow
          );
        }
      }
      const record: Record<string, string> = {};
      for (let i = 0; i < headers.length; i++) {
        record[headers[i]!] = parsed.values[i] ?? '';
      }
      chunkRows.push(record);
      chunkRowNumbers.push(parsed.physicalRow);

      if (chunkRows.length >= maxRowsPerChunk) {
        yield {
          rows: chunkRows,
          firstRowNumber: chunkRowNumbers[0]!,
          rowNumbers: chunkRowNumbers,
        };
        chunkRows = [];
        chunkRowNumbers = [];
      }
    }

    if (chunkRows.length > 0) {
      yield {
        rows: chunkRows,
        firstRowNumber: chunkRowNumbers[0]!,
        rowNumbers: chunkRowNumbers,
      };
    }
  }

  return {
    sheetName,
    headers,
    headerLine,
    chunks: generateChunks(),
  };
}

export async function stageGLXlsxImport(
  input: StageGLXlsxImportInput & StageGLImportDependencies
): Promise<GLStagingManifest> {
  const bytes = toUint8Array(input.source);
  const fileHash = input.fileHash ?? sha256HexBytes(bytes);
  const tokenized = await tokenizeGLXlsxBytes(bytes, {
    sheetName: input.sheetName,
    maxRowsPerChunk: input.maxRowsPerChunk,
  });

  return stageGLImport(
    {
      batchId: input.batchId,
      fileHash,
      config: {
        ...input.config,
        headers: input.config.headers ?? tokenized.headers,
        firstRowNumber: tokenized.headerLine + 1,
      },
      chunks: tokenized.chunks,
      signal: input.signal,
      lockOwnerId: input.lockOwnerId,
      lockTtlMs: input.lockTtlMs,
    },
    {
      repository: input.repository,
      compute: input.compute,
    }
  );
}
