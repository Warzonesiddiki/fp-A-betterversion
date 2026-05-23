// DataRetentionEngine — Automatic archival/deletion based on rules
// Pure TypeScript, deterministic, no external dependencies

export type RetentionAction = 'archive' | 'delete' | 'flag' | 'notify';
export type RetentionStatus = 'active' | 'archived' | 'deleted' | 'flagged';

export interface RetentionRule {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  retentionDays: number;
  action: RetentionAction;
  condition?: (record: Record<string, unknown>) => boolean;
  priority: number;
  enabled: boolean;
}

export interface RetentionRecord {
  id: string;
  ruleId: string;
  dataSource: string;
  recordId: string;
  action: RetentionAction;
  originalData?: Record<string, unknown>;
  archivedAt?: string;
  deletedAt?: string;
  reason: string;
}

export interface RetentionReport {
  ruleId: string;
  ruleName: string;
  dataSource: string;
  recordsProcessed: number;
  recordsAffected: number;
  action: RetentionAction;
  executedAt: string;
  errors: string[];
}

export class DataRetentionEngine {
  private rules: RetentionRule[] = [];
  private records: RetentionRecord[] = [];
  private reports: RetentionReport[] = [];

  addRule(rule: RetentionRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  removeRule(id: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.rules.splice(idx, 1);
    return true;
  }

  updateRule(id: string, updates: Partial<RetentionRule>): boolean {
    const rule = this.rules.find((r) => r.id === id);
    if (!rule) return false;
    Object.assign(rule, updates);
    this.rules.sort((a, b) => b.priority - a.priority);
    return true;
  }

  getRules(): RetentionRule[] {
    return [...this.rules];
  }

  getRulesBySource(dataSource: string): RetentionRule[] {
    return this.rules.filter((r) => r.dataSource === dataSource);
  }

  evaluate(
    dataSource: string,
    records: Record<string, unknown>[],
    dateField: string
  ): RetentionRecord[] {
    const applicableRules = this.rules.filter((r) => r.dataSource === dataSource && r.enabled);
    const results: RetentionRecord[] = [];
    const now = new Date();

    for (const record of records) {
      const dateValue = record[dateField];
      if (!dateValue) continue;
      const recordDate = new Date(dateValue as string);
      if (isNaN(recordDate.getTime())) continue;
      const ageDays = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

      for (const rule of applicableRules) {
        if (ageDays >= rule.retentionDays) {
          if (rule.condition && !rule.condition(record)) continue;

          const retRecord: RetentionRecord = {
            id: `ret-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            ruleId: rule.id,
            dataSource,
            recordId: String(record.id || record['id'] || Math.random()),
            action: rule.action,
            reason: `Age ${ageDays} days exceeds retention period of ${rule.retentionDays} days`,
          };

          if (rule.action === 'archive') {
            retRecord.originalData = { ...record };
            retRecord.archivedAt = now.toISOString();
          } else if (rule.action === 'delete') {
            retRecord.deletedAt = now.toISOString();
          }

          results.push(retRecord);
          this.records.push(retRecord);
        }
      }
    }
    return results;
  }

  execute(
    dataSource: string,
    records: Record<string, unknown>[],
    dateField: string
  ): RetentionReport[] {
    const applicableRules = this.rules.filter((r) => r.dataSource === dataSource && r.enabled);
    const reports: RetentionReport[] = [];

    for (const rule of applicableRules) {
      const report: RetentionReport = {
        ruleId: rule.id,
        ruleName: rule.name,
        dataSource,
        recordsProcessed: records.length,
        recordsAffected: 0,
        action: rule.action,
        executedAt: new Date().toISOString(),
        errors: [],
      };

      const now = new Date();
      for (const record of records) {
        try {
          const dateValue = record[dateField];
          if (!dateValue) continue;
          const recordDate = new Date(dateValue as string);
          if (isNaN(recordDate.getTime())) continue;
          const ageDays = Math.floor(
            (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (ageDays >= rule.retentionDays) {
            if (rule.condition && !rule.condition(record)) continue;
            report.recordsAffected++;
          }
        } catch (e) {
          report.errors.push(`Record ${record.id}: ${String(e)}`);
        }
      }

      reports.push(report);
      this.reports.push(report);
    }
    return reports;
  }

  getArchivedRecords(dataSource?: string): RetentionRecord[] {
    return this.records.filter(
      (r) => r.action === 'archive' && (!dataSource || r.dataSource === dataSource)
    );
  }

  getDeletedRecords(dataSource?: string): RetentionRecord[] {
    return this.records.filter(
      (r) => r.action === 'delete' && (!dataSource || r.dataSource === dataSource)
    );
  }

  restore(recordId: string): RetentionRecord | null {
    const record = this.records.find((r) => r.id === recordId && r.action === 'archive');
    if (!record || !record.originalData) return null;
    record.archivedAt = undefined;
    return record;
  }

  getReports(limit?: number): RetentionReport[] {
    const sorted = [...this.reports].sort(
      (a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }

  getStats(dataSource?: string): {
    totalRules: number;
    activeRules: number;
    archivedRecords: number;
    deletedRecords: number;
    lastExecuted?: string;
  } {
    const rules = dataSource ? this.rules.filter((r) => r.dataSource === dataSource) : this.rules;
    const archived = this.getArchivedRecords(dataSource).length;
    const deleted = this.getDeletedRecords(dataSource).length;
    const lastReport = this.reports
      .filter((r) => !dataSource || r.dataSource === dataSource)
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())[0];

    return {
      totalRules: rules.length,
      activeRules: rules.filter((r) => r.enabled).length,
      archivedRecords: archived,
      deletedRecords: deleted,
      lastExecuted: lastReport?.executedAt,
    };
  }

  serialize(): string {
    return JSON.stringify({
      rules: this.rules.map((r) => ({ ...r, condition: undefined })),
      records: this.records,
      reports: this.reports,
    });
  }
}

// Preset retention rules
export function createFinancialDataRetention(): RetentionRule[] {
  return [
    {
      id: 'gl-7year',
      name: 'GL Entries 7-Year Retention',
      description: 'SOX compliance: retain GL entries for 7 years',
      dataSource: 'gl_entries',
      retentionDays: 2555,
      action: 'archive',
      priority: 100,
      enabled: true,
    },
    {
      id: 'budget-3year',
      name: 'Budget Data 3-Year Retention',
      description: 'Retain budget data for 3 years after fiscal year end',
      dataSource: 'budgets',
      retentionDays: 1095,
      action: 'archive',
      priority: 80,
      enabled: true,
    },
    {
      id: 'audit-10year',
      name: 'Audit Trail 10-Year Retention',
      description: 'SOX compliance: retain audit trail for 10 years',
      dataSource: 'audit_trail',
      retentionDays: 3650,
      action: 'archive',
      priority: 100,
      enabled: true,
    },
    {
      id: 'temp-data-30day',
      name: 'Temp Data 30-Day Cleanup',
      description: 'Clean up temporary data after 30 days',
      dataSource: 'temp_data',
      retentionDays: 30,
      action: 'delete',
      priority: 50,
      enabled: true,
    },
    {
      id: 'notifications-90day',
      name: 'Notifications 90-Day Cleanup',
      description: 'Archive read notifications after 90 days',
      dataSource: 'notifications',
      retentionDays: 90,
      action: 'delete',
      priority: 40,
      enabled: true,
    },
  ];
}
