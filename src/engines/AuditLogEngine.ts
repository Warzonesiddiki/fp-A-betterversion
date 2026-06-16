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
      id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `audit-${Date.now()}-${this.fallbackRandomHex(12)}`,
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
    // SECURITY (Phase 7 audit, Hephaestus PATCH 4): escape CWE-1236 formula-injection vectors (=, +, -, @, tab, CR) by prefixing single quote. RFC 4180 quote for comma/quote/newline.
    const headers = this.escapeCsvRow(['id', 'timestamp', 'userId', 'userName', 'action', 'resource', 'resourceId', 'oldValue', 'newValue', 'ipAddress', 'sessionId', 'details', 'metadata']);
    const rows = this.entries
      .map(
        (e) =>
          this.escapeCsvRow([e.id, e.timestamp, e.userId, e.userName, e.action, e.resource, e.resourceId, e.oldValue == null ? null : String(e.oldValue), e.newValue == null ? null : String(e.newValue), e.ipAddress, e.sessionId, e.details, e.metadata ? JSON.stringify(e.metadata) : null])
      )
      .join('\n');
    return headers + '\n' + rows;
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

  private escapeCsvValue(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) return '';
    const s = String(value);
    if (s.length === 0) return '';
    const first = s.charAt(0);
    if (first === '=' || first === '+' || first === '-' || first === '@' || first === '\t' || first === '\r') {
      return `'${s}`;
    }
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  private escapeCsvRow(values: (string | number | boolean | null | undefined)[]): string {
    return values.map((v) => this.escapeCsvValue(v)).join(',');
  }

  private fallbackRandomHex(hexChars: number): string {
    const byteLen = Math.ceil(hexChars / 2);
    const bytes = new Uint8Array(byteLen);
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < byteLen; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, hexChars);

  }
}
