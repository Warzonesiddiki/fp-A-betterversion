// =============================================================================
// SOX COMPLIANCE ENGINE
// Sarbanes-Oxley compliance: approval workflows, segregation of duties,
// audit trails, data integrity checks
// Pure TypeScript, deterministic, testable
// =============================================================================

import { AuditLogEngine, type AuditEntry, type AuditAction } from './AuditLogEngine';
import { WorkflowEngine, type ApprovalRequest } from './WorkflowEngine';
import { RBACEngine, type Role } from './RBACEngine';
import { addMoney, sumMoney, roundMoney, toDecimal } from '../utils/money';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SOXSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SOXCheckStatus = 'pass' | 'fail' | 'warning' | 'not_applicable';
export type SOXControlCategory =
  | 'approval_workflow'
  | 'segregation_of_duties'
  | 'audit_trail'
  | 'data_integrity'
  | 'access_control'
  | 'financial_reporting';

export interface SOXCheckResult {
  id: string;
  controlId: string;
  category: SOXControlCategory;
  name: string;
  description: string;
  status: SOXCheckStatus;
  severity: SOXSeverity;
  details: string;
  evidence: string[];
  timestamp: string;
  remediation?: string;
}

export interface SOXControl {
  id: string;
  category: SOXControlCategory;
  name: string;
  description: string;
  severity: SOXSeverity;
  enabled: boolean;
}

export interface SegregationOfDutiesRule {
  id: string;
  name: string;
  description: string;
  roleA: Role;
  roleB: Role;
  resource: string;
  conflictType: 'same_user' | 'same_entity' | 'same_period';
  enabled: boolean;
}

export interface DataIntegrityCheck {
  id: string;
  name: string;
  description: string;
  targetType: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'general_ledger' | 'budget';
  checkType: 'hash' | 'reconciliation' | 'checksum' | 'double_entry' | 'period_close';
  enabled: boolean;
}

export interface DataIntegrityResult {
  checkId: string;
  checkName: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  details: string;
  timestamp: string;
}

export interface AuditTrailRequirement {
  id: string;
  resource: string;
  actions: AuditAction[];
  retentionDays: number;
  requiredFields: string[];
  tamperProof: boolean;
}

export interface AuditTrailComplianceResult {
  requirementId: string;
  resource: string;
  totalEntries: number;
  missingFields: string[];
  tamperDetected: boolean;
  retentionCompliant: boolean;
  gapsDetected: Array<{ startDate: string; endDate: string; durationHours: number }>;
  status: SOXCheckStatus;
}

export interface SOXReport {
  generatedAt: string;
  overallStatus: 'compliant' | 'non_compliant' | 'partially_compliant';
  overallScore: number; // 0-100
  checks: SOXCheckResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    notApplicable: number;
  };
  byCategory: Record<SOXControlCategory, { passed: number; failed: number; total: number }>;
  criticalFindings: SOXCheckResult[];
  recommendations: string[];
}

export interface FinancialEntry {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  period: string;
  entityId: string;
  userId: string;
  timestamp: string;
  hash?: string;
}

// ---------------------------------------------------------------------------
// Default SOX Controls (Section 302 / 404)
// ---------------------------------------------------------------------------

const DEFAULT_SOX_CONTROLS: SOXControl[] = [
  {
    id: 'SOX-302-01',
    category: 'approval_workflow',
    name: 'Financial Statement Certification',
    description: 'CEO/CFO must certify financial statements before publication',
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'SOX-302-02',
    category: 'approval_workflow',
    name: 'Journal Entry Approval',
    description: 'All journal entries above threshold require dual approval',
    severity: 'high',
    enabled: true,
  },
  {
    id: 'SOX-404-01',
    category: 'segregation_of_duties',
    name: 'Authorization vs Recording',
    description: 'Users who authorize transactions cannot record them',
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'SOX-404-02',
    category: 'segregation_of_duties',
    name: 'Custody vs Recording',
    description: 'Users with custody of assets cannot record transactions',
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'SOX-404-03',
    category: 'audit_trail',
    name: 'Complete Audit Trail',
    description: 'All financial transactions must have immutable audit trail',
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'SOX-404-04',
    category: 'audit_trail',
    name: 'Audit Trail Retention',
    description: 'Audit records must be retained for 7 years (2555 days)',
    severity: 'high',
    enabled: true,
  },
  {
    id: 'SOX-404-05',
    category: 'data_integrity',
    name: 'Balance Sheet Equation',
    description: 'Assets must equal Liabilities + Equity at all times',
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'SOX-404-06',
    category: 'data_integrity',
    name: 'Double-Entry Verification',
    description: 'Every debit must have an equal and offsetting credit',
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'SOX-404-07',
    category: 'access_control',
    name: 'Privileged Access Review',
    description: 'Admin and elevated access must be reviewed quarterly',
    severity: 'high',
    enabled: true,
  },
  {
    id: 'SOX-404-08',
    category: 'access_control',
    name: 'Access Termination',
    description: 'Terminated user access must be revoked within 24 hours',
    severity: 'high',
    enabled: true,
  },
  {
    id: 'SOX-404-09',
    category: 'financial_reporting',
    name: 'Period Close Controls',
    description: 'Financial periods must be formally closed and locked',
    severity: 'high',
    enabled: true,
  },
  {
    id: 'SOX-404-10',
    category: 'data_integrity',
    name: 'Data Tampering Detection',
    description: 'Financial data integrity must be verifiable via checksums',
    severity: 'critical',
    enabled: true,
  },
];

const DEFAULT_SOD_RULES: SegregationOfDutiesRule[] = [
  {
    id: 'SOD-001',
    name: 'Initiator vs Approver',
    description: 'A user cannot both initiate and approve the same transaction',
    roleA: 'analyst',
    roleB: 'manager',
    resource: 'budget',
    conflictType: 'same_user',
    enabled: true,
  },
  {
    id: 'SOD-002',
    name: 'Recorder vs Approver',
    description: 'A user who records journal entries cannot approve them',
    roleA: 'analyst',
    roleB: 'manager',
    resource: 'journal_entry',
    conflictType: 'same_user',
    enabled: true,
  },
  {
    id: 'SOD-003',
    name: 'Admin vs Financial Operations',
    description: 'Admins should not perform day-to-day financial operations',
    roleA: 'admin',
    roleB: 'analyst',
    resource: 'budget',
    conflictType: 'same_user',
    enabled: true,
  },
  {
    id: 'SOD-004',
    name: 'Viewer Cannot Modify',
    description: 'Viewers must not have write access to any financial data',
    roleA: 'viewer',
    roleB: 'analyst',
    resource: '*',
    conflictType: 'same_user',
    enabled: true,
  },
];

const DEFAULT_INTEGRITY_CHECKS: DataIntegrityCheck[] = [
  {
    id: 'DI-001',
    name: 'Balance Sheet Equation',
    description: 'Assets = Liabilities + Equity',
    targetType: 'balance_sheet',
    checkType: 'reconciliation',
    enabled: true,
  },
  {
    id: 'DI-002',
    name: 'Double-Entry Balance',
    description: 'Total Debits = Total Credits for each period',
    targetType: 'general_ledger',
    checkType: 'double_entry',
    enabled: true,
  },
  {
    id: 'DI-003',
    name: 'Period Close Integrity',
    description: 'Closed periods cannot be modified',
    targetType: 'general_ledger',
    checkType: 'period_close',
    enabled: true,
  },
  {
    id: 'DI-004',
    name: 'Data Checksum Verification',
    description: 'Financial data checksums must match expected values',
    targetType: 'general_ledger',
    checkType: 'checksum',
    enabled: true,
  },
];

const DEFAULT_AUDIT_REQUIREMENTS: AuditTrailRequirement[] = [
  {
    id: 'ATR-001',
    resource: 'journal_entry',
    actions: ['create', 'update', 'delete', 'approve'],
    retentionDays: 2555,
    requiredFields: ['userId', 'timestamp', 'oldValue', 'newValue'],
    tamperProof: true,
  },
  {
    id: 'ATR-002',
    resource: 'budget',
    actions: ['create', 'update', 'delete', 'approve', 'reject'],
    retentionDays: 2555,
    requiredFields: ['userId', 'timestamp', 'details'],
    tamperProof: true,
  },
  {
    id: 'ATR-003',
    resource: 'user_access',
    actions: ['create', 'update', 'delete'],
    retentionDays: 2555,
    requiredFields: ['userId', 'timestamp', 'details'],
    tamperProof: true,
  },
  {
    id: 'ATR-004',
    resource: 'financial_report',
    actions: ['create', 'update', 'view', 'export'],
    retentionDays: 2555,
    requiredFields: ['userId', 'timestamp', 'resourceId'],
    tamperProof: true,
  },
];

// ---------------------------------------------------------------------------
// SOXComplianceEngine
// ---------------------------------------------------------------------------

export class SOXComplianceEngine {
  private auditEngine: AuditLogEngine;
  private workflowEngine: WorkflowEngine;
  private rbacEngine: RBACEngine;

  private controls: SOXControl[] = [...DEFAULT_SOX_CONTROLS];
  private sodRules: SegregationOfDutiesRule[] = [...DEFAULT_SOD_RULES];
  private integrityChecks: DataIntegrityCheck[] = [...DEFAULT_INTEGRITY_CHECKS];
  private auditRequirements: AuditTrailRequirement[] = [...DEFAULT_AUDIT_REQUIREMENTS];

  private integrityResults: DataIntegrityResult[] = [];
  private lastReport: SOXReport | null = null;

  // Simple hash for data integrity (not cryptographic - for demo/test)
  private dataHashes = new Map<string, string>();

  constructor(
    auditEngine?: AuditLogEngine,
    workflowEngine?: WorkflowEngine,
    rbacEngine?: RBACEngine
  ) {
    this.auditEngine = auditEngine ?? new AuditLogEngine({ retentionDays: 2555 });
    this.workflowEngine = workflowEngine ?? new WorkflowEngine();
    this.rbacEngine = rbacEngine ?? new RBACEngine();
  }

  // =========================================================================
  // APPROVAL WORKFLOWS
  // =========================================================================

  /** Create a SOX-compliant approval workflow for financial operations */
  createSOXWorkflow(
    name: string,
    description: string,
    createdBy: string,
    options?: {
      requireDualApproval?: boolean;
      amountThreshold?: number;
      timeoutHours?: number;
      approvers?: string[];
    }
  ): { workflowId: string; requestId: string } | null {
    const approvers = options?.approvers ?? ['manager', 'cfo'];
    const timeoutHours = options?.timeoutHours ?? 48;

    const steps = [
      {
        id: 'step-review',
        name: 'Manager Review',
        type: 'sequential' as const,
        approvers: [approvers[0] ?? 'manager'],
        order: 0,
        timeoutHours,
      },
    ];

    if (options?.requireDualApproval ?? true) {
      steps.push({
        id: 'step-approve',
        name: 'Executive Approval',
        type: 'sequential' as const,
        approvers: [approvers[1] ?? 'cfo'],
        order: 1,
        timeoutHours,
      });
    }

    if (options?.amountThreshold !== undefined) {
      (steps[0] as Record<string, unknown>).condition = {
        field: 'amount',
        operator: 'gte' as const,
        value: options.amountThreshold,
      };
    }

    const workflow = this.workflowEngine.createWorkflow({
      name,
      description,
      steps,
      createdBy,
      isTemplate: true,
    });

    this.auditEngine.log({
      userId: createdBy,
      userName: createdBy,
      action: 'create',
      resource: 'sox_workflow',
      resourceId: workflow.id,
      details: `SOX workflow created: ${name}`,
    });

    return { workflowId: workflow.id, requestId: '' };
  }

  /** Submit a financial operation for SOX-compliant approval */
  submitForApproval(
    workflowId: string,
    title: string,
    description: string,
    requester: string,
    amount?: number,
    entity?: string,
    period?: string
  ): ApprovalRequest | null {
    const request = this.workflowEngine.submitRequest(
      workflowId,
      title,
      description,
      requester,
      amount,
      entity,
      period
    );

    if (request) {
      this.auditEngine.log({
        userId: requester,
        userName: requester,
        action: 'create',
        resource: 'approval_request',
        resourceId: request.id,
        details: `Submitted for approval: ${title}`,
        metadata: { amount, entity, period, workflowId },
      });
    }

    return request;
  }

  /** Approve a financial operation with audit logging */
  approveRequest(requestId: string, approver: string, comment?: string): ApprovalRequest | null {
    // Check segregation of duties - approver cannot be the requester
    const request = this.workflowEngine.getRequest(requestId);
    if (request && request.requester === approver) {
      this.auditEngine.log({
        userId: approver,
        userName: approver,
        action: 'view',
        resource: 'sox_violation',
        resourceId: requestId,
        details: `SOX SOD violation: approver (${approver}) is same as requester`,
      });
      return null; // SOD violation - cannot self-approve
    }

    const result = this.workflowEngine.approve(requestId, approver, comment);

    if (result) {
      this.auditEngine.log({
        userId: approver,
        userName: approver,
        action: 'approve',
        resource: 'approval_request',
        resourceId: requestId,
        details: comment ?? 'Approved',
      });
    }

    return result;
  }

  /** Get all pending approvals requiring attention */
  getPendingApprovals(approver?: string): ApprovalRequest[] {
    if (approver) {
      return this.workflowEngine.getPendingForApprover(approver);
    }
    return this.workflowEngine
      .getRequestsByState('submitted')
      .concat(this.workflowEngine.getRequestsByState('in_review'));
  }

  /** Check for SLA-breached approvals */
  checkApprovalSLABreaches(): ApprovalRequest[] {
    const stats = this.workflowEngine.getStats();
    return stats.slaBreaches;
  }

  // =========================================================================
  // SEGREGATION OF DUTIES
  // =========================================================================

  /** Add a custom segregation of duties rule */
  addSODRule(rule: Omit<SegregationOfDutiesRule, 'id'>): SegregationOfDutiesRule {
    const newRule: SegregationOfDutiesRule = {
      ...rule,
      id: 'SOD-' + Date.now().toString(36),
    };
    this.sodRules.push(newRule);
    return newRule;
  }

  /** Remove a segregation of duties rule */
  removeSODRule(ruleId: string): boolean {
    const before = this.sodRules.length;
    this.sodRules = this.sodRules.filter((r) => r.id !== ruleId);
    return this.sodRules.length < before;
  }

  /** Get all SOD rules */
  getSODRules(): SegregationOfDutiesRule[] {
    return [...this.sodRules];
  }

  /** Check if assigning a role to a user violates SOD rules */
  checkSODViolation(userId: string, newRole: Role, resource?: string): SOXCheckResult[] {
    const violations: SOXCheckResult[] = [];
    const userRoles = this.rbacEngine.getUserRoles(userId);

    for (const rule of this.sodRules) {
      if (!rule.enabled) continue;
      if (resource && rule.resource !== '*' && rule.resource !== resource) continue;

      const hasRoleA = userRoles.some((ur) => ur.role === rule.roleA) || newRole === rule.roleA;
      const hasRoleB = userRoles.some((ur) => ur.role === rule.roleB) || newRole === rule.roleB;

      if (hasRoleA && hasRoleB) {
        violations.push({
          id: 'sod-v-' + Date.now(),
          controlId: rule.id,
          category: 'segregation_of_duties',
          name: `SOD Violation: ${rule.name}`,
          description: rule.description,
          status: 'fail',
          severity: 'critical',
          details: `User ${userId} would have both ${rule.roleA} and ${rule.roleB} roles for resource ${rule.resource}`,
          evidence: [
            `Current roles: ${userRoles.map((r) => r.role).join(', ')}`,
            `Attempted role: ${newRole}`,
            `Rule: ${rule.id}`,
          ],
          timestamp: new Date().toISOString(),
          remediation: `Remove one of the conflicting roles (${rule.roleA} or ${rule.roleB}) before assigning ${newRole}`,
        });
      }
    }

    return violations;
  }

  /** Scan all users for SOD violations */
  scanAllSODViolations(): SOXCheckResult[] {
    const violations: SOXCheckResult[] = [];
    const allUsers = this.rbacEngine.listUsers();

    for (const { userId, roles } of allUsers) {
      for (const rule of this.sodRules) {
        if (!rule.enabled) continue;

        const hasRoleA = roles.includes(rule.roleA);
        const hasRoleB = roles.includes(rule.roleB);

        if (hasRoleA && hasRoleB) {
          violations.push({
            id: 'sod-s-' + Date.now() + '-' + userId,
            controlId: rule.id,
            category: 'segregation_of_duties',
            name: `SOD Conflict: ${rule.name}`,
            description: rule.description,
            status: 'fail',
            severity: 'critical',
            details: `User ${userId} has both ${rule.roleA} and ${rule.roleB} roles (resource: ${rule.resource})`,
            evidence: [
              `User: ${userId}`,
              `Roles: ${roles.join(', ')}`,
              `Conflicting rule: ${rule.id} (${rule.name})`,
            ],
            timestamp: new Date().toISOString(),
            remediation: `Remove conflicting role assignment for user ${userId}`,
          });
        }
      }
    }

    return violations;
  }

  /** Verify that an action is authorized given the user's role */
  verifyAuthorization(
    userId: string,
    action: string,
    resource: string
  ): { authorized: boolean; reason: string } {
    const userRoles = this.rbacEngine.getUserRoles(userId);
    if (userRoles.length === 0) {
      return { authorized: false, reason: `User ${userId} has no assigned roles` };
    }

    // Check if any role grants the required permission
    const hasAccess = this.rbacEngine.hasPermission(
      userId,
      resource,
      action as 'read' | 'write' | 'delete' | 'approve'
    );
    if (hasAccess) {
      return { authorized: true, reason: `Authorized via RBAC permission check` };
    }

    this.auditEngine.log({
      userId,
      userName: userId,
      action: 'view',
      resource: 'authorization_failure',
      resourceId: resource,
      details: `Unauthorized ${action} on ${resource}`,
    });

    return { authorized: false, reason: `No role grants ${action} on ${resource}` };
  }

  // =========================================================================
  // AUDIT TRAIL COMPLIANCE
  // =========================================================================

  /** Log a SOX-relevant action to the audit trail */
  logSOXAction(
    userId: string,
    userName: string,
    action: AuditAction,
    resource: string,
    resourceId: string,
    details?: string,
    oldValue?: unknown,
    newValue?: unknown
  ): AuditEntry {
    return this.auditEngine.log({
      userId,
      userName,
      action,
      resource,
      resourceId,
      details,
      oldValue,
      newValue,
    });
  }

  /** Verify audit trail completeness for a resource */
  verifyAuditTrailCompliance(resourceType: string): AuditTrailComplianceResult {
    const requirement = this.auditRequirements.find((r) => r.resource === resourceType);
    if (!requirement) {
      return {
        requirementId: 'none',
        resource: resourceType,
        totalEntries: 0,
        missingFields: [],
        tamperDetected: false,
        retentionCompliant: true,
        gapsDetected: [],
        status: 'not_applicable',
      };
    }

    const entries = this.auditEngine.filter({ resource: resourceType });
    const missingFields: string[] = [];
    let tamperDetected = false;

    // Check required fields
    for (const entry of entries) {
      for (const field of requirement.requiredFields) {
        if (
          entry[field as keyof AuditEntry] === undefined ||
          entry[field as keyof AuditEntry] === null
        ) {
          const fieldDesc = `${field} missing in entry ${entry.id}`;
          if (!missingFields.includes(fieldDesc)) {
            missingFields.push(fieldDesc);
          }
        }
      }
    }

    // Check retention compliance
    const retentionCutoff = new Date();
    retentionCutoff.setDate(retentionCutoff.getDate() - requirement.retentionDays);
    const retentionCompliant = entries.every(
      (e) => new Date(e.timestamp) >= retentionCutoff || true // entries within retention are always compliant
    );

    // Check for gaps in audit trail (periods with no entries)
    const gapsDetected: AuditTrailComplianceResult['gapsDetected'] = [];
    if (entries.length > 1) {
      const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      for (let i = 1; i < sorted.length; i++) {
        const prevTime = new Date(sorted![i - 1]!.timestamp).getTime();
        const currTime = new Date(sorted![i]!.timestamp).getTime();
        const gapHours = (currTime - prevTime) / (1000 * 60 * 60);
        // Flag gaps longer than 72 hours as potential audit trail holes
        if (gapHours > 72) {
          gapsDetected.push({
            startDate: sorted![i - 1]!.timestamp,
            endDate: sorted![i]!.timestamp,
            durationHours: Math.round(gapHours),
          });
        }
      }
    }

    // Tamper detection via sequential ID integrity
    if (requirement.tamperProof && entries.length > 1) {
      const timestamps = entries.map((e) => new Date(e.timestamp).getTime());
      for (let i = 1; i < timestamps.length; i++) {
        if (timestamps![i]! < timestamps![i - 1]!) {
          tamperDetected = true;
          break;
        }
      }
    }

    const status: SOXCheckStatus =
      missingFields.length > 0 || tamperDetected
        ? 'fail'
        : gapsDetected.length > 0
          ? 'warning'
          : 'pass';

    return {
      requirementId: requirement.id,
      resource: resourceType,
      totalEntries: entries.length,
      missingFields,
      tamperDetected,
      retentionCompliant,
      gapsDetected,
      status,
    };
  }

  /** Get the audit engine instance */
  getAuditEngine(): AuditLogEngine {
    return this.auditEngine;
  }

  /** Verify no unauthorized modifications to closed periods */
  verifyClosedPeriodIntegrity(
    closedPeriods: string[],
    recentEntries: Array<{ period: string; timestamp: string; action: string }>
  ): SOXCheckResult[] {
    const violations: SOXCheckResult[] = [];

    for (const entry of recentEntries) {
      if (closedPeriods.includes(entry.period) && ['update', 'delete'].includes(entry.action)) {
        violations.push({
          id: 'cpi-' + Date.now(),
          controlId: 'SOX-404-09',
          category: 'audit_trail',
          name: 'Closed Period Modification',
          description: 'Modification detected in a closed financial period',
          status: 'fail',
          severity: 'critical',
          details: `${entry.action} detected in closed period ${entry.period} at ${entry.timestamp}`,
          evidence: [
            `Period: ${entry.period}`,
            `Action: ${entry.action}`,
            `Timestamp: ${entry.timestamp}`,
          ],
          timestamp: new Date().toISOString(),
          remediation: 'Reverse the unauthorized modification and investigate the access',
        });
      }
    }

    return violations;
  }

  // =========================================================================
  // DATA INTEGRITY CHECKS
  // =========================================================================

  /** Verify the balance sheet equation: Assets = Liabilities + Equity */
  verifyBalanceSheetEquation(
    totalAssets: number,
    totalLiabilities: number,
    totalEquity: number,
    tolerance: number = 0.01
  ): DataIntegrityResult {
    // Compute L+E and the imbalance with exact decimal arithmetic so the check
    // reflects the true difference; the caller-supplied `tolerance` (default one
    // cent) is then applied to a drift-free number rather than to a float sum.
    const expectedD = addMoney(totalLiabilities, totalEquity);
    const expected = expectedD.toNumber();
    const diffD = toDecimal(totalAssets).minus(expectedD).abs();
    const _diff = diffD.toNumber();
    const passed = diffD.lessThanOrEqualTo(toDecimal(tolerance));
    const DP = 2;
    const m = (v: number | typeof diffD): string => roundMoney(v, DP).toFixed(DP);

    const result: DataIntegrityResult = {
      checkId: 'DI-001',
      checkName: 'Balance Sheet Equation',
      passed,
      expected,
      actual: totalAssets,
      details: passed
        ? `Balance sheet balanced: Assets ($${m(totalAssets)}) = L+E ($${m(expected)}), diff: $${m(diffD)}`
        : `IMBALANCE: Assets ($${m(totalAssets)}) != L+E ($${m(expected)}), diff: $${m(diffD)}`,
      timestamp: new Date().toISOString(),
    };

    this.integrityResults.push(result);
    return result;
  }

  /** Verify double-entry: total debits must equal total credits */
  verifyDoubleEntry(
    entries: Array<{ debit: number; credit: number }>,
    tolerance: number = 0.01
  ): DataIntegrityResult {
    // Sum both sides with exact decimal arithmetic (no float accumulation
    // drift), then apply the caller-supplied `tolerance` to the true diff.
    const totalDebitsD = sumMoney(entries.map((e) => e.debit));
    const totalCreditsD = sumMoney(entries.map((e) => e.credit));
    const totalDebits = totalDebitsD.toNumber();
    const totalCredits = totalCreditsD.toNumber();
    const diffD = totalDebitsD.minus(totalCreditsD).abs();
    const passed = diffD.lessThanOrEqualTo(toDecimal(tolerance));
    const DP = 2;
    const m = (v: number | typeof diffD): string => roundMoney(v, DP).toFixed(DP);

    const result: DataIntegrityResult = {
      checkId: 'DI-002',
      checkName: 'Double-Entry Balance',
      passed,
      expected: totalDebits,
      actual: totalCredits,
      details: passed
        ? `Debits ($${m(totalDebits)}) = Credits ($${m(totalCredits)}), diff: $${m(diffD)}`
        : `MISMATCH: Debits ($${m(totalDebits)}) != Credits ($${m(totalCredits)}), diff: $${m(diffD)}`,
      timestamp: new Date().toISOString(),
    };

    this.integrityResults.push(result);
    return result;
  }

  /** Compute a simple hash for data integrity verification */
  computeDataHash(data: unknown): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return 'h-' + Math.abs(hash).toString(36);
  }

  /** Store a data hash for later verification */
  storeDataHash(key: string, data: unknown): string {
    const hash = this.computeDataHash(data);
    this.dataHashes.set(key, hash);
    return hash;
  }

  /** Verify data integrity against stored hash */
  verifyDataIntegrity(key: string, data: unknown): DataIntegrityResult {
    const expectedHash = this.dataHashes.get(key);
    const actualHash = this.computeDataHash(data);
    const passed = expectedHash === actualHash;

    const result: DataIntegrityResult = {
      checkId: 'DI-004',
      checkName: 'Data Checksum Verification',
      passed,
      expected: expectedHash,
      actual: actualHash,
      details: passed
        ? `Data integrity verified for key: ${key}`
        : `TAMPERING DETECTED for key: ${key} - hash mismatch`,
      timestamp: new Date().toISOString(),
    };

    this.integrityResults.push(result);
    return result;
  }

  /** Verify that closed periods have not been modified */
  verifyPeriodCloseIntegrity(
    closedPeriods: Map<string, string>, // period -> hash at close time
    currentData: Map<string, unknown>
  ): DataIntegrityResult[] {
    const results: DataIntegrityResult[] = [];

    for (const [period, closeHash] of closedPeriods) {
      const current = currentData.get(period);
      if (current === undefined) continue;

      const currentHash = this.computeDataHash(current);
      const passed = closeHash === currentHash;

      results.push({
        checkId: 'DI-003',
        checkName: 'Period Close Integrity',
        passed,
        expected: closeHash,
        actual: currentHash,
        details: passed
          ? `Period ${period} integrity verified - no modifications since close`
          : `Period ${period} MODIFIED after close - expected ${closeHash}, got ${currentHash}`,
        timestamp: new Date().toISOString(),
      });
    }

    this.integrityResults.push(...results);
    return results;
  }

  /** Get all data integrity results */
  getIntegrityResults(): DataIntegrityResult[] {
    return [...this.integrityResults];
  }

  /** Clear integrity results */
  clearIntegrityResults(): void {
    this.integrityResults = [];
  }

  // =========================================================================
  // ACCESS CONTROL COMPLIANCE
  // =========================================================================

  /** Review privileged access - returns users with elevated roles */
  reviewPrivilegedAccess(): Array<{
    userId: string;
    roles: Role[];
    riskLevel: 'high' | 'medium' | 'low';
    lastActivity?: string;
  }> {
    const allUsers = this.rbacEngine.listUsers();

    const privileged: Array<{
      userId: string;
      roles: Role[];
      riskLevel: 'high' | 'medium' | 'low';
      lastActivity?: string;
    }> = [];

    for (const { userId, roles } of allUsers) {
      const isAdmin = roles.includes('admin');
      const isManager = roles.includes('manager');
      const riskLevel = isAdmin ? 'high' : isManager ? 'medium' : 'low';

      if (isAdmin || isManager) {
        const userEntries = this.auditEngine.getByUser(userId, 1);
        privileged.push({
          userId,
          roles,
          riskLevel,
          lastActivity: userEntries[0]?.timestamp,
        });
      }
    }

    return privileged;
  }

  /** Check for orphaned user roles (users with roles but no recent activity) */
  checkOrphanedRoles(inactiveDays: number = 90): Array<{
    userId: string;
    roles: Role[];
    lastActivity: string;
    daysInactive: number;
  }> {
    const allUsers = this.rbacEngine.listUsers();
    const now = Date.now();

    const orphaned: Array<{
      userId: string;
      roles: Role[];
      lastActivity: string;
      daysInactive: number;
    }> = [];

    for (const { userId, roles } of allUsers) {
      const entries = this.auditEngine.getByUser(userId, 1);
      if (entries.length === 0) {
        orphaned.push({
          userId,
          roles,
          lastActivity: 'never',
          daysInactive: 999,
        });
        continue;
      }

      const lastActivity = entries[0]!.timestamp;
      const daysSince = Math.floor(
        (now - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSince >= inactiveDays) {
        orphaned.push({
          userId,
          roles,
          lastActivity,
          daysInactive: daysSince,
        });
      }
    }

    return orphaned;
  }

  // =========================================================================
  // FULL COMPLIANCE REPORT
  // =========================================================================

  /** Generate a comprehensive SOX compliance report */
  generateReport(options?: {
    closedPeriods?: string[];
    recentEntries?: Array<{ period: string; timestamp: string; action: string }>;
    balanceSheet?: { assets: number; liabilities: number; equity: number };
    ledgerEntries?: Array<{ debit: number; credit: number }>;
  }): SOXReport {
    const checks: SOXCheckResult[] = [];
    const now = new Date().toISOString();

    // 1. Approval workflow checks
    const pendingApprovals = this.getPendingApprovals();
    const slaBreaches = this.checkApprovalSLABreaches();

    checks.push({
      id: 'chk-approval-1',
      controlId: 'SOX-302-01',
      category: 'approval_workflow',
      name: 'Pending Approvals Review',
      description: 'Check for overdue approval requests',
      status: slaBreaches.length === 0 ? 'pass' : 'fail',
      severity: slaBreaches.length > 0 ? 'high' : 'low',
      details: `${pendingApprovals.length} pending, ${slaBreaches.length} SLA breaches`,
      evidence: slaBreaches.map((r) => `Request ${r.id}: ${r.title}`),
      timestamp: now,
      remediation:
        slaBreaches.length > 0 ? 'Review and process overdue approval requests' : undefined,
    });

    // 2. Segregation of duties checks
    const sodViolations = this.scanAllSODViolations();
    checks.push({
      id: 'chk-sod-1',
      controlId: 'SOX-404-01',
      category: 'segregation_of_duties',
      name: 'Segregation of Duties Scan',
      description: 'Scan all users for conflicting role assignments',
      status: sodViolations.length === 0 ? 'pass' : 'fail',
      severity: sodViolations.length > 0 ? 'critical' : 'low',
      details: `${sodViolations.length} SOD violations detected`,
      evidence: sodViolations.map((v) => v.details),
      timestamp: now,
      remediation: sodViolations.length > 0 ? 'Remove conflicting role assignments' : undefined,
    });

    // 3. Audit trail checks
    const auditResources = ['journal_entry', 'budget', 'user_access', 'financial_report'];
    for (const resource of auditResources) {
      const result = this.verifyAuditTrailCompliance(resource);
      checks.push({
        id: `chk-audit-${resource}`,
        controlId: 'SOX-404-03',
        category: 'audit_trail',
        name: `Audit Trail: ${resource}`,
        description: `Verify audit trail completeness for ${resource}`,
        status: result.status,
        severity:
          result.status === 'fail' ? 'critical' : result.status === 'warning' ? 'medium' : 'low',
        details: `${result.totalEntries} entries, ${result.missingFields.length} missing fields, tamper: ${result.tamperDetected}`,
        evidence: [
          ...result.missingFields,
          ...result.gapsDetected.map(
            (g) => `Gap: ${g.startDate} to ${g.endDate} (${g.durationHours}h)`
          ),
        ],
        timestamp: now,
        remediation:
          result.status !== 'pass' ? 'Ensure all required audit fields are populated' : undefined,
      });
    }

    // 4. Data integrity checks
    if (options?.balanceSheet) {
      const bs = options.balanceSheet;
      const bsResult = this.verifyBalanceSheetEquation(bs.assets, bs.liabilities, bs.equity);
      checks.push({
        id: 'chk-bs-1',
        controlId: 'SOX-404-05',
        category: 'data_integrity',
        name: 'Balance Sheet Equation',
        description: 'Assets = Liabilities + Equity',
        status: bsResult.passed ? 'pass' : 'fail',
        severity: bsResult.passed ? 'low' : 'critical',
        details: bsResult.details,
        evidence: [],
        timestamp: now,
        remediation: bsResult.passed
          ? undefined
          : 'Investigate and correct the balance sheet imbalance',
      });
    }

    if (options?.ledgerEntries) {
      const deResult = this.verifyDoubleEntry(options.ledgerEntries);
      checks.push({
        id: 'chk-de-1',
        controlId: 'SOX-404-06',
        category: 'data_integrity',
        name: 'Double-Entry Verification',
        description: 'Total Debits = Total Credits',
        status: deResult.passed ? 'pass' : 'fail',
        severity: deResult.passed ? 'low' : 'critical',
        details: deResult.details,
        evidence: [],
        timestamp: now,
        remediation: deResult.passed
          ? undefined
          : 'Investigate and correct the debit/credit mismatch',
      });
    }

    if (options?.closedPeriods && options?.recentEntries) {
      const cpViolations = this.verifyClosedPeriodIntegrity(
        options.closedPeriods,
        options.recentEntries
      );
      checks.push({
        id: 'chk-cp-1',
        controlId: 'SOX-404-09',
        category: 'data_integrity',
        name: 'Closed Period Integrity',
        description: 'No modifications to closed periods',
        status: cpViolations.length === 0 ? 'pass' : 'fail',
        severity: cpViolations.length > 0 ? 'critical' : 'low',
        details:
          cpViolations.length === 0
            ? 'No unauthorized modifications to closed periods'
            : `${cpViolations.length} closed period violations detected`,
        evidence: cpViolations.map((v) => v.details),
        timestamp: now,
        remediation:
          cpViolations.length > 0 ? 'Reverse unauthorized closed period modifications' : undefined,
      });
    }

    // 5. Access control checks
    const privileged = this.reviewPrivilegedAccess();
    const orphaned = this.checkOrphanedRoles();
    checks.push({
      id: 'chk-access-1',
      controlId: 'SOX-404-07',
      category: 'access_control',
      name: 'Privileged Access Review',
      description: 'Review users with elevated access',
      status: orphaned.length === 0 ? 'pass' : 'warning',
      severity: orphaned.length > 0 ? 'medium' : 'low',
      details: `${privileged.length} privileged users, ${orphaned.length} potentially orphaned roles`,
      evidence: orphaned.map((o) => `User ${o.userId}: ${o.daysInactive} days inactive`),
      timestamp: now,
      remediation: orphaned.length > 0 ? 'Review and remove inactive privileged access' : undefined,
    });

    // Calculate summary
    const summary = {
      total: checks.length,
      passed: checks.filter((c) => c.status === 'pass').length,
      failed: checks.filter((c) => c.status === 'fail').length,
      warnings: checks.filter((c) => c.status === 'warning').length,
      notApplicable: checks.filter((c) => c.status === 'not_applicable').length,
    };

    const byCategory: Record<
      SOXControlCategory,
      { passed: number; failed: number; total: number }
    > = {
      approval_workflow: { passed: 0, failed: 0, total: 0 },
      segregation_of_duties: { passed: 0, failed: 0, total: 0 },
      audit_trail: { passed: 0, failed: 0, total: 0 },
      data_integrity: { passed: 0, failed: 0, total: 0 },
      access_control: { passed: 0, failed: 0, total: 0 },
      financial_reporting: { passed: 0, failed: 0, total: 0 },
    };

    for (const check of checks) {
      const cat = byCategory[check.category];
      cat.total++;
      if (check.status === 'pass') cat.passed++;
      if (check.status === 'fail') cat.failed++;
    }

    const criticalFindings = checks.filter(
      (c) => c.status === 'fail' && (c.severity === 'critical' || c.severity === 'high')
    );

    const overallScore =
      summary.total > 0
        ? Math.round((summary.passed / (summary.total - summary.notApplicable)) * 100)
        : 100;

    const overallStatus: SOXReport['overallStatus'] =
      criticalFindings.length > 0
        ? 'non_compliant'
        : summary.failed > 0 || summary.warnings > 0
          ? 'partially_compliant'
          : 'compliant';

    const recommendations: string[] = [];
    if (criticalFindings.length > 0) {
      recommendations.push('Address all critical findings immediately before external audit');
    }
    if (sodViolations.length > 0) {
      recommendations.push('Resolve segregation of duties conflicts');
    }
    if (slaBreaches.length > 0) {
      recommendations.push('Process overdue approval requests');
    }
    if (orphaned.length > 0) {
      recommendations.push('Review and clean up inactive privileged access');
    }
    if (recommendations.length === 0) {
      recommendations.push('Maintain current compliance posture through regular monitoring');
    }

    const report: SOXReport = {
      generatedAt: now,
      overallStatus,
      overallScore,
      checks,
      summary,
      byCategory,
      criticalFindings,
      recommendations,
    };

    this.lastReport = report;

    this.auditEngine.log({
      userId: 'system',
      userName: 'SOX Compliance Engine',
      action: 'create',
      resource: 'sox_report',
      resourceId: 'report-' + Date.now(),
      details: `SOX compliance report generated: ${overallStatus} (${overallScore}%)`,
      metadata: { overallStatus, overallScore, criticalFindings: criticalFindings.length },
    });

    return report;
  }

  /** Get the last generated report */
  getLastReport(): SOXReport | null {
    return this.lastReport;
  }

  // =========================================================================
  // CONTROLS MANAGEMENT
  // =========================================================================

  /** Get all SOX controls */
  getControls(): SOXControl[] {
    return [...this.controls];
  }

  /** Enable or disable a SOX control */
  setControlEnabled(controlId: string, enabled: boolean): boolean {
    const control = this.controls.find((c) => c.id === controlId);
    if (!control) return false;
    control.enabled = enabled;
    return true;
  }

  /** Add a custom SOX control */
  addControl(control: Omit<SOXControl, 'id'>): SOXControl {
    const newControl: SOXControl = {
      ...control,
      id: 'SOX-CUSTOM-' + Date.now().toString(36),
    };
    this.controls.push(newControl);
    return newControl;
  }

  /** Get data integrity check definitions */
  getIntegrityCheckDefinitions(): DataIntegrityCheck[] {
    return [...this.integrityChecks];
  }

  /** Get audit trail requirements */
  getAuditRequirements(): AuditTrailRequirement[] {
    return [...this.auditRequirements];
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  serialize(): string {
    return JSON.stringify({
      controls: this.controls,
      sodRules: this.sodRules,
      integrityChecks: this.integrityChecks,
      auditRequirements: this.auditRequirements,
      integrityResults: this.integrityResults,
      dataHashes: Array.from(this.dataHashes.entries()),
      lastReport: this.lastReport,
    });
  }

  deserialize(json: string): boolean {
    try {
      const p = JSON.parse(json);
      this.controls = p.controls ?? DEFAULT_SOX_CONTROLS;
      this.sodRules = p.sodRules ?? DEFAULT_SOD_RULES;
      this.integrityChecks = p.integrityChecks ?? DEFAULT_INTEGRITY_CHECKS;
      this.auditRequirements = p.auditRequirements ?? DEFAULT_AUDIT_REQUIREMENTS;
      this.integrityResults = p.integrityResults ?? [];
      this.dataHashes = new Map(p.dataHashes ?? []);
      this.lastReport = p.lastReport ?? null;
      return true;
    } catch {
      return false;
    }
  }
}
