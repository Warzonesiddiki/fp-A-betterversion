// @money-ast-allow Reason: Delivery success rate: successful / totalDeliveries is a count ratio, not money
import { randomId } from '@/utils/cryptoId';
// =============================================================================
// REPORT SCHEDULING ENGINE
// Cron-based scheduling, distribution lists, delivery tracking
// Pure TypeScript, deterministic, testable
// =============================================================================

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface ReportSchedule {
  id: string;
  name: string;
  reportId: string;
  frequency: ScheduleFrequency;
  cronExpression?: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryRecord {
  id: string;
  scheduleId: string;
  reportId: string;
  recipients: string[];
  format: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  error?: string;
  fileSize?: number;
}

export interface ReportSubscription {
  userId: string;
  scheduleId: string;
  enabled: boolean;
  subscribedAt: string;
}

export class ReportSchedulingEngine {
  private schedules = new Map<string, ReportSchedule>();
  private deliveryHistory: DeliveryRecord[] = [];
  private subscriptions: ReportSubscription[] = [];

  // ---------------------------------------------------------------------------
  // Schedule CRUD
  // ---------------------------------------------------------------------------

  createSchedule(
    name: string,
    reportId: string,
    frequency: ScheduleFrequency,
    recipients: string[],
    format: 'pdf' | 'excel' | 'csv' = 'pdf'
  ): ReportSchedule {
    const id = randomId('sched');
    const now = new Date().toISOString();
    const schedule: ReportSchedule = {
      id,
      name,
      reportId,
      frequency,
      recipients,
      format,
      enabled: true,
      createdAt: now,
      updatedAt: now,
      nextRun: this.calculateNextRun(frequency),
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  getSchedule(id: string): ReportSchedule | undefined {
    return this.schedules.get(id);
  }

  listSchedules(): ReportSchedule[] {
    return Array.from(this.schedules.values());
  }

  deleteSchedule(id: string): boolean {
    return this.schedules.delete(id);
  }

  updateSchedule(id: string, updates: Partial<ReportSchedule>): ReportSchedule | null {
    const schedule = this.schedules.get(id);
    if (!schedule) return null;
    Object.assign(schedule, updates, { updatedAt: new Date().toISOString() });
    return schedule;
  }

  enableSchedule(id: string): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;
    schedule.enabled = true;
    schedule.updatedAt = new Date().toISOString();
    return true;
  }

  disableSchedule(id: string): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;
    schedule.enabled = false;
    schedule.updatedAt = new Date().toISOString();
    return true;
  }

  // ---------------------------------------------------------------------------
  // Execution
  // ---------------------------------------------------------------------------

  executeSchedule(scheduleId: string): DeliveryRecord | null {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule || !schedule.enabled) return null;

    const record: DeliveryRecord = {
      id: 'del-' + Date.now(),
      scheduleId,
      reportId: schedule.reportId,
      recipients: [...schedule.recipients],
      format: schedule.format,
      status: 'pending',
    };

    this.deliveryHistory.push(record);

    // Update schedule
    schedule.lastRun = new Date().toISOString();
    schedule.nextRun = this.calculateNextRun(schedule.frequency);
    schedule.updatedAt = new Date().toISOString();

    return record;
  }

  markDelivered(deliveryId: string, fileSize?: number): boolean {
    const record = this.deliveryHistory.find((d) => d.id === deliveryId);
    if (!record) return false;
    record.status = 'sent';
    record.sentAt = new Date().toISOString();
    record.fileSize = fileSize;
    return true;
  }

  markFailed(deliveryId: string, error: string): boolean {
    const record = this.deliveryHistory.find((d) => d.id === deliveryId);
    if (!record) return false;
    record.status = 'failed';
    record.error = error;
    return true;
  }

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------

  subscribe(userId: string, scheduleId: string): ReportSubscription {
    const existing = this.subscriptions.find(
      (s) => s.userId === userId && s.scheduleId === scheduleId
    );
    if (existing) {
      existing.enabled = true;
      return existing;
    }
    const sub: ReportSubscription = {
      userId,
      scheduleId,
      enabled: true,
      subscribedAt: new Date().toISOString(),
    };
    this.subscriptions.push(sub);
    return sub;
  }

  unsubscribe(userId: string, scheduleId: string): boolean {
    const idx = this.subscriptions.findIndex(
      (s) => s.userId === userId && s.scheduleId === scheduleId
    );
    if (idx === -1) return false;
    this.subscriptions.splice(idx, 1);
    return true;
  }

  getUserSubscriptions(userId: string): ReportSubscription[] {
    return this.subscriptions.filter((s) => s.userId === userId && s.enabled);
  }

  // ---------------------------------------------------------------------------
  // Delivery History
  // ---------------------------------------------------------------------------

  getDeliveryHistory(scheduleId?: string): DeliveryRecord[] {
    if (scheduleId) return this.deliveryHistory.filter((d) => d.scheduleId === scheduleId);
    return [...this.deliveryHistory];
  }

  getPendingDeliveries(): DeliveryRecord[] {
    return this.deliveryHistory.filter((d) => d.status === 'pending');
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private calculateNextRun(frequency: ScheduleFrequency): string {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
      case 'yearly':
        now.setFullYear(now.getFullYear() + 1);
        break;
      default:
        now.setDate(now.getDate() + 1);
    }
    return now.toISOString();
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  getStats(): {
    totalSchedules: number;
    enabledSchedules: number;
    totalDeliveries: number;
    successRate: number;
  } {
    const schedules = Array.from(this.schedules.values());
    const totalDeliveries = this.deliveryHistory.length;
    const successful = this.deliveryHistory.filter((d) => d.status === 'sent').length;
    return {
      totalSchedules: schedules.length,
      enabledSchedules: schedules.filter((s) => s.enabled).length,
      totalDeliveries,
      successRate: totalDeliveries > 0 ? successful / totalDeliveries : 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  serialize(): string {
    return JSON.stringify({
      schedules: Array.from(this.schedules.entries()),
      deliveryHistory: this.deliveryHistory,
      subscriptions: this.subscriptions,
    });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.schedules = new Map(parsed.schedules);
    this.deliveryHistory = parsed.deliveryHistory ?? [];
    this.subscriptions = parsed.subscriptions ?? [];
  }
}
