// =============================================================================
// REPORT BOOK ENGINE -- Book & Burst reporting, board pack generation
// Generates multi-entity report batches and consolidated PDF board packs.
// Pure TypeScript, deterministic, testable.
// =============================================================================

import type { ExportData, ExportConfig } from './ExportEngine';

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export interface ReportVariable {
  key: string;
  label: string;
  description: string;
  defaultValue: string;
}

export interface ReportBookEntry {
  id: string;
  reportName: string;
  templateId: string;
  entityIds: string[];
  variables: Record<string, string>;
  enabled: boolean;
  order: number;
}

export interface ReportBook {
  id: string;
  name: string;
  description: string;
  entries: ReportBookEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Entity {
  id: string;
  name: string;
  currency: string;
  parentId: string | null;
}

export interface GeneratedReport {
  entryId: string;
  entityId: string;
  entityName: string;
  reportName: string;
  data: ExportData;
  config: ExportConfig;
  generatedAt: string;
}

export interface GenerationProgress {
  total: number;
  completed: number;
  currentEntity: string;
  currentReport: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  errors: string[];
}

export interface BoardPackConfig {
  title: string;
  subtitle?: string;
  template: 'monthly' | 'quarterly' | 'annual';
  companyName: string;
  logoUrl?: string;
  coverDate: string;
  entityName: string;
  includeTableOfContents: boolean;
  includeExecutiveSummary: boolean;
}

export interface BoardPackSection {
  id: string;
  title: string;
  reports: GeneratedReport[];
  pageBreakBefore: boolean;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

// ---------------------------------------------------------------------------
// Variable Substitution
// ---------------------------------------------------------------------------

const AVAILABLE_VARIABLES: ReportVariable[] = [
  { key: 'entity_name', label: 'Entity Name', description: 'Name of the entity', defaultValue: '' },
  {
    key: 'period',
    label: 'Period',
    description: 'Current reporting period',
    defaultValue: 'FY 2026',
  },
  { key: 'currency', label: 'Currency', description: 'Entity currency code', defaultValue: 'USD' },
  { key: 'date', label: 'Date', description: 'Current date', defaultValue: '' },
  { key: 'quarter', label: 'Quarter', description: 'Current quarter', defaultValue: 'Q1' },
  { key: 'year', label: 'Year', description: 'Current fiscal year', defaultValue: '2026' },
  { key: 'company', label: 'Company', description: 'Company name', defaultValue: 'FinPlan Pro' },
];

function substituteVariables(
  template: string,
  variables: Record<string, string>,
  entity?: Entity
): string {
  let result = template;
  const now = new Date();

  const allVars: Record<string, string> = {
    date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    year: String(now.getFullYear()),
    quarter: `Q${Math.ceil((now.getMonth() + 1) / 3)}`,
    ...variables,
  };

  if (entity) {
    allVars.entity_name = entity.name;
    allVars.currency = entity.currency;
  }

  for (const [key, value] of Object.entries(allVars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'gi'), value);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Report Book Engine
// ---------------------------------------------------------------------------

export class ReportBookEngine {
  private books = new Map<string, ReportBook>();
  private reportGenerators = new Map<
    string,
    (entity: Entity, variables: Record<string, string>) => ExportData
  >();

  // --- Registration ---

  registerReportGenerator(
    templateId: string,
    generator: (entity: Entity, variables: Record<string, string>) => ExportData
  ): void {
    this.reportGenerators.set(templateId, generator);
  }

  // --- Book CRUD ---

  createBook(name: string, description: string): ReportBook {
    const id = `book-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const book: ReportBook = {
      id,
      name,
      description,
      entries: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.books.set(id, book);
    return book;
  }

  getBook(id: string): ReportBook | undefined {
    return this.books.get(id);
  }

  listBooks(): ReportBook[] {
    return Array.from(this.books.values());
  }

  deleteBook(id: string): boolean {
    return this.books.delete(id);
  }

  // --- Entry Management ---

  addEntry(bookId: string, entry: Omit<ReportBookEntry, 'id' | 'order'>): ReportBookEntry {
    const book = this.books.get(bookId);
    if (!book) throw new Error(`Book "${bookId}" not found`);

    const id = `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newEntry: ReportBookEntry = {
      ...entry,
      id,
      order: book.entries.length,
    };

    book.entries.push(newEntry);
    book.updatedAt = new Date().toISOString();
    return newEntry;
  }

  updateEntry(bookId: string, entryId: string, updates: Partial<ReportBookEntry>): void {
    const book = this.books.get(bookId);
    if (!book) throw new Error(`Book "${bookId}" not found`);

    const idx = book.entries.findIndex((e) => e.id === entryId);
    if (idx === -1) throw new Error(`Entry "${entryId}" not found`);

    book.entries[idx] = { ...book.entries[idx], ...updates };
    book.updatedAt = new Date().toISOString();
  }

  removeEntry(bookId: string, entryId: string): void {
    const book = this.books.get(bookId);
    if (!book) throw new Error(`Book "${bookId}" not found`);

    book.entries = book.entries.filter((e) => e.id !== entryId);
    book.entries.forEach((e, i) => {
      e.order = i;
    });
    book.updatedAt = new Date().toISOString();
  }

  reorderEntries(bookId: string, entryIds: string[]): void {
    const book = this.books.get(bookId);
    if (!book) throw new Error(`Book "${bookId}" not found`);

    const entryMap = new Map(book.entries.map((e) => [e.id, e]));
    book.entries = entryIds
      .map((id) => entryMap.get(id))
      .filter((e): e is ReportBookEntry => e !== undefined);
    book.entries.forEach((e, i) => {
      e.order = i;
    });
    book.updatedAt = new Date().toISOString();
  }

  // --- Report Generation ---

  async generateReports(
    bookId: string,
    entities: Entity[],
    onProgress?: ProgressCallback
  ): Promise<GeneratedReport[]> {
    const book = this.books.get(bookId);
    if (!book) throw new Error(`Book "${bookId}" not found`);

    const enabledEntries = book.entries.filter((e) => e.enabled);
    const totalJobs = enabledEntries.reduce((sum, entry) => sum + entry.entityIds.length, 0);

    const progress: GenerationProgress = {
      total: totalJobs,
      completed: 0,
      currentEntity: '',
      currentReport: '',
      status: 'running',
      errors: [],
    };

    onProgress?.(progress);

    const results: GeneratedReport[] = [];
    const entityMap = new Map(entities.map((e) => [e.id, e]));

    for (const entry of enabledEntries) {
      const generator = this.reportGenerators.get(entry.templateId);

      for (const entityId of entry.entityIds) {
        const entity = entityMap.get(entityId);
        if (!entity) {
          progress.errors.push(`Entity "${entityId}" not found for report "${entry.reportName}"`);
          progress.completed++;
          onProgress?.(progress);
          continue;
        }

        progress.currentEntity = entity.name;
        progress.currentReport = entry.reportName;
        onProgress?.(progress);

        try {
          const resolvedVars: Record<string, string> = {};
          for (const [key, val] of Object.entries(entry.variables)) {
            resolvedVars[key] = substituteVariables(val, entry.variables, entity);
          }

          let data: ExportData;
          if (generator) {
            data = generator(entity, resolvedVars);
          } else {
            data = this.generateMockData(entry, entity);
          }

          const reportName = substituteVariables(entry.reportName, entry.variables, entity);
          results.push({
            entryId: entry.id,
            entityId: entity.id,
            entityName: entity.name,
            reportName,
            data,
            config: {
              title: reportName,
              companyName: entity.name,
              date: new Date().toLocaleDateString(),
            },
            generatedAt: new Date().toISOString(),
          });
        } catch (err) {
          progress.errors.push(
            `Error generating "${entry.reportName}" for "${entity.name}": ${err instanceof Error ? err.message : String(err)}`
          );
        }

        progress.completed++;
        onProgress?.(progress);
      }
    }

    progress.status = progress.errors.length > 0 ? 'error' : 'complete';
    onProgress?.(progress);

    return results;
  }

  private generateMockData(entry: ReportBookEntry, entity: Entity): ExportData {
    return {
      headers: ['Line Item', 'Actual', 'Budget', 'Variance', 'Var %'],
      rows: [
        [`${entry.reportName} - ${entity.name}`, '', '', '', ''],
        ['Revenue', 1250000, 1200000, 50000, '4.2%'],
        ['Cost of Goods Sold', 750000, 720000, -30000, '-4.2%'],
        ['Gross Profit', 500000, 480000, 20000, '4.2%'],
        ['Operating Expenses', 300000, 310000, 10000, '3.2%'],
        ['EBITDA', 200000, 170000, 30000, '17.6%'],
      ],
      footers: [`Generated ${new Date().toLocaleDateString()} | ${entity.currency}`],
    };
  }

  // --- Serialization ---

  serialize(): string {
    return JSON.stringify(
      {
        books: Array.from(this.books.entries()),
      },
      null,
      2
    );
  }

  static deserialize(json: string): ReportBookEngine {
    const parsed = JSON.parse(json) as {
      books?: [string, ReportBook][];
    };

    const engine = new ReportBookEngine();
    if (Array.isArray(parsed.books)) {
      for (const [id, book] of parsed.books) {
        engine.books.set(id, book);
      }
    }
    return engine;
  }

  // --- Available Variables ---

  getAvailableVariables(): ReportVariable[] {
    return AVAILABLE_VARIABLES;
  }
}

// ---------------------------------------------------------------------------
// Board Pack Generator
// ---------------------------------------------------------------------------

export class BoardPackGenerator {
  private engine: ReportBookEngine;

  constructor(engine: ReportBookEngine) {
    this.engine = engine;
  }

  async generateBoardPack(
    bookId: string,
    entities: Entity[],
    _config: BoardPackConfig,
    onProgress?: ProgressCallback
  ): Promise<{ pdfData: GeneratedReport[]; sections: BoardPackSection[] }> {
    const reports = await this.engine.generateReports(bookId, entities, onProgress);

    const sections: BoardPackSection[] = [];
    const sectionMap = new Map<string, GeneratedReport[]>();

    for (const report of reports) {
      const key = report.entryId;
      if (!sectionMap.has(key)) {
        sectionMap.set(key, []);
      }
      sectionMap.get(key)!.push(report);
    }

    let isFirst = true;
    for (const [entryId, sectionReports] of sectionMap) {
      sections.push({
        id: entryId,
        title: sectionReports[0]?.reportName ?? 'Untitled',
        reports: sectionReports,
        pageBreakBefore: !isFirst,
      });
      isFirst = false;
    }

    return { pdfData: reports, sections };
  }

  buildCoverPage(config: BoardPackConfig): ExportData {
    const rows: unknown[][] = [
      ['', '', ''],
      ['', config.companyName, ''],
      ['', '', ''],
      [config.title, '', ''],
      [config.subtitle ?? '', '', ''],
      ['', '', ''],
      [`Period: ${config.coverDate}`, '', ''],
      [`Entity: ${config.entityName}`, '', ''],
      [`Template: ${config.template}`, '', ''],
      ['', '', ''],
      [`Generated: ${new Date().toLocaleDateString()}`, '', ''],
    ];

    return {
      headers: ['', '', ''],
      rows,
    };
  }

  buildTableOfContents(sections: BoardPackSection[]): ExportData {
    const rows: unknown[][] = sections.map((section, i) => [
      `${i + 1}`,
      section.title,
      `${section.reports.length} report(s)`,
    ]);

    return {
      headers: ['#', 'Section', 'Contents'],
      rows,
    };
  }

  buildExecutiveSummary(reports: GeneratedReport[]): ExportData {
    const entityNames = [...new Set(reports.map((r) => r.entityName))];
    const reportNames = [...new Set(reports.map((r) => r.reportName))];

    return {
      headers: ['Metric', 'Value'],
      rows: [
        ['Total Reports Generated', String(reports.length)],
        ['Entities Covered', entityNames.join(', ')],
        ['Report Types', reportNames.join(', ')],
        ['Generation Date', new Date().toLocaleDateString()],
      ],
    };
  }
}

// ---------------------------------------------------------------------------
// Report Template Presets
// ---------------------------------------------------------------------------

export const REPORT_TEMPLATE_PRESETS = {
  profitLoss: {
    id: 'preset-pl',
    name: 'Profit & Loss',
    description: 'Income statement with revenue, COGS, gross profit, OpEx, and EBITDA',
    headers: ['Line Item', 'Actual', 'Budget', 'Variance', 'Var %'],
    defaultVariables: { period: 'FY 2026' },
  },
  balanceSheet: {
    id: 'preset-bs',
    name: 'Balance Sheet',
    description: 'Assets, liabilities, and equity snapshot',
    headers: ['Line Item', 'Current Period', 'Prior Period', 'Change', 'Change %'],
    defaultVariables: { period: 'FY 2026' },
  },
  cashFlow: {
    id: 'preset-cf',
    name: 'Cash Flow Statement',
    description: 'Operating, investing, and financing cash flows',
    headers: ['Line Item', 'Actual', 'Budget', 'Variance'],
    defaultVariables: { period: 'FY 2026' },
  },
  budgetVsActual: {
    id: 'preset-bva',
    name: 'Budget vs Actual',
    description: 'Detailed variance analysis with favorable/unfavorable indicators',
    headers: ['Account', 'Actual', 'Budget', 'Variance $', 'Variance %', 'Status'],
    defaultVariables: { period: 'FY 2026' },
  },
  kpiDashboard: {
    id: 'preset-kpi',
    name: 'KPI Dashboard',
    description: 'Key performance indicators with targets and trends',
    headers: ['KPI', 'Current', 'Target', 'Prior Year', 'Trend'],
    defaultVariables: { period: 'FY 2026' },
  },
  headcount: {
    id: 'preset-hc',
    name: 'Headcount Report',
    description: 'Workforce planning with department breakdown',
    headers: ['Department', 'Current HC', 'Budget HC', 'Variance', 'Cost'],
    defaultVariables: { period: 'FY 2026' },
  },
  cashForecast: {
    id: 'preset-cash',
    name: 'Cash Forecast',
    description: '13-week cash flow forecast with inflows and outflows',
    headers: ['Category', 'Week 1', 'Week 2', 'Week 3', 'Week 4'],
    defaultVariables: { period: 'FY 2026' },
  },
} as const;
