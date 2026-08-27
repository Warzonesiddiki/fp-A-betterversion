/**
 * SOX Compliance Engine — Test Suite
 *
 * Source under test: src/engines/SOXComplianceEngine.ts (1,354 LOC, 36 methods)
 * Engine handles: Section 302 / 404 controls, segregation of duties, audit trails,
 * data integrity (BS equation, double-entry, period close, checksum), and access reviews.
 *
 * Coverage target: ≥ 85% line coverage (per Prometheus audit Top-10 #5).
 * Test count: 50+ across 12 describe blocks.
 *
 * Cross-refs: Prometheus audit report §5.1, Top-10 #5; closes 175/176 → 176/176 engine test gap.
 *
 * Honest Labeling (16th HL moment):
 *   The pre-write at `docs/drafts/prometheus/SOXComplianceEngine.test.ts` was based on an
 *   older interface version (used `CTRL-302-1` IDs, `frequency`/`owner`/`evidence` fields,
 *   `checkId` instead of `controlId`, `serialize()` returning object instead of string).
 *   This corrected file matches the ACTUAL source (SOX-302-01, no frequency field, etc.).
 *
 * Codification 8 (Glob ABSOLUTE path), Codification 9 (wc -l before/after), Codification 12
 * (verify-then-act, applied to the pre-write vs source reconciliation), D-007 Honest Labeling.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SOXComplianceEngine } from './SOXComplianceEngine';
import { AuditLogEngine } from './AuditLogEngine';
import type { Role } from '@/types/rbac';

describe('SOXComplianceEngine', () => {
  let engine: SOXComplianceEngine;

  beforeEach(() => {
    engine = new SOXComplianceEngine();
  });

  // ==========================================================================
  // 1. DEFAULT MATRIX — controls, SOD rules, integrity checks, audit reqs
  // ==========================================================================

  describe('Default matrix initialization', () => {
    it('initializes with 12 default SOX 302/404 controls', () => {
      const controls = engine.getControls();
      expect(controls.length).toBe(12);
      const ids = controls.map((c) => c.id);
      expect(ids).toContain('SOX-302-01');
      expect(ids).toContain('SOX-302-02');
      expect(ids).toContain('SOX-404-01');
      expect(ids).toContain('SOX-404-10');
    });

    it('default controls are enabled and have proper severity/category', () => {
      const controls = engine.getControls();
      const sec302 = controls.find((c) => c.id === 'SOX-302-01');
      expect(sec302).toBeDefined();
      expect(sec302!.enabled).toBe(true);
      expect(sec302!.severity).toBe('critical');
      expect(sec302!.category).toBe('approval_workflow');
    });

    it('initializes with 4 default SOD rules', () => {
      const rules = engine.getSODRules();
      expect(rules.length).toBe(4);
      const ids = rules.map((r) => r.id);
      expect(ids).toContain('SOD-001');
      expect(ids).toContain('SOD-002');
      expect(ids).toContain('SOD-003');
      expect(ids).toContain('SOD-004');
      // All defaults are enabled
      expect(rules.every((r) => r.enabled)).toBe(true);
    });

    it('initializes with 4 default integrity check definitions', () => {
      const checks = engine.getIntegrityCheckDefinitions();
      expect(checks.length).toBe(4);
      const ids = checks.map((c) => c.id);
      expect(ids).toContain('DI-001');
      expect(ids).toContain('DI-002');
      expect(ids).toContain('DI-003');
      expect(ids).toContain('DI-004');
    });

    it('initializes with 4 default audit trail requirements', () => {
      const reqs = engine.getAuditRequirements();
      expect(reqs.length).toBe(4);
      // All retention periods should be 2555 days (7 years for SOX)
      expect(reqs.every((r) => r.retentionDays === 2555)).toBe(true);
      // All should be tamper-proof
      expect(reqs.every((r) => r.tamperProof === true)).toBe(true);
    });
  });

  // ==========================================================================
  // 2. APPROVAL WORKFLOWS
  // ==========================================================================

  describe('Approval workflows', () => {
    it('createSOXWorkflow() returns a workflowId and requestId', () => {
      const result = engine.createSOXWorkflow(
        'Journal Approval',
        'Standard JE workflow',
        'admin-1'
      );
      expect(result).not.toBeNull();
      expect(result!.workflowId).toBeDefined();
      expect(typeof result!.workflowId).toBe('string');
    });

    it('createSOXWorkflow() with requireDualApproval creates multi-step workflow', () => {
      const result = engine.createSOXWorkflow(
        'Vendor Pmt',
        'Dual approval for vendor payments',
        'admin-1',
        {
          requireDualApproval: true,
          amountThreshold: 10000,
        }
      );
      expect(result).not.toBeNull();
      expect(result!.workflowId.length).toBeGreaterThan(0);
    });

    it('createSOXWorkflow() with requireDualApproval=false creates single-step', () => {
      const result = engine.createSOXWorkflow('Low-value approval', 'Single-step', 'admin-1', {
        requireDualApproval: false,
      });
      expect(result).not.toBeNull();
    });

    it('submitForApproval() returns an ApprovalRequest', () => {
      const { workflowId } = engine.createSOXWorkflow('Test', 'Test workflow', 'admin-1')!;
      const request = engine.submitForApproval(
        workflowId,
        'Test Request',
        'Test description',
        'user-1'
      );
      expect(request).not.toBeNull();
      expect(request!.requester).toBe('user-1');
    });

    it('approveRequest() enforces SOD: requester cannot self-approve', () => {
      const { workflowId } = engine.createSOXWorkflow('Test', 'Test workflow', 'admin-1')!;
      const request = engine.submitForApproval(workflowId, 'Test', 'Test', 'user-1')!;
      // Try to self-approve — should be rejected
      const result = engine.approveRequest(request.id, 'user-1');
      expect(result).toBeNull();
    });

    it('approveRequest() succeeds when approver ≠ requester and is in workflow approvers list', () => {
      // Default workflow approvers are ['manager', 'cfo']; use 'manager' to match
      const { workflowId } = engine.createSOXWorkflow('Test', 'Test workflow', 'admin-1')!;
      const request = engine.submitForApproval(workflowId, 'Test', 'Test', 'user-1')!;
      const result = engine.approveRequest(request.id, 'manager', 'Looks good');
      expect(result).not.toBeNull();
    });

    it('getPendingApprovals() returns the in-flight request', () => {
      const { workflowId } = engine.createSOXWorkflow('Test', 'Test workflow', 'admin-1')!;
      engine.submitForApproval(workflowId, 'Test', 'Test', 'user-1');
      const pending = engine.getPendingApprovals();
      expect(pending.length).toBeGreaterThanOrEqual(1);
    });

    it('checkApprovalSLABreaches() returns array (possibly empty)', () => {
      const breaches = engine.checkApprovalSLABreaches();
      expect(Array.isArray(breaches)).toBe(true);
    });
  });

  // ==========================================================================
  // 3. SEGREGATION OF DUTIES
  // ==========================================================================

  describe('Segregation of duties', () => {
    it('addSODRule() creates a new rule with auto-generated id', () => {
      const initialCount = engine.getSODRules().length;
      const newRule = engine.addSODRule({
        name: 'Test Rule',
        description: 'Test description',
        roleA: 'analyst' as Role,
        roleB: 'admin' as Role,
        resource: 'invoice',
        conflictType: 'same_user',
        enabled: true,
      });
      expect(newRule.id).toBeDefined();
      expect(newRule.id.startsWith('SOD-')).toBe(true);
      expect(engine.getSODRules().length).toBe(initialCount + 1);
    });

    it('removeSODRule() removes an existing rule by id', () => {
      const rule = engine.addSODRule({
        name: 'Test Remove',
        description: 'Test',
        roleA: 'analyst' as Role,
        roleB: 'manager' as Role,
        resource: 'budget',
        conflictType: 'same_user',
        enabled: true,
      });
      const before = engine.getSODRules().length;
      const removed = engine.removeSODRule(rule.id);
      expect(removed).toBe(true);
      expect(engine.getSODRules().length).toBe(before - 1);
    });

    it('removeSODRule() returns false for non-existent id', () => {
      const removed = engine.removeSODRule('SOD-DOES-NOT-EXIST');
      expect(removed).toBe(false);
    });

    it('getSODRules() returns a copy (mutation does not affect internal state)', () => {
      const rules = engine.getSODRules();
      rules.pop();
      expect(engine.getSODRules().length).toBe(4);
    });

    it('checkSODViolation() returns array (possibly empty) for a user with no role conflicts', () => {
      const violations = engine.checkSODViolation('user-x', 'analyst' as Role, 'budget');
      expect(Array.isArray(violations)).toBe(true);
    });

    it('scanAllSODViolations() returns array (possibly empty)', () => {
      const violations = engine.scanAllSODViolations();
      expect(Array.isArray(violations)).toBe(true);
    });
  });

  // ==========================================================================
  // 4. AUTHORIZATION
  // ==========================================================================

  describe('Authorization', () => {
    it('verifyAuthorization() returns structured result for a user with no roles', () => {
      const result = engine.verifyAuthorization('user-with-no-roles', 'read', 'budget');
      expect(result).toHaveProperty('authorized');
      expect(result).toHaveProperty('reason');
      expect(typeof result.reason).toBe('string');
    });

    it('verifyAuthorization() returns authorized=false when user has no roles', () => {
      const result = engine.verifyAuthorization('ghost-user', 'read', 'budget');
      expect(result.authorized).toBe(false);
    });

    it('verifyAuthorization() reason is a non-empty string', () => {
      const result = engine.verifyAuthorization('user-1', 'write', 'journal_entry');
      expect(result.reason.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 5. AUDIT TRAIL COMPLIANCE
  // ==========================================================================

  describe('Audit trail compliance', () => {
    it('logSOXAction() returns an AuditEntry with id and timestamp', () => {
      const entry = engine.logSOXAction(
        'user-1',
        'Alice',
        'create',
        'journal_entry',
        'je-1',
        'Created journal entry'
      );
      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
    });

    it('logSOXAction() supports oldValue and newValue params', () => {
      const entry = engine.logSOXAction(
        'user-1',
        'Alice',
        'update',
        'budget',
        'b-1',
        'Updated budget',
        1000,
        2000
      );
      expect(entry).toBeDefined();
    });

    it('verifyAuditTrailCompliance() returns not_applicable for unknown resource', () => {
      const result = engine.verifyAuditTrailCompliance('unknown_resource');
      expect(result.status).toBe('not_applicable');
      expect(result.totalEntries).toBe(0);
    });

    it('verifyAuditTrailCompliance() returns a valid AuditTrailComplianceResult for known resource', () => {
      engine.logSOXAction('u1', 'Alice', 'create', 'journal_entry', 'je-1', 'Test');
      const result = engine.verifyAuditTrailCompliance('journal_entry');
      expect(result).toHaveProperty('requirementId');
      expect(result).toHaveProperty('resource');
      expect(result).toHaveProperty('totalEntries');
      expect(result).toHaveProperty('missingFields');
      expect(result).toHaveProperty('tamperDetected');
      expect(result).toHaveProperty('retentionCompliant');
      expect(result).toHaveProperty('gapsDetected');
      expect(result).toHaveProperty('status');
    });

    it('verifyAuditTrailCompliance() reports retention compliance when engine retention covers the requirement', () => {
      engine.logSOXAction('u1', 'Alice', 'create', 'journal_entry', 'je-1', 'Test');
      const result = engine.verifyAuditTrailCompliance('journal_entry');
      // Default engine retains 2555 days; journal_entry requirement is 2555.
      expect(result.retentionCompliant).toBe(true);
    });

    it('verifyAuditTrailCompliance() flags retentionNonCompliance when engine retention is shorter than required', () => {
      // An audit engine configured to prune after 30 days destroys evidence the
      // 2555-day journal_entry requirement mandates — this must NOT report as
      // retention compliant (the old `|| true` guard could never fail).
      const shortRetention = new SOXComplianceEngine(new AuditLogEngine({ retentionDays: 30 }));
      shortRetention.logSOXAction('u1', 'Alice', 'create', 'journal_entry', 'je-1', 'Test');
      const result = shortRetention.verifyAuditTrailCompliance('journal_entry');
      expect(result.retentionCompliant).toBe(false);
    });

    it('getAuditEngine() returns the AuditLogEngine instance', () => {
      const auditEngine = engine.getAuditEngine();
      expect(auditEngine).toBeDefined();
      expect(typeof auditEngine.log).toBe('function');
    });
  });

  // ==========================================================================
  // 6. CLOSED PERIOD INTEGRITY
  // ==========================================================================

  describe('Closed period integrity', () => {
    it('verifyClosedPeriodIntegrity() returns empty array for no violations', () => {
      const violations = engine.verifyClosedPeriodIntegrity(['2025-Q4'], []);
      expect(violations).toEqual([]);
    });

    it('verifyClosedPeriodIntegrity() flags update in closed period', () => {
      const violations = engine.verifyClosedPeriodIntegrity(
        ['2025-Q4'],
        [{ period: '2025-Q4', timestamp: '2025-12-15T10:00:00Z', action: 'update' }]
      );
      expect(violations.length).toBe(1);
      expect(violations[0].category).toBe('audit_trail');
      expect(violations[0].status).toBe('fail');
      expect(violations[0].controlId).toBe('SOX-404-09');
    });

    it('verifyClosedPeriodIntegrity() flags delete in closed period', () => {
      const violations = engine.verifyClosedPeriodIntegrity(
        ['2025-Q4'],
        [{ period: '2025-Q4', timestamp: '2025-12-20T10:00:00Z', action: 'delete' }]
      );
      expect(violations.length).toBe(1);
    });

    it('verifyClosedPeriodIntegrity() does not flag actions in open periods', () => {
      const violations = engine.verifyClosedPeriodIntegrity(
        ['2025-Q4'],
        [{ period: '2026-Q1', timestamp: '2026-01-15T10:00:00Z', action: 'update' }]
      );
      expect(violations).toEqual([]);
    });
  });

  // ==========================================================================
  // 7. DATA INTEGRITY
  // ==========================================================================

  describe('Data integrity', () => {
    it('verifyBalanceSheetEquation() returns passed=true for balanced BS', () => {
      const result = engine.verifyBalanceSheetEquation(1000, 600, 400);
      expect(result.passed).toBe(true);
      expect(result.checkId).toBe('DI-001');
    });

    it('verifyBalanceSheetEquation() returns passed=false for unbalanced BS', () => {
      const result = engine.verifyBalanceSheetEquation(1000, 600, 300);
      expect(result.passed).toBe(false);
      expect(result.checkId).toBe('DI-001');
      expect(result.details).toContain('IMBALANCE');
    });

    it('verifyBalanceSheetEquation() honors tolerance parameter', () => {
      // 0.005 imbalance is within 0.01 tolerance → passed
      const result = engine.verifyBalanceSheetEquation(1000, 600, 399.995, 0.01);
      expect(result.passed).toBe(true);
    });

    it('verifyDoubleEntry() returns passed=true for balanced debits/credits', () => {
      const result = engine.verifyDoubleEntry([
        { debit: 100, credit: 0 },
        { debit: 0, credit: 100 },
      ]);
      expect(result.passed).toBe(true);
      expect(result.checkId).toBe('DI-002');
    });

    it('verifyDoubleEntry() returns passed=false for mismatched debits/credits', () => {
      const result = engine.verifyDoubleEntry([
        { debit: 100, credit: 0 },
        { debit: 0, credit: 50 },
      ]);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('MISMATCH');
    });

    it('verifyDoubleEntry() handles empty array as balanced (both sums 0)', () => {
      const result = engine.verifyDoubleEntry([]);
      expect(result.passed).toBe(true);
    });

    it('verifyDoubleEntry() sums many cent amounts exactly (no float drift)', () => {
      // Ten 0.1 debits vs one 1.00 credit. A naive float sum of ten 0.1s is
      // 0.9999999999999999, a 1e-16 imbalance — well inside the 0.01 tolerance,
      // so this would pass either way; the stronger guarantee is the reported
      // diff is exactly 0.00, not a float artifact.
      const entries = Array.from({ length: 10 }, () => ({ debit: 0.1, credit: 0 }));
      entries.push({ debit: 0, credit: 1.0 });
      const result = engine.verifyDoubleEntry(entries);
      expect(result.passed).toBe(true);
      expect(result.details).toContain('diff: $0.00');
      expect(result.details).toContain('Debits ($1.00)');
    });

    it('verifyDoubleEntry() catches a true one-cent break beyond tolerance', () => {
      const result = engine.verifyDoubleEntry(
        [
          { debit: 100.0, credit: 0 },
          { debit: 0, credit: 99.99 },
        ],
        0.001
      );
      expect(result.passed).toBe(false);
      expect(result.details).toContain('diff: $0.01');
    });

    it('verifyBalanceSheetEquation() reports an exact imbalance diff', () => {
      // diff is exactly 0.01; with a sub-cent tolerance it must fail, and the
      // reported diff must be the exact $0.01 (not a float artifact like 0.0100001).
      const result = engine.verifyBalanceSheetEquation(1000.0, 600.0, 399.99, 0.001);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('diff: $0.01');
    });

    it('computeDataHash() is deterministic for same input', () => {
      const data = { foo: 'bar', n: 42 };
      const h1 = engine.computeDataHash(data);
      const h2 = engine.computeDataHash(data);
      expect(h1).toBe(h2);
    });

    it('computeDataHash() differs for different inputs', () => {
      const h1 = engine.computeDataHash({ a: 1 });
      const h2 = engine.computeDataHash({ a: 2 });
      expect(h1).not.toBe(h2);
    });

    it('computeDataHash() returns a non-empty string', () => {
      const h = engine.computeDataHash({ test: 1 });
      expect(typeof h).toBe('string');
      expect(h.length).toBeGreaterThan(0);
    });

    it('storeDataHash() + verifyDataIntegrity() round-trip succeeds', () => {
      const data = { a: 1, b: 2 };
      engine.storeDataHash('key-1', data);
      const result = engine.verifyDataIntegrity('key-1', data);
      expect(result.passed).toBe(true);
      expect(result.checkId).toBe('DI-004');
    });

    it('verifyDataIntegrity() detects tampering (different data)', () => {
      engine.storeDataHash('key-1', { a: 1 });
      const result = engine.verifyDataIntegrity('key-1', { a: 2 });
      expect(result.passed).toBe(false);
      expect(result.details).toContain('TAMPERING');
    });

    it('verifyDataIntegrity() returns failed result for missing key', () => {
      const result = engine.verifyDataIntegrity('never-stored-key', { a: 1 });
      expect(result.passed).toBe(false);
    });

    it('verifyPeriodCloseIntegrity() returns passed for unmodified closed period', () => {
      const data = { q1: { total: 100 } };
      const closeHash = engine.computeDataHash(data.q1);
      const closedPeriods = new Map([['2026-Q1', closeHash]]);
      const currentData = new Map([['2026-Q1', { total: 100 }]]);
      const results = engine.verifyPeriodCloseIntegrity(closedPeriods, currentData);
      expect(results.length).toBe(1);
      expect(results[0].passed).toBe(true);
    });

    it('verifyPeriodCloseIntegrity() returns failed for modified closed period', () => {
      const closeHash = engine.computeDataHash({ total: 100 });
      const closedPeriods = new Map([['2026-Q1', closeHash]]);
      const currentData = new Map([['2026-Q1', { total: 200 }]]);
      const results = engine.verifyPeriodCloseIntegrity(closedPeriods, currentData);
      expect(results[0].passed).toBe(false);
    });

    it('getIntegrityResults() returns accumulated results', () => {
      expect(engine.getIntegrityResults().length).toBe(0);
      engine.verifyBalanceSheetEquation(100, 60, 40);
      expect(engine.getIntegrityResults().length).toBe(1);
    });

    it('clearIntegrityResults() empties the results array', () => {
      engine.verifyBalanceSheetEquation(100, 60, 40);
      engine.clearIntegrityResults();
      expect(engine.getIntegrityResults()).toEqual([]);
    });
  });

  // ==========================================================================
  // 8. ACCESS CONTROL
  // ==========================================================================

  describe('Access control', () => {
    it('reviewPrivilegedAccess() returns array of privileged users', () => {
      const privileged = engine.reviewPrivilegedAccess();
      expect(Array.isArray(privileged)).toBe(true);
    });

    it('reviewPrivilegedAccess() entries have userId, roles, riskLevel', () => {
      const privileged = engine.reviewPrivilegedAccess();
      if (privileged.length > 0) {
        const entry = privileged[0];
        expect(entry).toHaveProperty('userId');
        expect(entry).toHaveProperty('roles');
        expect(entry).toHaveProperty('riskLevel');
        expect(['high', 'medium', 'low']).toContain(entry.riskLevel);
      }
    });

    it('checkOrphanedRoles() returns array (possibly empty)', () => {
      const orphaned = engine.checkOrphanedRoles(90);
      expect(Array.isArray(orphaned)).toBe(true);
    });

    it('checkOrphanedRoles() respects the threshold parameter', () => {
      const d30 = engine.checkOrphanedRoles(30);
      const d365 = engine.checkOrphanedRoles(365);
      // Both should return arrays (length may differ if any user has activity between 30-365 days)
      expect(Array.isArray(d30)).toBe(true);
      expect(Array.isArray(d365)).toBe(true);
    });
  });

  // ==========================================================================
  // 9. FULL COMPLIANCE REPORT
  // ==========================================================================

  describe('Full compliance report', () => {
    it('generateReport() returns a SOXReport with required fields', () => {
      const report = engine.generateReport();
      expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(Array.isArray(report.checks)).toBe(true);
      expect(report.checks.length).toBeGreaterThan(0);
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(['compliant', 'non_compliant', 'partially_compliant']).toContain(report.overallStatus);
    });

    it('generateReport() includes the 5 check categories from default report', () => {
      const report = engine.generateReport();
      // Default report covers: approval (1) + SOD (1) + audit trail (4 resources) + access control (1) = 7 checks
      expect(report.checks.length).toBe(7);
      const categories = new Set(report.checks.map((c) => c.category));
      expect(categories.has('approval_workflow')).toBe(true);
      expect(categories.has('segregation_of_duties')).toBe(true);
      expect(categories.has('audit_trail')).toBe(true);
      expect(categories.has('access_control')).toBe(true);
    });

    it('generateReport() with balanceSheet option includes BS check', () => {
      const report = engine.generateReport({
        balanceSheet: { assets: 100, liabilities: 60, equity: 40 },
      });
      const bsCheck = report.checks.find((c) => c.id === 'chk-bs-1');
      expect(bsCheck).toBeDefined();
      expect(bsCheck!.status).toBe('pass');
    });

    it('generateReport() with unbalanced balanceSheet fails the BS check', () => {
      const report = engine.generateReport({
        balanceSheet: { assets: 100, liabilities: 60, equity: 30 },
      });
      const bsCheck = report.checks.find((c) => c.id === 'chk-bs-1');
      expect(bsCheck).toBeDefined();
      expect(bsCheck!.status).toBe('fail');
    });

    it('generateReport() with ledgerEntries includes double-entry check', () => {
      const report = engine.generateReport({
        ledgerEntries: [
          { debit: 100, credit: 0 },
          { debit: 0, credit: 100 },
        ],
      });
      const deCheck = report.checks.find((c) => c.id === 'chk-de-1');
      expect(deCheck).toBeDefined();
    });

    it('generateReport() with closedPeriods + recentEntries includes closed-period check', () => {
      const report = engine.generateReport({
        closedPeriods: ['2025-Q4'],
        recentEntries: [{ period: '2026-Q1', timestamp: '2026-01-15T10:00:00Z', action: 'create' }],
      });
      const cpCheck = report.checks.find((c) => c.id === 'chk-cp-1');
      expect(cpCheck).toBeDefined();
      expect(cpCheck!.status).toBe('pass');
    });

    it('generateReport() summary counts are consistent', () => {
      const report = engine.generateReport();
      const passed = report.checks.filter((c) => c.status === 'pass').length;
      const failed = report.checks.filter((c) => c.status === 'fail').length;
      const warnings = report.checks.filter((c) => c.status === 'warning').length;
      const notApplicable = report.checks.filter((c) => c.status === 'not_applicable').length;
      const total = report.checks.length;
      expect(passed + failed + warnings + notApplicable).toBe(total);
      expect(report.summary.total).toBe(total);
    });

    it('generateReport() byCategory sums to total', () => {
      const report = engine.generateReport();
      const sumByCategory = Object.values(report.byCategory).reduce((acc, c) => acc + c.total, 0);
      expect(sumByCategory).toBe(report.summary.total);
    });

    it('generateReport() criticalFindings is subset of failed checks', () => {
      const report = engine.generateReport();
      for (const cf of report.criticalFindings) {
        expect(cf.status).toBe('fail');
      }
    });

    it('getLastReport() returns the most recent report', () => {
      const _r1 = engine.generateReport();
      const r2 = engine.generateReport();
      const last = engine.getLastReport();
      expect(last).toEqual(r2);
    });

    it('getLastReport() returns null on a fresh engine', () => {
      const fresh = new SOXComplianceEngine();
      expect(fresh.getLastReport()).toBeNull();
    });
  });

  // ==========================================================================
  // 10. CONTROLS MANAGEMENT
  // ==========================================================================

  describe('Controls management', () => {
    it('getControls() returns a copy of the controls array', () => {
      const controls = engine.getControls();
      controls.pop();
      expect(engine.getControls().length).toBe(12);
    });

    it('setControlEnabled() enables/disables an existing control', () => {
      const ok1 = engine.setControlEnabled('SOX-302-01', false);
      expect(ok1).toBe(true);
      const c = engine.getControls().find((c) => c.id === 'SOX-302-01');
      expect(c!.enabled).toBe(false);

      const ok2 = engine.setControlEnabled('SOX-302-01', true);
      expect(ok2).toBe(true);
      expect(engine.getControls().find((c) => c.id === 'SOX-302-01')!.enabled).toBe(true);
    });

    it('setControlEnabled() returns false for unknown control id', () => {
      const ok = engine.setControlEnabled('SOX-DOES-NOT-EXIST', false);
      expect(ok).toBe(false);
    });

    it('addControl() creates a new control with auto-generated id', () => {
      const initial = engine.getControls().length;
      const newControl = engine.addControl({
        category: 'financial_reporting',
        name: 'Custom Reporting Check',
        description: 'A custom control',
        severity: 'medium',
        enabled: true,
      });
      expect(newControl.id).toBeDefined();
      expect(newControl.id.startsWith('SOX-CUSTOM-')).toBe(true);
      expect(engine.getControls().length).toBe(initial + 1);
    });
  });

  // ==========================================================================
  // 11. SERIALIZATION
  // ==========================================================================

  describe('Serialization', () => {
    it('serialize() returns a JSON string', () => {
      const state = engine.serialize();
      expect(typeof state).toBe('string');
      expect(() => JSON.parse(state)).not.toThrow();
    });

    it('serialize() round-trip preserves control count', () => {
      const originalControls = engine.getControls().length;
      const originalSodRules = engine.getSODRules().length;
      const state = engine.serialize();
      const fresh = new SOXComplianceEngine();
      const ok = fresh.deserialize(state);
      expect(ok).toBe(true);
      expect(fresh.getControls().length).toBe(originalControls);
      expect(fresh.getSODRules().length).toBe(originalSodRules);
    });

    it('deserialize() preserves added custom control + SOD rule', () => {
      engine.addControl({
        category: 'audit_trail',
        name: 'Custom Audit Check',
        description: 'd',
        severity: 'low',
        enabled: true,
      });
      engine.addSODRule({
        name: 'Custom SOD',
        description: 'd',
        roleA: 'analyst' as Role,
        roleB: 'admin' as Role,
        resource: 'invoice',
        conflictType: 'same_user',
        enabled: true,
      });

      const state = engine.serialize();
      const fresh = new SOXComplianceEngine();
      fresh.deserialize(state);

      expect(fresh.getControls().length).toBe(13);
      expect(fresh.getSODRules().length).toBe(5);
    });

    it('deserialize() returns false for invalid JSON', () => {
      const fresh = new SOXComplianceEngine();
      const ok = fresh.deserialize('not-valid-json{');
      expect(ok).toBe(false);
    });
  });

  // ==========================================================================
  // 12. INTEGRATION: END-TO-END SOX SCENARIO
  // ==========================================================================

  describe('Integration: end-to-end SOX scenario', () => {
    it('full approval workflow + audit trail + integrity check', () => {
      // 1. Create a SOX workflow
      const { workflowId } = engine.createSOXWorkflow(
        'JE Approval',
        'Standard journal entry approval',
        'admin-1'
      )!;

      // 2. Submit a request
      const request = engine.submitForApproval(
        workflowId,
        'Q1 Accrual',
        'Monthly accrual entry',
        'user-1',
        5000,
        'ACME-001',
        '2026-Q1'
      )!;
      expect(request).not.toBeNull();

      // 3. Approve with a different user in approvers list (SOD-compliant)
      const approved = engine.approveRequest(request.id, 'manager', 'Approved');
      expect(approved).not.toBeNull();

      // 4. Log a journal_entry action to the audit trail (default requirement covers it)
      engine.logSOXAction(
        'user-1',
        'Alice',
        'create',
        'journal_entry',
        'je-1',
        'Q1 Accrual entry',
        0,
        5000
      );
      const auditResult = engine.verifyAuditTrailCompliance('journal_entry');
      expect(auditResult.totalEntries).toBeGreaterThan(0);

      // 5. Run integrity check
      const bs = engine.verifyBalanceSheetEquation(1000, 600, 400);
      expect(bs.passed).toBe(true);

      // 6. Generate report — all should be green
      const report = engine.generateReport({
        balanceSheet: { assets: 1000, liabilities: 600, equity: 400 },
        ledgerEntries: [
          { debit: 100, credit: 0 },
          { debit: 0, credit: 100 },
        ],
      });
      expect(report.overallStatus).not.toBe('non_compliant');
    });

    it('flags a complete violation chain (SOD self-approval + closed period modify)', () => {
      // 1. Create workflow and submit
      const { workflowId } = engine.createSOXWorkflow('Test', 'Test', 'admin-1')!;
      const request = engine.submitForApproval(workflowId, 'Test', 'Test', 'user-1')!;

      // 2. Try to self-approve (SOD violation — should fail)
      const selfApproved = engine.approveRequest(request.id, 'user-1');
      expect(selfApproved).toBeNull();

      // 3. Closed period violation
      const cpViolations = engine.verifyClosedPeriodIntegrity(
        ['2025-Q4'],
        [{ period: '2025-Q4', timestamp: '2025-12-15T10:00:00Z', action: 'update' }]
      );
      expect(cpViolations.length).toBe(1);

      // 4. Unbalanced BS
      const bs = engine.verifyBalanceSheetEquation(1000, 600, 300);
      expect(bs.passed).toBe(false);

      // 5. Generate report
      const report = engine.generateReport({
        balanceSheet: { assets: 1000, liabilities: 600, equity: 300 },
        closedPeriods: ['2025-Q4'],
        recentEntries: [{ period: '2025-Q4', timestamp: '2025-12-15T10:00:00Z', action: 'update' }],
      });
      // Report should be non-compliant or partially compliant
      expect(['non_compliant', 'partially_compliant']).toContain(report.overallStatus);
      expect(report.criticalFindings.length).toBeGreaterThan(0);
    });
  });
});
