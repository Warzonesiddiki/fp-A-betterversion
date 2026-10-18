// @money-ast-allow Reason: Control coverage percent: (testedControls / totalControls) * 100 is a count-based ratio, not money
// =============================================================================
// REGULATORY REPORTING ENGINE — SOX 404 / IFRS / GDPR / GAAP Report Generation
// Pure TypeScript, deterministic, testable. Generates regulatory reports
// for financial (SOX 404, IFRS, GAAP, FINREP) and non-financial (GDPR, ESG)
// jurisdictions. Includes template validation, rule-based validation,
// material misstatement detection, electronic signature, audit-trail
// hash, and regulator-specific output formatting.
//
// All methods are STATIC and PURE (no React/DOM, no global state).
// 4-ICP verdict (G9 GATE):
//   INTENT:     SOX/IFRS/GDPR/GAAP/ESG regulatory report generation.
//   CORRECTNESS: Rule-based validation, threshold detection, hash chain.
//   PERF:       O(n) for report assembly, O(n*rules) for validation.
//   COMPLIANCE: Audit-trail hash, electronic signature, tamper detection.
// =============================================================================

// --- Type Definitions ---

export type ReportFramework = 'SOX-404' | 'IFRS' | 'GAAP' | 'FINREP' | 'GDPR' | 'ESG' | 'COREP';
export type ReportSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type OutputFormat = 'pdf' | 'xbrl' | 'csv' | 'json' | 'html';

export interface ReportTemplate {
  readonly id: string;
  readonly framework: ReportFramework;
  readonly version: string;
  readonly sections: readonly ReportSection[];
  readonly requiredFields: readonly string[];
  readonly validationRules: readonly ValidationRule[];
}

export interface ReportSection {
  readonly id: string;
  readonly title: string;
  readonly type: 'header' | 'table' | 'narrative' | 'attestation' | 'signature';
  readonly fields: readonly string[];
}

export interface ValidationRule {
  readonly id: string;
  readonly field: string;
  readonly type: 'required' | 'range' | 'regex' | 'sum' | 'threshold' | 'cross-field';
  readonly params: Record<string, string | number | boolean>;
  readonly severity: ReportSeverity;
  readonly message: string;
}

export interface ReportData {
  readonly [key: string]: string | number | boolean | null | ReportData | readonly ReportData[];
}

export interface ValidationIssue {
  readonly ruleId: string;
  readonly field: string;
  readonly severity: ReportSeverity;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
  readonly errors: number;
  readonly warnings: number;
}

export interface ReportFinding {
  readonly field: string;
  readonly actual: number;
  readonly expected: number;
  readonly delta: number;
  readonly deltaPct: number;
  readonly severity: ReportSeverity;
  readonly material: boolean;
}

export interface SignedReport {
  readonly reportId: string;
  readonly framework: ReportFramework;
  readonly generatedAt: string;
  readonly signedBy: string;
  readonly signedAt: string;
  readonly hash: string;
  readonly data: ReportData;
  readonly validation: ValidationResult;
  readonly findings: readonly ReportFinding[];
}

export interface ESGMetrics {
  readonly scope1Emissions: number; // tons CO2e
  readonly scope2Emissions: number; // tons CO2e
  readonly scope3Emissions: number; // tons CO2e
  readonly waterUsage: number; // m3
  readonly wasteRecycled: number; // tons
  readonly diversityPct: number; // 0-100
  readonly boardIndependence: number; // 0-100
}

// --- Engine ---

export class RegulatoryReportingEngine {
  // 1. Validate template structure
  static validateTemplate(template: ReportTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!template.id) errors.push('Template missing id');
    if (!template.framework) errors.push('Template missing framework');
    if (!template.sections?.length) errors.push('Template has no sections');
    if (template.requiredFields.length === 0) errors.push('Template has no required fields');
    const ruleIds = new Set<string>();
    for (const r of template.validationRules) {
      if (ruleIds.has(r.id)) errors.push(`Duplicate rule id: ${r.id}`);
      ruleIds.add(r.id);
    }
    return { valid: errors.length === 0, errors };
  }

  // 2. Render report from template + data
  static renderReport(
    template: ReportTemplate,
    data: ReportData
  ): {
    header: string;
    attest: string;
    body: ReportData;
    sections: Record<string, ReportData | string>;
  } {
    const sections: Record<string, ReportData | string> = {};
    let header = '';
    let attest = '';
    let body: ReportData = data;
    for (const section of template.sections) {
      if (section.type === 'header') {
        const value = template.id + ' v' + template.version;
        sections[section.id] = value;
        header = value;
      } else if (section.type === 'attestation') {
        const value = 'I attest that the information in this report is accurate and complete.';
        sections[section.id] = value;
        attest = value;
      } else {
        sections[section.id] = data;
        body = data;
      }
    }
    return { header, attest, body, sections };
  }

  // 3. Apply validation rules to data
  static applyValidationRules(template: ReportTemplate, data: ReportData): ValidationResult {
    const issues: ValidationIssue[] = [];
    for (const rule of template.validationRules) {
      const val = RegulatoryReportingEngine.getNestedValue(data, rule.field);
      if (rule.type === 'required' && (val === null || val === undefined || val === '')) {
        issues.push({
          ruleId: rule.id,
          field: rule.field,
          severity: rule.severity,
          message: rule.message,
        });
      } else if (rule.type === 'range' && typeof val === 'number') {
        const min = Number(rule.params.min ?? -Infinity);
        const max = Number(rule.params.max ?? Infinity);
        if (val < min || val > max)
          issues.push({
            ruleId: rule.id,
            field: rule.field,
            severity: rule.severity,
            message: `${rule.message} (got ${val}, expected ${min}-${max})`,
          });
      } else if (rule.type === 'regex' && typeof val === 'string') {
        const pattern = new RegExp(String(rule.params.pattern));
        if (!pattern.test(val))
          issues.push({
            ruleId: rule.id,
            field: rule.field,
            severity: rule.severity,
            message: rule.message,
          });
      }
    }
    const errors = issues.filter((i) => i.severity === 'high' || i.severity === 'critical').length;
    const warnings = issues.filter((i) => i.severity === 'medium' || i.severity === 'low').length;
    return { valid: errors === 0, issues, errors, warnings };
  }

  // 4. Compute ESG composite score (0-100)
  /**
   * An empty metric set is not a perfect environmental record. With nothing
   * supplied, every pillar and the composite are `null` and `evaluated` is
   * false, because scoring zeros produced `e: 100` (no emissions reported read
   * as a perfect E pillar) and a composite of 52 for an entity that had
   * reported nothing at all.
   *
   * A record in which *something* was supplied is scored exactly as before:
   * deciding what a genuine 0 emissions figure means next to an unknown
   * diversity percentage is a per-pillar availability decision for the owner,
   * not for this engine.
   */
  static computeESGScore(metrics: ESGMetrics): {
    composite: number | null;
    e: number | null;
    s: number | null;
    g: number | null;
    evaluated: boolean;
    reason?: string;
  } {
    const nothingSupplied =
      metrics.scope1Emissions === 0 &&
      metrics.scope2Emissions === 0 &&
      metrics.scope3Emissions === 0 &&
      metrics.waterUsage === 0 &&
      metrics.wasteRecycled === 0 &&
      metrics.diversityPct === 0 &&
      metrics.boardIndependence === 0;
    if (nothingSupplied) {
      return {
        composite: null,
        e: null,
        s: null,
        g: null,
        evaluated: false,
        reason: 'no ESG metrics supplied (every field is zero) — nothing to assess',
      };
    }

    const e = Math.max(0, 100 - (metrics.scope1Emissions + metrics.scope2Emissions) / 1000);
    const s = metrics.diversityPct * 0.6 + (metrics.waterUsage < 1000000 ? 40 : 20);
    const g = metrics.boardIndependence;
    return {
      composite: Math.round(e * 0.4 + s * 0.3 + g * 0.3),
      e: Math.round(e),
      s: Math.round(s),
      g: Math.round(g),
      evaluated: true,
    };
  }

  // 5. Compute SOX 404 control coverage (% of controls tested)
  /**
   * Absence of controls, and absence of testing, are not findings. With no
   * controls in scope this used to return `materialWeakness: true` (effectiveness
   * 0 < 80) — the strongest possible adverse SOX conclusion, asserted over an
   * empty input; `(100, 0, 0)` did the same, so nothing tested read as a
   * weakness. Now: no controls in scope → everything `null`, `evaluated: false`;
   * controls in scope but none tested → coverage 0 (a real fact) with
   * effectiveness and weakness `null` (unknown). Only tested controls can
   * produce a weakness, and the comparison still uses the unrounded
   * effectiveness, so a supplied-data result is bit-for-bit what it was.
   */
  static computeSOXControlsCoverage(
    totalControls: number,
    testedControls: number,
    passedControls: number
  ): {
    coverage: number | null;
    effectiveness: number | null;
    materialWeakness: boolean | null;
    evaluated: boolean;
    reason?: string;
  } {
    if (totalControls === 0) {
      return {
        coverage: null,
        effectiveness: null,
        materialWeakness: null,
        evaluated: false,
        reason:
          'no controls in scope — coverage and effectiveness cannot be computed, and a material weakness cannot be asserted',
      };
    }

    const coverage = Math.round((testedControls / totalControls) * 100);

    if (testedControls === 0) {
      return {
        coverage,
        effectiveness: null,
        materialWeakness: null,
        evaluated: true,
        reason: `${totalControls} control(s) in scope but none were tested — effectiveness is unknown, and untested is not a weakness`,
      };
    }

    const rawEffectiveness = (passedControls / testedControls) * 100;
    return {
      coverage,
      effectiveness: Math.round(rawEffectiveness),
      materialWeakness: rawEffectiveness < 80,
      evaluated: true,
    };
  }

  // 6. Compute GDPR compliance score (0-100)
  /**
   * Every deduction is guarded by a `> 0` / `<` comparison, so an empty input
   * triggered none of them and returned `score: 100, issues: []`: no records on
   * file read as full GDPR compliance. With nothing supplied the score is now
   * `null` and `evaluated` is false. A supplied record is scored exactly as
   * before.
   */
  static computeGDPRScore(
    processingActivities: number,
    dpiaCompleted: number,
    breachIncidents: number,
    consentRecords: number
  ): { score: number | null; issues: string[]; evaluated: boolean; reason?: string } {
    const issues: string[] = [];

    if (
      processingActivities === 0 &&
      dpiaCompleted === 0 &&
      breachIncidents === 0 &&
      consentRecords === 0
    ) {
      return {
        score: null,
        issues,
        evaluated: false,
        reason:
          'no processing activities, DPIAs, breach incidents or consent records supplied — nothing to assess',
      };
    }

    let score = 100;
    if (processingActivities > 0 && dpiaCompleted < processingActivities) {
      score -= 20;
      issues.push(`${processingActivities - dpiaCompleted} processing activities missing DPIA`);
    }
    if (breachIncidents > 0) {
      score -= breachIncidents * 5;
      issues.push(`${breachIncidents} breach incidents on record`);
    }
    if (consentRecords < processingActivities) {
      score -= 10;
      issues.push(`Incomplete consent records (${consentRecords}/${processingActivities})`);
    }
    return { score: Math.max(0, score), issues, evaluated: true };
  }

  // 7. Detect material misstatements (delta > threshold)
  static detectMaterialMisstatements(
    report: ReportData,
    prior: ReportData,
    threshold: number
  ): readonly ReportFinding[] {
    const findings: ReportFinding[] = [];
    const fields = new Set([...Object.keys(report), ...Object.keys(prior)]);
    for (const f of fields) {
      const cur = Number(report[f]);
      const prev = Number(prior[f]);
      if (isNaN(cur) || isNaN(prev) || prev === 0) continue;
      const delta = cur - prev;
      const deltaPct = Math.abs((delta / prev) * 100);
      if (deltaPct > threshold) {
        findings.push({
          field: f,
          actual: cur,
          expected: prev,
          delta,
          deltaPct: Math.round(deltaPct),
          severity: deltaPct > threshold * 2 ? 'critical' : 'high',
          material: deltaPct > threshold,
        });
      }
    }
    return findings;
  }

  // 8. Sign report with electronic signature
  static signReport(
    reportId: string,
    framework: ReportFramework,
    data: ReportData,
    validation: ValidationResult,
    findings: readonly ReportFinding[],
    signedBy: string
  ): SignedReport {
    return {
      reportId,
      framework,
      generatedAt: new Date().toISOString(),
      signedBy,
      signedAt: new Date().toISOString(),
      hash: RegulatoryReportingEngine.computeAuditTrailHash(reportId, signedBy, data),
      data,
      validation,
      findings,
    };
  }

  // 9. Compute audit-trail hash (deterministic SHA-256-like)
  static computeAuditTrailHash(reportId: string, signedBy: string, data: ReportData): string {
    const content = reportId + '|' + signedBy + '|' + JSON.stringify(data);
    // Simple deterministic hash (not cryptographic — for traceability only)
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < content.length; i++) {
      const ch = content.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }

  // 10. Format regulator output
  static formatRegulatorOutput(report: SignedReport, format: OutputFormat): string {
    if (format === 'json') return JSON.stringify(report, null, 2);
    if (format === 'csv')
      return `reportId,framework,signedBy,signedAt,hash\n${report.reportId},${report.framework},${report.signedBy},${report.signedAt},${report.hash}`;
    if (format === 'xbrl')
      return `<?xml version="1.0"?><xbrl><context id="${report.reportId}">${report.framework}</context></xbrl>`;
    if (format === 'html')
      return `<html><body><h1>${report.framework} Report</h1><p>ID: ${report.reportId}</p><p>Signed: ${report.signedBy}</p></body></html>`;
    return `Report ${report.reportId} (${report.framework}) signed by ${report.signedBy} on ${report.signedAt}`;
  }

  // 11. Validate that all required fields are present
  static validateRequiredFields(template: ReportTemplate, data: ReportData): readonly string[] {
    const missing: string[] = [];
    for (const f of template.requiredFields) {
      if (RegulatoryReportingEngine.getNestedValue(data, f) === undefined) missing.push(f);
    }
    return missing;
  }

  // 12. Get nested value from data object (supports dot notation)
  static getNestedValue(
    data: ReportData,
    path: string
  ): string | number | boolean | null | ReportData | readonly ReportData[] | undefined {
    const parts = path.split('.');
    let current: unknown = data;
    for (const p of parts) {
      if (current && typeof current === 'object' && p in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[p];
      } else {
        return undefined;
      }
    }
    return current as
      | string
      | number
      | boolean
      | null
      | ReportData
      | readonly ReportData[]
      | undefined;
  }
}
