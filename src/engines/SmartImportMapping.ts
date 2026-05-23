/**
 * Smart Import Mapping — Auto-detect column mappings from headers
 */

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  transform?: 'none' | 'number' | 'date' | 'trim' | 'uppercase';
}

export interface MatchResult {
  field: string;
  score: number;
  method: 'exact' | 'fuzzy' | 'learned';
}

export class SmartImportMapping {
  private static learnedMappings = new Map<string, ColumnMapping[]>();
  private static fieldAliases: Record<string, string[]> = {
    accountId: [
      'account',
      'acct',
      'gl_account',
      'account_code',
      'account_number',
      'acct_num',
      'gl_code',
    ],
    accountName: ['account_name', 'acct_name', 'description', 'gl_name', 'account_desc'],
    period: ['period', 'month', 'fiscal_period', 'per', 'month_year'],
    date: [
      'date',
      'transaction_date',
      'trans_date',
      'posting_date',
      'entry_date',
      'period_end_date',
    ],
    debit: ['debit', 'dr', 'debit_amount', 'dr_amount'],
    credit: ['credit', 'cr', 'credit_amount', 'cr_amount'],
    amount: ['amount', 'net_amount', 'total', 'value', 'balance'],
    entityId: ['entity', 'company', 'subsidiary', 'division', 'bu', 'business_unit'],
    departmentId: ['department', 'dept', 'cost_center', 'costcenter', 'cc'],
    description: ['description', 'desc', 'memo', 'narrative', 'comment', 'remarks'],
    currency: ['currency', 'curr', 'ccy'],
    reference: ['reference', 'ref', 'reference_number', 'journal_number', 'je_number'],
  };

  static suggestMappings(headers: string[]): ColumnMapping[] {
    const mappings: ColumnMapping[] = [];
    const usedFields = new Set<string>();

    for (const header of headers) {
      const normalized = header
        .toLowerCase()
        .trim()
        .replace(/[\s_-]+/g, '_');
      let bestMatch: { field: string; score: number; method: MatchResult['method'] } = {
        field: '',
        score: 0,
        method: 'exact',
      };

      // Exact match
      for (const [field, aliases] of Object.entries(this.fieldAliases)) {
        if (usedFields.has(field)) continue;
        if (aliases.includes(normalized) || field === normalized) {
          bestMatch = { field, score: 1.0, method: 'exact' };
          break;
        }
      }

      // Fuzzy match
      if (bestMatch.score < 1.0) {
        for (const [field, aliases] of Object.entries(this.fieldAliases)) {
          if (usedFields.has(field)) continue;
          for (const alias of aliases) {
            const score = this.similarity(normalized, alias);
            if (score > bestMatch.score && score > 0.6) {
              bestMatch = { field, score, method: 'fuzzy' };
            }
          }
        }
      }

      // Learned match
      if (bestMatch.score < 0.8) {
        for (const [, mappings] of this.learnedMappings) {
          const found = mappings.find((m) => m.sourceColumn === header);
          if (found && !usedFields.has(found.targetField)) {
            bestMatch = { field: found.targetField, score: 0.9, method: 'learned' };
            break;
          }
        }
      }

      if (bestMatch.field) {
        usedFields.add(bestMatch.field);
        mappings.push({
          sourceColumn: header,
          targetField: bestMatch.field,
          confidence: bestMatch.score,
          transform: this.inferTransform(header),
        });
      }
    }

    return mappings;
  }

  static learnFromImport(headers: string[], mappings: ColumnMapping[]): void {
    const key = headers.join('|');
    this.learnedMappings.set(key, mappings);
  }

  static getLearnedMappings(source: string): ColumnMapping[] {
    return this.learnedMappings.get(source) ?? [];
  }

  static fuzzyMatch(header: string, candidates: string[]): MatchResult[] {
    return candidates
      .map((c) => ({
        field: c,
        score: this.similarity(header.toLowerCase(), c.toLowerCase()),
        method: 'fuzzy' as const,
      }))
      .filter((r) => r.score > 0.5)
      .sort((a, b) => b.score - a.score);
  }

  private static inferTransform(header: string): ColumnMapping['transform'] {
    const lower = header.toLowerCase();
    if (lower.includes('date')) return 'date';
    if (
      lower.includes('amount') ||
      lower.includes('debit') ||
      lower.includes('credit') ||
      lower.includes('balance')
    )
      return 'number';
    if (lower.includes('code') || lower.includes('id')) return 'uppercase';
    return 'trim';
  }

  private static similarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 0.8;
    const aWords = a.split('_');
    const bWords = b.split('_');
    const common = aWords.filter((w) => bWords.includes(w)).length;
    return common / Math.max(aWords.length, bWords.length);
  }
}
