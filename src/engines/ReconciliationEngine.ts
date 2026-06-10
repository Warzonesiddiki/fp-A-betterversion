/**
 * Data Reconciliation Engine
 * Compares datasets, finds discrepancies, auto-resolves within tolerance.
 */

export interface DataRow {
  [key: string]: unknown;
}

export interface MatchedPair {
  key: string;
  recordA: DataRow;
  recordB: DataRow;
}

export interface Discrepancy {
  key: string;
  field: string;
  valueA: unknown;
  valueB: unknown;
  difference: number;
  withinTolerance: boolean;
}

export interface ReconciliationResult {
  matched: MatchedPair[];
  unmatchedA: DataRow[];
  unmatchedB: DataRow[];
  discrepancies: Discrepancy[];
  matchRate: number;
}

export interface ReconciliationReport {
  summary: {
    totalA: number;
    totalB: number;
    matched: number;
    unmatchedA: number;
    unmatchedB: number;
    discrepancies: number;
    matchRate: string;
  };
  discrepancies: Discrepancy[];
  unmatchedRecords: { source: 'A' | 'B'; records: DataRow[] }[];
  generatedAt: string;
}

export interface Resolution {
  key: string;
  field: string;
  resolvedValue: unknown;
  method: 'tolerance' | 'priority' | 'manual';
}

export class ReconciliationEngine {
  static reconcile(sourceA: DataRow[], sourceB: DataRow[], key: string): ReconciliationResult {
    const mapA = new Map<unknown, DataRow>();
    const mapB = new Map<unknown, DataRow>();

    for (const row of sourceA) mapA.set(row[key]!, row);
    for (const row of sourceB) mapB.set(row[key]!, row);

    const matched: MatchedPair[] = [];
    const unmatchedA: DataRow[] = [];
    const unmatchedB: DataRow[] = [];
    const discrepancies: Discrepancy[] = [];

    for (const [k, a] of mapA) {
      const b = mapB.get(k);
      if (b) {
        matched.push({ key: String(k), recordA: a, recordB: b });
        // Find field-level discrepancies
        const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
        for (const field of allKeys) {
          if (field === key) continue;
          const valA = Number(a[field] ?? 0);
          const valB = Number(b[field] ?? 0);
          if (valA !== valB && (typeof a[field] === 'number' || typeof b[field] === 'number')) {
            discrepancies.push({
              key: String(k),
              field,
              valueA: a[field]!,
              valueB: b[field]!,
              difference: Math.abs(valA - valB),
              withinTolerance: Math.abs(valA - valB) < 0.01,
            });
          }
        }
      } else {
        unmatchedA.push(a);
      }
    }

    for (const [k, b] of mapB) {
      if (!mapA.has(k)) unmatchedB.push(b);
    }

    const total = Math.max(sourceA.length, sourceB.length);
    const matchRate = total > 0 ? matched.length / total : 0;

    return { matched, unmatchedA, unmatchedB, discrepancies, matchRate };
  }

  static matchRecords(
    a: DataRow[],
    b: DataRow[],
    matchKey: string
  ): { matched: MatchedPair[]; unmatchedA: DataRow[]; unmatchedB: DataRow[] } {
    const result = this.reconcile(a, b, matchKey);
    return {
      matched: result.matched,
      unmatchedA: result.unmatchedA,
      unmatchedB: result.unmatchedB,
    };
  }

  static findDiscrepancies(matched: MatchedPair[], tolerance: number): Discrepancy[] {
    const discrepancies: Discrepancy[] = [];
    for (const pair of matched) {
      const allKeys = new Set([...Object.keys(pair.recordA), ...Object.keys(pair.recordB)]);
      for (const field of allKeys) {
        const valA = Number(pair.recordA[field] ?? 0);
        const valB = Number(pair.recordB[field] ?? 0);
        if (typeof pair.recordA[field] === 'number' || typeof pair.recordB[field] === 'number') {
          const diff = Math.abs(valA - valB);
          if (diff > 0) {
            discrepancies.push({
              key: pair.key,
              field,
              valueA: pair.recordA[field]!,
              valueB: pair.recordB[field]!,
              difference: diff,
              withinTolerance: diff <= tolerance,
            });
          }
        }
      }
    }
    return discrepancies;
  }

  static generateReport(result: ReconciliationResult): ReconciliationReport {
    return {
      summary: {
        totalA: result.matched.length + result.unmatchedA.length,
        totalB: result.matched.length + result.unmatchedB.length,
        matched: result.matched.length,
        unmatchedA: result.unmatchedA.length,
        unmatchedB: result.unmatchedB.length,
        discrepancies: result.discrepancies.length,
        matchRate: `${(result.matchRate * 100).toFixed(1)}%`,
      },
      discrepancies: result.discrepancies,
      unmatchedRecords: [
        { source: 'A', records: result.unmatchedA },
        { source: 'B', records: result.unmatchedB },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  static autoResolve(discrepancies: Discrepancy[], tolerance: number): Resolution[] {
    return discrepancies
      .filter((d) => d.withinTolerance || d.difference <= tolerance)
      .map((d) => ({
        key: d.key,
        field: d.field,
        resolvedValue: d.valueA, // Default to source A
        method: 'tolerance' as const,
      }));
  }
}
