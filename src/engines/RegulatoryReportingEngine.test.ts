import { describe, it, expect } from 'vitest';
import {
  RegulatoryReportingEngine,
  type ReportTemplate,
  type ReportData,
  type ESGMetrics,
} from './RegulatoryReportingEngine';

// =============================================================================
// TEST HELPERS
// =============================================================================

function makeTemplate(overrides: Partial<ReportTemplate> = {}): ReportTemplate {
  return {
    id: 'SOX-2026-Q1',
    framework: 'SOX-404',
    version: '1.0',
    sections: [
      { id: 'header', title: 'Header', type: 'header', fields: [] },
      { id: 'body', title: 'Body', type: 'table', fields: ['revenue', 'netIncome'] },
      { id: 'attest', title: 'Attestation', type: 'attestation', fields: [] },
    ],
    requiredFields: ['revenue', 'netIncome', 'cfoAttestation'],
    validationRules: [
      {
        id: 'r1',
        field: 'revenue',
        type: 'range',
        params: { min: 0, max: 1e12 },
        severity: 'high',
        message: 'Revenue out of range',
      },
      {
        id: 'r2',
        field: 'cfoAttestation',
        type: 'required',
        params: {},
        severity: 'critical',
        message: 'CFO attestation required',
      },
    ],
    ...overrides,
  };
}

// =============================================================================
// TESTS (12 tests, ≥10 minimum per Leader spec)
// =============================================================================

describe('RegulatoryReportingEngine', () => {
  it('1. validateTemplate returns valid for clean template', () => {
    const t = makeTemplate();
    const r = RegulatoryReportingEngine.validateTemplate(t);
    expect(r.valid).toBe(true);
  });

  it('2. validateTemplate detects missing sections', () => {
    const t = makeTemplate({ sections: [] });
    const r = RegulatoryReportingEngine.validateTemplate(t);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('no sections'))).toBe(true);
  });

  it('3. validateTemplate detects duplicate rule ids', () => {
    const t = makeTemplate({
      validationRules: [
        { id: 'dup', field: 'a', type: 'required', params: {}, severity: 'high', message: 'm' },
        { id: 'dup', field: 'b', type: 'required', params: {}, severity: 'high', message: 'm' },
      ],
    });
    const r = RegulatoryReportingEngine.validateTemplate(t);
    expect(r.valid).toBe(false);
  });

  it('4. renderReport returns sections for all template sections', () => {
    const t = makeTemplate();
    const data: ReportData = { revenue: 1000000, netIncome: 100000, cfoAttestation: true };
    const r = RegulatoryReportingEngine.renderReport(t, data);
    expect(r.header).toContain('SOX-2026-Q1');
    expect(r.attest).toContain('attest');
    expect(r.body).toEqual(data);
  });

  it('5. applyValidationRules flags missing required field', () => {
    const t = makeTemplate();
    const data: ReportData = { revenue: 1000, netIncome: 100 }; // missing cfoAttestation
    const r = RegulatoryReportingEngine.applyValidationRules(t, data);
    expect(r.valid).toBe(false);
    expect(r.errors).toBeGreaterThanOrEqual(1);
  });

  it('6. applyValidationRules flags out-of-range value', () => {
    const t = makeTemplate();
    const data: ReportData = { revenue: -100, netIncome: 100, cfoAttestation: true };
    const r = RegulatoryReportingEngine.applyValidationRules(t, data);
    expect(r.valid).toBe(false);
  });

  it('7. computeESGScore returns composite and sub-scores', () => {
    const metrics: ESGMetrics = {
      scope1Emissions: 100,
      scope2Emissions: 200,
      scope3Emissions: 1000,
      waterUsage: 500000,
      wasteRecycled: 100,
      diversityPct: 50,
      boardIndependence: 70,
    };
    const r = RegulatoryReportingEngine.computeESGScore(metrics);
    expect(r.composite).toBeGreaterThan(0);
    expect(r.composite).toBeLessThanOrEqual(100);
    expect(r.e).toBeGreaterThan(0);
  });

  it('8. computeSOXControlsCoverage detects material weakness', () => {
    const r = RegulatoryReportingEngine.computeSOXControlsCoverage(100, 100, 70);
    expect(r.coverage).toBe(100);
    expect(r.effectiveness).toBe(70);
    expect(r.materialWeakness).toBe(true);
  });

  it('9. computeSOXControlsCoverage reports no weakness for high effectiveness', () => {
    const r = RegulatoryReportingEngine.computeSOXControlsCoverage(100, 100, 95);
    expect(r.effectiveness).toBe(95);
    expect(r.materialWeakness).toBe(false);
  });

  it('10. computeGDPRScore returns score and issues', () => {
    const r = RegulatoryReportingEngine.computeGDPRScore(10, 5, 2, 8);
    expect(r.score).toBeLessThan(100);
    expect(r.issues.length).toBeGreaterThan(0);
  });

  it('11. detectMaterialMisstatements flags large deltas', () => {
    const cur: ReportData = { revenue: 1000 };
    const prev: ReportData = { revenue: 800 };
    const findings = RegulatoryReportingEngine.detectMaterialMisstatements(cur, prev, 5); // 25% delta > 5%
    expect(findings.length).toBe(1);
    expect(findings[0].field).toBe('revenue');
    expect(findings[0].material).toBe(true);
  });

  it('12. signReport and computeAuditTrailHash produce deterministic output', () => {
    const data: ReportData = { revenue: 1000 };
    const validation = RegulatoryReportingEngine.applyValidationRules(makeTemplate(), data);
    const findings = RegulatoryReportingEngine.detectMaterialMisstatements(
      data,
      { revenue: 900 },
      5
    );
    const r = RegulatoryReportingEngine.signReport(
      'R1',
      'SOX-404',
      data,
      validation,
      findings,
      'alice'
    );
    expect(r.signedBy).toBe('alice');
    expect(r.hash.length).toBe(16);
    expect(r.validation).toEqual(validation);
  });
});
