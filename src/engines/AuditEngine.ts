import { randomId } from '@/utils/cryptoId';
/**
 * AuditEngine — Audit trail logging, querying, export
 */

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AuditEntry {
  readonly id: string;
  readonly userId: string;
  readonly userName: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly resourceName: string;
  readonly oldValue: string | number | null;
  readonly newValue: string | number | null;
  readonly severity: AuditSeverity;
  readonly timestamp: string;
  readonly details?: string;
}

export interface AuditQuery {
  startDate?: string;
  endDate?: string;
  userId?: string;
  resourceType?: string;
  severity?: AuditSeverity;
  limit?: number;
}

export class AuditEngine {
  private static entries: AuditEntry[] = [];

  /**
   * Log an audit entry
   */
  static log(params: {
    userId: string;
    userName: string;
    action: string;
    resourceType: string;
    resourceId: string;
    resourceName: string;
    oldValue?: string | number | null;
    newValue?: string | number | null;
    severity?: AuditSeverity;
    details?: string;
  }): AuditEntry {
    const entry: AuditEntry = {
      id: randomId('audit'),
      userId: params.userId,
      userName: params.userName,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      resourceName: params.resourceName,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
      severity: params.severity ?? 'INFO',
      timestamp: new Date().toISOString(),
      details: params.details,
    };

    AuditEngine.entries.push(entry);
    return entry;
  }

  /**
   * Query audit entries with filters
   */
  static query(filters: AuditQuery = {}): readonly AuditEntry[] {
    let results = [...AuditEngine.entries];

    if (filters.startDate) {
      results = results.filter((e) => e.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      results = results.filter((e) => e.timestamp <= filters.endDate!);
    }
    if (filters.userId) {
      results = results.filter((e) => e.userId === filters.userId);
    }
    if (filters.resourceType) {
      results = results.filter((e) => e.resourceType === filters.resourceType);
    }
    if (filters.severity) {
      results = results.filter((e) => e.severity === filters.severity);
    }

    // Sort newest first
    results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  /**
   * Export audit trail as CSV string
   */
  static exportCSV(filters: AuditQuery = {}): string {
    const entries = AuditEngine.query(filters);
    const headers = [
      'ID',
      'User',
      'Action',
      'Resource Type',
      'Resource',
      'Old Value',
      'New Value',
      'Severity',
      'Timestamp',
    ];
    const rows = entries.map((e) => [
      e.id,
      e.userName,
      e.action,
      e.resourceType,
      e.resourceName,
      e.oldValue ?? '',
      e.newValue ?? '',
      e.severity,
      e.timestamp,
    ]);

    return [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
  }

  /**
   * Export audit trail as JSON
   */
  static exportJSON(filters: AuditQuery = {}): string {
    return JSON.stringify(AuditEngine.query(filters), null, 2);
  }

  /**
   * Get audit statistics
   */
  static getStats(): {
    total: number;
    bySeverity: Record<AuditSeverity, number>;
    byResourceType: Record<string, number>;
    recentActions: readonly AuditEntry[];
  } {
    const bySeverity: Record<AuditSeverity, number> = { INFO: 0, WARNING: 0, CRITICAL: 0 };
    const byResourceType: Record<string, number> = {};

    for (const entry of AuditEngine.entries) {
      bySeverity[entry.severity]++;
      byResourceType[entry.resourceType] = (byResourceType[entry.resourceType] || 0) + 1;
    }

    return {
      total: AuditEngine.entries.length,
      bySeverity,
      byResourceType,
      recentActions: AuditEngine.entries.slice(-10).reverse(),
    };
  }

  /**
   * Clear old entries based on retention days
   */
  static archive(retentionDays: number): number {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const before = AuditEngine.entries.length;
    AuditEngine.entries = AuditEngine.entries.filter((e) => e.timestamp >= cutoff);
    return before - AuditEngine.entries.length;
  }

  /**
   * Get all entries (for testing/debugging)
   */
  static getAll(): readonly AuditEntry[] {
    return [...AuditEngine.entries];
  }

  /**
   * Reset (for testing)
   */
  static reset(): void {
    AuditEngine.entries = [];
  }
}
