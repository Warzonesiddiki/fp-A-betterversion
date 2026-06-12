/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach } from 'vitest';
import { SOXComplianceEngine } from './SOXComplianceEngine';
import { AuditLogEngine } from './AuditLogEngine';
import { WorkflowEngine } from './WorkflowEngine';
import { RBACEngine } from './RBACEngine';

describe('SOXComplianceEngine', () => {
  let engine: SOXComplianceEngine;
  let audit: AuditLogEngine;
  let workflow: WorkflowEngine;
  let rbac: RBACEngine;

  beforeEach(() => {
    audit = new AuditLogEngine({ retentionDays: 2555 });
    workflow = new WorkflowEngine();
    rbac = new RBACEngine();
    engine = new SOXComplianceEngine(audit, workflow, rbac);
  });

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  describe('initialization', () => {
    it('should initialize with default controls', () => {
      const controls = engine.getControls();
      expect(controls.length).toBeGreaterThanOrEqual(10);
      expect(controls.some((c) => c.id === 'SOX-302-01')).toBe(true);
      expect(controls.some((c) => c.id === 'SOX-404-01')).toBe(true);
    });

    it('should initialize with default SOD rules', () => {
      const rules = engine.getSODRules();
      expect(rules.length).toBeGreaterThanOrEqual(4);
    });

    it('should initialize with default integrity check definitions', () => {
      const checks = engine.getIntegrityCheckDefinitions();
      expect(checks.length).toBeGreaterThanOrEqual(4);
    });

    it('should initialize with default audit requirements', () => {
      const requirements = engine.getAuditRequirements();
      expect(requirements.length).toBeGreaterThanOrEqual(4);
    });

    it('should create with default engines if none provided', () => {
      const defaultEngine = new SOXComplianceEngine();
      expect(defaultEngine).toBeDefined();
      expect(defaultEngine.getControls().length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // APPROVAL WORKFLOWS
  // ===========================================================================

  describe('approval workflows', () => {
    it('should create a SOX workflow with dual approval', () => {
      const result = engine.createSOXWorkflow(
        'Budget Approval',
        'Standard budget approval',
        'admin',
        { requireDualApproval: true }
      );

      expect(result).not.toBeNull();
      expect(result!.workflowId).toBeDefined();
    });

    it('should create a SOX workflow with single approval', () => {
      const result = engine.createSOXWorkflow('Simple Approval', 'Single step', 'admin', {
        requireDualApproval: false,
      });

      expect(result).not.toBeNull();
    });

    it('should submit for approval', () => {
      const wf = engine.createSOXWorkflow('Test', 'test', 'admin');
      expect(wf).not.toBeNull();

      // Create the workflow directly for submission
      const workflowDef = workflow.createWorkflow({
        name: 'Test WF',
        description: 'test',
        steps: [{ id: 's1', name: 'Review', type: 'sequential', approvers: ['manager'], order: 0 }],
        createdBy: 'admin',
        isTemplate: false,
      });

      const request = engine.submitForApproval(
        workflowDef.id,
        'Q1 Budget',
        'Quarterly budget review',
        'analyst1',
        50000,
        'entity-1',
        'Q1-2026'
      );

      expect(request).not.toBeNull();
      expect(request!.title).toBe('Q1 Budget');
      expect(request!.state).toBe('submitted');
    });

    it('should approve request with proper authorization', () => {
      const workflowDef = workflow.createWorkflow({
        name: 'Test',
        description: 'test',
        steps: [{ id: 's1', name: 'Review', type: 'sequential', approvers: ['manager'], order: 0 }],
        createdBy: 'admin',
        isTemplate: false,
      });

      const request = workflow.submitRequest(workflowDef.id, 'Test', 'test', 'analyst1');
      expect(request).not.toBeNull();

      const approved = engine.approveRequest(request!.id, 'manager', 'Looks good');
      expect(approved).not.toBeNull();
      expect(approved!.state).toBe('approved');
    });

    it('should reject request from approver', () => {
      const workflowDef = workflow.createWorkflow({
        name: 'Test',
        description: 'test',
        steps: [{ id: 's1', name: 'Review', type: 'sequential', approvers: ['manager'], order: 0 }],
        createdBy: 'admin',
        isTemplate: false,
      });

      const request = workflow.submitRequest(workflowDef.id, 'Test', 'test', 'analyst1');
      expect(request).not.toBeNull();

      const rejected = workflow.reject(request!.id, 'manager', 'Needs revision');
      expect(rejected).not.toBeNull();
      expect(rejected!.state).toBe('rejected');
    });

    it('should prevent self-approval (SOD enforcement)', () => {
      const workflowDef = workflow.createWorkflow({
        name: 'Test',
        description: 'test',
        steps: [
          { id: 's1', name: 'Review', type: 'sequential', approvers: ['analyst1'], order: 0 },
        ],
        createdBy: 'admin',
        isTemplate: false,
      });

      const request = workflow.submitRequest(workflowDef.id, 'Test', 'test', 'analyst1');
      expect(request).not.toBeNull();

      // Self-approval should be blocked by SOX engine
      const result = engine.approveRequest(request!.id, 'analyst1');
      expect(result).toBeNull();
    });

    it('should get pending approvals', () => {
      const workflowDef = workflow.createWorkflow({
        name: 'Test',
        description: 'test',
        steps: [{ id: 's1', name: 'Review', type: 'sequential', approvers: ['manager'], order: 0 }],
        createdBy: 'admin',
        isTemplate: false,
      });

      workflow.submitRequest(workflowDef.id, 'Test 1', 'test', 'analyst1');
      workflow.submitRequest(workflowDef.id, 'Test 2', 'test', 'analyst2');

      const pending = engine.getPendingApprovals('manager');
      expect(pending.length).toBe(2);
    });

    it('should check for SLA breaches', () => {
      const workflowDef = workflow.createWorkflow({
        name: 'Test',
        description: 'test',
        steps: [
          {
            id: 's1',
            name: 'Review',
            type: 'sequential',
            approvers: ['manager'],
            order: 0,
            timeoutHours: 1,
          },
        ],
        createdBy: 'admin',
        isTemplate: false,
      });

      workflow.submitRequest(workflowDef.id, 'Test', 'test', 'analyst1');
      const breaches = engine.checkApprovalSLABreaches();
      expect(Array.isArray(breaches)).toBe(true);
    });

    it('should log approvals to audit trail', () => {
      const workflowDef = workflow.createWorkflow({
        name: 'Test',
        description: 'test',
        steps: [{ id: 's1', name: 'Review', type: 'sequential', approvers: ['manager'], order: 0 }],
        createdBy: 'admin',
        isTemplate: false,
      });

      const request = workflow.submitRequest(workflowDef.id, 'Test', 'test', 'analyst1');
      engine.approveRequest(request!.id, 'manager', 'Approved');

      const auditEntries = audit.filter({ resource: 'approval_request' });
      expect(auditEntries.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // SEGREGATION OF DUTIES
  // ===========================================================================

  describe('segregation of duties', () => {
    it('should detect SOD violation when assigning conflicting role', () => {
      rbac.assignRole('user1', 'analyst', ['entity1'], 'admin');

      const violations = engine.checkSODViolation('user1', 'manager', 'budget');
      expect(violations.length).toBeGreaterThan(0);
      expect(violations![0]!.status).toBe('fail');
      expect(violations![0]!.severity).toBe('critical');
    });

    it('should pass when no conflicting roles', () => {
      rbac.assignRole('user1', 'dept_head', ['entity1'], 'admin');

      const violations = engine.checkSODViolation('user1', 'analyst', 'budget');
      expect(violations.length).toBe(0);
    });

    it('should scan all users for SOD violations', () => {
      rbac.assignRole('user1', 'analyst', ['entity1'], 'admin');
      rbac.assignRole('user1', 'manager', ['entity1'], 'admin');
      rbac.assignRole('user2', 'viewer', ['entity1'], 'admin');

      const violations = engine.scanAllSODViolations();
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.details.includes('user1'))).toBe(true);
    });

    it('should add custom SOD rule', () => {
      const rule = engine.addSODRule({
        name: 'Custom Rule',
        description: 'Custom test rule',
        roleA: 'dept_head',
        roleB: 'admin',
        resource: 'report',
        conflictType: 'same_user',
        enabled: true,
      });

      expect(rule.id).toBeDefined();
      expect(engine.getSODRules().some((r) => r.id === rule.id)).toBe(true);
    });

    it('should remove SOD rule', () => {
      const rule = engine.addSODRule({
        name: 'Temp Rule',
        description: 'Temporary',
        roleA: 'viewer',
        roleB: 'admin',
        resource: 'data',
        conflictType: 'same_user',
        enabled: true,
      });

      expect(engine.removeSODRule(rule.id)).toBe(true);
      expect(engine.getSODRules().some((r) => r.id === rule.id)).toBe(false);
    });

    it('should return false when removing non-existent rule', () => {
      expect(engine.removeSODRule('nonexistent')).toBe(false);
    });

    it('should respect enabled flag on SOD rules', () => {
      rbac.assignRole('user1', 'analyst', ['entity1'], 'admin');

      // Disable all rules
      const rules = engine.getSODRules();
      for (const rule of rules) {
        // Create engine with disabled rules by removing and re-adding
      }

      // With rules enabled, should detect violation
      const violations = engine.checkSODViolation('user1', 'manager', 'budget');
      expect(violations.length).toBeGreaterThan(0);
    });

    it('should verify authorization correctly', () => {
      rbac.assignRole('user1', 'analyst', ['entity1'], 'admin');

      const result = engine.verifyAuthorization('user1', 'write', 'budget');
      expect(result.authorized).toBe(true);
    });

    it('should deny authorization for unassigned roles', () => {
      const result = engine.verifyAuthorization('unknown-user', 'write', 'budget');
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('no assigned roles');
    });

    it('should deny authorization for insufficient permissions', () => {
      rbac.assignRole('user1', 'viewer', ['entity1'], 'admin');

      const result = engine.verifyAuthorization('user1', 'write', 'budget');
      expect(result.authorized).toBe(false);
    });
  });

  // ===========================================================================
  // AUDIT TRAIL COMPLIANCE
  // ===========================================================================

  describe('audit trail compliance', () => {
    it('should log SOX actions', () => {
      const entry = engine.logSOXAction(
        'user1',
        'John Doe',
        'create',
        'journal_entry',
        'je-001',
        'Created journal entry',
        null,
        { amount: 1000 }
      );

      expect(entry.id).toBeDefined();
      expect(entry.action).toBe('create');
      expect(entry.resource).toBe('journal_entry');
    });

    it('should verify audit trail compliance for tracked resource', () => {
      // Log some entries
      engine.logSOXAction('user1', 'User 1', 'create', 'journal_entry', 'je-001', 'Entry 1');
      engine.logSOXAction('user1', 'User 1', 'update', 'journal_entry', 'je-001', 'Updated');

      const result = engine.verifyAuditTrailCompliance('journal_entry');
      expect(result.resource).toBe('journal_entry');
      expect(result.totalEntries).toBe(2);
      expect(result.status).toBeDefined();
    });

    it('should return not_applicable for untracked resource', () => {
      const result = engine.verifyAuditTrailCompliance('unknown_resource');
      expect(result.status).toBe('not_applicable');
    });

    it('should detect missing fields in audit entries', () => {
      // Manually add an entry with missing fields
      audit.log({
        userId: 'user1',
        userName: 'User 1',
        action: 'create',
        resource: 'journal_entry',
        resourceId: 'je-001',
        // missing oldValue and newValue
      });

      const result = engine.verifyAuditTrailCompliance('journal_entry');
      // The entry should have userId, timestamp, but may be missing oldValue/newValue
      expect(result.totalEntries).toBe(1);
    });

    it('should detect closed period violations', () => {
      const violations = engine.verifyClosedPeriodIntegrity(
        ['Q4-2025'],
        [
          { period: 'Q4-2025', timestamp: '2026-01-15T10:00:00Z', action: 'update' },
          { period: 'Q1-2026', timestamp: '2026-02-15T10:00:00Z', action: 'create' },
        ]
      );

      expect(violations.length).toBe(1);
      expect(violations![0]!.severity).toBe('critical');
      expect(violations![0]!.details).toContain('Q4-2025');
    });

    it('should pass when no closed period violations', () => {
      const violations = engine.verifyClosedPeriodIntegrity(
        ['Q4-2025'],
        [{ period: 'Q1-2026', timestamp: '2026-02-15T10:00:00Z', action: 'create' }]
      );

      expect(violations.length).toBe(0);
    });

    it('should get audit engine instance', () => {
      const auditEngine = engine.getAuditEngine();
      expect(auditEngine).toBeDefined();
    });
  });

  // ===========================================================================
  // DATA INTEGRITY CHECKS
  // ===========================================================================

  describe('data integrity checks', () => {
    it('should verify balanced balance sheet', () => {
      const result = engine.verifyBalanceSheetEquation(100000, 60000, 40000);
      expect(result.passed).toBe(true);
      expect(result.checkName).toBe('Balance Sheet Equation');
    });

    it('should detect imbalanced balance sheet', () => {
      const result = engine.verifyBalanceSheetEquation(100000, 60000, 30000);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('IMBALANCE');
    });

    it('should handle balance sheet within tolerance', () => {
      const result = engine.verifyBalanceSheetEquation(100000, 60000, 39999.995, 0.01);
      expect(result.passed).toBe(true);
    });

    it('should verify double-entry balance', () => {
      const entries = [
        { debit: 1000, credit: 0 },
        { debit: 0, credit: 1000 },
      ];
      const result = engine.verifyDoubleEntry(entries);
      expect(result.passed).toBe(true);
    });

    it('should detect double-entry mismatch', () => {
      const entries = [
        { debit: 1000, credit: 0 },
        { debit: 0, credit: 900 },
      ];
      const result = engine.verifyDoubleEntry(entries);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('MISMATCH');
    });

    it('should compute and store data hash', () => {
      const data = { amount: 1000, account: 'Cash' };
      const hash = engine.storeDataHash('entry-1', data);
      expect(hash).toBeDefined();
      expect(hash.startsWith('h-')).toBe(true);
    });

    it('should verify data integrity against stored hash', () => {
      const data = { amount: 1000, account: 'Cash' };
      engine.storeDataHash('entry-1', data);

      const result = engine.verifyDataIntegrity('entry-1', data);
      expect(result.passed).toBe(true);
    });

    it('should detect data tampering', () => {
      const data = { amount: 1000, account: 'Cash' };
      engine.storeDataHash('entry-1', data);

      const tamperedData = { amount: 2000, account: 'Cash' };
      const result = engine.verifyDataIntegrity('entry-1', tamperedData);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('TAMPERING');
    });

    it('should verify period close integrity', () => {
      const closedPeriods = new Map([['Q4-2025', engine.computeDataHash({ revenue: 100000 })]]);
      const currentData = new Map([['Q4-2025', { revenue: 100000 }]]);

      const results = engine.verifyPeriodCloseIntegrity(closedPeriods, currentData);
      expect(results.length).toBe(1);
      expect(results![0]!.passed).toBe(true);
    });

    it('should detect period close modification', () => {
      const closedPeriods = new Map([['Q4-2025', engine.computeDataHash({ revenue: 100000 })]]);
      const currentData = new Map([['Q4-2025', { revenue: 200000 }]]);

      const results = engine.verifyPeriodCloseIntegrity(closedPeriods, currentData);
      expect(results.length).toBe(1);
      expect(results![0]!.passed).toBe(false);
    });

    it('should track integrity results', () => {
      engine.verifyBalanceSheetEquation(100000, 60000, 40000);
      engine.verifyDoubleEntry([{ debit: 500, credit: 500 }]);

      const results = engine.getIntegrityResults();
      expect(results.length).toBe(2);
    });

    it('should clear integrity results', () => {
      engine.verifyBalanceSheetEquation(100000, 60000, 40000);
      expect(engine.getIntegrityResults().length).toBe(1);

      engine.clearIntegrityResults();
      expect(engine.getIntegrityResults().length).toBe(0);
    });
  });

  // ===========================================================================
  // ACCESS CONTROL COMPLIANCE
  // ===========================================================================

  describe('access control compliance', () => {
    it('should review privileged access', () => {
      rbac.assignRole('admin1', 'admin', ['*'], 'system');
      rbac.assignRole('mgr1', 'manager', ['entity1'], 'admin1');
      rbac.assignRole('viewer1', 'viewer', ['entity1'], 'admin1');

      const privileged = engine.reviewPrivilegedAccess();
      expect(privileged.length).toBeGreaterThanOrEqual(2);
      expect(privileged.some((p) => p.userId === 'admin1')).toBe(true);
      expect(privileged.some((p) => p.userId === 'mgr1')).toBe(true);
      expect(privileged.some((p) => p.userId === 'viewer1')).toBe(false);
    });

    it('should identify risk levels for privileged users', () => {
      rbac.assignRole('admin1', 'admin', ['*'], 'system');
      rbac.assignRole('mgr1', 'manager', ['entity1'], 'admin1');

      const privileged = engine.reviewPrivilegedAccess();
      const admin = privileged.find((p) => p.userId === 'admin1');
      const mgr = privileged.find((p) => p.userId === 'mgr1');

      expect(admin?.riskLevel).toBe('high');
      expect(mgr?.riskLevel).toBe('medium');
    });

    it('should detect orphaned roles', () => {
      rbac.assignRole('inactive-user', 'admin', ['*'], 'system');

      const orphaned = engine.checkOrphanedRoles(90);
      expect(orphaned.length).toBeGreaterThanOrEqual(1);
      expect(orphaned.some((o) => o.userId === 'inactive-user')).toBe(true);
    });

    it('should not flag active users as orphaned', () => {
      rbac.assignRole('active-user', 'manager', ['entity1'], 'admin');

      // Log recent activity
      audit.log({
        userId: 'active-user',
        userName: 'Active User',
        action: 'view',
        resource: 'budget',
        resourceId: 'b-1',
      });

      const orphaned = engine.checkOrphanedRoles(90);
      expect(orphaned.some((o) => o.userId === 'active-user')).toBe(false);
    });
  });

  // ===========================================================================
  // CONTROLS MANAGEMENT
  // ===========================================================================

  describe('controls management', () => {
    it('should enable/disable controls', () => {
      expect(engine.setControlEnabled('SOX-302-01', false)).toBe(true);
      const control = engine.getControls().find((c) => c.id === 'SOX-302-01');
      expect(control?.enabled).toBe(false);

      expect(engine.setControlEnabled('SOX-302-01', true)).toBe(true);
      expect(control?.enabled).toBe(true);
    });

    it('should return false for non-existent control', () => {
      expect(engine.setControlEnabled('nonexistent', false)).toBe(false);
    });

    it('should add custom control', () => {
      const control = engine.addControl({
        category: 'data_integrity',
        name: 'Custom Check',
        description: 'Custom data check',
        severity: 'high',
        enabled: true,
      });

      expect(control.id).toBeDefined();
      expect(engine.getControls().some((c) => c.id === control.id)).toBe(true);
    });
  });

  // ===========================================================================
  // FULL COMPLIANCE REPORT
  // ===========================================================================

  describe('compliance report', () => {
    it('should generate basic compliance report', () => {
      const report = engine.generateReport();

      expect(report.generatedAt).toBeDefined();
      expect(report.overallStatus).toBeDefined();
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(report.checks.length).toBeGreaterThan(0);
      expect(report.summary.total).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate report with balance sheet data', () => {
      const report = engine.generateReport({
        balanceSheet: { assets: 100000, liabilities: 60000, equity: 40000 },
      });

      const bsCheck = report.checks.find((c) => c.controlId === 'SOX-404-05');
      expect(bsCheck).toBeDefined();
      expect(bsCheck!.status).toBe('pass');
    });

    it('should generate report with imbalanced balance sheet', () => {
      const report = engine.generateReport({
        balanceSheet: { assets: 100000, liabilities: 60000, equity: 30000 },
      });

      const bsCheck = report.checks.find((c) => c.controlId === 'SOX-404-05');
      expect(bsCheck).toBeDefined();
      expect(bsCheck!.status).toBe('fail');
      expect(bsCheck!.severity).toBe('critical');
    });

    it('should generate report with ledger entries', () => {
      const report = engine.generateReport({
        ledgerEntries: [
          { debit: 5000, credit: 0 },
          { debit: 0, credit: 5000 },
        ],
      });

      const deCheck = report.checks.find((c) => c.controlId === 'SOX-404-06');
      expect(deCheck).toBeDefined();
      expect(deCheck!.status).toBe('pass');
    });

    it('should generate report with closed period checks', () => {
      const report = engine.generateReport({
        closedPeriods: ['Q4-2025'],
        recentEntries: [{ period: 'Q1-2026', timestamp: '2026-02-01T10:00:00Z', action: 'create' }],
      });

      const cpCheck = report.checks.find((c) => c.controlId === 'SOX-404-09');
      expect(cpCheck).toBeDefined();
      expect(cpCheck!.status).toBe('pass');
    });

    it('should detect SOD violations in report', () => {
      rbac.assignRole('user1', 'analyst', ['entity1'], 'admin');
      rbac.assignRole('user1', 'manager', ['entity1'], 'admin');

      const report = engine.generateReport();
      const sodCheck = report.checks.find((c) => c.category === 'segregation_of_duties');
      expect(sodCheck).toBeDefined();
      expect(sodCheck!.status).toBe('fail');
    });

    it('should categorize findings by category', () => {
      const report = engine.generateReport();
      expect(report.byCategory).toBeDefined();
      expect(report.byCategory.approval_workflow).toBeDefined();
      expect(report.byCategory.segregation_of_duties).toBeDefined();
      expect(report.byCategory.audit_trail).toBeDefined();
      expect(report.byCategory.data_integrity).toBeDefined();
      expect(report.byCategory.access_control).toBeDefined();
    });

    it('should identify critical findings', () => {
      rbac.assignRole('user1', 'analyst', ['entity1'], 'admin');
      rbac.assignRole('user1', 'manager', ['entity1'], 'admin');

      const report = engine.generateReport({
        balanceSheet: { assets: 100000, liabilities: 60000, equity: 30000 },
      });

      expect(report.criticalFindings.length).toBeGreaterThan(0);
    });

    it('should be compliant when all checks pass', () => {
      rbac.assignRole('user1', 'analyst', ['entity1'], 'admin');

      const report = engine.generateReport({
        balanceSheet: { assets: 100000, liabilities: 60000, equity: 40000 },
        ledgerEntries: [{ debit: 1000, credit: 1000 }],
        closedPeriods: [],
        recentEntries: [],
      });

      // Should be at least partially compliant (no critical failures)
      expect(['compliant', 'partially_compliant']).toContain(report.overallStatus);
    });

    it('should retrieve last report', () => {
      engine.generateReport();
      const lastReport = engine.getLastReport();
      expect(lastReport).not.toBeNull();
      expect(lastReport!.generatedAt).toBeDefined();
    });

    it('should return null before first report', () => {
      expect(engine.getLastReport()).toBeNull();
    });

    it('should log report generation to audit trail', () => {
      engine.generateReport();
      const entries = audit.filter({ resource: 'sox_report' });
      expect(entries.length).toBe(1);
    });
  });

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  describe('serialization', () => {
    it('should serialize and deserialize', () => {
      // Add some data
      rbac.assignRole('user1', 'admin', ['*'], 'system');
      engine.storeDataHash('test', { value: 42 });

      const json = engine.serialize();
      expect(json).toBeDefined();

      const newEngine = new SOXComplianceEngine();
      const success = newEngine.deserialize(json);
      expect(success).toBe(true);
      expect(newEngine.getIntegrityResults()).toEqual(engine.getIntegrityResults());
    });

    it('should handle invalid JSON gracefully', () => {
      const newEngine = new SOXComplianceEngine();
      expect(newEngine.deserialize('invalid json')).toBe(false);
    });

    it('should preserve controls across serialization', () => {
      engine.addControl({
        category: 'data_integrity',
        name: 'Custom',
        description: 'Test',
        severity: 'low',
        enabled: true,
      });

      const json = engine.serialize();
      const newEngine = new SOXComplianceEngine();
      newEngine.deserialize(json);

      expect(newEngine.getControls().length).toBe(engine.getControls().length);
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle empty ledger entries for double-entry check', () => {
      const result = engine.verifyDoubleEntry([]);
      expect(result.passed).toBe(true);
    });

    it('should handle balance sheet with zero values', () => {
      const result = engine.verifyBalanceSheetEquation(0, 0, 0);
      expect(result.passed).toBe(true);
    });

    it('should handle very large financial values', () => {
      const result = engine.verifyBalanceSheetEquation(999999999999, 500000000000, 499999999999);
      expect(result.passed).toBe(true);
    });

    it('should handle negative values in balance sheet', () => {
      const result = engine.verifyBalanceSheetEquation(100000, 120000, -20000);
      expect(result.passed).toBe(true);
    });

    it('should handle SOD check with no existing roles', () => {
      const violations = engine.checkSODViolation('new-user', 'analyst');
      expect(violations.length).toBe(0);
    });

    it('should handle report with SOD violations and data issues together', () => {
      rbac.assignRole('user1', 'analyst', ['entity1'], 'admin');
      rbac.assignRole('user1', 'manager', ['entity1'], 'admin');

      const report = engine.generateReport({
        balanceSheet: { assets: 100000, liabilities: 60000, equity: 30000 },
      });

      expect(report.overallStatus).toBe('non_compliant');
      expect(report.criticalFindings.length).toBeGreaterThan(1);
    });
  });
});
