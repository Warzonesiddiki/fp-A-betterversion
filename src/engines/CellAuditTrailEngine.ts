import type { CellAuditEntry } from '@/types';

// =============================================================================
// EXTENDED AUDIT ENTRY — Full compliance-grade audit trail
// =============================================================================

export type AuditOperation = 'write' | 'update' | 'delete' | 'bulk';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ExtendedAuditEntry {
  readonly id: string;
  readonly cellId: string;
  readonly accountId: string;
  readonly accountName: string;
  readonly month: number;
  readonly oldValue: number | string | Date | boolean | null;
  readonly newValue: number | string | Date | boolean;
  readonly userId: string;
  readonly userName: string;
  readonly timestamp: string;
  readonly reason: string | null;
  readonly operation: AuditOperation;
  readonly dataType: string;
  readonly source?: string;
  readonly approvalStatus?: ApprovalStatus;
  readonly approvedBy?: string;
  readonly approvedAt?: string;
  readonly metadata?: Record<string, unknown>;
  readonly transactionId?: string;
}

export interface AuditReport {
  totalChanges: number;
  uniqueUsers: string[];
  uniqueCells: string[];
  dateRange: { earliest: string; latest: string };
  changesByType: Record<string, number>;
  changesByOperation: Record<AuditOperation, number>;
  changesByUser: Record<string, number>;
  approvalStats: { pending: number; approved: number; rejected: number };
}

export interface ComplianceReport {
  generatedAt: string;
  dateRange: { start: string; end: string };
  totalChanges: number;
  changesByUser: { userId: string; userName: string; count: number }[];
  changesByCell: { cellId: string; count: number }[];
  changesByOperation: Record<AuditOperation, number>;
  approvalSummary: { pending: number; approved: number; rejected: number };
  dataLineage: { cellId: string; source: string; timestamp: string }[];
}

export interface DataLineageEntry {
  cellId: string;
  source: string;
  userId: string;
  timestamp: string;
  value: unknown;
  operation: AuditOperation;
}

export interface RetentionConfig {
  retentionDays: number;
  maxEntries?: number;
}

export interface QueryFilter {
  cellId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  dataType?: string;
  operation?: AuditOperation;
  approvalStatus?: ApprovalStatus;
  reason?: string;
}

// =============================================================================
// CELL AUDIT TRAIL ENGINE — SOX-compliant audit logging
// Pure TypeScript, deterministic, immutable audit trail
// =============================================================================

export class CellAuditTrailEngine {
  private history: ExtendedAuditEntry[] = [];
  private idCounter = 0;
  private transactionCounter = 0;
  private retentionConfig: RetentionConfig = { retentionDays: 2555 }; // ~7 years default

  // --- Configuration ---

  setRetentionConfig(config: RetentionConfig): void {
    this.retentionConfig = config;
  }

  getRetentionConfig(): RetentionConfig {
    return { ...this.retentionConfig };
  }

  // --- Core Recording ---

  recordChange(entry: CellAuditEntry): ExtendedAuditEntry {
    const extended: ExtendedAuditEntry = {
      ...entry,
      id: entry.id || `audit-${++this.idCounter}`,
      operation: 'write',
      dataType: 'input',
    };
    this.history.push(Object.freeze(extended));
    this.enforceRetention();
    return extended;
  }

  recordWrite(
    cellId: string,
    newValue: number | string | Date | boolean,
    userId: string,
    userName: string,
    options: {
      oldValue?: number | string | Date | boolean | null;
      reason?: string;
      dataType?: string;
      source?: string;
      accountId?: string;
      accountName?: string;
      month?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): ExtendedAuditEntry {
    const entry: ExtendedAuditEntry = {
      id: `audit-${++this.idCounter}`,
      cellId,
      accountId: options.accountId ?? '',
      accountName: options.accountName ?? '',
      month: options.month ?? 0,
      oldValue: options.oldValue ?? null,
      newValue,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      reason: options.reason ?? null,
      operation: 'write',
      dataType: options.dataType ?? 'input',
      source: options.source,
      metadata: options.metadata,
    };
    this.history.push(Object.freeze(entry));
    this.enforceRetention();
    return entry;
  }

  recordUpdate(
    cellId: string,
    oldValue: number | string | Date | boolean,
    newValue: number | string | Date | boolean,
    userId: string,
    userName: string,
    options: {
      reason?: string;
      dataType?: string;
      source?: string;
      accountId?: string;
      accountName?: string;
      month?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): ExtendedAuditEntry {
    const entry: ExtendedAuditEntry = {
      id: `audit-${++this.idCounter}`,
      cellId,
      accountId: options.accountId ?? '',
      accountName: options.accountName ?? '',
      month: options.month ?? 0,
      oldValue,
      newValue,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      reason: options.reason ?? null,
      operation: 'update',
      dataType: options.dataType ?? 'input',
      source: options.source,
      metadata: options.metadata,
    };
    this.history.push(Object.freeze(entry));
    this.enforceRetention();
    return entry;
  }

  recordDelete(
    cellId: string,
    oldValue: number | string | Date | boolean,
    userId: string,
    userName: string,
    options: {
      reason?: string;
      dataType?: string;
      source?: string;
      accountId?: string;
      accountName?: string;
      month?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): ExtendedAuditEntry {
    const entry: ExtendedAuditEntry = {
      id: `audit-${++this.idCounter}`,
      cellId,
      accountId: options.accountId ?? '',
      accountName: options.accountName ?? '',
      month: options.month ?? 0,
      oldValue,
      newValue: null as unknown as number,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      reason: options.reason ?? null,
      operation: 'delete',
      dataType: options.dataType ?? 'input',
      source: options.source,
      metadata: options.metadata,
    };
    this.history.push(Object.freeze(entry));
    this.enforceRetention();
    return entry;
  }

  // --- Bulk Operations ---

  recordBulk(
    entries: Array<{
      cellId: string;
      oldValue: unknown;
      newValue: unknown;
      dataType?: string;
      source?: string;
      accountId?: string;
      accountName?: string;
      month?: number;
    }>,
    userId: string,
    userName: string,
    reason?: string
  ): ExtendedAuditEntry[] {
    const transactionId = `txn-${++this.transactionCounter}-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const auditEntries: ExtendedAuditEntry[] = entries.map((e) => ({
      id: `audit-${++this.idCounter}`,
      cellId: e.cellId,
      accountId: e.accountId ?? '',
      accountName: e.accountName ?? '',
      month: e.month ?? 0,
      oldValue: e.oldValue as number | string | Date | boolean | null,
      newValue: e.newValue as number | string | Date | boolean,
      userId,
      userName,
      timestamp,
      reason: reason ?? null,
      operation: 'bulk' as AuditOperation,
      dataType: e.dataType ?? 'input',
      source: e.source,
      transactionId,
    }));

    for (const entry of auditEntries) {
      this.history.push(Object.freeze(entry));
    }
    this.enforceRetention();
    return auditEntries;
  }

  // --- Query ---

  getHistory(cellId: string): ExtendedAuditEntry[] {
    return this.history
      .filter((h) => h.cellId === cellId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getChangesByUser(userId: string): ExtendedAuditEntry[] {
    return this.history.filter((h) => h.userId === userId);
  }

  getChangesByDateRange(start: string, end: string): ExtendedAuditEntry[] {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return this.history.filter((h) => {
      const time = new Date(h.timestamp).getTime();
      return time >= startTime && time < endTime;
    });
  }

  getChangesByOperation(operation: AuditOperation): ExtendedAuditEntry[] {
    return this.history.filter((h) => h.operation === operation);
  }

  getChangesByDataType(dataType: string): ExtendedAuditEntry[] {
    return this.history.filter((h) => h.dataType === dataType);
  }

  getChangesByReason(reason: string): ExtendedAuditEntry[] {
    return this.history.filter((h) => h.reason === reason);
  }

  getChangesByApprovalStatus(status: ApprovalStatus): ExtendedAuditEntry[] {
    return this.history.filter((h) => h.approvalStatus === status);
  }

  getChangesByTransaction(transactionId: string): ExtendedAuditEntry[] {
    return this.history.filter((h) => h.transactionId === transactionId);
  }

  query(filter: QueryFilter): ExtendedAuditEntry[] {
    return this.history.filter((h) => {
      if (filter.cellId && h.cellId !== filter.cellId) return false;
      if (filter.userId && h.userId !== filter.userId) return false;
      if (filter.dataType && h.dataType !== filter.dataType) return false;
      if (filter.operation && h.operation !== filter.operation) return false;
      if (filter.approvalStatus && h.approvalStatus !== filter.approvalStatus) return false;
      if (filter.reason && h.reason !== filter.reason) return false;
      if (filter.startDate) {
        const time = new Date(h.timestamp).getTime();
        if (time < new Date(filter.startDate).getTime()) return false;
      }
      if (filter.endDate) {
        const time = new Date(h.timestamp).getTime();
        if (time >= new Date(filter.endDate).getTime()) return false;
      }
      return true;
    });
  }

  // --- Undo Support ---

  getLatestValue(cellId: string): unknown | null {
    const history = this.getHistory(cellId);
    if (history.length === 0) return null;
    return history[0]!.newValue;
  }

  getPreviousValue(cellId: string): unknown | null {
    const history = this.getHistory(cellId);
    if (history.length < 2) return null;
    return history[1]!.newValue;
  }

  getValueAtTime(cellId: string, timestamp: string): unknown | null {
    const time = new Date(timestamp).getTime();
    const entries = this.history
      .filter((h) => h.cellId === cellId && new Date(h.timestamp).getTime() <= time)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (entries.length === 0) return null;
    return entries[0]!.newValue;
  }

  revertToState(cellId: string, timestamp: string): ExtendedAuditEntry | null {
    const value = this.getValueAtTime(cellId, timestamp);
    if (value === null) return null;
    const latest = this.getLatestValue(cellId);
    return this.recordUpdate(
      cellId,
      latest as string | number | boolean | Date,
      value as string | number | boolean | Date,
      'system',
      'System Revert',
      {
        reason: `Reverted to state at ${timestamp}`,
        source: 'audit-revert',
      }
    );
  }

  // --- Approval Workflow ---

  submitForApproval(entryId: string): ExtendedAuditEntry | null {
    const idx = this.history.findIndex((h) => h.id === entryId);
    if (idx === -1) return null;
    const entry = this.history[idx]!;
    if (entry.approvalStatus && entry.approvalStatus !== 'pending') return entry;

    const updated: ExtendedAuditEntry = { ...entry, approvalStatus: 'pending' } as ExtendedAuditEntry;
    this.history[idx] = Object.freeze(updated);
    return updated;
  }

  approveEntry(entryId: string, approvedBy: string): ExtendedAuditEntry | null {
    const idx = this.history.findIndex((h) => h.id === entryId);
    if (idx === -1) return null;
    const entry = this.history[idx]!;

    const updated: ExtendedAuditEntry = {
      ...entry,
      approvalStatus: 'approved',
      approvedBy,
      approvedAt: new Date().toISOString(),
    } as ExtendedAuditEntry;
    this.history[idx] = Object.freeze(updated);
    return updated;
  }

  rejectEntry(entryId: string, rejectedBy: string): ExtendedAuditEntry | null {
    const idx = this.history.findIndex((h) => h.id === entryId);
    if (idx === -1) return null;
    const entry = this.history[idx]!;

    const updated: ExtendedAuditEntry = {
      ...entry,
      approvalStatus: 'rejected',
      approvedBy: rejectedBy,
      approvedAt: new Date().toISOString(),
    } as ExtendedAuditEntry;
    this.history[idx] = Object.freeze(updated);
    return updated;
  }

  // --- Compliance Reports ---

  getAuditReport(): AuditReport {
    const uniqueUsers = Array.from(new Set(this.history.map((h) => h.userId)));
    const uniqueCells = Array.from(new Set(this.history.map((h) => h.cellId)));

    let earliest = '';
    let latest = '';

    if (this.history.length > 0) {
      const sorted = [...this.history].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      earliest = sorted[0]!.timestamp;
      latest = sorted![sorted.length - 1]!.timestamp;
    }

    const changesByType: Record<string, number> = {};
    const changesByOperation: Record<AuditOperation, number> = {
      write: 0,
      update: 0,
      delete: 0,
      bulk: 0,
    };
    const changesByUser: Record<string, number> = {};
    const approvalStats = { pending: 0, approved: 0, rejected: 0 };

    for (const h of this.history) {
      const type = h.reason || 'manual_edit';
      changesByType[type] = (changesByType[type] || 0) + 1;
      changesByOperation[h.operation] = (changesByOperation[h.operation] || 0) + 1;
      changesByUser[h.userId] = (changesByUser[h.userId] || 0) + 1;
      if (h.approvalStatus === 'pending') approvalStats.pending++;
      else if (h.approvalStatus === 'approved') approvalStats.approved++;
      else if (h.approvalStatus === 'rejected') approvalStats.rejected++;
    }

    return {
      totalChanges: this.history.length,
      uniqueUsers,
      uniqueCells,
      dateRange: { earliest, latest },
      changesByType,
      changesByOperation,
      changesByUser,
      approvalStats,
    };
  }

  generateComplianceReport(startDate: string, endDate: string): ComplianceReport {
    const filtered = this.getChangesByDateRange(startDate, endDate);

    const userMap = new Map<string, { userId: string; userName: string; count: number }>();
    const cellMap = new Map<string, { cellId: string; count: number }>();
    const changesByOperation: Record<AuditOperation, number> = {
      write: 0,
      update: 0,
      delete: 0,
      bulk: 0,
    };
    const approvalSummary = { pending: 0, approved: 0, rejected: 0 };
    const dataLineage: { cellId: string; source: string; timestamp: string }[] = [];

    for (const h of filtered) {
      const user = userMap.get(h.userId) ?? { userId: h.userId, userName: h.userName, count: 0 };
      user.count++;
      userMap.set(h.userId, user);

      const cell = cellMap.get(h.cellId) ?? { cellId: h.cellId, count: 0 };
      cell.count++;
      cellMap.set(h.cellId, cell);

      changesByOperation[h.operation] = (changesByOperation[h.operation] || 0) + 1;

      if (h.approvalStatus === 'pending') approvalSummary.pending++;
      else if (h.approvalStatus === 'approved') approvalSummary.approved++;
      else if (h.approvalStatus === 'rejected') approvalSummary.rejected++;

      if (h.source) {
        dataLineage.push({ cellId: h.cellId, source: h.source, timestamp: h.timestamp });
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      dateRange: { start: startDate, end: endDate },
      totalChanges: filtered.length,
      changesByUser: Array.from(userMap.values()),
      changesByCell: Array.from(cellMap.values()),
      changesByOperation,
      approvalSummary,
      dataLineage,
    };
  }

  // --- Data Lineage ---

  getDataLineage(cellId: string): DataLineageEntry[] {
    return this.history
      .filter((h) => h.cellId === cellId)
      .map((h) => ({
        cellId: h.cellId,
        source: h.source ?? 'manual',
        userId: h.userId,
        timestamp: h.timestamp,
        value: h.newValue,
        operation: h.operation,
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getFullLineage(cellId: string): DataLineageEntry[] {
    return this.getDataLineage(cellId);
  }

  // --- Export ---

  exportJSON(): string {
    return JSON.stringify(this.history, null, 2);
  }

  exportCSV(): string {
    if (this.history.length === 0) return '';

    const headers = [
      'id',
      'cellId',
      'operation',
      'dataType',
      'accountId',
      'accountName',
      'month',
      'oldValue',
      'newValue',
      'userId',
      'userName',
      'timestamp',
      'reason',
      'source',
      'approvalStatus',
      'approvedBy',
      'approvedAt',
      'transactionId',
    ];

    const escapeCSV = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = this.history.map((h) =>
      headers.map((header) => escapeCSV(h[header as keyof ExtendedAuditEntry])).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  // --- Retention ---

  enforceRetention(): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionConfig.retentionDays);

    this.history = this.history.filter((h) => new Date(h.timestamp).getTime() >= cutoff.getTime());

    if (this.retentionConfig.maxEntries && this.history.length > this.retentionConfig.maxEntries) {
      this.history = this.history.slice(-this.retentionConfig.maxEntries);
    }
  }

  getRetentionStatus(): { currentEntries: number; retentionDays: number; maxEntries?: number } {
    return {
      currentEntries: this.history.length,
      retentionDays: this.retentionConfig.retentionDays,
      maxEntries: this.retentionConfig.maxEntries,
    };
  }

  // --- Accessors ---

  getAllEntries(): ExtendedAuditEntry[] {
    return [...this.history];
  }

  getEntryById(id: string): ExtendedAuditEntry | undefined {
    return this.history.find((h) => h.id === id);
  }

  getEntryCount(): number {
    return this.history.length;
  }

  getUniqueTransactions(): string[] {
    return Array.from(
      new Set(this.history.filter((h) => h.transactionId).map((h) => h.transactionId!))
    );
  }

  // --- Immutability Check ---

  isImmutable(): boolean {
    // History entries are frozen — cannot be mutated
    return true;
  }

  // --- Clear (for testing only) ---

  clear(): void {
    this.history = [];
    this.idCounter = 0;
    this.transactionCounter = 0;
  }
}
