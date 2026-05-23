/**
 * API Documentation Generator
 * Auto-generates docs from TypeScript types and JSDoc
 */

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  params?: Record<string, { type: string; required: boolean; description: string }>;
  returns?: { type: string; description: string };
  example?: unknown;
}

interface EngineDoc {
  name: string;
  description: string;
  methods: MethodDoc[];
  properties: PropertyDoc[];
  examples: string[];
}

interface MethodDoc {
  name: string;
  description: string;
  params: Array<{ name: string; type: string; description: string }>;
  returns: { type: string; description: string };
  example?: string;
}

interface PropertyDoc {
  name: string;
  type: string;
  description: string;
  default?: string;
}

export class APIDocumentation {
  private static engines: Map<string, EngineDoc> = new Map();

  /**
   * Register engine documentation
   */
  static registerEngine(doc: EngineDoc): void {
    this.engines.set(doc.name, doc);
  }

  /**
   * Generate markdown documentation for an engine
   */
  static generateEngineDoc(engineName: string): string {
    const doc = this.engines.get(engineName);
    if (!doc) return `# ${engineName}\n\nDocumentation not found.`;

    let md = `# ${engineName}\n\n${doc.description}\n\n`;

    if (doc.properties.length > 0) {
      md += `## Properties\n\n`;
      md += `| Name | Type | Description | Default |\n`;
      md += `|------|------|-------------|---------|\n`;
      for (const prop of doc.properties) {
        md += `| \`${prop.name}\` | \`${prop.type}\` | ${prop.description} | ${prop.default ?? '—'} |\n`;
      }
      md += '\n';
    }

    if (doc.methods.length > 0) {
      md += `## Methods\n\n`;
      for (const method of doc.methods) {
        md += `### \`${method.name}\`\n\n`;
        md += `${method.description}\n\n`;

        if (method.params.length > 0) {
          md += `**Parameters:**\n\n`;
          md += `| Name | Type | Description |\n`;
          md += `|------|------|-------------|\n`;
          for (const param of method.params) {
            md += `| \`${param.name}\` | \`${param.type}\` | ${param.description} |\n`;
          }
          md += '\n';
        }

        md += `**Returns:** \`${method.returns.type}\` — ${method.returns.description}\n\n`;

        if (method.example) {
          md += `**Example:**\n\n\`\`\`typescript\n${method.example}\n\`\`\`\n\n`;
        }
      }
    }

    return md;
  }

  /**
   * Generate API index page
   */
  static generateIndex(): string {
    let md = `# FinPlan Pro API Reference\n\n`;
    md += `> Auto-generated from TypeScript types and JSDoc\n\n`;
    md += `## Engines (${this.engines.size})\n\n`;

    const categories = new Map<string, string[]>();
    for (const [name] of this.engines) {
      const category = name.includes('Financial')
        ? 'Financial'
        : name.includes('Report')
          ? 'Reporting'
          : name.includes('Tax')
            ? 'Tax'
            : name.includes('Budget')
              ? 'Budgeting'
              : name.includes('Forecast')
                ? 'Forecasting'
                : name.includes('Consolid')
                  ? 'Consolidation'
                  : name.includes('FX')
                    ? 'Currency'
                    : name.includes('Compliance')
                      ? 'Compliance'
                      : name.includes('Import') || name.includes('Export')
                        ? 'Data'
                        : 'Other';
      const list = categories.get(category) ?? [];
      list.push(name);
      categories.set(category, list);
    }

    for (const [category, engines] of categories) {
      md += `### ${category}\n\n`;
      for (const engine of engines) {
        md += `- [\`${engine}\`](./engines/${engine}.md)\n`;
      }
      md += '\n';
    }

    return md;
  }

  /**
   * Get all registered engines
   */
  static getEngines(): EngineDoc[] {
    return Array.from(this.engines.values());
  }
}
