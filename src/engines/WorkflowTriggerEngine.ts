// =============================================================================
// WORKFLOW TRIGGER ENGINE
// Trigger system for workflow automation: data change, time-based, manual, events
// Pure TypeScript, deterministic, testable, zero external dependencies
// =============================================================================

export type TriggerType =
  | 'data_change'
  | 'time_based'
  | 'manual'
  | 'event'
  | 'webhook'
  | 'threshold';
export type ComparisonOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'between'
  | 'contains';
export type LogicalOperator = 'and' | 'or' | 'not';

export interface TriggerCondition {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
  value2?: unknown;
}

export interface TriggerRule {
  id: string;
  type: TriggerType;
  name: string;
  description: string;
  enabled: boolean;
  conditions: TriggerCondition[];
  logicalOperator: LogicalOperator;
  config: TriggerConfig;
  metadata?: Record<string, unknown>;
  createdAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
}

export interface TriggerConfig {
  cronExpression?: string;
  timezone?: string;
  intervalMs?: number;
  maxTriggers?: number;
  cooldownMs?: number;
  entity?: string;
  account?: string;
  eventType?: string;
  webhookPath?: string;
}

export interface TriggerEvent {
  id: string;
  triggerId: string;
  type: TriggerType;
  payload: Record<string, unknown>;
  timestamp: string;
  matched: boolean;
  actions: string[];
}

export interface TriggerEvaluationResult {
  matched: boolean;
  triggerId: string;
  reason: string;
  matchedConditions: string[];
}

export class WorkflowTriggerEngine {
  private triggers = new Map<string, TriggerRule>();
  private events: TriggerEvent[] = [];
  private lastTriggerTimes = new Map<string, number>();

  createTrigger(
    type: TriggerType,
    name: string,
    description: string,
    config: TriggerConfig = {}
  ): TriggerRule {
    const id = 'trg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const trigger: TriggerRule = {
      id,
      type,
      name,
      description,
      enabled: true,
      conditions: [],
      logicalOperator: 'and',
      config,
      createdAt: new Date().toISOString(),
      triggerCount: 0,
    };
    this.triggers.set(id, trigger);
    return trigger;
  }

  getTrigger(id: string): TriggerRule | undefined {
    return this.triggers.get(id);
  }

  listTriggers(): TriggerRule[] {
    return Array.from(this.triggers.values());
  }

  deleteTrigger(id: string): boolean {
    return this.triggers.delete(id);
  }

  enableTrigger(id: string): boolean {
    const trigger = this.triggers.get(id);
    if (!trigger) return false;
    trigger.enabled = true;
    return true;
  }

  disableTrigger(id: string): boolean {
    const trigger = this.triggers.get(id);
    if (!trigger) return false;
    trigger.enabled = false;
    return true;
  }

  addCondition(triggerId: string, condition: TriggerCondition): boolean {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) return false;
    trigger.conditions.push(condition);
    return true;
  }

  removeCondition(triggerId: string, index: number): boolean {
    const trigger = this.triggers.get(triggerId);
    if (!trigger || index < 0 || index >= trigger.conditions.length) return false;
    trigger.conditions.splice(index, 1);
    return true;
  }

  evaluate(triggerId: string, data: Record<string, unknown>): TriggerEvaluationResult {
    const trigger = this.triggers.get(triggerId);
    if (!trigger)
      return { matched: false, triggerId, reason: 'Trigger not found', matchedConditions: [] };
    if (!trigger.enabled)
      return { matched: false, triggerId, reason: 'Trigger disabled', matchedConditions: [] };

    const cooldownMs = trigger.config.cooldownMs ?? 0;
    const lastTime = this.lastTriggerTimes.get(triggerId) ?? 0;
    if (cooldownMs > 0 && Date.now() - lastTime < cooldownMs) {
      return { matched: false, triggerId, reason: 'Cooldown active', matchedConditions: [] };
    }

    const maxTriggers = trigger.config.maxTriggers ?? Infinity;
    if (trigger.triggerCount >= maxTriggers) {
      return { matched: false, triggerId, reason: 'Max triggers reached', matchedConditions: [] };
    }

    const matchedConditions: string[] = [];
    const results = trigger.conditions.map((c, i) => {
      const matched = this.evaluateCondition(c, data);
      if (matched) matchedConditions.push(`condition_${i}`);
      return matched;
    });

    const overall =
      trigger.logicalOperator === 'and'
        ? results.every(Boolean)
        : trigger.logicalOperator === 'or'
          ? results.some(Boolean)
          : !results[0];

    return {
      matched: overall,
      triggerId,
      reason: overall ? 'All conditions met' : 'Conditions not met',
      matchedConditions,
    };
  }

  evaluateAll(data: Record<string, unknown>): TriggerEvaluationResult[] {
    const results: TriggerEvaluationResult[] = [];
    for (const trigger of this.triggers.values()) {
      if (trigger.enabled) {
        results.push(this.evaluate(trigger.id, data));
      }
    }
    return results;
  }

  fireTrigger(triggerId: string, payload: Record<string, unknown> = {}): TriggerEvent | null {
    const trigger = this.triggers.get(triggerId);
    if (!trigger || !trigger.enabled) return null;

    const now = new Date().toISOString();
    const event: TriggerEvent = {
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      triggerId,
      type: trigger.type,
      payload,
      timestamp: now,
      matched: true,
      actions: [],
    };

    trigger.lastTriggeredAt = now;
    trigger.triggerCount++;
    this.lastTriggerTimes.set(triggerId, Date.now());
    this.events.push(event);
    // Prune old events to prevent unbounded growth
    if (this.events.length > 10000) {
      this.events = this.events.slice(-5000);
    }
    return event;
  }

  getEvents(triggerId?: string): TriggerEvent[] {
    if (triggerId) return this.events.filter((e) => e.triggerId === triggerId);
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }

  shouldTriggerTimeBased(triggerId: string): boolean {
    const trigger = this.triggers.get(triggerId);
    if (!trigger || trigger.type !== 'time_based' || !trigger.enabled) return false;

    const intervalMs = trigger.config.intervalMs;
    if (intervalMs) {
      const lastTime = this.lastTriggerTimes.get(triggerId) ?? 0;
      return Date.now() - lastTime >= intervalMs;
    }
    return false;
  }

  getTimeBasedTriggers(): TriggerRule[] {
    return Array.from(this.triggers.values()).filter((t) => t.type === 'time_based' && t.enabled);
  }

  serialize(): string {
    return JSON.stringify({
      triggers: Array.from(this.triggers.entries()),
      events: this.events,
      lastTriggerTimes: Array.from(this.lastTriggerTimes.entries()),
    });
  }

  deserialize(json: string): boolean {
    try {
      const p = JSON.parse(json);
      this.triggers = new Map(p.triggers ?? []);
      this.events = p.events ?? [];
      this.lastTriggerTimes = new Map(p.lastTriggerTimes ?? []);
      return true;
    } catch {
      return false;
    }
  }

  private evaluateCondition(condition: TriggerCondition, data: Record<string, unknown>): boolean {
    const value = data[condition.field];
    const target = condition.value;
    switch (condition.operator) {
      case 'eq':
        return value === target;
      case 'neq':
        return value !== target;
      case 'gt':
        return typeof value === 'number' && typeof target === 'number' && value > target;
      case 'lt':
        return typeof value === 'number' && typeof target === 'number' && value < target;
      case 'gte':
        return typeof value === 'number' && typeof target === 'number' && value >= target;
      case 'lte':
        return typeof value === 'number' && typeof target === 'number' && value <= target;
      case 'between':
        return (
          typeof value === 'number' &&
          typeof target === 'number' &&
          typeof condition.value2 === 'number' &&
          value >= target &&
          value <= condition.value2
        );
      case 'contains':
        return typeof value === 'string' && typeof target === 'string' && value.includes(target);
      default:
        return false;
    }
  }
}
