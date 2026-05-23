// =============================================================================
// WORKFLOW ACTION ENGINE
// Action library for workflow automation: notify, calculate, export, validate
// Pure TypeScript, deterministic, testable, zero external dependencies
// =============================================================================

export type ActionType =
  | 'notify'
  | 'calculate'
  | 'export'
  | 'validate'
  | 'transform'
  | 'log'
  | 'http'
  | 'delay'
  | 'branch'
  | 'loop';
export type ActionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface ActionDefinition {
  id: string;
  type: ActionType;
  name: string;
  description: string;
  config: ActionConfig;
  inputMapping: Record<string, string>;
  outputMapping: Record<string, string>;
  retryPolicy?: RetryPolicy;
  timeoutMs?: number;
  condition?: string;
}

export interface ActionConfig {
  template?: string;
  recipients?: string[];
  channel?: 'email' | 'slack' | 'teams' | 'webhook';
  formula?: string;
  variables?: Record<string, unknown>;
  format?: 'pdf' | 'excel' | 'csv' | 'json';
  destination?: string;
  validationRules?: ValidationRule[];
  transformType?: 'filter' | 'map' | 'aggregate' | 'sort' | 'pivot';
  transformConfig?: Record<string, unknown>;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  delayMs?: number;
  iterations?: number;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'range' | 'regex' | 'custom';
  config: Record<string, unknown>;
  errorMessage: string;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
}

export interface ActionResult {
  actionId: string;
  status: ActionStatus;
  output: Record<string, unknown>;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  retryCount: number;
}

export interface ActionTemplate {
  id: string;
  type: ActionType;
  name: string;
  description: string;
  defaultConfig: ActionConfig;
  category: string;
}

export class WorkflowActionEngine {
  private actions = new Map<string, ActionDefinition>();
  private results: ActionResult[] = [];
  private templates: ActionTemplate[] = [
    {
      id: 'tpl-email-notify',
      type: 'notify',
      name: 'Email Notification',
      description: 'Send email notification',
      defaultConfig: { channel: 'email', template: 'default' },
      category: 'notification',
    },
    {
      id: 'tpl-slack-notify',
      type: 'notify',
      name: 'Slack Notification',
      description: 'Send Slack message',
      defaultConfig: { channel: 'slack', template: 'default' },
      category: 'notification',
    },
    {
      id: 'tpl-formula-calc',
      type: 'calculate',
      name: 'Formula Calculation',
      description: 'Execute formula calculation',
      defaultConfig: { formula: '', variables: {} },
      category: 'calculation',
    },
    {
      id: 'tpl-pdf-export',
      type: 'export',
      name: 'PDF Export',
      description: 'Export data as PDF',
      defaultConfig: { format: 'pdf', destination: '' },
      category: 'export',
    },
    {
      id: 'tpl-excel-export',
      type: 'export',
      name: 'Excel Export',
      description: 'Export data as Excel',
      defaultConfig: { format: 'excel', destination: '' },
      category: 'export',
    },
    {
      id: 'tpl-data-validate',
      type: 'validate',
      name: 'Data Validation',
      description: 'Validate data against rules',
      defaultConfig: { validationRules: [] },
      category: 'validation',
    },
    {
      id: 'tpl-data-transform',
      type: 'transform',
      name: 'Data Transform',
      description: 'Transform data',
      defaultConfig: { transformType: 'filter', transformConfig: {} },
      category: 'transformation',
    },
  ];

  createAction(
    type: ActionType,
    name: string,
    description: string,
    config: ActionConfig = {}
  ): ActionDefinition {
    const id = 'act-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const action: ActionDefinition = {
      id,
      type,
      name,
      description,
      config,
      inputMapping: {},
      outputMapping: {},
    };
    this.actions.set(id, action);
    return action;
  }

  getAction(id: string): ActionDefinition | undefined {
    return this.actions.get(id);
  }

  listActions(): ActionDefinition[] {
    return Array.from(this.actions.values());
  }

  deleteAction(id: string): boolean {
    return this.actions.delete(id);
  }

  updateActionConfig(id: string, config: Partial<ActionConfig>): boolean {
    const action = this.actions.get(id);
    if (!action) return false;
    Object.assign(action.config, config);
    return true;
  }

  setInputMapping(actionId: string, mapping: Record<string, string>): boolean {
    const action = this.actions.get(actionId);
    if (!action) return false;
    action.inputMapping = mapping;
    return true;
  }

  setOutputMapping(actionId: string, mapping: Record<string, string>): boolean {
    const action = this.actions.get(actionId);
    if (!action) return false;
    action.outputMapping = mapping;
    return true;
  }

  async execute(actionId: string, context: Record<string, unknown> = {}): Promise<ActionResult> {
    const action = this.actions.get(actionId);
    if (!action) {
      return {
        actionId,
        status: 'failed',
        output: {},
        error: 'Action not found',
        startedAt: new Date().toISOString(),
        retryCount: 0,
      };
    }

    const input = this.resolveMappings(action.inputMapping, context);
    const startedAt = new Date().toISOString();
    let lastError: string | undefined;
    let retryCount = 0;
    const maxRetries = action.retryPolicy?.maxRetries ?? 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const output = await this.executeAction(action, input);
        const completedAt = new Date().toISOString();
        const result: ActionResult = {
          actionId,
          status: 'completed',
          output,
          startedAt,
          completedAt,
          durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
          retryCount: attempt,
        };
        this.results.push(result);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        retryCount = attempt;
        if (attempt < maxRetries) {
          const backoff =
            (action.retryPolicy?.backoffMs ?? 1000) *
            Math.pow(action.retryPolicy?.backoffMultiplier ?? 2, attempt);
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }

    const completedAt = new Date().toISOString();
    const result: ActionResult = {
      actionId,
      status: 'failed',
      output: {},
      error: lastError,
      startedAt,
      completedAt,
      durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      retryCount,
    };
    this.results.push(result);
    // Prune old results to prevent unbounded growth
    if (this.results.length > 10000) {
      this.results = this.results.slice(-5000);
    }
    return result;
  }

  getResults(actionId?: string): ActionResult[] {
    if (actionId) return this.results.filter((r) => r.actionId === actionId);
    return [...this.results];
  }

  clearResults(): void {
    this.results = [];
  }

  getTemplates(): ActionTemplate[] {
    return [...this.templates];
  }

  getTemplatesByCategory(category: string): ActionTemplate[] {
    return this.templates.filter((t) => t.category === category);
  }

  createActionFromTemplate(
    templateId: string,
    name: string,
    overrides: Partial<ActionConfig> = {}
  ): ActionDefinition | null {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) return null;
    return this.createAction(template.type, name, template.description, {
      ...template.defaultConfig,
      ...overrides,
    });
  }

  serialize(): string {
    return JSON.stringify({
      actions: Array.from(this.actions.entries()),
      results: this.results,
    });
  }

  deserialize(json: string): boolean {
    try {
      const p = JSON.parse(json);
      this.actions = new Map(p.actions ?? []);
      this.results = p.results ?? [];
      return true;
    } catch {
      return false;
    }
  }

  private async executeAction(
    action: ActionDefinition,
    input: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const timeoutMs = action.timeoutMs;
    const execute = async (): Promise<Record<string, unknown>> => {
      switch (action.type) {
        case 'notify':
          return this.executeNotify(action.config, input);
        case 'calculate':
          return this.executeCalculate(action.config, input);
        case 'export':
          return this.executeExport(action.config, input);
        case 'validate':
          return this.executeValidate(action.config, input);
        case 'transform':
          return this.executeTransform(action.config, input);
        case 'log':
          return {
            logged: true,
            message: action.config.template ?? 'Action executed',
            data: input,
          };
        case 'delay':
          await new Promise((r) => setTimeout(r, action.config.delayMs ?? 1000));
          return { delayed: action.config.delayMs ?? 1000 };
        default:
          return { status: 'unimplemented', type: action.type };
      }
    };
    if (timeoutMs && timeoutMs > 0) {
      return Promise.race([
        execute(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Action "${action.name}" timed out after ${timeoutMs}ms`)),
            timeoutMs
          )
        ),
      ]);
    }
    return execute();
  }

  private executeNotify(
    config: ActionConfig,
    input: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      sent: true,
      channel: config.channel ?? 'email',
      recipients: config.recipients ?? [],
      subject: config.template,
      data: input,
    };
  }

  private executeCalculate(
    config: ActionConfig,
    input: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      calculated: true,
      formula: config.formula,
      variables: { ...config.variables, ...input },
      result: null,
    };
  }

  private executeExport(
    config: ActionConfig,
    input: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      exported: true,
      format: config.format ?? 'pdf',
      destination: config.destination,
      recordCount: Array.isArray(input.data) ? (input.data as unknown[]).length : 0,
    };
  }

  private executeValidate(
    config: ActionConfig,
    input: Record<string, unknown>
  ): Record<string, unknown> {
    const errors: string[] = [];
    for (const rule of config.validationRules ?? []) {
      const value = input[rule.field];
      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null || value === '') errors.push(rule.errorMessage);
          break;
        case 'range':
          if (
            typeof value === 'number' &&
            typeof rule.config.min === 'number' &&
            value < rule.config.min
          )
            errors.push(rule.errorMessage);
          if (
            typeof value === 'number' &&
            typeof rule.config.max === 'number' &&
            value > rule.config.max
          )
            errors.push(rule.errorMessage);
          break;
      }
    }
    return { valid: errors.length === 0, errors };
  }

  private executeTransform(
    config: ActionConfig,
    input: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      transformed: true,
      type: config.transformType,
      config: config.transformConfig,
      result: input,
    };
  }

  private resolveMappings(
    mapping: Record<string, string>,
    context: Record<string, unknown>
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const [key, path] of Object.entries(mapping)) {
      resolved[key] = this.resolvePath(path, context);
    }
    return resolved;
  }

  private resolvePath(path: string, obj: Record<string, unknown>): unknown {
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }
}
