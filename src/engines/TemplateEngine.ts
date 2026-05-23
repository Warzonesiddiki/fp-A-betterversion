/**
 * TemplateEngine — manages budget/forecast/report templates.
 *
 * Competitors (22/25) have pre-built templates for fast onboarding.
 * This engine provides load, instantiate, customize, list, export, import.
 */

export type TemplateCategory = 'budget' | 'forecast' | 'report' | 'dashboard';
export type TemplateIndustry =
  | 'technology'
  | 'manufacturing'
  | 'retail'
  | 'banking'
  | 'healthcare'
  | 'energy'
  | 'real-estate'
  | 'construction'
  | 'insurance'
  | 'education'
  | 'agriculture'
  | 'government'
  | 'nonprofit'
  | 'hospitality'
  | 'transportation'
  | 'generic';

export interface TemplateColumn {
  key: string;
  label: string;
  type: 'number' | 'text' | 'formula' | 'date' | 'currency' | 'percentage';
  formula?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: string;
}

export interface TemplateRow {
  id: string;
  label: string;
  level: number; // 0 = top, 1 = child, 2 = grandchild
  parentId?: string;
  isTotal?: boolean;
  isEditable?: boolean;
  defaultValues?: Record<string, number | string>;
}

export interface TemplateKPI {
  id: string;
  label: string;
  formula: string;
  format: 'currency' | 'percentage' | 'number' | 'compact';
  target?: number;
  higherIsBetter?: boolean;
}

export interface TemplateChart {
  type:
    | 'bar'
    | 'line'
    | 'pie'
    | 'area'
    | 'waterfall'
    | 'variance'
    | 'sparkline'
    | 'treemap'
    | 'heatmap'
    | 'gauge';
  title: string;
  dataKey: string;
  xAxisKey?: string;
  yAxisKey?: string;
  colors?: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  industry: TemplateIndustry;
  columns: TemplateColumn[];
  rows: TemplateRow[];
  kpis: TemplateKPI[];
  charts: TemplateChart[];
  version: number;
  createdAt: string;
  updatedAt: string;
  author?: string;
  tags?: string[];
}

export interface TemplateInstance {
  templateId: string;
  instanceId: string;
  data: Record<string, Record<string, number | string>>;
  customizations: Partial<Template>;
  createdAt: string;
}

export class TemplateEngine {
  /**
   * Load a template by ID from the registry.
   */
  static loadTemplate(templates: Template[], id: string): Template | undefined {
    return templates.find((t) => t.id === id);
  }

  /**
   * List templates, optionally filtered by category.
   */
  static listTemplates(templates: Template[], category?: TemplateCategory): Template[] {
    if (!category) return templates;
    return templates.filter((t) => t.category === category);
  }

  /**
   * List templates by industry.
   */
  static listByIndustry(templates: Template[], industry: TemplateIndustry): Template[] {
    return templates.filter((t) => t.industry === industry || t.industry === 'generic');
  }

  /**
   * Instantiate a template with data.
   */
  static instantiateTemplate(
    template: Template,
    data?: Record<string, Record<string, number | string>>
  ): TemplateInstance {
    const instanceData: Record<string, Record<string, number | string>> = {};

    // Initialize with default values from template rows
    for (const row of template.rows) {
      instanceData[row.id] = { ...row.defaultValues } as Record<string, number | string>;
      // Initialize all columns
      for (const col of template.columns) {
        if (instanceData[row.id][col.key] === undefined) {
          instanceData[row.id][col.key] =
            col.type === 'number' || col.type === 'currency' || col.type === 'percentage' ? 0 : '';
        }
      }
    }

    // Merge provided data
    if (data) {
      for (const [rowId, rowValues] of Object.entries(data)) {
        instanceData[rowId] = { ...instanceData[rowId], ...rowValues };
      }
    }

    return {
      templateId: template.id,
      instanceId: `inst-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      data: instanceData,
      customizations: {},
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Customize a template (add/remove rows, change columns, etc.).
   */
  static customizeTemplate(
    template: Template,
    changes: Partial<
      Pick<Template, 'columns' | 'rows' | 'kpis' | 'charts' | 'name' | 'description'>
    >
  ): Template {
    return {
      ...template,
      ...changes,
      updatedAt: new Date().toISOString(),
      version: template.version + 1,
    };
  }

  /**
   * Export template to JSON string.
   */
  static exportTemplate(template: Template): string {
    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template from JSON string.
   */
  static importTemplate(json: string): Template | { error: string } {
    try {
      const parsed = JSON.parse(json);
      if (!parsed.id || !parsed.name || !parsed.category) {
        return { error: 'Invalid template: missing required fields (id, name, category)' };
      }
      if (!Array.isArray(parsed.columns) || !Array.isArray(parsed.rows)) {
        return { error: 'Invalid template: columns and rows must be arrays' };
      }
      return parsed as Template;
    } catch {
      return { error: 'Invalid JSON' };
    }
  }

  /**
   * Calculate a formula cell value.
   */
  static calculateFormula(
    formula: string,
    data: Record<string, Record<string, number | string>>,
    rowId: string
  ): number {
    // Simple formula evaluation: SUM, percentage, difference
    const upper = formula.toUpperCase().trim();

    if (upper.startsWith('SUM(')) {
      const ref = upper.slice(4, -1);
      if (ref.includes(':')) {
        // Range sum: SUM(A1:A10)
        return 0; // simplified
      }
      // Column sum
      let total = 0;
      for (const row of Object.values(data)) {
        const val = row[ref.toLowerCase()] ?? row[ref] ?? 0;
        if (typeof val === 'number') total += val;
      }
      return total;
    }

    if (upper === 'TOTAL') {
      // Sum all numeric values in this row
      const row = data[rowId] ?? {};
      let total = 0;
      for (const val of Object.values(row)) {
        if (typeof val === 'number') total += val;
      }
      return total;
    }

    if (upper.startsWith('%')) {
      // Percentage of total: %revenue
      const ref = upper.slice(1);
      const row = data[rowId] ?? {};
      const value = typeof row[ref] === 'number' ? (row[ref] as number) : 0;
      let total = 0;
      for (const r of Object.values(data)) {
        const v = r[ref];
        if (typeof v === 'number') total += v;
      }
      return total === 0 ? 0 : (value / total) * 100;
    }

    return 0;
  }

  /**
   * Evaluate all formulas in a template instance.
   */
  static evaluateFormulas(
    template: Template,
    instance: TemplateInstance
  ): Record<string, Record<string, number | string>> {
    const result = { ...instance.data };

    for (const col of template.columns) {
      if (col.formula) {
        for (const row of template.rows) {
          if (result[row.id]) {
            result[row.id][col.key] = this.calculateFormula(col.formula, result, row.id);
          }
        }
      }
    }

    return result;
  }
}
