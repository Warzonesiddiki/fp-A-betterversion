import { describe, it, expect } from 'vitest';
import { ComplianceEngine } from './ComplianceEngine';

describe('ComplianceEngine', () => {
  describe('checkSegregationOfDuties', () => {
    it('passes with no conflicting roles', () => {
      const result = ComplianceEngine.checkSegregationOfDuties('user1', ['analyst', 'viewer']);
      expect(result.status).toBe('PASS');
      expect(result.category).toBe('SOX');
    });

    it('fails with approver + requester conflict', () => {
      const result = ComplianceEngine.checkSegregationOfDuties('user1', ['approver', 'requester']);
      expect(result.status).toBe('FAIL');
      expect(result.message).toContain('approver + requester');
    });

    it('fails with admin + auditor conflict', () => {
      const result = ComplianceEngine.checkSegregationOfDuties('user1', ['admin', 'auditor']);
      expect(result.status).toBe('FAIL');
      expect(result.message).toContain('admin + auditor');
    });

    it('fails with creator + approver conflict', () => {
      const result = ComplianceEngine.checkSegregationOfDuties('user1', ['creator', 'approver']);
      expect(result.status).toBe('FAIL');
      expect(result.message).toContain('creator + approver');
    });

    it('detects multiple conflicts', () => {
      const result = ComplianceEngine.checkSegregationOfDuties('user1', [
        'approver',
        'requester',
        'admin',
        'auditor',
      ]);
      expect(result.status).toBe('FAIL');
      expect(result.message).toContain('approver + requester');
      expect(result.message).toContain('admin + auditor');
    });
  });

  describe('checkApprovalWorkflow', () => {
    it('passes for valid approval', () => {
      const result = ComplianceEngine.checkApprovalWorkflow('approver1', 'user1', 5000, 10000);
      expect(result.status).toBe('PASS');
      expect(result.category).toBe('WORKFLOW');
    });

    it('fails for self-approval', () => {
      const result = ComplianceEngine.checkApprovalWorkflow('user1', 'user1', 5000, 10000);
      expect(result.status).toBe('FAIL');
      expect(result.message).toContain('Self-approval');
    });

    it('warns when amount exceeds threshold', () => {
      const result = ComplianceEngine.checkApprovalWorkflow('approver1', 'user1', 15000, 10000);
      expect(result.status).toBe('WARNING');
      expect(result.message).toContain('exceeds threshold');
    });

    it('self-approval takes priority over threshold check', () => {
      const result = ComplianceEngine.checkApprovalWorkflow('user1', 'user1', 15000, 10000);
      expect(result.status).toBe('FAIL');
    });
  });

  describe('checkDataRetention', () => {
    it('passes for recent record', () => {
      const recent = new Date().toISOString();
      const result = ComplianceEngine.checkDataRetention(recent, 365);
      expect(result.status).toBe('PASS');
      expect(result.category).toBe('DATA');
    });

    it('warns for expired record', () => {
      const old = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
      const result = ComplianceEngine.checkDataRetention(old, 365);
      expect(result.status).toBe('WARNING');
      expect(result.message).toContain('days old');
    });
  });

  describe('validateAccess', () => {
    it('passes when role has required permission', () => {
      const perms = { admin: ['read', 'write', 'delete'], viewer: ['read'] };
      const result = ComplianceEngine.validateAccess('admin', 'delete', perms);
      expect(result.status).toBe('PASS');
      expect(result.category).toBe('ACCESS');
    });

    it('fails when role lacks permission', () => {
      const perms = { viewer: ['read'] };
      const result = ComplianceEngine.validateAccess('viewer', 'delete', perms);
      expect(result.status).toBe('FAIL');
    });

    it('passes with wildcard permission', () => {
      const perms = { admin: ['*'] };
      const result = ComplianceEngine.validateAccess('admin', 'anything', perms);
      expect(result.status).toBe('PASS');
    });

    it('fails for unknown role', () => {
      const perms = { admin: ['read'] };
      const result = ComplianceEngine.validateAccess('unknown', 'read', perms);
      expect(result.status).toBe('FAIL');
    });
  });

  describe('generateReport', () => {
    it('calculates score correctly', () => {
      const checks = [
        {
          id: '1',
          name: 'A',
          category: 'SOX' as const,
          status: 'PASS' as const,
          message: '',
          timestamp: '',
        },
        {
          id: '2',
          name: 'B',
          category: 'SOX' as const,
          status: 'PASS' as const,
          message: '',
          timestamp: '',
        },
        {
          id: '3',
          name: 'C',
          category: 'SOX' as const,
          status: 'FAIL' as const,
          message: '',
          timestamp: '',
        },
        {
          id: '4',
          name: 'D',
          category: 'SOX' as const,
          status: 'WARNING' as const,
          message: '',
          timestamp: '',
        },
      ];
      const report = ComplianceEngine.generateReport(checks);
      expect(report.score).toBe(50);
      expect(report.passed).toBe(2);
      expect(report.failed).toBe(1);
      expect(report.warnings).toBe(1);
    });

    it('returns 100 for empty checks', () => {
      const report = ComplianceEngine.generateReport([]);
      expect(report.score).toBe(100);
      expect(report.passed).toBe(0);
    });
  });
});
