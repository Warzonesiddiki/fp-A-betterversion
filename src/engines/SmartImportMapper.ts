/**
 * SmartImportMapper — AI-powered column mapping for data imports
 * Part 6 #3: Reduces import setup from 30 minutes to 30 seconds
 */

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

export class SmartImportMapper {
  private static learnedMappings: Map<string, LearnedMapping> = new Map();

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
      learnedAt: new Date().toISOString(),
      useCount: existing ? existing.useCount + 1 : 1,
    };
    this.learnedMappings.set(sourceFile, learned);

    // Persist to localStorage for cross-session learning
    try {
      const stored = JSON.parse(localStorage.getItem('finplan_learned_mappings') ?? '{}');
      stored[sourceFile] = learned;
      localStorage.setItem('finplan_learned_mappings', JSON.stringify(stored));
    } catch {
      // Silent fail — localStorage might be full
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

    // Check localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('finplan_learned_mappings') ?? '{}');
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
