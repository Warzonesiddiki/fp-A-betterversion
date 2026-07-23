// src/types/audit.ts
// Clio (Audit Muse) — Part 141 P0A-17 types
// Coupling: Hades GDPR T-15 (consentRegistry + rightsWorkflow + breachTimer)
//            Hera RBAC T-4.30 (rbacEnforcer.ts)

import type { CellAddress } from '@/types/cell';

export type AuditOperation = 'read' | 'write' | 'update' | 'delete' | 'bulk';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto';
export type DataType = 'number' | 'string' | 'boolean' | 'date' | 'object' | 'array';
export type AuditSource = 'manual' | 'import' | 'api' | 'plugin' | 'automation' | 'gdpr';

export interface CellAuditEntry {
  id: string;
  cellId: CellAddress;
  userId: string;
  operation: AuditOperation;
  dataType: DataType;
  previousValue: unknown;
  newValue: unknown;
  approvalStatus: ApprovalStatus;
  approvalUserId?: string;
  approvalTimestamp?: number;
  source: AuditSource;
  transactionId?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/** Extended entry cross-references external modules (Hades GDPR + Hera RBAC + Part 140 versioning) */
export interface ExtendedAuditEntry extends CellAuditEntry {
  /** Part 140 Cell Versioning cross-reference */
  versionId?: string;
  /** Hades GDPR consentRegistry cross-reference (Article 6 + Article 7) */
  consentId?: string;
  /** Hades GDPR breachTimer cross-reference (Article 33 + 72h notification) */
  breachEventId?: string;
  /** Hera RBAC rbacEnforcer.ts cross-reference (T-4.30 enforce() call) */
  rbacEnforceId?: string;
}

/** 12 filter types per Part 141 spec §3.2 */
export interface AuditFilters {
  /** 1. Cell ID text search (matches sectorId/scenarioId/periodId/lineItemId) */
  cellId?: string;
  /** 2. User dropdown */
  userId?: string;
  /** 3. Operation chips (multi-select) */
  operation?: AuditOperation[];
  /** 4. Data type chips (multi-select) */
  dataType?: DataType[];
  /** 5. Approval status chips (multi-select) */
  approvalStatus?: ApprovalStatus[];
  /** 6. Source dropdown */
  source?: AuditSource;
  /** 7. Transaction ID text search (for bulk grouping) */
  transactionId?: string;
  /** 8. Date range [from, to] epoch ms */
  dateRange?: [number, number];
  /** 9. Value range [min, max] for numeric newValue */
  valueRange?: [number, number];
  /** 10. Full-text search (matches id + userId + lineItemId + metadata) */
  fullTextSearch?: string;
  /** 11. Has version (Part 140 cross-reference) */
  hasVersion?: boolean;
  /** 12. Has GDPR consent (Hades consentRegistry cross-reference) */
  hasConsent?: boolean;
}
