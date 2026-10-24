import { describe, it, expect } from 'vitest';
import { ComplianceEngine } from './ComplianceEngine';
import type { ComplianceCheck } from './ComplianceEngine';

/**
 * GOVERNANCE EVIDENCE for cap:govern.compliance-engine
 *
 * The ComplianceEngine checks SOX compliance including segregation of duties,
 * approval workflows, data retention, and access control. The governance
 * dimension here is CONTROL EFFECTIVENESS — compliance checks must detect
 * conflicts, enforce approval thresholds, flag expired records, and validate
 * access permissions. A failed compliance check means a control breakdown.
 *
 * Tested dimensions:
 * 1. Segregation of duties
 * 2. Approval workflow
 * 3. Data retention
 * 4. Access control validation
 * 5. Report generation
 * 6. Determinism
 */

describe('ComplianceEngine — GOVERNANCE (govern.compliance-engine)', () => {
  describe('1. Segregation of duties', () => {
    it('checkSegregationOfDuties passes for non-conflicting roles', () => {
      const check = ComplianceEngine.checkSegregationOfDuties('user-1', ['requester', 'viewer']);
      expect(check.status).toBe('PASS');
      expect(check.category).toBe('SOX');
    });

    it('checkSegregationOfDuties fails for approver + requester conflict', () => {
      const check = ComplianceEngine.checkSegregationOfDuties('user-1', ['approver', 'requester']);
      expect(check.status).toBe('FAIL');
    });

    it('checkSegregationOfDuties fails for admin + auditor conflict', () => {
      const check = ComplianceEngine.checkSegregationOfDuties('user-1', ['admin', 'auditor']);
      expect(check.status).toBe('FAIL');
    });

    it('checkSegregationOfDuties fails for creator + approver conflict', () => {
      const check = ComplianceEngine.checkSegregationOfDuties('user-1', ['creator', 'approver']);
      expect(check.status).toBe('FAIL');
    });

    it('checkSegregationOfDuties returns ComplianceCheck structure', () => {
      const check = ComplianceEngine.checkSegregationOfDuties('user-1', ['viewer']);
      expect(check.id).toBeDefined();
      expect(check.name).toBeDefined();
      expect(check.category).toBeDefined();
      expect(check.status).toBeDefined();
      expect(check.message).toBeDefined();
      expect(check.timestamp).toBeDefined();
    });
  });

  describe('2. Approval workflow', () => {
    it('checkApprovalWorkflow passes for valid approval', () => {
      const check = ComplianceEngine.checkApprovalWorkflow(
        'approver-1',
        'requester-1',
        5000,
        10000
      );
      expect(check.status).toBe('PASS');
      expect(check.category).toBe('WORKFLOW');
    });

    it('checkApprovalWorkflow fails for self-approval', () => {
      const check = ComplianceEngine.checkApprovalWorkflow('user-1', 'user-1', 5000, 10000);
      expect(check.status).toBe('FAIL');
    });

    it('checkApprovalWorkflow warns for amount exceeding threshold', () => {
      const check = ComplianceEngine.checkApprovalWorkflow(
        'approver-1',
        'requester-1',
        15000,
        10000
      );
      expect(check.status).toBe('WARNING');
    });
  });

  describe('3. Data retention', () => {
    it('checkDataRetention passes for recent records', () => {
      const recordDate = new Date().toISOString();
      const check = ComplianceEngine.checkDataRetention(recordDate, 2555);
      expect(check.status).toBe('PASS');
      expect(check.category).toBe('DATA');
    });

    it('checkDataRetention warns for expired records', () => {
      const recordDate = '2010-01-01';
      const check = ComplianceEngine.checkDataRetention(recordDate, 365);
      expect(check.status).toBe('WARNING');
    });
  });

  describe('4. Access control validation', () => {
    it('validateAccess passes for permitted role', () => {
      const permissions = { admin: ['*'], viewer: ['budget:read'] };
      const check = ComplianceEngine.validateAccess('viewer', 'budget:read', permissions);
      expect(check.status).toBe('PASS');
      expect(check.category).toBe('ACCESS');
    });

    it('validateAccess fails for unpermitted role', () => {
      const permissions = { viewer: ['budget:read'] };
      const check = ComplianceEngine.validateAccess('viewer', 'budget:write', permissions);
      expect(check.status).toBe('FAIL');
    });

    it('validateAccess passes for wildcard permission', () => {
      const permissions = { admin: ['*'] };
      const check = ComplianceEngine.validateAccess('admin', 'any:action', permissions);
      expect(check.status).toBe('PASS');
    });

    it('validateAccess fails for unknown role', () => {
      const permissions = { admin: ['*'] };
      const check = ComplianceEngine.validateAccess('unknown', 'any:action', permissions);
      expect(check.status).toBe('FAIL');
    });
  });

  describe('5. Report generation', () => {
    it('generateReport computes score from checks', () => {
      const checks: ComplianceCheck[] = [
        { id: '1', name: 'Test', category: 'SOX', status: 'PASS', message: '', timestamp: '' },
        { id: '2', name: 'Test', category: 'SOX', status: 'PASS', message: '', timestamp: '' },
        { id: '3', name: 'Test', category: 'SOX', status: 'FAIL', message: '', timestamp: '' },
        { id: '4', name: 'Test', category: 'SOX', status: 'WARNING', message: '', timestamp: '' },
      ];
      const report = ComplianceEngine.generateReport(checks);
      expect(report.score).toBe(50);
      expect(report.passed).toBe(2);
      expect(report.failed).toBe(1);
      expect(report.warnings).toBe(1);
      expect(report.checks).toHaveLength(4);
    });

    it('generateReport returns 100 for empty checks', () => {
      const report = ComplianceEngine.generateReport([]);
      expect(report.score).toBe(100);
      expect(report.passed).toBe(0);
      expect(report.failed).toBe(0);
    });

    it('generateReport includes generatedAt timestamp', () => {
      const checks: ComplianceCheck[] = [
        { id: '1', name: 'Test', category: 'SOX', status: 'PASS', message: '', timestamp: '' },
      ];
      const report = ComplianceEngine.generateReport(checks);
      expect(report.generatedAt).toBeDefined();
    });
  });

  describe('6. Determinism', () => {
    it('checkSegregationOfDuties is deterministic', () => {
      const r1 = ComplianceEngine.checkSegregationOfDuties('user-1', ['approver', 'requester']);
      const r2 = ComplianceEngine.checkSegregationOfDuties('user-1', ['approver', 'requester']);
      expect(r1.status).toBe(r2.status);
      expect(r1.message).toBe(r2.message);
    });

    it('checkApprovalWorkflow is deterministic for same inputs', () => {
      const r1 = ComplianceEngine.checkApprovalWorkflow('approver-1', 'requester-1', 5000, 10000);
      const r2 = ComplianceEngine.checkApprovalWorkflow('approver-1', 'requester-1', 5000, 10000);
      expect(r1.status).toBe(r2.status);
      expect(r1.message).toBe(r2.message);
    });

    it('generateReport is deterministic', () => {
      const checks: ComplianceCheck[] = [
        { id: '1', name: 'Test', category: 'SOX', status: 'PASS', message: '', timestamp: '' },
        { id: '2', name: 'Test', category: 'SOX', status: 'FAIL', message: '', timestamp: '' },
      ];
      const r1 = ComplianceEngine.generateReport(checks);
      const r2 = ComplianceEngine.generateReport(checks);
      expect(r1.score).toBe(r2.score);
      expect(r1.passed).toBe(r2.passed);
      expect(r1.failed).toBe(r2.failed);
    });
  });
});
