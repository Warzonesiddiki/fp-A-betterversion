// =============================================================================
// WORKFLOW TEMPLATE ENGINE
// Pre-built workflow templates for common FP&A processes
// Pure TypeScript, deterministic, testable, zero external dependencies
// =============================================================================

export type TemplateCategory =
  | 'budget'
  | 'forecast'
  | 'close'
  | 'report'
  | 'approval'
  | 'import'
  | 'validation'
  | 'reconciliation';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  steps: WorkflowTemplateStep[];
  triggers: WorkflowTemplateTrigger[];
  variables: TemplateVariable[];
  isBuiltIn: boolean;
  version: string;
  createdAt: string;
}

export interface WorkflowTemplateStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'approval' | 'notification' | 'delay' | 'loop';
  config: Record<string, unknown>;
  order: number;
  dependsOn?: string[];
  condition?: string;
}

export interface WorkflowTemplateTrigger {
  type: 'manual' | 'schedule' | 'event' | 'data_change';
  config: Record<string, unknown>;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select';
  label: string;
  description: string;
  defaultValue: unknown;
  required: boolean;
  options?: string[];
}

export interface InstantiatedWorkflow {
  templateId: string;
  name: string;
  steps: WorkflowTemplateStep[];
  variables: Record<string, unknown>;
  createdAt: string;
}

export class WorkflowTemplateEngine {
  private templates = new Map<string, WorkflowTemplate>();
  private customTemplates = new Map<string, WorkflowTemplate>();

  constructor() {
    this.registerBuiltInTemplates();
  }

  private registerBuiltInTemplates(): void {
    const builtIn: WorkflowTemplate[] = [
      {
        id: 'tpl-monthly-close',
        name: 'Monthly Close Process',
        description: 'Standard monthly financial close workflow',
        category: 'close',
        tags: ['monthly', 'close', 'finance'],
        steps: [
          {
            id: 's1',
            name: 'Post Journal Entries',
            type: 'action',
            config: { action: 'post_journals' },
            order: 0,
          },
          {
            id: 's2',
            name: 'Run Reconciliation',
            type: 'action',
            config: { action: 'reconcile' },
            order: 1,
            dependsOn: ['s1'],
          },
          {
            id: 's3',
            name: 'Review Variances',
            type: 'action',
            config: { action: 'variance_analysis' },
            order: 2,
            dependsOn: ['s2'],
          },
          {
            id: 's4',
            name: 'Manager Approval',
            type: 'approval',
            config: { approvers: ['manager'] },
            order: 3,
            dependsOn: ['s3'],
          },
          {
            id: 's5',
            name: 'Lock Period',
            type: 'action',
            config: { action: 'lock_period' },
            order: 4,
            dependsOn: ['s4'],
          },
          {
            id: 's6',
            name: 'Generate Reports',
            type: 'action',
            config: { action: 'generate_reports' },
            order: 5,
            dependsOn: ['s5'],
          },
          {
            id: 's7',
            name: 'Notify Completion',
            type: 'notification',
            config: { channel: 'email', template: 'close_complete' },
            order: 6,
            dependsOn: ['s6'],
          },
        ],
        triggers: [{ type: 'schedule', config: { frequency: 'monthly', day: 1 } }],
        variables: [
          {
            name: 'entity',
            type: 'string',
            label: 'Entity',
            description: 'Entity to close',
            defaultValue: '',
            required: true,
          },
          {
            name: 'period',
            type: 'string',
            label: 'Period',
            description: 'Period to close',
            defaultValue: '',
            required: true,
          },
        ],
        isBuiltIn: true,
        version: '1.0.0',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'tpl-budget-approval',
        name: 'Budget Approval Workflow',
        description: 'Multi-level budget approval process',
        category: 'approval',
        tags: ['budget', 'approval'],
        steps: [
          {
            id: 's1',
            name: 'Submit Budget',
            type: 'action',
            config: { action: 'submit' },
            order: 0,
          },
          {
            id: 's2',
            name: 'Manager Review',
            type: 'approval',
            config: { approvers: ['manager'] },
            order: 1,
            dependsOn: ['s1'],
          },
          {
            id: 's3',
            name: 'VP Review',
            type: 'approval',
            config: { approvers: ['vp'] },
            order: 2,
            dependsOn: ['s2'],
            condition: 'amount > 100000',
          },
          {
            id: 's4',
            name: 'CFO Approval',
            type: 'approval',
            config: { approvers: ['cfo'] },
            order: 3,
            dependsOn: ['s3'],
            condition: 'amount > 500000',
          },
          {
            id: 's5',
            name: 'Lock Budget',
            type: 'action',
            config: { action: 'lock' },
            order: 4,
            dependsOn: ['s2'],
          },
          {
            id: 's6',
            name: 'Notify Approval',
            type: 'notification',
            config: { channel: 'email', template: 'budget_approved' },
            order: 5,
            dependsOn: ['s5'],
          },
        ],
        triggers: [{ type: 'manual', config: {} }],
        variables: [
          {
            name: 'budgetId',
            type: 'string',
            label: 'Budget ID',
            description: 'Budget to approve',
            defaultValue: '',
            required: true,
          },
          {
            name: 'amount',
            type: 'number',
            label: 'Amount',
            description: 'Budget amount',
            defaultValue: 0,
            required: true,
          },
        ],
        isBuiltIn: true,
        version: '1.0.0',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'tpl-forecast-update',
        name: 'Quarterly Forecast Update',
        description: 'Quarterly rolling forecast update process',
        category: 'forecast',
        tags: ['forecast', 'quarterly'],
        steps: [
          {
            id: 's1',
            name: 'Import Actuals',
            type: 'action',
            config: { action: 'import_actuals' },
            order: 0,
          },
          {
            id: 's2',
            name: 'Run Forecast Model',
            type: 'action',
            config: { action: 'run_forecast' },
            order: 1,
            dependsOn: ['s1'],
          },
          {
            id: 's3',
            name: 'Compare to Budget',
            type: 'action',
            config: { action: 'compare_budget' },
            order: 2,
            dependsOn: ['s2'],
          },
          {
            id: 's4',
            name: 'Analyze Variances',
            type: 'action',
            config: { action: 'variance_analysis' },
            order: 3,
            dependsOn: ['s3'],
          },
          {
            id: 's5',
            name: 'Review Forecast',
            type: 'approval',
            config: { approvers: ['fp&a_manager'] },
            order: 4,
            dependsOn: ['s4'],
          },
          {
            id: 's6',
            name: 'Publish Forecast',
            type: 'action',
            config: { action: 'publish' },
            order: 5,
            dependsOn: ['s5'],
          },
        ],
        triggers: [{ type: 'schedule', config: { frequency: 'quarterly' } }],
        variables: [
          {
            name: 'entity',
            type: 'string',
            label: 'Entity',
            description: 'Entity to forecast',
            defaultValue: '',
            required: true,
          },
          {
            name: 'scenario',
            type: 'string',
            label: 'Scenario',
            description: 'Forecast scenario',
            defaultValue: 'base',
            required: true,
          },
        ],
        isBuiltIn: true,
        version: '1.0.0',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'tpl-data-import',
        name: 'Data Import Pipeline',
        description: 'Automated data import with validation',
        category: 'import',
        tags: ['import', 'data', 'etl'],
        steps: [
          {
            id: 's1',
            name: 'Extract Data',
            type: 'action',
            config: { action: 'extract' },
            order: 0,
          },
          {
            id: 's2',
            name: 'Validate Data',
            type: 'action',
            config: { action: 'validate' },
            order: 1,
            dependsOn: ['s1'],
          },
          {
            id: 's3',
            name: 'Transform Data',
            type: 'action',
            config: { action: 'transform' },
            order: 2,
            dependsOn: ['s2'],
          },
          {
            id: 's4',
            name: 'Load Data',
            type: 'action',
            config: { action: 'load' },
            order: 3,
            dependsOn: ['s3'],
          },
          {
            id: 's5',
            name: 'Reconcile',
            type: 'action',
            config: { action: 'reconcile' },
            order: 4,
            dependsOn: ['s4'],
          },
          {
            id: 's6',
            name: 'Notify Success',
            type: 'notification',
            config: { channel: 'email', template: 'import_complete' },
            order: 5,
            dependsOn: ['s5'],
          },
        ],
        triggers: [{ type: 'schedule', config: { frequency: 'daily', hour: 6 } }],
        variables: [
          {
            name: 'source',
            type: 'select',
            label: 'Data Source',
            description: 'Source system',
            defaultValue: 'erp',
            required: true,
            options: ['erp', 'crm', 'hris', 'manual'],
          },
          {
            name: 'filePattern',
            type: 'string',
            label: 'File Pattern',
            description: 'File pattern to match',
            defaultValue: '*.csv',
            required: true,
          },
        ],
        isBuiltIn: true,
        version: '1.0.0',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'tpl-data-validation',
        name: 'Data Validation Suite',
        description: 'Comprehensive data validation workflow',
        category: 'validation',
        tags: ['validation', 'quality'],
        steps: [
          {
            id: 's1',
            name: 'Check Completeness',
            type: 'action',
            config: { action: 'check_completeness' },
            order: 0,
          },
          {
            id: 's2',
            name: 'Check Accuracy',
            type: 'action',
            config: { action: 'check_accuracy' },
            order: 1,
          },
          {
            id: 's3',
            name: 'Check Consistency',
            type: 'action',
            config: { action: 'check_consistency' },
            order: 2,
          },
          {
            id: 's4',
            name: 'Check Balance',
            type: 'action',
            config: { action: 'check_balance' },
            order: 3,
            dependsOn: ['s1', 's2', 's3'],
          },
          {
            id: 's5',
            name: 'Generate Report',
            type: 'action',
            config: { action: 'generate_validation_report' },
            order: 4,
            dependsOn: ['s4'],
          },
          {
            id: 's6',
            name: 'Notify Issues',
            type: 'notification',
            config: { channel: 'email', template: 'validation_issues' },
            order: 5,
            dependsOn: ['s5'],
            condition: 'errors > 0',
          },
        ],
        triggers: [{ type: 'event', config: { event: 'data_import_complete' } }],
        variables: [
          {
            name: 'entity',
            type: 'string',
            label: 'Entity',
            description: 'Entity to validate',
            defaultValue: '',
            required: true,
          },
          {
            name: 'period',
            type: 'string',
            label: 'Period',
            description: 'Period to validate',
            defaultValue: '',
            required: true,
          },
        ],
        isBuiltIn: true,
        version: '1.0.0',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'tpl-report-distribution',
        name: 'Report Distribution',
        description: 'Automated report generation and distribution',
        category: 'report',
        tags: ['report', 'distribution'],
        steps: [
          {
            id: 's1',
            name: 'Generate Reports',
            type: 'action',
            config: { action: 'generate' },
            order: 0,
          },
          {
            id: 's2',
            name: 'Quality Check',
            type: 'action',
            config: { action: 'quality_check' },
            order: 1,
            dependsOn: ['s1'],
          },
          {
            id: 's3',
            name: 'Format Reports',
            type: 'action',
            config: { action: 'format' },
            order: 2,
            dependsOn: ['s2'],
          },
          {
            id: 's4',
            name: 'Distribute via Email',
            type: 'notification',
            config: { channel: 'email', template: 'report_package' },
            order: 3,
            dependsOn: ['s3'],
          },
          {
            id: 's5',
            name: 'Archive Reports',
            type: 'action',
            config: { action: 'archive' },
            order: 4,
            dependsOn: ['s4'],
          },
        ],
        triggers: [{ type: 'schedule', config: { frequency: 'monthly', day: 5 } }],
        variables: [
          {
            name: 'reportType',
            type: 'select',
            label: 'Report Type',
            description: 'Type of report',
            defaultValue: 'board_pack',
            required: true,
            options: ['board_pack', 'management', 'variance', 'kpi'],
          },
          {
            name: 'recipients',
            type: 'string',
            label: 'Recipients',
            description: 'Email recipients',
            defaultValue: '',
            required: true,
          },
        ],
        isBuiltIn: true,
        version: '1.0.0',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'tpl-ic-reconciliation',
        name: 'Intercompany Reconciliation',
        description: 'IC matching and elimination workflow',
        category: 'reconciliation',
        tags: ['intercompany', 'reconciliation', 'consolidation'],
        steps: [
          {
            id: 's1',
            name: 'Extract IC Transactions',
            type: 'action',
            config: { action: 'extract_ic' },
            order: 0,
          },
          {
            id: 's2',
            name: 'Auto-Match',
            type: 'action',
            config: { action: 'auto_match' },
            order: 1,
            dependsOn: ['s1'],
          },
          {
            id: 's3',
            name: 'Review Unmatched',
            type: 'approval',
            config: { approvers: ['controller'] },
            order: 2,
            dependsOn: ['s2'],
          },
          {
            id: 's4',
            name: 'Manual Match',
            type: 'action',
            config: { action: 'manual_match' },
            order: 3,
            dependsOn: ['s3'],
          },
          {
            id: 's5',
            name: 'Generate Eliminations',
            type: 'action',
            config: { action: 'generate_eliminations' },
            order: 4,
            dependsOn: ['s4'],
          },
          {
            id: 's6',
            name: 'Post Eliminations',
            type: 'action',
            config: { action: 'post_eliminations' },
            order: 5,
            dependsOn: ['s5'],
          },
        ],
        triggers: [{ type: 'schedule', config: { frequency: 'monthly', day: 3 } }],
        variables: [
          {
            name: 'period',
            type: 'string',
            label: 'Period',
            description: 'Period to reconcile',
            defaultValue: '',
            required: true,
          },
          {
            name: 'tolerance',
            type: 'number',
            label: 'Tolerance',
            description: 'Amount tolerance',
            defaultValue: 100,
            required: false,
          },
        ],
        isBuiltIn: true,
        version: '1.0.0',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'tpl-budget-collection',
        name: 'Budget Collection',
        description: 'Distribute budget templates and collect submissions',
        category: 'budget',
        tags: ['budget', 'collection', 'planning'],
        steps: [
          {
            id: 's1',
            name: 'Distribute Templates',
            type: 'notification',
            config: { channel: 'email', template: 'budget_template' },
            order: 0,
          },
          {
            id: 's2',
            name: 'Wait for Submissions',
            type: 'delay',
            config: { delayDays: 14 },
            order: 1,
            dependsOn: ['s1'],
          },
          {
            id: 's3',
            name: 'Send Reminders',
            type: 'notification',
            config: { channel: 'email', template: 'budget_reminder' },
            order: 2,
            dependsOn: ['s2'],
          },
          {
            id: 's4',
            name: 'Collect Submissions',
            type: 'action',
            config: { action: 'collect' },
            order: 3,
            dependsOn: ['s3'],
          },
          {
            id: 's5',
            name: 'Consolidate',
            type: 'action',
            config: { action: 'consolidate' },
            order: 4,
            dependsOn: ['s4'],
          },
          {
            id: 's6',
            name: 'Review Consolidated',
            type: 'approval',
            config: { approvers: ['cfo'] },
            order: 5,
            dependsOn: ['s5'],
          },
        ],
        triggers: [{ type: 'manual', config: {} }],
        variables: [
          {
            name: 'fiscalYear',
            type: 'string',
            label: 'Fiscal Year',
            description: 'Budget fiscal year',
            defaultValue: '',
            required: true,
          },
          {
            name: 'departments',
            type: 'string',
            label: 'Departments',
            description: 'Departments to include',
            defaultValue: 'all',
            required: false,
          },
        ],
        isBuiltIn: true,
        version: '1.0.0',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];

    for (const tpl of builtIn) {
      this.templates.set(tpl.id, tpl);
    }
  }

  getTemplate(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id) ?? this.customTemplates.get(id);
  }

  listTemplates(): WorkflowTemplate[] {
    return [...Array.from(this.templates.values()), ...Array.from(this.customTemplates.values())];
  }

  listBuiltInTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  listCustomTemplates(): WorkflowTemplate[] {
    return Array.from(this.customTemplates.values());
  }

  getTemplatesByCategory(category: TemplateCategory): WorkflowTemplate[] {
    return this.listTemplates().filter((t) => t.category === category);
  }

  searchTemplates(query: string): WorkflowTemplate[] {
    const q = query.toLowerCase();
    return this.listTemplates().filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  createCustomTemplate(
    template: Omit<WorkflowTemplate, 'id' | 'isBuiltIn' | 'createdAt'>
  ): WorkflowTemplate {
    const id = 'ctpl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const custom: WorkflowTemplate = {
      ...template,
      id,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
    };
    this.customTemplates.set(id, custom);
    return custom;
  }

  deleteCustomTemplate(id: string): boolean {
    if (this.templates.has(id)) return false;
    return this.customTemplates.delete(id);
  }

  instantiate(
    templateId: string,
    name: string,
    variables: Record<string, unknown> = {}
  ): InstantiatedWorkflow | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    const resolvedVariables: Record<string, unknown> = {};
    for (const v of template.variables) {
      resolvedVariables[v.name] = variables[v.name] ?? v.defaultValue;
    }

    return {
      templateId,
      name,
      steps: template.steps.map((s) => ({ ...s, config: { ...s.config } })),
      variables: resolvedVariables,
      createdAt: new Date().toISOString(),
    };
  }

  validateVariables(
    templateId: string,
    variables: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const template = this.getTemplate(templateId);
    if (!template) return { valid: false, errors: ['Template not found'] };

    const errors: string[] = [];
    for (const v of template.variables) {
      const value = variables[v.name];
      if (v.required && (value === undefined || value === null || value === '')) {
        errors.push(`Variable "${v.label}" is required`);
      }
      if (value !== undefined && v.type === 'number' && typeof value !== 'number') {
        errors.push(`Variable "${v.label}" must be a number`);
      }
      if (
        value !== undefined &&
        v.type === 'select' &&
        v.options &&
        !v.options.includes(String(value))
      ) {
        errors.push(`Variable "${v.label}" must be one of: ${v.options.join(', ')}`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  getTemplateCategories(): TemplateCategory[] {
    const categories = new Set<TemplateCategory>();
    for (const tpl of this.listTemplates()) categories.add(tpl.category);
    return Array.from(categories).sort();
  }

  serialize(): string {
    return JSON.stringify({
      customTemplates: Array.from(this.customTemplates.entries()),
    });
  }

  deserialize(json: string): void {
    const p = JSON.parse(json);
    this.customTemplates = new Map(p.customTemplates ?? []);
  }
}
