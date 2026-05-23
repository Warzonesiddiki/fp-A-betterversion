/**
 * Clipboard Intelligence — Parse and format clipboard data for grid operations
 * Handles Excel TSV format, CSV, and plain text
 */

interface ParsedData {
  rows: string[][];
  rowCount: number;
  colCount: number;
}

interface PasteResult {
  success: boolean;
  data: string[][];
  errors: string[];
}

export class ClipboardUtils {
  /**
   * Copy selected cells from AG Grid to clipboard
   */
  static async copyCells(getData: () => string[][]): Promise<void> {
    const data = getData();
    const tsv = data.map((row) => row.join('\t')).join('\n');
    await navigator.clipboard.writeText(tsv);
  }

  /**
   * Paste from clipboard into grid
   */
  static async pasteCells(): Promise<PasteResult> {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return { success: false, data: [], errors: ['Empty clipboard'] };

      const parsed = this.parseClipboardText(text);
      return { success: true, data: parsed.rows, errors: [] };
    } catch {
      return { success: false, data: [], errors: ['Failed to read clipboard'] };
    }
  }

  /**
   * Parse Excel TSV format (tab-separated values)
   */
  static parseClipboardText(text: string): ParsedData {
    const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
    const rows: string[][] = [];

    for (const line of lines) {
      rows.push(line.split('\t'));
    }

    const colCount = Math.max(...rows.map((r) => r.length));

    return {
      rows,
      rowCount: rows.length,
      colCount,
    };
  }

  /**
   * Parse CSV format
   */
  static parseCSV(text: string): ParsedData {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const rows: string[][] = [];

    for (const line of lines) {
      const row: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim());
      rows.push(row);
    }

    return {
      rows,
      rowCount: rows.length,
      colCount: rows.length > 0 ? rows[0].length : 0,
    };
  }

  /**
   * Format data for Excel paste (TSV)
   */
  static formatForExcel(data: unknown[][]): string {
    return data
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '');
            // Escape tabs and newlines
            if (str.includes('\t') || str.includes('\n') || str.includes('"')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join('\t')
      )
      .join('\n');
  }

  /**
   * Validate paste dimensions against target grid
   */
  static validatePasteDimensions(
    sourceRows: number,
    sourceCols: number,
    targetRows: number,
    targetCols: number
  ): { valid: boolean; message?: string } {
    if (sourceRows > targetRows) {
      return {
        valid: false,
        message: `Source has ${sourceRows} rows but target only has ${targetRows} rows. Extra rows will be ignored.`,
      };
    }
    if (sourceCols > targetCols) {
      return {
        valid: false,
        message: `Source has ${sourceCols} columns but target only has ${targetCols} columns. Extra columns will be ignored.`,
      };
    }
    return { valid: true };
  }

  /**
   * Transform pasted data to match target grid dimensions
   */
  static fitToGrid(data: string[][], targetRows: number, targetCols: number): string[][] {
    const result: string[][] = [];

    for (let r = 0; r < targetRows; r++) {
      const row: string[] = [];
      for (let c = 0; c < targetCols; c++) {
        row.push(data[r]?.[c] ?? '');
      }
      result.push(row);
    }

    return result;
  }

  /**
   * Detect if pasted data contains financial values
   */
  static detectFinancialData(data: string[][]): boolean {
    const flat = data.flat();
    const financialPattern = /^[\$€£¥]?\s*[\d,]+\.?\d*%?$/;
    let matches = 0;

    for (const cell of flat.slice(0, 50)) {
      // Check first 50 cells
      if (financialPattern.test(cell.trim())) matches++;
    }

    return matches > flat.length * 0.3; // 30% threshold
  }

  /**
   * Parse financial values from pasted data
   */
  static parseFinancialValues(data: string[][]): number[][] {
    return data.map((row) =>
      row.map((cell) => {
        const cleaned = cell.replace(/[\$€£¥,\s]/g, '');
        const isNegative = cleaned.startsWith('(') && cleaned.endsWith(')');
        const num = parseFloat(isNegative ? cleaned.slice(1, -1) : cleaned);
        return isNaN(num) ? 0 : isNegative ? -num : num;
      })
    );
  }
}
