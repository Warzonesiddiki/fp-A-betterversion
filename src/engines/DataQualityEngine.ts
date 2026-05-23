// DataQualityEngine — Data quality profiling and scoring
// Pure TypeScript, deterministic, no external dependencies

export type QualityDimension =
  | 'completeness'
  | 'accuracy'
  | 'consistency'
  | 'timeliness'
  | 'uniqueness'
  | 'validity';

export interface QualityRule {
  id: string;
  name: string;
  dimension: QualityDimension;
  field: string;
  check: (value: unknown, row?: Record<string, unknown>) => boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface QualityResult {
  field: string;
  dimension: QualityDimension;
  passed: number;
  failed: number;
  total: number;
  score: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  failedRows: number[];
}

export interface DataQualityReport {
  overallScore: number;
  dimensionScores: Record<QualityDimension, number>;
  fieldScores: Record<string, number>;
  results: QualityResult[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    criticalFailures: number;
  };
  generatedAt: string;
}

export class DataQualityEngine {
  private rules: QualityRule[] = [];

  addRule(rule: QualityRule): void {
    this.rules.push(rule);
  }

  removeRule(id: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.rules.splice(idx, 1);
    return true;
  }

  getRules(): QualityRule[] {
    return [...this.rules];
  }

  getRulesByDimension(dimension: QualityDimension): QualityRule[] {
    return this.rules.filter((r) => r.dimension === dimension);
  }

  profile(data: Record<string, unknown>[]): Record<
    string,
    {
      total: number;
      nulls: number;
      unique: number;
      types: Record<string, number>;
      completeness: number;
      uniqueness: number;
    }
  > {
    const profile: Record<string, ReturnType<typeof this.profile>[string]> = {};
    if (data.length === 0) return profile;

    const fields = Object.keys(data[0]);
    for (const field of fields) {
      const values = data.map((row) => row[field]);
      const nulls = values.filter((v) => v === null || v === undefined || v === '').length;
      const unique = new Set(values.map((v) => JSON.stringify(v))).size;
      const types: Record<string, number> = {};
      for (const v of values) {
        const t = v === null || v === undefined ? 'null' : Array.isArray(v) ? 'array' : typeof v;
        types[t] = (types[t] || 0) + 1;
      }
      profile[field] = {
        total: data.length,
        nulls,
        unique,
        types,
        completeness: (data.length - nulls) / data.length,
        uniqueness: unique / data.length,
      };
    }
    return profile;
  }

  validate(data: Record<string, unknown>[]): DataQualityReport {
    const results: QualityResult[] = [];
    for (const rule of this.rules) {
      let passed = 0;
      let failed = 0;
      const failedRows: number[] = [];
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const value = row[rule.field];
        if (rule.check(value, row)) {
          passed++;
        } else {
          failed++;
          failedRows.push(i);
        }
      }
      const total = passed + failed;
      results.push({
        field: rule.field,
        dimension: rule.dimension,
        passed,
        failed,
        total,
        score: total > 0 ? passed / total : 1,
        severity: rule.severity,
        failedRows,
      });
    }

    const dimensionScores: Record<QualityDimension, number> = {
      completeness: 0,
      accuracy: 0,
      consistency: 0,
      timeliness: 0,
      uniqueness: 0,
      validity: 0,
    };
    const dimensionCounts: Record<string, number> = {};
    for (const r of results) {
      dimensionScores[r.dimension] = (dimensionScores[r.dimension] || 0) + r.score;
      dimensionCounts[r.dimension] = (dimensionCounts[r.dimension] || 0) + 1;
    }
    for (const dim of Object.keys(dimensionScores) as QualityDimension[]) {
      if (dimensionCounts[dim]) dimensionScores[dim] /= dimensionCounts[dim];
      else dimensionScores[dim] = 1;
    }

    const fieldScores: Record<string, number> = {};
    const fieldGroups = new Map<string, QualityResult[]>();
    for (const r of results) {
      const existing = fieldGroups.get(r.field) || [];
      existing.push(r);
      fieldGroups.set(r.field, existing);
    }
    for (const [field, group] of fieldGroups) {
      fieldScores[field] = group.reduce((s, r) => s + r.score, 0) / group.length;
    }

    const totalChecks = results.reduce((s, r) => s + r.total, 0);
    const passed = results.reduce((s, r) => s + r.passed, 0);
    const failed = results.reduce((s, r) => s + r.failed, 0);
    const criticalFailures = results.filter(
      (r) => r.severity === 'critical' && r.failed > 0
    ).length;

    const overallScore =
      results.length > 0 ? results.reduce((s, r) => s + r.score, 0) / results.length : 1;

    return {
      overallScore,
      dimensionScores,
      fieldScores,
      results,
      summary: { totalChecks, passed, failed, criticalFailures },
      generatedAt: new Date().toISOString(),
    };
  }
}

// Preset rules
export function createCompletenessRule(
  field: string,
  severity: QualityRule['severity'] = 'high'
): QualityRule {
  return {
    id: `completeness-${field}`,
    name: `${field} must not be empty`,
    dimension: 'completeness',
    field,
    check: (v) => v !== null && v !== undefined && v !== '',
    severity,
  };
}

export function createNumericRule(field: string, min?: number, max?: number): QualityRule {
  return {
    id: `numeric-${field}`,
    name: `${field} must be a valid number`,
    dimension: 'validity',
    field,
    check: (v) => {
      if (typeof v !== 'number' || !Number.isFinite(v)) return false;
      if (min !== undefined && v < min) return false;
      if (max !== undefined && v > max) return false;
      return true;
    },
    severity: 'high',
  };
}

export function createRangeRule(field: string, min: number, max: number): QualityRule {
  return {
    id: `range-${field}`,
    name: `${field} must be between ${min} and ${max}`,
    dimension: 'accuracy',
    field,
    check: (v) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max,
    severity: 'medium',
  };
}

export function createUniqueRule(field: string): QualityRule {
  const seen = new Set<string>();
  return {
    id: `unique-${field}`,
    name: `${field} must be unique`,
    dimension: 'uniqueness',
    field,
    check: (v) => {
      const key = JSON.stringify(v);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    },
    severity: 'high',
  };
}
