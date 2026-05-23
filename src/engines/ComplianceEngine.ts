/**
 * ComplianceEngine — SOX compliance, access control, data retention
 */

export interface ComplianceCheck {
  readonly id: string;
  readonly name: string;
  readonly category: 'SOX' | 'ACCESS' | 'DATA' | 'WORKFLOW';
  readonly status: 'PASS' | 'FAIL' | 'WARNING';
  readonly message: string;
  readonly timestamp: string;
}

export interface ComplianceReport {
  readonly score: number; // 0-100
  readonly checks: ComplianceCheck[];
  readonly passed: number;
  readonly failed: number;
  readonly warnings: number;
  readonly generatedAt: string;
}

export interface SegregationDuties {
  readonly userId: string;
  readonly roles: readonly string[];
  readonly conflicts: readonly string[];
}

export class ComplianceEngine {
  /**
   * Check segregation of duties — user shouldn't have conflicting roles
   */
  static checkSegregationOfDuties(userId: string, roles: readonly string[]): ComplianceCheck {
    const conflictingPairs: [string, string][] = [
      ['approver', 'requester'],
      ['admin', 'auditor'],
      ['creator', 'approver'],
    ];

    const conflicts: string[] = [];
    for (const [a, b] of conflictingPairs) {
      if (roles.includes(a) && roles.includes(b)) {
        conflicts.push(`${a} + ${b}`);
      }
    }

    return {
      id: `sod-${userId}`,
      name: 'Segregation of Duties',
      category: 'SOX',
      status: conflicts.length > 0 ? 'FAIL' : 'PASS',
      message:
        conflicts.length > 0
          ? `Conflicting roles: ${conflicts.join(', ')}`
          : 'No role conflicts detected',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if approval workflow is valid
   */
  static checkApprovalWorkflow(
    approverId: string,
    requesterId: string,
    amount: number,
    threshold: number
  ): ComplianceCheck {
    const isSelfApproval = approverId === requesterId;
    const exceedsThreshold = amount > threshold;

    if (isSelfApproval) {
      return {
        id: `approval-${Date.now()}`,
        name: 'Approval Workflow',
        category: 'WORKFLOW',
        status: 'FAIL',
        message: 'Self-approval not allowed',
        timestamp: new Date().toISOString(),
      };
    }

    if (exceedsThreshold) {
      return {
        id: `approval-${Date.now()}`,
        name: 'Approval Workflow',
        category: 'WORKFLOW',
        status: 'WARNING',
        message: `Amount $${amount.toLocaleString()} exceeds threshold $${threshold.toLocaleString()}`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      id: `approval-${Date.now()}`,
      name: 'Approval Workflow',
      category: 'WORKFLOW',
      status: 'PASS',
      message: 'Approval valid',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check data retention policy
   */
  static checkDataRetention(recordDate: string, retentionDays: number): ComplianceCheck {
    const age = (Date.now() - new Date(recordDate).getTime()) / (1000 * 60 * 60 * 24);
    const expired = age > retentionDays;

    return {
      id: `retention-${Date.now()}`,
      name: 'Data Retention',
      category: 'DATA',
      status: expired ? 'WARNING' : 'PASS',
      message: expired
        ? `Record is ${Math.floor(age)} days old (retention: ${retentionDays} days)`
        : `Record age: ${Math.floor(age)} days`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate RBAC access
   */
  static validateAccess(
    userRole: string,
    requiredPermission: string,
    rolePermissions: Record<string, readonly string[]>
  ): ComplianceCheck {
    const permissions = rolePermissions[userRole] ?? [];
    const hasAccess = permissions.includes(requiredPermission) || permissions.includes('*');

    return {
      id: `access-${Date.now()}`,
      name: 'Access Control',
      category: 'ACCESS',
      status: hasAccess ? 'PASS' : 'FAIL',
      message: hasAccess
        ? `Role "${userRole}" has "${requiredPermission}" permission`
        : `Role "${userRole}" lacks "${requiredPermission}" permission`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate compliance report from checks
   */
  static generateReport(checks: readonly ComplianceCheck[]): ComplianceReport {
    const passed = checks.filter((c) => c.status === 'PASS').length;
    const failed = checks.filter((c) => c.status === 'FAIL').length;
    const warnings = checks.filter((c) => c.status === 'WARNING').length;
    const score = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 100;

    return {
      score,
      checks: [...checks],
      passed,
      failed,
      warnings,
      generatedAt: new Date().toISOString(),
    };
  }
}
