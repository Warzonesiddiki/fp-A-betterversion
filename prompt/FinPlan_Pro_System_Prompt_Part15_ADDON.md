# FINPLAN PRO — AI FLEET SYSTEM PROMPT
## Part 15 of 15 (ADDON): Plugin Architecture & Extensibility System
## Version 5.0.0 | Generated 2026-05-18

---

## 0. WHY THIS PART EXISTS

FinPlan Pro must be extensible WITHOUT modifying core code. Anaplan has an
App Hub but it's locked to their cloud. Our plugins work OFFLINE, can be
shared via USB/email, and don't require internet or vendor approval.

This is a COMPETITIVE MOAT: consultants build industry plugins, enterprises
build ERP connectors, power users share templates. The ecosystem locks users in.

---

## 1. PLUGIN SYSTEM OVERVIEW

### 1.1 Why Plugins Matter

  USERS want: Custom calculations, industry formulas, personal workflows
  CONSULTANTS want: Industry-specific extensions they can sell/give to clients
  ENTERPRISES want: ERP connectors (SAP, Oracle, NetSuite), custom reports
  COMMUNITY wants: Share templates, formula packs, dashboard designs

### 1.2 Plugin Types

  1. FORMULA PLUGINS    — Custom formula functions (=XIRR_ADV, =DEBT_SCHEDULE)
  2. REPORT PLUGINS     — Custom report templates (board packs, investor decks)
  3. IMPORT PLUGINS     — Custom data connectors (SAP extract, QuickBooks, Xero)
  4. EXPORT PLUGINS     — Custom export formats (XBRL, iXBRL, custom PDF layouts)
  5. DASHBOARD PLUGINS  — Custom widgets/charts (heatmaps, waterfall, Sankey)
  6. WORKFLOW PLUGINS   — Custom automation rules (auto-approve, notifications)
  7. INDUSTRY PLUGINS   — Sector-specific features (SaaS metrics, REIT analysis)
  8. THEME PLUGINS      — Custom visual themes and color palettes

### 1.3 Design Principles

  OFFLINE-FIRST: Plugins install and work without internet
  SANDBOXED: Plugins cannot crash the app or corrupt data
  DECLARATIVE: Plugins declare what they need, user approves
  COMPOSABLE: Plugins can depend on other plugins
  VERSIONED: Plugins specify compatible FinPlan versions

---

## 2. PLUGIN MANIFEST FORMAT

### 2.1 manifest.json Schema

```json
{
  "id": "com.author.plugin-name",
  "name": "Plugin Display Name",
  "version": "1.0.0",
  "description": "One-line description of what this plugin does",
  "author": "Author Name <email@example.com>",
  "license": "MIT",
  "type": "formula",
  "entry": "index.ts",
  "icon": "icon.png",
  "permissions": ["read-data", "write-data"],
  "minFinPlanVersion": "1.0.0",
  "maxFinPlanVersion": "2.0.0",
  "dependencies": [],
  "conflicts": [],
  "tags": ["finance", "irr", "valuation"],
  "homepage": "https://github.com/author/plugin-name",
  "repository": "https://github.com/author/plugin-name"
}
```

### 2.2 Plugin ID Convention

  Format: reverse-domain.author.plugin-name
  Examples:
    com.mckindric.irr-advanced
    org.fpa-community.saas-metrics
    com.acme-corp.sap-connector
    io.finplan.industry-banking

### 2.3 Version SemVer Rules

  MAJOR: Breaking changes to plugin API (users must re-validate)
  MINOR: New features, backward compatible
  PATCH: Bug fixes only

### 2.4 Permission Declarations

  read-data         — Read cell values, dimensions, scenarios
  write-data        — Write cell values (modifies model)
  read-settings     — Read app settings and preferences
  network           — Make HTTP requests (must declare domains)
  file-system       — Read/write local files (must declare paths)
  notifications     — Show system notifications
  clipboard         — Read/write clipboard
  storage           — Persistent plugin storage (up to 10MB)

---

## 3. PLUGIN API

### 3.1 Core API Surface

```typescript
// @finplan/plugin-api — Public API for plugin developers

interface PluginAPI {
  // FORMULA ENGINE
  formula: {
    registerFunction(name: string, spec: FormulaSpec): void;
    unregisterFunction(name: string): void;
    listFunctions(): FormulaSpec[];
  };

  // REPORT ENGINE
  reports: {
    registerTemplate(template: ReportTemplate): void;
    unregisterTemplate(id: string): void;
    generate(templateId: string, data: ModelData): Promise<Blob>;
  };

  // IMPORT ENGINE
  import: {
    registerConnector(connector: ImportConnector): void;
    parse(filePath: string, connectorId: string): Promise<ImportResult>;
  };

  // EXPORT ENGINE
  export: {
    registerFormat(format: ExportFormat): void;
    export(data: ModelData, formatId: string): Promise<Blob>;
  };

  // DASHBOARD ENGINE
  dashboards: {
    registerWidget(widget: DashboardWidget): void;
    unregisterWidget(id: string): void;
  };

  // WORKFLOW ENGINE
  workflows: {
    registerRule(rule: WorkflowRule): void;
    unregisterRule(id: string): void;
  };

  // DATA ACCESS
  data: {
    readCells(range: CellRange): Promise<CellValue[][]>;
    writeCells(range: CellRange, values: CellValue[][]): Promise<void>;
    readDimensions(): Promise<Dimension[]>;
    readScenarios(): Promise<Scenario[]>;
    readModel(): Promise<ModelSnapshot>;
  };

  // EVENTS
  events: {
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
    emit(event: string, data: any): void;
  };

  // STORAGE (persistent, per-plugin)
  storage: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
  };

  // UI
  ui: {
    showNotification(message: string, type: 'info' | 'warn' | 'error'): void;
    showDialog(options: DialogOptions): Promise<DialogResult>;
    registerMenuItem(menu: string, item: MenuItem): void;
    registerToolbarButton(button: ToolbarButton): void;
  };

  // LOGGING
  log: {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
  };
}
```

### 3.2 What Plugins CAN Access

  READ: Cell values, dimensions, scenarios, model structure
  WRITE: Cell values (if write-data permission granted)
  REGISTER: Custom functions, templates, widgets, connectors
  LISTEN: Cell change, save, load, calculation complete, export complete
  STORE: Up to 10MB persistent data per plugin
  NOTIFY: System notifications (if notification permission)
  UI: Menu items, toolbar buttons, dialogs

### 3.3 What Plugins CANNOT Access

  BLOCKED: Other plugins' storage (isolation)
  BLOCKED: Core engine internals (FormulaEngine, CubeEngine source)
  BLOCKED: Other users' data (multi-tenant isolation)
  BLOCKED: Raw file system paths (sandboxed)
  BLOCKED: Arbitrary network requests (must declare domains)
  BLOCKED: eval(), new Function(), dynamic import (security)
  BLOCKED: process, require, child_process (Node.js APIs)
  BLOCKED: Direct DOM manipulation (render through Plugin UI API)

---

## 4. PLUGIN LIFECYCLE

### 4.1 Lifecycle Phases

```
  1. DISCOVERY
     └─ Scan plugin directories:
        - App plugins: ~/.finplan/plugins/
        - User plugins: ~/Documents/FinPlan/plugins/
        - Dev plugins: ./plugins/ (development mode)
     └─ Read each manifest.json
     └─ Build plugin registry

  2. VALIDATION
     └─ Check manifest schema (valid JSON, required fields)
     └─ Check version compatibility (minFinPlanVersion <= current)
     └─ Check dependencies (all required plugins present)
     └─ Check conflicts (no conflicting plugins installed)
     └─ Check permissions (user has approved all declared permissions)
     └─ If any check fails → skip plugin, log warning

  3. LOADING
     └─ Import plugin module (dynamic import)
     └─ Verify default export implements Plugin interface
     └─ If load fails → skip plugin, log error

  4. INITIALIZATION
     └─ Call plugin.init(api)
     └─ Plugin registers its functions, templates, widgets
     └─ If init throws → skip plugin, log error

  5. RUNTIME
     └─ Plugin responds to events
     └─ Plugin's registered functions available in formula bar
     └─ Plugin's templates available in report generator
     └─ Plugin's widgets available in dashboard builder

  6. CLEANUP
     └─ Call plugin.destroy()
     └─ Unregister all functions, templates, widgets
     └─ Remove event listeners
     └─ Clear plugin storage (if uninstalling)
```

### 4.2 Hot Reload (Development Mode)

```
  In development mode (NODE_ENV=development):
    - Watch plugin directory for changes
    - On file change:
      1. Call plugin.destroy()
      2. Re-import module
      3. Call plugin.init(api)
    - Preserves plugin storage across reloads
    - Shows reload notification in dev console
```

---

## 5. FORMULA PLUGIN EXAMPLE

### 5.1 Advanced IRR Plugin

```typescript
// plugins/custom-irr/index.ts
import type { FormulaPlugin, PluginAPI } from '@finplan/plugin-api';

export default class CustomIRRPlugin implements FormulaPlugin {
  id = 'com.custom.irr-advanced';
  name = 'Advanced IRR';
  version = '1.0.0';

  private api!: PluginAPI;

  init(api: PluginAPI): void {
    this.api = api;

    api.formula.registerFunction('XIRR_ADV', {
      description: 'Extended IRR with multiple guess support and convergence control',
      category: 'Financial',
      parameters: [
        {
          name: 'values',
          type: 'number[]',
          description: 'Cash flow values (negative = outflow, positive = inflow)',
          required: true
        },
        {
          name: 'dates',
          type: 'date[]',
          description: 'Corresponding dates for each cash flow',
          required: true
        },
        {
          name: 'guess',
          type: 'number',
          description: 'Initial guess for IRR (default: 0.1 = 10%)',
          required: false,
          default: 0.1
        },
        {
          name: 'maxIterations',
          type: 'number',
          description: 'Maximum Newton-Raphson iterations (default: 100)',
          required: false,
          default: 100
        },
        {
          name: 'tolerance',
          type: 'number',
          description: 'Convergence tolerance (default: 1e-10)',
          required: false,
          default: 1e-10
        }
      ],
      returnType: 'number',
      execute: (values: number[], dates: Date[], guess: number,
                maxIterations: number, tolerance: number): number => {
        return this.calculateXIRR(values, dates, guess, maxIterations, tolerance);
      }
    });

    api.formula.registerFunction('MIRR_ADV', {
      description: 'Modified IRR with explicit reinvestment and finance rates',
      category: 'Financial',
      parameters: [
        { name: 'values', type: 'number[]', required: true },
        { name: 'financeRate', type: 'number', required: true },
        { name: 'reinvestRate', type: 'number', required: true }
      ],
      returnType: 'number',
      execute: (values: number[], financeRate: number,
                reinvestRate: number): number => {
        return this.calculateMIRR(values, financeRate, reinvestRate);
      }
    });

    api.log.info('Advanced IRR plugin loaded — XIRR_ADV, MIRR_ADV registered');
  }

  destroy(): void {
    this.api.formula.unregisterFunction('XIRR_ADV');
    this.api.formula.unregisterFunction('MIRR_ADV');
    this.api.log.info('Advanced IRR plugin unloaded');
  }

  private calculateXIRR(values: number[], dates: Date[], guess: number,
                        maxIterations: number, tolerance: number): number {
    // Newton-Raphson method
    let rate = guess;
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;
      const d0 = dates[0].getTime();

      for (let j = 0; j < values.length; j++) {
        const years = (dates[j].getTime() - d0) / (365.25 * 24 * 60 * 60 * 1000);
        const factor = Math.pow(1 + rate, years);
        npv += values[j] / factor;
        dnpv -= years * values[j] / (factor * (1 + rate));
      }

      const newRate = rate - npv / dnpv;
      if (Math.abs(newRate - rate) < tolerance) return newRate;
      rate = newRate;
    }

    this.api.log.warn('XIRR_ADV: did not converge after ' + maxIterations + ' iterations');
    return rate;
  }

  private calculateMIRR(values: number[], financeRate: number,
                        reinvestRate: number): number {
    let negPV = 0;
    let posFV = 0;
    const n = values.length;

    for (let i = 0; i < n; i++) {
      if (values[i] < 0) {
        negPV += values[i] / Math.pow(1 + financeRate, i);
      } else {
        posFV += values[i] * Math.pow(1 + reinvestRate, n - 1 - i);
      }
    }

    return Math.pow(-posFV / negPV, 1 / (n - 1)) - 1;
  }
}
```

### 5.2 Debt Schedule Plugin

```typescript
// plugins/debt-schedule/index.ts
import type { FormulaPlugin, PluginAPI } from '@finplan/plugin-api';

export default class DebtSchedulePlugin implements FormulaPlugin {
  id = 'com.custom.debt-schedule';
  name = 'Debt Schedule Functions';

  init(api: PluginAPI): void {

    api.formula.registerFunction('PMT_SCHEDULE', {
      description: 'Generate full amortization schedule as array',
      category: 'Debt',
      parameters: [
        { name: 'principal', type: 'number', required: true },
        { name: 'annualRate', type: 'number', required: true },
        { name: 'years', type: 'number', required: true },
        { name: 'paymentsPerYear', type: 'number', required: false, default: 12 }
      ],
      returnType: 'number[][]',
      execute: (principal: number, annualRate: number, years: number,
                ppy: number = 12): number[][] => {
        const n = years * ppy;
        const r = annualRate / ppy;
        const pmt = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const schedule: number[][] = [];
        let balance = principal;

        for (let i = 1; i <= n; i++) {
          const interest = balance * r;
          const principalPay = pmt - interest;
          balance -= principalPay;
          schedule.push([i, pmt, principalPay, interest, Math.max(0, balance)]);
        }
        return schedule;
      }
    });

    api.formula.registerFunction('DEBT_SERVICE_COVERAGE', {
      description: 'DSCR = Net Operating Income / Total Debt Service',
      category: 'Debt',
      parameters: [
        { name: 'noi', type: 'number', required: true },
        { name: 'totalDebtService', type: 'number', required: true }
      ],
      returnType: 'number',
      execute: (noi: number, totalDebtService: number): number => {
        if (totalDebtService === 0) return Infinity;
        return noi / totalDebtService;
      }
    });
  }

  destroy(): void {
    // Unregister functions
  }
}
```

---

## 6. REPORT PLUGIN EXAMPLE

### 6.1 Custom Board Pack Plugin

```typescript
// plugins/board-pack-pro/index.ts
import type { ReportPlugin, PluginAPI, ReportTemplate } from '@finplan/plugin-api';

export default class BoardPackPlugin implements ReportPlugin {
  id = 'com.custom.board-pack-pro';
  name = 'Professional Board Pack';

  init(api: PluginAPI): void {
    api.reports.registerTemplate({
      id: 'board-pack-pro',
      name: 'Board Pack (Professional)',
      description: 'Investor-grade board report with KPIs, P&L, BS, CF, variance',
      icon: '📊',
      sections: [
        {
          type: 'cover-page',
          title: 'Quarterly Board Pack',
          subtitle: '{{companyName}} — {{period}}',
          logo: true,
          date: true
        },
        {
          type: 'executive-summary',
          title: 'Executive Summary',
          metrics: ['revenue', 'grossMargin', 'ebitda', 'netIncome', 'fcf'],
          highlights: 5,
          risks: 3
        },
        {
          type: 'kpi-dashboard',
          title: 'Key Performance Indicators',
          layout: 'grid',
          kpis: [
            { name: 'Revenue', format: 'currency', showTrend: true },
            { name: 'Gross Margin', format: 'percent', showTrend: true },
            { name: 'EBITDA', format: 'currency', showTrend: true },
            { name: 'Headcount', format: 'integer', showTrend: false },
            { name: 'Revenue/Employee', format: 'currency', showTrend: true },
            { name: 'Burn Rate', format: 'currency', showTrend: true }
          ]
        },
        {
          type: 'pnl',
          title: 'Income Statement',
          periods: ['actual', 'budget', 'variance', 'variance%'],
          groupBy: ['revenue', 'cogs', 'opex', 'other'],
          showEBITDA: true,
          showNetIncome: true
        },
        {
          type: 'balance-sheet',
          title: 'Balance Sheet',
          periods: ['current', 'prior'],
          groupBy: ['assets', 'liabilities', 'equity']
        },
        {
          type: 'cash-flow',
          title: 'Cash Flow Statement',
          periods: ['actual', 'budget'],
          groupBy: ['operating', 'investing', 'financing']
        },
        {
          type: 'variance-analysis',
          title: 'Variance Analysis',
          threshold: 0.1,
          showChart: true,
          topN: 10
        },
        {
          type: 'scenario-comparison',
          title: 'Scenario Analysis',
          scenarios: ['base', 'upside', 'downside'],
          metrics: ['revenue', 'ebitda', 'fcf']
        },
        {
          type: 'appendix',
          title: 'Detailed Schedules',
          include: ['debt-schedule', 'capex-schedule', 'headcount-schedule']
        }
      ],
      options: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, bottom: 20, left: 25, right: 25 },
        headerText: '{{companyName}} — Confidential',
        footerText: 'Page {{page}} of {{total}}',
        branding: true
      }
    });

    api.ui.registerMenuItem('reports', {
      id: 'board-pack-pro',
      label: 'Board Pack (Pro)',
      icon: '📊',
      shortcut: 'Ctrl+Shift+B'
    });

    api.log.info('Board Pack Pro plugin loaded');
  }

  destroy(): void {
    this.api.reports.unregisterTemplate('board-pack-pro');
  }
}
```

---

## 7. IMPORT/EXPORT PLUGIN EXAMPLE

### 7.1 SAP Connector Plugin

```typescript
// plugins/sap-connector/index.ts
import type { ImportPlugin, ExportPlugin, PluginAPI } from '@finplan/plugin-api';

export default class SAPConnectorPlugin implements ImportPlugin, ExportPlugin {
  id = 'com.custom.sap-connector';
  name = 'SAP Data Connector';

  init(api: PluginAPI): void {

    // IMPORT: Read SAP extract files
    api.import.registerConnector({
      id: 'sap-extract',
      name: 'SAP Extract (.txt)',
      description: 'Import data from SAP GL extract files',
      extensions: ['.txt', '.csv'],
      detect: (header: string) => {
        // SAP extracts have specific column patterns
        return header.includes('BUKRS') && header.includes('HKONT');
      },
      parse: async (content: string) => {
        const lines = content.split('\n');
        const headers = lines[0].split('\t');
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split('\t');
          if (cols.length >= 4) {
            rows.push({
              entity: cols[headers.indexOf('BUKRS')],
              account: cols[headers.indexOf('HKONT')],
              period: cols[headers.indexOf('MONAT')],
              amount: parseFloat(cols[headers.indexOf('DMBTR')]) || 0,
              currency: cols[headers.indexOf('WAERS')] || 'EUR'
            });
          }
        }

        return {
          headers: ['Entity', 'Account', 'Period', 'Amount', 'Currency'],
          rows: rows.map(r => [r.entity, r.account, r.period, r.amount, r.currency]),
          metadata: { source: 'SAP', recordCount: rows.length }
        };
      }
    });

    // EXPORT: Generate SAP-compatible import file
    api.export.registerFormat({
      id: 'sap-import',
      name: 'SAP Import Format (.txt)',
      description: 'Export data in SAP-compatible format for re-import',
      extension: '.txt',
      generate: async (data) => {
        const headers = ['BUKRS', 'HKONT', 'MONAT', 'DMBTR', 'WAERS'];
        const lines = [headers.join('\t')];

        for (const row of data.rows) {
          lines.push(row.join('\t'));
        }

        return new Blob([lines.join('\n')], { type: 'text/plain' });
      }
    });
  }

  destroy(): void {
    // Unregister
  }
}
```

### 7.2 QuickBooks Connector Plugin

```typescript
// plugins/quickbooks-connector/index.ts
import type { ImportPlugin, PluginAPI } from '@finplan/plugin-api';

export default class QuickBooksPlugin implements ImportPlugin {
  id = 'com.custom.quickbooks';
  name = 'QuickBooks Data Connector';

  init(api: PluginAPI): void {
    api.import.registerConnector({
      id: 'quickbooks-iif',
      name: 'QuickBooks IIF (.iif)',
      description: 'Import QuickBooks IIF export files',
      extensions: ['.iif'],
      detect: (header: string) => header.includes('!TRNS'),
      parse: async (content: string) => {
        // Parse IIF format
        const lines = content.split('\n');
        const rows = [];
        let inTransaction = false;

        for (const line of lines) {
          if (line.startsWith('!TRNS')) {
            inTransaction = true;
            continue;
          }
          if (line.startsWith('!ENDTRNS')) {
            inTransaction = false;
            continue;
          }
          if (inTransaction && line.trim()) {
            const cols = line.split('\t');
            rows.push(cols);
          }
        }

        return {
          headers: ['Date', 'Account', 'Name', 'Amount', 'Memo'],
          rows,
          metadata: { source: 'QuickBooks', recordCount: rows.length }
        };
      }
    });
  }

  destroy(): void {}
}
```

---

## 8. DASHBOARD PLUGIN EXAMPLE

### 8.1 Waterfall Chart Plugin

```typescript
// plugins/waterfall-chart/index.ts
import type { DashboardPlugin, PluginAPI } from '@finplan/plugin-api';

export default class WaterfallChartPlugin implements DashboardPlugin {
  id = 'com.custom.waterfall-chart';
  name = 'Waterfall Chart Widget';

  init(api: PluginAPI): void {
    api.dashboards.registerWidget({
      id: 'waterfall-chart',
      name: 'Waterfall Chart',
      description: 'Shows cumulative effect of sequential positive/negative values',
      icon: '📊',
      category: 'Charts',
      defaultSize: { width: 6, height: 4 },
      config: {
        dataSource: { type: 'range', label: 'Data Range' },
        startLabel: { type: 'string', label: 'Start Label', default: 'Beginning' },
        endLabel: { type: 'string', label: 'End Label', default: 'Ending' },
        positiveColor: { type: 'color', label: 'Positive Color', default: '#16A34A' },
        negativeColor: { type: 'color', label: 'Negative Color', default: '#DC2626' },
        totalColor: { type: 'color', label: 'Total Color', default: '#2563EB' },
        showValues: { type: 'boolean', label: 'Show Values', default: true },
        showConnectors: { type: 'boolean', label: 'Show Connectors', default: true }
      },
      render: (container, data, config) => {
        // Render waterfall chart using canvas or SVG
        // This is a simplified example
        const { dataSource, positiveColor, negativeColor, totalColor } = config;
        const values = data.getRange(dataSource);

        let cumulative = 0;
        const bars = values.map((v, i) => {
          const start = cumulative;
          cumulative += v;
          return {
            label: v.label,
            value: v.value,
            start,
            end: cumulative,
            color: v.value >= 0 ? positiveColor : negativeColor
          };
        });

        // Add total bar
        bars.push({
          label: config.endLabel || 'Total',
          value: cumulative,
          start: 0,
          end: cumulative,
          color: totalColor
        });

        // Render bars using SVG
        return this.renderSVG(container, bars, config);
      }
    });

    api.log.info('Waterfall Chart plugin loaded');
  }

  destroy(): void {
    this.api.dashboards.unregisterWidget('waterfall-chart');
  }

  private renderSVG(container: HTMLElement, bars: any[], config: any): void {
    // SVG rendering implementation
  }
}
```

---

## 9. WORKFLOW PLUGIN EXAMPLE

### 9.1 Auto-Approval Rules Plugin

```typescript
// plugins/auto-approve/index.ts
import type { WorkflowPlugin, PluginAPI } from '@finplan/plugin-api';

export default class AutoApprovePlugin implements WorkflowPlugin {
  id = 'com.custom.auto-approve';
  name = 'Budget Auto-Approval Rules';

  init(api: PluginAPI): void {
    api.workflows.registerRule({
      id: 'auto-approve-minor-variance',
      name: 'Auto-Approve Minor Variance',
      description: 'Automatically approve budgets with <5% total variance',
      trigger: 'budget-submitted',
      conditions: [
        {
          type: 'variance-check',
          metric: 'total-expense',
          operator: 'less-than',
          threshold: 0.05
        },
        {
          type: 'variance-check',
          metric: 'total-revenue',
          operator: 'less-than',
          threshold: 0.05
        }
      ],
      actions: [
        {
          type: 'approve-budget',
          reason: 'Auto-approved: variance within 5% threshold'
        },
        {
          type: 'notify',
          recipients: ['submitter'],
          message: 'Budget auto-approved (variance < 5%)'
        }
      ]
    });

    api.workflows.registerRule({
      id: 'flag-large-variance',
      name: 'Flag Large Variance',
      description: 'Flag budgets with >20% variance for senior review',
      trigger: 'budget-submitted',
      conditions: [
        {
          type: 'variance-check',
          metric: 'total-expense',
          operator: 'greater-than',
          threshold: 0.20
        }
      ],
      actions: [
        {
          type: 'assign-reviewer',
          role: 'cfo'
        },
        {
          type: 'notify',
          recipients: ['cfo', 'submitter'],
          message: 'Budget flagged: >20% variance requires CFO review'
        }
      ]
    });

    api.log.info('Auto-Approval Rules plugin loaded — 2 rules registered');
  }

  destroy(): void {}
}
```

---

## 10. INDUSTRY PLUGIN EXAMPLE

### 10.1 SaaS Metrics Plugin

```typescript
// plugins/saas-metrics/index.ts
import type { IndustryPlugin, PluginAPI } from '@finplan/plugin-api';

export default class SaaSMetricsPlugin implements IndustryPlugin {
  id = 'com.fpa-community.saas-metrics';
  name = 'SaaS Metrics Pack';
  industry = 'technology';

  init(api: PluginAPI): void {

    // Register SaaS-specific formula functions
    api.formula.registerFunction('ARR', {
      description: 'Annual Recurring Revenue = MRR × 12',
      category: 'SaaS',
      parameters: [{ name: 'mrr', type: 'number', required: true }],
      returnType: 'number',
      execute: (mrr: number) => mrr * 12
    });

    api.formula.registerFunction('MRR_CHURN', {
      description: 'MRR Churn Rate = Churned MRR / Starting MRR',
      category: 'SaaS',
      parameters: [
        { name: 'churnedMRR', type: 'number', required: true },
        { name: 'startingMRR', type: 'number', required: true }
      ],
      returnType: 'number',
      execute: (churnedMRR: number, startingMRR: number) => {
        if (startingMRR === 0) return 0;
        return churnedMRR / startingMRR;
      }
    });

    api.formula.registerFunction('LTV', {
      description: 'Customer Lifetime Value = ARPU / Churn Rate',
      category: 'SaaS',
      parameters: [
        { name: 'arpu', type: 'number', required: true },
        { name: 'churnRate', type: 'number', required: true }
      ],
      returnType: 'number',
      execute: (arpu: number, churnRate: number) => {
        if (churnRate === 0) return Infinity;
        return arpu / churnRate;
      }
    });

    api.formula.registerFunction('CAC_PAYBACK', {
      description: 'CAC Payback Period = CAC / (ARPU × Gross Margin)',
      category: 'SaaS',
      parameters: [
        { name: 'cac', type: 'number', required: true },
        { name: 'arpu', type: 'number', required: true },
        { name: 'grossMargin', type: 'number', required: true }
      ],
      returnType: 'number',
      execute: (cac: number, arpu: number, grossMargin: number) => {
        const denominator = arpu * grossMargin;
        if (denominator === 0) return Infinity;
        return cac / denominator;
      }
    });

    api.formula.registerFunction('RULE_OF_40', {
      description: 'Rule of 40 = Revenue Growth % + EBITDA Margin %',
      category: 'SaaS',
      parameters: [
        { name: 'revenueGrowth', type: 'number', required: true },
        { name: 'ebitdaMargin', type: 'number', required: true }
      ],
      returnType: 'number',
      execute: (revenueGrowth: number, ebitdaMargin: number) => {
        return revenueGrowth + ebitdaMargin;
      }
    });

    api.formula.registerFunction('NET_DOLLAR_RETENTION', {
      description: 'NDR = (Starting MRR + Expansion - Contraction - Churn) / Starting MRR',
      category: 'SaaS',
      parameters: [
        { name: 'startingMRR', type: 'number', required: true },
        { name: 'expansionMRR', type: 'number', required: true },
        { name: 'contractionMRR', type: 'number', required: true },
        { name: 'churnedMRR', type: 'number', required: true }
      ],
      returnType: 'number',
      execute: (start: number, expansion: number,
                contraction: number, churn: number) => {
        if (start === 0) return 0;
        return (start + expansion - contraction - churn) / start;
      }
    });

    // Register SaaS dashboard template
    api.dashboards.registerWidget({
      id: 'saas-kpi-dashboard',
      name: 'SaaS KPI Dashboard',
      description: 'ARR, MRR, churn, LTV, CAC, NDR overview',
      icon: '☁️',
      category: 'SaaS',
      defaultSize: { width: 12, height: 6 },
      config: {},
      render: (container, data, config) => {
        // Render SaaS KPI cards
      }
    });

    // Register SaaS report template
    api.reports.registerTemplate({
      id: 'saas-monthly',
      name: 'SaaS Monthly Report',
      description: 'Monthly SaaS metrics report with trends',
      icon: '☁️',
      sections: [
        { type: 'kpi-dashboard', widget: 'saas-kpi-dashboard' },
        { type: 'trend-chart', metrics: ['arr', 'mrr', 'ndr'] },
        { type: 'cohort-analysis' },
        { type: 'unit-economics' }
      ]
    });

    api.log.info('SaaS Metrics plugin loaded — 6 formulas, 1 dashboard, 1 report');
  }

  destroy(): void {
    ['ARR', 'MRR_CHURN', 'LTV', 'CAC_PAYBACK', 'RULE_OF_40',
     'NET_DOLLAR_RETENTION'].forEach(f =>
      this.api.formula.unregisterFunction(f));
  }
}
```

---

## 11. PLUGIN DISTRIBUTION

### 11.1 Local Installation

  METHOD 1: Drop folder
    Copy plugin folder to:
      Windows: %APPDATA%/FinPlan/plugins/
      macOS: ~/Library/Application Support/FinPlan/plugins/
      Linux: ~/.local/share/finplan/plugins/

  METHOD 2: Install dialog
    File → Plugins → Install Plugin → Select .finplan-plugin file
    → Shows manifest preview → User approves permissions → Installs

  METHOD 3: Drag and drop
    Drag .finplan-plugin file onto FinPlan Pro window
    → Shows manifest preview → User approves permissions → Installs

### 11.2 Plugin Package Format (.finplan-plugin)

  A .finplan-plugin file is a ZIP archive containing:
    manifest.json         — Plugin manifest
    index.ts              — Main entry point (compiled to JS)
    icon.png              — Plugin icon (64x64)
    README.md             — Plugin documentation
    CHANGELOG.md          — Version history
    dist/                 — Compiled JavaScript
    assets/               — Static assets (images, templates)
    tests/                — Plugin tests

### 11.3 Plugin Marketplace (Future Phase)

  FEATURES:
    Browse plugins within FinPlan Pro
    One-click install
    Ratings and reviews (1-5 stars)
    Verified publisher badges
    Category browsing (formulas, reports, industries)
    Search by keyword
    Version history
    Compatibility checking

  PUBLISHING:
    Create publisher account
    Submit plugin for review
    Automatic security scan
    Manual review (24-48 hours)
    Approval → listed in marketplace

### 11.4 Sharing Plugins (Offline)

  OPTIONS:
    Email: Send .finplan-plugin file as attachment
    USB: Copy to USB drive, install on target machine
    File server: Place on shared network drive
    Git: Host on GitHub/GitLab, download as ZIP

  NO INTERNET REQUIRED for any installation method.

---

## 12. PLUGIN SECURITY

### 12.1 Sandboxing

  ISOLATION LEVELS:
    Level 1 (Default): Plugin runs in Web Worker (no DOM, no network)
    Level 2 (Trusted): Plugin runs in main thread (has DOM, limited network)
    Level 3 (Full): Plugin has full access (requires admin approval)

  DEFAULT: Level 1 (Web Worker sandbox)
    - No direct DOM access
    - No direct file system access
    - Network through proxy only (declared domains)
    - Memory limit: 100MB
    - CPU time limit: 100ms per function call

### 12.2 Permission System

  PERMISSION APPROVAL FLOW:
    1. Plugin declares permissions in manifest
    2. On install, show permission request dialog
    3. User can approve/deny each permission individually
    4. Denied permissions → plugin features disabled
    5. Permissions can be changed later in Settings → Plugins

  PERMISSION CATEGORIES:
    DATA:
      read-data       — Read cell values, dimensions (always required)
      write-data      — Modify cell values (DANGEROUS — requires explicit approval)
      read-settings   — Read app settings

    NETWORK:
      network         — Make HTTP requests (must declare allowed domains)
      websocket       — Open WebSocket connections (must declare hosts)

    FILE SYSTEM:
      read-files      — Read local files (must declare allowed paths)
      write-files     — Write local files (must declare allowed paths)

    UI:
      notifications   — Show system notifications
      clipboard       — Read/write clipboard
      menus           — Add menu items
      dialogs         — Show modal dialogs

    STORAGE:
      storage         — Persistent plugin storage (up to 10MB)

### 12.3 Code Signing

  UNSIGNED PLUGINS:
    Show warning: "This plugin is not signed. Install at your own risk."
    User must click "Install Anyway" to proceed

  SIGNED PLUGINS:
    Publisher creates RSA-2048 key pair
    Plugin package signed with private key
    FinPlan Pro verifies signature with public key
    Show badge: "✓ Verified Publisher"

  VERIFICATION PROCESS:
    1. Check signature is valid
    2. Check certificate chain
    3. Check certificate not revoked
    4. Show publisher name from certificate

### 12.4 Automatic Security Scan

  ON INSTALL:
    1. Scan for eval(), new Function() → BLOCK
    2. Scan for require('child_process') → BLOCK
    3. Scan for process.env access → BLOCK
    4. Scan for fs.readFile/writeFile without permission → WARN
    5. Check for known vulnerable dependencies → WARN
    6. Verify manifest matches actual code → WARN if mismatch

---

## 13. PLUGIN DEVELOPMENT GUIDE

### 13.1 Getting Started

```bash
# Create plugin folder
mkdir plugins/my-plugin
cd plugins/my-plugin

# Create manifest
cat > manifest.json << 'EOF'
{
  "id": "com.myname.my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "My custom plugin",
  "author": "My Name",
  "type": "formula",
  "entry": "index.ts",
  "permissions": ["read-data"]
}
EOF

# Create entry point
cat > index.ts << 'EOF'
import type { FormulaPlugin, PluginAPI } from '@finplan/plugin-api';

export default class MyPlugin implements FormulaPlugin {
  id = 'com.myname.my-plugin';
  name = 'My Plugin';

  init(api: PluginAPI): void {
    api.formula.registerFunction('DOUBLE', {
      description: 'Doubles a number',
      category: 'Custom',
      parameters: [
        { name: 'value', type: 'number', required: true }
      ],
      returnType: 'number',
      execute: (value: number) => value * 2
    });

    api.log.info('My Plugin loaded — DOUBLE function registered');
  }

  destroy(): void {
    this.api.formula.unregisterFunction('DOUBLE');
  }
}
EOF
```

### 13.2 Testing Plugins

```bash
# Start FinPlan Pro in dev mode
npm run dev -- --plugin-dev

# Plugin hot-reloads on file change
# Check console for plugin logs
# Test functions in formula bar: =DOUBLE(5) → 10
```

### 13.3 Packaging Plugins

```bash
# Package plugin as .finplan-plugin
npx @finplan/plugin-cli package ./plugins/my-plugin

# Creates: my-plugin-1.0.0.finplan-plugin
# This is a ZIP with manifest, compiled JS, assets
```

### 13.4 Plugin API Type Definitions

```typescript
// @finplan/plugin-api/types.ts

interface FormulaSpec {
  description: string;
  category: string;
  parameters: ParameterSpec[];
  returnType: string;
  execute: (...args: any[]) => any;
}

interface ParameterSpec {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'date' | 'number[]' | 'string[]';
  description?: string;
  required: boolean;
  default?: any;
}

interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sections: ReportSection[];
  options?: ReportOptions;
}

interface DashboardWidget {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category: string;
  defaultSize: { width: number; height: number };
  config: Record<string, ConfigField>;
  render: (container: HTMLElement, data: DataAPI, config: any) => void;
}

interface ImportConnector {
  id: string;
  name: string;
  description?: string;
  extensions: string[];
  detect: (header: string) => boolean;
  parse: (content: string) => Promise<ImportResult>;
}

interface ExportFormat {
  id: string;
  name: string;
  description?: string;
  extension: string;
  generate: (data: ModelData) => Promise<Blob>;
}

interface WorkflowRule {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  conditions: Condition[];
  actions: Action[];
}
```

---

## 14. PLUGIN STORAGE & STATE

### 14.1 Per-Plugin Storage

  Each plugin gets isolated storage (up to 10MB):
    api.storage.get<T>(key: string): Promise<T | null>
    api.storage.set<T>(key: string, value: T): Promise<void>
    api.storage.delete(key: string): Promise<void>
    api.storage.clear(): Promise<void>
    api.storage.keys(): Promise<string[]>

  Storage persists across app restarts.
  Storage is cleared on plugin uninstall.
  Storage is NOT shared between plugins.

### 14.2 Plugin State Machine

```
  INSTALLED → VALIDATED → LOADED → ACTIVE → SUSPENDED → UNLOADED → UNINSTALLED

  TRANSITIONS:
    INSTALL    → VALIDATED (automatic after install)
    VALIDATE   → LOADED (if all checks pass)
    LOAD       → ACTIVE (if init succeeds)
    ACTIVATE   → SUSPENDED (if user disables)
    SUSPEND    → ACTIVE (if user re-enables)
    DEACTIVATE → UNLOADED (on app shutdown)
    UNLOAD     → LOADED (on next app start)
    UNINSTALL  → UNINSTALLED (storage cleared)
```

---

## 15. COMPETITIVE ADVANTAGE

### Why This Plugin System Wins:

  vs. Anaplan App Hub:
    Anaplan: Cloud-only, requires vendor approval, expensive
    FinPlan: Offline, instant install, free marketplace

  vs. Planful Marketplace:
    Planful: Limited customization, vendor-controlled
    FinPlan: Full API access, community-driven

  vs. Excel Add-ins:
    Excel: Complex deployment, security concerns
    FinPlan: Sandboxed, signed, one-click install

  vs. Google Sheets Add-ons:
    Google: Requires internet, limited offline
    FinPlan: Fully offline, works without any connection

### Lock-in Mechanics:

  1. Users build custom formulas → can't easily switch
  2. Consultants build client-specific plugins → recurring revenue
  3. Enterprises build ERP connectors → integration lock-in
  4. Community shares templates → ecosystem lock-in
  5. Industry packs become standard → switching cost increases

---

*Version 5.0.0 — Part 15 of 15*
