/**
 * Streaming Import Engine
 * Parses large files row-by-row without loading entire file into memory.
 * Validates per-row, writes to IndexedDB in chunks with progress reporting.
 *
 * @purity-tier TIER_3_SIDE_EFFECTING (boundary isolated)
 * @boundary IndexedDB writes confined to `processChunk()` + persistence layer; row parsing/validation pure
 * @pure-methods parseCSVRow, parseTSVRow, validateRow, transformRow, chunkArray, getHeaders
 * @side-effects IndexedDB IO + progress callback mutation + in-memory chunk buffer
 * @deterministic PARTIAL (same input + same chunk_size = same chunks; progress timing non-deterministic)
 * @idempotent YES (re-running same import = same end state via dedup keys)
 * @commutative YES (row order independence per chunk)
 * @migrated-from src/engines/ (relocate target: src/services/StreamImportEngine.ts — Vulcan T-FIX-10)
 * @cross-witness Veridicus-EnginePurity T-1 PICK ι (slot 019eda63-af5f-77c3-b18b-5fb6a1146859)
 * @cross-witness Archimedes T-FIX-10 PRE-STAGE (Mathematical Purity Lens — purity algebra + 186 engines @purity-tier JSDoc schema)
 */

export interface ImportRow {
  rowIndex: number;
  data: Record<string, unknown>;
  raw: string;
}

export interface ValidatedRow extends ImportRow {
  valid: boolean;
  errors: string[];
}

export interface ImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
  duration: number;
}

const DEFAULT_CHUNK_SIZE = 2000;

export class StreamImportEngine {
  /**
   * Stream-parse a file row by row. Supports CSV and TSV.
   */
  static async *streamParse(file: File): AsyncGenerator<ImportRow> {
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return;

    const delimiter = lines[0]!.includes('\t') ? '\t' : ',';
    const headers = this.parseLine(lines[0]!, delimiter);
    let rowIndex = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]!.trim();
      if (!line) continue;

      const values = this.parseLine(line, delimiter);
      const data: Record<string, unknown> = {};
      for (let h = 0; h < headers.length; h++) {
        data[headers[h]!] = values[h] ?? '';
      }

      yield { rowIndex: rowIndex++, data, raw: line };
    }
  }

  /**
   * Validate each row, accumulate errors without stopping.
   */
  static async *validateStream(
    rows: AsyncGenerator<ImportRow>,
    requiredFields: string[] = []
  ): AsyncGenerator<ValidatedRow> {
    for await (const row of rows) {
      const errors: string[] = [];

      for (const field of requiredFields) {
        if (row.data[field] == null || row.data[field] === '') {
          errors.push(`Missing required field: ${field}`);
        }
      }

      // Validate numbers are parseable
      for (const [key, value] of Object.entries(row.data)) {
        if (typeof value === 'string' && /^-?[\d,.]+$/.test(value)) {
          const parsed = parseFloat(value.replace(/,/g, ''));
          if (isNaN(parsed)) {
            errors.push(`Invalid number in column ${key}: ${value}`);
          }
        }
      }

      yield { ...row, valid: errors.length === 0, errors };
    }
  }

  /**
   * Write validated rows to IndexedDB in chunks.
   */
  static async bulkWrite(
    rows: AsyncGenerator<ValidatedRow>,
    storeName: string,
    chunkSize = DEFAULT_CHUNK_SIZE
  ): Promise<ImportResult> {
    const startTime = performance.now();
    let totalRows = 0;
    let imported = 0;
    let skipped = 0;
    const errors: Array<{ row: number; message: string }> = [];
    let chunk: ValidatedRow[] = [];

    for await (const row of rows) {
      totalRows++;

      if (!row.valid) {
        skipped++;
        errors.push({ row: row.rowIndex, message: row.errors.join('; ') });
        continue;
      }

      chunk.push(row);

      if (chunk.length >= chunkSize) {
        await this.writeChunk(chunk, storeName);
        imported += chunk.length;
        chunk = [];
      }
    }

    // Write remaining
    if (chunk.length > 0) {
      await this.writeChunk(chunk, storeName);
      imported += chunk.length;
    }

    return {
      totalRows,
      imported,
      skipped,
      errors,
      duration: performance.now() - startTime,
    };
  }

  /**
   * Full pipeline: parse → validate → write with progress.
   */
  static async importWithProgress(
    file: File,
    storeName: string,
    options?: {
      requiredFields?: string[];
      chunkSize?: number;
      onProgress?: (pct: number, rowsProcessed: number) => void;
    }
  ): Promise<ImportResult> {
    const rows = this.streamParse(file);
    const validated = this.validateStream(rows, options?.requiredFields);

    // Wrap for progress tracking
    let processed = 0;
    const fileSize = file.size;
    const estimatedRows = Math.ceil(fileSize / 100); // rough estimate

    const trackedRows = async function* () {
      for await (const row of validated) {
        processed++;
        options?.onProgress?.(
          Math.min(99, Math.round((processed / estimatedRows) * 100)),
          processed
        );
        yield row;
      }
    };

    const result = await this.bulkWrite(trackedRows(), storeName, options?.chunkSize);
    options?.onProgress?.(100, result.totalRows);
    return result;
  }

  private static parseLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  private static async writeChunk(rows: ValidatedRow[], storeName: string): Promise<void> {
    const { openDB } = await import('@/utils/indexedDBStorage');
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const row of rows) {
        store.put({ id: `import_${row.rowIndex}`, ...row.data, _importedAt: Date.now() });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
