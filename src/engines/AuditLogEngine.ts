// Audit Log Engine - Comprehensive audit logging
// Pure TypeScript, no external dependencies

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'view'
  | 'comment';

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  details?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditFilter {
  userId?: string;
  action?: AuditAction;
  resource?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export class AuditLogEngine {
  private entries: AuditEntry[] = [];
  private maxEntries: number;
  private retentionDays: number;

  constructor(config?: { maxEntries?: number; retentionDays?: number }) {
    this.maxEntries = config?.maxEntries ?? 100000;
    this.retentionDays = config?.retentionDays ?? 2555; // 7 years for SOX
  }

  log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const auditEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };
    this.entries.push(auditEntry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
    return auditEntry;
  }

  filter(filters: AuditFilter): AuditEntry[] {
    let result = [...this.entries];
    if (filters.userId) result = result.filter((e) => e.userId === filters.userId);
    if (filters.action) result = result.filter((e) => e.action === filters.action);
    if (filters.resource) result = result.filter((e) => e.resource === filters.resource);
    if (filters.resourceId) result = result.filter((e) => e.resourceId === filters.resourceId);
    if (filters.startDate) result = result.filter((e) => e.timestamp >= filters.startDate!);
    if (filters.endDate) result = result.filter((e) => e.timestamp <= filters.endDate!);
    result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (filters.limit) result = result.slice(0, filters.limit);
    return result;
  }

  getRecent(count: number): AuditEntry[] {
    return this.entries.slice(-count).reverse();
  }

  getByResource(resource: string, resourceId: string): AuditEntry[] {
    return this.entries
      .filter((e) => e.resource === resource && e.resourceId === resourceId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  getByUser(userId: string, limit?: number): AuditEntry[] {
    const result = this.entries
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return limit ? result.slice(0, limit) : result;
  }

  getStats(): {
    total: number;
    byAction: Record<string, number>;
    byResource: Record<string, number>;
    byUser: Record<string, number>;
  } {
    const byAction: Record<string, number> = {};
    const byResource: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    for (const e of this.entries) {
      byAction[e.action] = (byAction[e.action] || 0) + 1;
      byResource[e.resource] = (byResource[e.resource] || 0) + 1;
      byUser[e.userId] = (byUser[e.userId] || 0) + 1;
    }
    return { total: this.entries.length, byAction, byResource, byUser };
  }

  exportCSV(): string {
    const headers = 'id,timestamp,userId,userName,action,resource,resourceId,details\n';
    const rows = this.entries
      .map(
        (e) =>
          `"${e.id}","${e.timestamp}","${e.userId}","${e.userName}","${e.action}","${e.resource}","${e.resourceId}","${e.details ?? ''}"`
      )
      .join('\n');
    return headers + rows;
  }

  prune(): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);
    const cutoffStr = cutoff.toISOString();
    const before = this.entries.length;
    this.entries = this.entries.filter((e) => e.timestamp >= cutoffStr);
    return before - this.entries.length;
  }

  getEntries(): AuditEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }

  serialize(): string {
    return JSON.stringify(this.entries);
  }

  deserialize(json: string): void {
    this.entries = JSON.parse(json);
  }
}
