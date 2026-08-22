import { randomId } from '@/utils/cryptoId';
// =============================================================================
// REPORT SCHEDULER ENGINE — Cron-based scheduling for report generation
// Pure TypeScript, deterministic, no external dependencies
// =============================================================================

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface ScheduleConfig {
  frequency: ScheduleFrequency;
  dayOfWeek?: number; // 0-6 (Sun-Sat)
  dayOfMonth?: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  cronExpression?: string; // For custom frequency
  timezone?: string;
}

export interface ScheduleEntry {
  id: string;
  reportId: string;
  reportName: string;
  config: ScheduleConfig;
  recipients: string[];
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  runCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleRun {
  id: string;
  scheduleId: string;
  startedAt: string;
  completedAt?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  outputPath?: string;
}

export class ReportSchedulerEngine {
  private schedules = new Map<string, ScheduleEntry>();
  private runs: ScheduleRun[] = [];

  /**
   * `referenceDate` makes schedule creation deterministic: callers (and
   * tests) can pin the clock instead of depending on wall-clock "now".
   * Defaults to the current time, preserving the original 4-arg API.
   */
  createSchedule(
    reportId: string,
    reportName: string,
    config: ScheduleConfig,
    recipients: string[] = [],
    referenceDate: Date = new Date()
  ): ScheduleEntry {
    const id = randomId('sched');
    const now = referenceDate.toISOString();
    const nextRun = this.calculateNextRun(config, referenceDate);

    const entry: ScheduleEntry = {
      id,
      reportId,
      reportName,
      config,
      recipients,
      enabled: true,
      nextRun,
      runCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.schedules.set(id, entry);
    return entry;
  }

  getSchedule(id: string): ScheduleEntry | undefined {
    return this.schedules.get(id);
  }

  listSchedules(): ScheduleEntry[] {
    return Array.from(this.schedules.values());
  }

  updateSchedule(
    id: string,
    updates: Partial<Pick<ScheduleEntry, 'config' | 'recipients' | 'enabled'>>
  ): ScheduleEntry | null {
    const entry = this.schedules.get(id);
    if (!entry) return null;
    if (updates.config) entry.config = updates.config;
    if (updates.recipients) entry.recipients = updates.recipients;
    if (updates.enabled !== undefined) entry.enabled = updates.enabled;
    entry.nextRun = this.calculateNextRun(entry.config);
    entry.updatedAt = new Date().toISOString();
    return entry;
  }

  deleteSchedule(id: string): boolean {
    return this.schedules.delete(id);
  }

  pauseSchedule(id: string): boolean {
    const entry = this.schedules.get(id);
    if (!entry) return false;
    entry.enabled = false;
    entry.updatedAt = new Date().toISOString();
    return true;
  }

  resumeSchedule(id: string): boolean {
    const entry = this.schedules.get(id);
    if (!entry) return false;
    entry.enabled = true;
    entry.nextRun = this.calculateNextRun(entry.config);
    entry.updatedAt = new Date().toISOString();
    return true;
  }

  getDueSchedules(): ScheduleEntry[] {
    const now = new Date();
    return Array.from(this.schedules.values()).filter(
      (s) => s.enabled && new Date(s.nextRun) <= now
    );
  }

  recordRun(scheduleId: string, status: ScheduleRun['status'], error?: string): ScheduleRun | null {
    const entry = this.schedules.get(scheduleId);
    if (!entry) return null;

    const run: ScheduleRun = {
      id: 'run-' + Date.now(),
      scheduleId,
      startedAt: new Date().toISOString(),
      status,
      error,
    };

    if (status === 'completed' || status === 'failed') {
      run.completedAt = new Date().toISOString();
    }

    if (status === 'completed') {
      entry.lastRun = run.startedAt;
      entry.runCount++;
      entry.nextRun = this.calculateNextRun(entry.config);
    }

    entry.updatedAt = new Date().toISOString();
    this.runs.push(run);
    return run;
  }

  getRuns(scheduleId: string): ScheduleRun[] {
    return this.runs.filter((r) => r.scheduleId === scheduleId);
  }

  serialize(): string {
    return JSON.stringify({
      schedules: Array.from(this.schedules.entries()),
      runs: this.runs,
    });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.schedules = new Map(parsed.schedules);
    this.runs = parsed.runs;
  }

  // Next-run math runs entirely in UTC day/time space. The previous
  // local-wall-clock arithmetic (`setHours`/`getDay`) made nextRun
  // machine-dependent: a 09:00 schedule serialized as 03:30Z under
  // Asia/Kolkata and month boundaries shifted across UTC dates (e.g. "Sept 1"
  // became Aug 31T18:30Z). `hour`/`minute`/`dayOfWeek`/`dayOfMonth` are
  // interpreted as UTC so the ISO-string nextRun contract holds everywhere.
  private calculateNextRun(config: ScheduleConfig, now: Date = new Date()): string {
    const next = new Date(now.getTime());
    next.setUTCHours(config.hour, config.minute, 0, 0);

    switch (config.frequency) {
      case 'daily':
        if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
        break;
      case 'weekly':
        next.setUTCDate(next.getUTCDate() + (((config.dayOfWeek ?? 1) - next.getUTCDay() + 7) % 7));
        if (next <= now) next.setUTCDate(next.getUTCDate() + 7);
        break;
      case 'monthly':
        next.setUTCDate(config.dayOfMonth ?? 1);
        if (next <= now) next.setUTCMonth(next.getUTCMonth() + 1);
        break;
      case 'quarterly':
        next.setUTCMonth(Math.floor(next.getUTCMonth() / 3) * 3 + 3, 1);
        break;
      case 'yearly':
        next.setUTCMonth(0, 1);
        if (next <= now) next.setUTCFullYear(next.getUTCFullYear() + 1);
        break;
      case 'custom':
        if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
        break;
    }

    return next.toISOString();
  }
}
