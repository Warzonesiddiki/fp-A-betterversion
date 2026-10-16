/** Streaming CSV tokenizer with exact physical 1-based line numbers for GL staging. */
import { sha256Hex } from '@/utils/sha256';
import { MAX_GL_CHUNK_ROWS } from '@/workers/glIngestionRequest';
import type { GLIngestChunkInput } from '@/types/glIngestion';
import type { GLStagingManifest } from './glStagingRepository';
import {
  stageGLImport,
  type GLStagingChunkSlice,
  type StageGLImportDependencies,
} from './glStagingCoordinator';

export type GLCsvDelimiter = ',' | '\t' | ';' | '|';

export type GLCsvStreamSource =
  | string
  | Uint8Array
  | Iterable<string | Uint8Array>
  | AsyncIterable<string | Uint8Array>;

export interface TokenizeGLCsvOptions {
  readonly delimiter: GLCsvDelimiter;
  readonly maxRowsPerChunk?: number;
}

export interface TokenizedGLCsvChunk extends GLStagingChunkSlice {
  readonly headers: readonly string[];
  readonly rows: readonly Readonly<Record<string, string>>[];
  readonly rowNumbers: readonly number[];
  readonly firstRowNumber: number;
}

export type CSVTokenizationErrorCode =
  | 'INVALID_OPTIONS'
  | 'INVALID_UTF8'
  | 'MISSING_HEADER'
  | 'UNCLOSED_QUOTE'
  | 'MALFORMED_QUOTE'
  | 'EXTRA_COLUMNS';

export class CSVTokenizationError extends Error {
  readonly code: CSVTokenizationErrorCode;
  readonly line: number;

  constructor(code: CSVTokenizationErrorCode, line: number, message: string) {
    super(message);
    this.name = 'CSVTokenizationError';
    this.code = code;
    this.line = line;
  }
}

const VALID_DELIMITERS = new Set<string>([',', '\t', ';', '|']);

function isByteView(value: unknown): value is ArrayBufferView {
  return ArrayBuffer.isView(value);
}

function toUint8Array(view: ArrayBufferView): Uint8Array {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
}

async function* toTextFragments(
  source: GLCsvStreamSource,
  getLine: () => number
): AsyncGenerator<string> {
  if (typeof source === 'string') {
    yield source;
    return;
  }
  const decoder = new TextDecoder('utf-8', { fatal: true });
  if (isByteView(source)) {
    try {
      yield decoder.decode(toUint8Array(source));
    } catch {
      throw new CSVTokenizationError(
        'INVALID_UTF8',
        getLine(),
        `Invalid UTF-8 byte sequence at line ${getLine()}.`
      );
    }
    return;
  }
  try {
    for await (const chunk of source) {
      if (typeof chunk === 'string') {
        yield chunk;
      } else if (isByteView(chunk)) {
        yield decoder.decode(toUint8Array(chunk), { stream: true });
      } else {
        throw new CSVTokenizationError(
          'INVALID_OPTIONS',
          getLine(),
          'CSV stream chunks must be strings or Uint8Arrays.'
        );
      }
    }
    const tail = decoder.decode();
    if (tail) yield tail;
  } catch (error) {
    if (error instanceof CSVTokenizationError) throw error;
    throw new CSVTokenizationError(
      'INVALID_UTF8',
      getLine(),
      `Invalid UTF-8 byte sequence at line ${getLine()}.`
    );
  }
}

type CellState = 'START_CELL' | 'UNQUOTED' | 'IN_QUOTES' | 'QUOTE_IN_QUOTES';

export async function* tokenizeGLCsvStream(
  source: GLCsvStreamSource,
  options: TokenizeGLCsvOptions
): AsyncGenerator<TokenizedGLCsvChunk> {
  if (!VALID_DELIMITERS.has(options.delimiter)) {
    throw new CSVTokenizationError(
      'INVALID_OPTIONS',
      1,
      'An explicit CSV delimiter (",", "\\t", ";", or "|") is required.'
    );
  }
  const maxRows = options.maxRowsPerChunk ?? MAX_GL_CHUNK_ROWS;
  if (!Number.isSafeInteger(maxRows) || maxRows < 1 || maxRows > MAX_GL_CHUNK_ROWS) {
    throw new CSVTokenizationError(
      'INVALID_OPTIONS',
      1,
      `maxRowsPerChunk must be a safe integer between 1 and ${MAX_GL_CHUNK_ROWS}.`
    );
  }

  const delimiter = options.delimiter;
  let physicalLine = 1;
  let recordStartLine = 1;
  let cellState = 'START_CELL' as CellState;
  let row: string[] = [];
  let cell = '';
  let rowHadQuotes = false;
  let pendingCR = false;
  let seenFirstChar = false;

  let headers: readonly string[] | null = null;
  let chunkRows: Readonly<Record<string, string>>[] = [];
  let chunkRowNumbers: number[] = [];

  const emitRecord = (): TokenizedGLCsvChunk | null => {
    const currentRow = row;
    const hadQuotes = rowHadQuotes;
    const line = recordStartLine;
    row = [];
    cell = '';
    rowHadQuotes = false;
    cellState = 'START_CELL';

    const isBlank = !hadQuotes && currentRow.every((c) => c.trim() === '');
    if (isBlank) {
      return null;
    }

    if (headers === null) {
      const parsedHeaders = currentRow.map((h) => h.trim());
      if (parsedHeaders.length === 0 || parsedHeaders.every((h) => h === '')) {
        throw new CSVTokenizationError(
          'MISSING_HEADER',
          line,
          `CSV header row at line ${line} is empty.`
        );
      }
      headers = parsedHeaders;
      return null;
    }

    if (currentRow.length > headers.length) {
      throw new CSVTokenizationError(
        'EXTRA_COLUMNS',
        line,
        `CSV record at line ${line} has ${currentRow.length} columns, exceeding header count of ${headers.length}.`
      );
    }

    const recordObj: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      const key = headers[i]!;
      recordObj[key] = (currentRow[i] ?? '').trim();
    }
    chunkRows.push(recordObj);
    chunkRowNumbers.push(line);

    if (chunkRows.length >= maxRows) {
      const readyChunk: TokenizedGLCsvChunk = {
        headers,
        rows: chunkRows,
        rowNumbers: chunkRowNumbers,
        firstRowNumber: chunkRowNumbers[0]!,
      };
      chunkRows = [];
      chunkRowNumbers = [];
      return readyChunk;
    }
    return null;
  };

  const processLogicalChar = (ch: string): TokenizedGLCsvChunk | null => {
    if (cellState === 'START_CELL') {
      if (ch === '"') {
        if (row.length === 0) recordStartLine = physicalLine;
        rowHadQuotes = true;
        cellState = 'IN_QUOTES';
        return null;
      }
      if (ch === delimiter) {
        if (row.length === 0) recordStartLine = physicalLine;
        row.push('');
        return null;
      }
      if (ch === '\n') {
        if (row.length === 0) recordStartLine = physicalLine;
        row.push('');
        const maybeChunk = emitRecord();
        physicalLine++;
        recordStartLine = physicalLine;
        return maybeChunk;
      }
      if (row.length === 0) recordStartLine = physicalLine;
      cell = ch;
      cellState = 'UNQUOTED';
      return null;
    }

    if (cellState === 'UNQUOTED') {
      if (ch === '"') {
        throw new CSVTokenizationError(
          'MALFORMED_QUOTE',
          physicalLine,
          `Unexpected quote inside unquoted CSV field at line ${physicalLine}.`
        );
      }
      if (ch === delimiter) {
        row.push(cell);
        cell = '';
        cellState = 'START_CELL';
        return null;
      }
      if (ch === '\n') {
        row.push(cell);
        cell = '';
        const maybeChunk = emitRecord();
        physicalLine++;
        recordStartLine = physicalLine;
        return maybeChunk;
      }
      cell += ch;
      return null;
    }

    if (cellState === 'IN_QUOTES') {
      if (ch === '"') {
        cellState = 'QUOTE_IN_QUOTES';
        return null;
      }
      if (ch === '\n') {
        cell += '\n';
        physicalLine++;
        return null;
      }
      cell += ch;
      return null;
    }

    // cellState === 'QUOTE_IN_QUOTES'
    if (ch === '"') {
      cell += '"';
      cellState = 'IN_QUOTES';
      return null;
    }
    if (ch === delimiter) {
      row.push(cell);
      cell = '';
      cellState = 'START_CELL';
      return null;
    }
    if (ch === '\n') {
      row.push(cell);
      cell = '';
      const maybeChunk = emitRecord();
      physicalLine++;
      recordStartLine = physicalLine;
      return maybeChunk;
    }
    throw new CSVTokenizationError(
      'MALFORMED_QUOTE',
      physicalLine,
      `Unexpected character after closing quote at line ${physicalLine}.`
    );
  };

  for await (const rawFragment of toTextFragments(source, () => physicalLine)) {
    if (rawFragment.length === 0) continue;
    let fragment = rawFragment;
    if (!seenFirstChar) {
      seenFirstChar = true;
      if (fragment.charCodeAt(0) === 0xfeff) {
        fragment = fragment.slice(1);
      }
    }
    for (let i = 0; i < fragment.length; i++) {
      const ch = fragment[i]!;
      if (pendingCR) {
        pendingCR = false;
        if (ch === '\n') continue;
      }
      if (ch === '\r') {
        pendingCR = true;
        const maybeChunk = processLogicalChar('\n');
        if (maybeChunk) yield maybeChunk;
        continue;
      }
      const maybeChunk = processLogicalChar(ch);
      if (maybeChunk) yield maybeChunk;
    }
  }

  if (cellState === 'IN_QUOTES') {
    throw new CSVTokenizationError(
      'UNCLOSED_QUOTE',
      recordStartLine,
      `Unclosed quoted CSV field starting at line ${recordStartLine}.`
    );
  }

  if (row.length > 0 || cell.length > 0 || cellState === 'QUOTE_IN_QUOTES') {
    row.push(cell);
    const maybeChunk = emitRecord();
    if (maybeChunk) yield maybeChunk;
  }

  if (headers === null) {
    throw new CSVTokenizationError(
      'MISSING_HEADER',
      1,
      'CSV stream is empty or contains no header row.'
    );
  }

  if (chunkRows.length > 0) {
    yield {
      headers,
      rows: chunkRows,
      rowNumbers: chunkRowNumbers,
      firstRowNumber: chunkRowNumbers[0]!,
    };
  }
}

export interface StageGLCsvImportInput {
  readonly batchId: string;
  readonly source: GLCsvStreamSource;
  /** Optional precomputed lowercase SHA-256 hex digest of the source bytes. */
  readonly fileHash?: string;
  readonly delimiter: GLCsvDelimiter;
  readonly maxRowsPerChunk?: number;
  readonly config: Omit<GLIngestChunkInput, 'rows' | 'headers'> & {
    readonly headers?: readonly string[];
  };
  readonly signal?: AbortSignal;
}

async function normalizeSourceWithHash(
  source: GLCsvStreamSource,
  suppliedHash?: string
): Promise<{ readonly replaySource: GLCsvStreamSource; readonly fileHash: string }> {
  if (suppliedHash !== undefined) {
    return { replaySource: source, fileHash: suppliedHash };
  }
  if (typeof source === 'string') {
    return { replaySource: source, fileHash: await sha256Hex(source) };
  }
  const fragments: string[] = [];
  for await (const textPart of toTextFragments(source, () => 1)) {
    fragments.push(textPart);
  }
  const fullText = fragments.join('');
  const fileHash = await sha256Hex(fullText);
  async function* replay() {
    for (const part of fragments) {
      yield part;
    }
  }
  return { replaySource: replay(), fileHash };
}

export async function stageGLCsvImport(
  input: StageGLCsvImportInput,
  dependencies: StageGLImportDependencies = {}
): Promise<GLStagingManifest> {
  const { replaySource, fileHash } = await normalizeSourceWithHash(input.source, input.fileHash);
  const iterator = tokenizeGLCsvStream(replaySource, {
    delimiter: input.delimiter,
    maxRowsPerChunk: input.maxRowsPerChunk,
  });

  const first = await iterator.next();
  const headers = input.config.headers ?? (first.done ? [] : first.value.headers);

  async function* remainingChunks(): AsyncGenerator<GLStagingChunkSlice> {
    if (!first.done) {
      yield {
        rows: first.value.rows,
        rowNumbers: first.value.rowNumbers,
        firstRowNumber: first.value.firstRowNumber,
      };
      for await (const nextChunk of iterator) {
        yield {
          rows: nextChunk.rows,
          rowNumbers: nextChunk.rowNumbers,
          firstRowNumber: nextChunk.firstRowNumber,
        };
      }
    }
  }

  return stageGLImport(
    {
      batchId: input.batchId,
      fileHash,
      config: {
        ...input.config,
        headers,
      },
      chunks: remainingChunks(),
      signal: input.signal,
    },
    dependencies
  );
}
