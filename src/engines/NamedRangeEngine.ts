/**
 * NamedRangeEngine — Named ranges for formulas
 * Maps human-readable names to cell ranges for easier formula writing
 */

interface NamedRange {
  id: string;
  name: string;
  scope: 'global' | 'sheet' | 'entity';
  sheetId?: string;
  entityId?: string;
  range: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  };
  description?: string;
  createdBy: string;
  createdAt: string;
}

export class NamedRangeEngine {
  private static ranges = new Map<string, NamedRange>();

  /**
   * Create a named range
   */
  static create(range: Omit<NamedRange, 'id' | 'createdAt'>): NamedRange {
    const id = `nr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const full: NamedRange = {
      ...range,
      id,
      createdAt: new Date().toISOString(),
    };
    this.ranges.set(range.name.toLowerCase(), full);
    return full;
  }

  /**
   * Get cell range by name
   */
  static getRange(name: string): NamedRange | undefined {
    return this.ranges.get(name.toLowerCase());
  }

  /**
   * Resolve named range to cell references
   */
  static resolve(name: string): string[] | null {
    const range = this.getRange(name);
    if (!range) return null;

    const cells: string[] = [];
    for (let r = range.range.startRow; r <= range.range.endRow; r++) {
      for (let c = range.range.startCol; c <= range.range.endCol; c++) {
        cells.push(`${this.colToLetter(c)}${r}`);
      }
    }
    return cells;
  }

  /**
   * Get values from named range
   */
  static getValues(name: string, data: (number | string | null)[][]): (number | string | null)[] {
    const range = this.getRange(name);
    if (!range) return [];

    const values: (number | string | null)[] = [];
    for (let r = range.range.startRow; r <= range.range.endRow; r++) {
      for (let c = range.range.startCol; c <= range.range.endCol; c++) {
        values.push(data[r]?.[c] ?? null);
      }
    }
    return values;
  }

  /**
   * List all named ranges
   */
  static list(scope?: 'global' | 'sheet' | 'entity'): NamedRange[] {
    const all = Array.from(this.ranges.values());
    if (scope) return all.filter((r) => r.scope === scope);
    return all;
  }

  /**
   * Update a named range
   */
  static update(name: string, updates: Partial<NamedRange>): boolean {
    const existing = this.ranges.get(name.toLowerCase());
    if (!existing) return false;
    Object.assign(existing, updates);
    return true;
  }

  /**
   * Delete a named range
   */
  static delete(name: string): boolean {
    return this.ranges.delete(name.toLowerCase());
  }

  /**
   * Parse named range from formula
   */
  static parseFormula(formula: string): string {
    // Replace named ranges with cell references
    return formula.replace(/\b([A-Za-z_]\w*)\b/g, (match) => {
      const range = this.getRange(match);
      if (!range) return match;
      const start = `${this.colToLetter(range.range.startCol)}${range.range.startRow}`;
      const end = `${this.colToLetter(range.range.endCol)}${range.range.endRow}`;
      return `${start}:${end}`;
    });
  }

  /**
   * Column number to letter (0=A, 25=Z, 26=AA)
   */
  private static colToLetter(col: number): string {
    let result = '';
    let c = col;
    while (c >= 0) {
      result = String.fromCharCode(65 + (c % 26)) + result;
      c = Math.floor(c / 26) - 1;
    }
    return result;
  }

  /**
   * Clear all ranges
   */
  static reset(): void {
    this.ranges.clear();
  }
}
