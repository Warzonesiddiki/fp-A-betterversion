// =============================================================================
// WORKFLOW SCHEDULER ENGINE
// Cron-based scheduling, calendar integration, scheduled task management
// Pure TypeScript, deterministic, testable, zero external dependencies
// =============================================================================

export type ScheduleFrequency =
  | 'once'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom';
export type ScheduleStatus = 'active' | 'paused' | 'completed' | 'failed' | 'expired';
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface ScheduleDefinition {
  id: string;
  name: string;
  description: string;
  workflowId: string;
  frequency: ScheduleFrequency;
  cronExpression?: string;
  timezone: string;
  startDate: string;
  endDate?: string;
  nextRunAt: string;
  lastRunAt?: string;
  status: ScheduleStatus;
  config: ScheduleConfig;
  metadata?: Record<string, unknown>;
  createdAt: string;
  executionCount: number;
  maxExecutions?: number;
}

export interface ScheduleConfig {
  hour?: number;
  minute?: number;
  dayOfMonth?: number;
  daysOfWeek?: DayOfWeek[];
  month?: number;
  quarter?: number;
  intervalHours?: number;
  intervalMinutes?: number;
  skipWeekends?: boolean;
  skipHolidays?: boolean;
  holidays?: string[];
  retryOnFailure?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface ScheduledExecution {
  id: string;
  scheduleId: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  error?: string;
  output?: Record<string, unknown>;
  durationMs?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'close' | 'review' | 'approval' | 'report' | 'custom';
  entity?: string;
  description?: string;
}

export class WorkflowSchedulerEngine {
  private schedules = new Map<string, ScheduleDefinition>();
  private executions: ScheduledExecution[] = [];
  private calendar: CalendarEvent[] = [];

  createSchedule(
    name: string,
    description: string,
    workflowId: string,
    frequency: ScheduleFrequency,
    config: ScheduleConfig = {}
  ): ScheduleDefinition {
    const id = 'sch-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const now = new Date();
    const schedule: ScheduleDefinition = {
      id,
      name,
      description,
      workflowId,
      frequency,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      startDate: now.toISOString(),
      nextRunAt: this.calculateNextRun(frequency, config, now).toISOString(),
      status: 'active',
      config,
      createdAt: now.toISOString(),
      executionCount: 0,
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  getSchedule(id: string): ScheduleDefinition | undefined {
    return this.schedules.get(id);
  }

  listSchedules(): ScheduleDefinition[] {
    return Array.from(this.schedules.values());
  }

  listActiveSchedules(): ScheduleDefinition[] {
    return Array.from(this.schedules.values()).filter((s) => s.status === 'active');
  }

  deleteSchedule(id: string): boolean {
    return this.schedules.delete(id);
  }

  pauseSchedule(id: string): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule || schedule.status !== 'active') return false;
    schedule.status = 'paused';
    return true;
  }

  resumeSchedule(id: string): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule || schedule.status !== 'paused') return false;
    schedule.status = 'active';
    schedule.nextRunAt = this.calculateNextRun(
      schedule.frequency,
      schedule.config,
      new Date()
    ).toISOString();
    return true;
  }

  updateSchedule(
    id: string,
    updates: Partial<
      Pick<
        ScheduleDefinition,
        'name' | 'description' | 'frequency' | 'config' | 'endDate' | 'maxExecutions'
      >
    >
  ): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;
    if (updates.name !== undefined) schedule.name = updates.name;
    if (updates.description !== undefined) schedule.description = updates.description;
    if (updates.frequency !== undefined) schedule.frequency = updates.frequency;
    if (updates.config !== undefined) schedule.config = { ...schedule.config, ...updates.config };
    if (updates.endDate !== undefined) schedule.endDate = updates.endDate;
    if (updates.maxExecutions !== undefined) schedule.maxExecutions = updates.maxExecutions;
    schedule.nextRunAt = this.calculateNextRun(
      schedule.frequency,
      schedule.config,
      new Date()
    ).toISOString();
    return true;
  }

  getDueSchedules(): ScheduleDefinition[] {
    const now = new Date();
    return Array.from(this.schedules.values()).filter((s) => {
      if (s.status !== 'active') return false;
      if (s.endDate && new Date(s.endDate) < now) return false;
      if (s.maxExecutions !== undefined && s.executionCount >= s.maxExecutions) return false;
      return new Date(s.nextRunAt) <= now;
    });
  }

  markExecuted(
    scheduleId: string,
    success: boolean,
    output?: Record<string, unknown>,
    error?: string
  ): ScheduledExecution | null {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return null;

    const now = new Date();
    const execution: ScheduledExecution = {
      id: 'exec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      scheduleId,
      scheduledAt: schedule.nextRunAt,
      startedAt: now.toISOString(),
      completedAt: now.toISOString(),
      status: success ? 'completed' : 'failed',
      output,
      error,
      durationMs: 0,
    };
    this.executions.push(execution);
    // Prune old executions to prevent unbounded growth
    if (this.executions.length > 10000) {
      this.executions = this.executions.slice(-5000);
    }

    schedule.lastRunAt = now.toISOString();
    schedule.executionCount++;

    if (schedule.maxExecutions !== undefined && schedule.executionCount >= schedule.maxExecutions) {
      schedule.status = 'completed';
    } else if (success || schedule.config.retryOnFailure) {
      schedule.nextRunAt = this.calculateNextRun(
        schedule.frequency,
        schedule.config,
        now
      ).toISOString();
    } else {
      schedule.status = 'failed';
    }

    return execution;
  }

  getExecutions(scheduleId?: string): ScheduledExecution[] {
    if (scheduleId) return this.executions.filter((e) => e.scheduleId === scheduleId);
    return [...this.executions];
  }

  addCalendarEvent(
    title: string,
    date: string,
    type: CalendarEvent['type'],
    entity?: string,
    description?: string
  ): CalendarEvent {
    const event: CalendarEvent = {
      id: 'cal-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      title,
      date,
      type,
      entity,
      description,
    };
    this.calendar.push(event);
    return event;
  }

  getCalendarEvents(startDate?: string, endDate?: string): CalendarEvent[] {
    let events = [...this.calendar];
    if (startDate) events = events.filter((e) => e.date >= startDate);
    if (endDate) events = events.filter((e) => e.date <= endDate);
    return events.sort((a, b) => a.date.localeCompare(b.date));
  }

  removeCalendarEvent(id: string): boolean {
    const idx = this.calendar.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.calendar.splice(idx, 1);
    return true;
  }

  isBusinessDay(date: Date, config: ScheduleConfig): boolean {
    const day = date.getDay();
    if (day === 0 || day === 6) return false;
    if (config.skipHolidays) {
      const dateStr = date.toISOString().slice(0, 10);
      if (config.holidays?.includes(dateStr)) return false;
    }
    return true;
  }

  getNextBusinessDay(date: Date, config: ScheduleConfig): Date {
    const next = new Date(date);
    while (!this.isBusinessDay(next, config)) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  serialize(): string {
    return JSON.stringify({
      schedules: Array.from(this.schedules.entries()),
      executions: this.executions,
      calendar: this.calendar,
    });
  }

  deserialize(json: string): boolean {
    try {
      const p = JSON.parse(json);
      this.schedules = new Map(p.schedules ?? []);
      this.executions = p.executions ?? [];
      this.calendar = p.calendar ?? [];
      return true;
    } catch {
      return false;
    }
  }

  private calculateNextRun(frequency: ScheduleFrequency, config: ScheduleConfig, from: Date): Date {
    let next = new Date(from);
    const hour = config.hour ?? 0;
    const minute = config.minute ?? 0;

    switch (frequency) {
      case 'once':
        return new Date(from.getTime() + 60000);
      case 'hourly':
        next.setMinutes(minute, 0, 0);
        if (next <= from) next.setHours(next.getHours() + 1);
        return next;
      case 'daily':
        next.setHours(hour, minute, 0, 0);
        if (next <= from) next.setDate(next.getDate() + 1);
        if (config.skipWeekends) next = this.getNextBusinessDay(next, config);
        return next;
      case 'weekly': {
        const targetDay = config.daysOfWeek?.[0] ? this.dayToNumber(config.daysOfWeek[0]!) : 1;
        next.setHours(hour, minute, 0, 0);
        const currentDay = next.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        next.setDate(next.getDate() + daysUntil);
        return next;
      }
      case 'monthly':
        next.setDate(config.dayOfMonth ?? 1);
        next.setHours(hour, minute, 0, 0);
        if (next <= from) next.setMonth(next.getMonth() + 1);
        return next;
      case 'quarterly': {
        const currentMonth = next.getMonth();
        const targetMonth = Math.floor(currentMonth / 3) * 3 + (config.month ?? 0);
        next.setMonth(targetMonth, config.dayOfMonth ?? 1);
        next.setHours(hour, minute, 0, 0);
        if (next <= from) next.setMonth(next.getMonth() + 3);
        return next;
      }
      case 'yearly':
        next.setMonth(config.month ?? 0, config.dayOfMonth ?? 1);
        next.setHours(hour, minute, 0, 0);
        if (next <= from) next.setFullYear(next.getFullYear() + 1);
        return next;
      case 'custom':
        next.setMinutes(next.getMinutes() + (config.intervalMinutes ?? 60));
        return next;
      default:
        return new Date(from.getTime() + 3600000);
    }
  }

  private dayToNumber(day: DayOfWeek): number {
    const map: Record<DayOfWeek, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    return map[day];
  }
}
