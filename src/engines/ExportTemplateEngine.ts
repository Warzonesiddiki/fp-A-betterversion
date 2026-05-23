// =============================================================================
// EXPORT TEMPLATE ENGINE — Professional PDF/Excel export with templates
// Handles variable substitution, page layout, bookmarks, headers/footers
// =============================================================================

export type TemplateType =
  | 'board_pack'
  | 'pl_statement'
  | 'balance_sheet'
  | 'cash_flow'
  | 'budget_vs_actual'
  | 'kpi_summary';

export interface TemplateVariable {
  key: string;
  label: string;
  defaultValue: string;
}

export interface TemplateSection {
  id: string;
  type: 'cover' | 'kpi_summary' | 'table' | 'chart' | 'text' | 'page_break';
  title: string;
  order: number;
  config: Record<string, unknown>;
}

export interface TemplateStyle {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerFontSize: number;
  bodyFontSize: number;
  logoUrl?: string;
  companyName: string;
}

export interface ExportTemplate {
  id: string;
  name: string;
  type: TemplateType;
  description: string;
  sections: TemplateSection[];
  style: TemplateStyle;
  variables: TemplateVariable[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportContext {
  entity: string;
  period: string;
  currency: string;
  date: string;
  preparedBy: string;
  data: Record<string, unknown>;
}

interface JsPDFDoc {
  internal: {
    pageSize: { width: number; height: number };
    getCurrentPageInfo(): { pageNumber: number };
  };
  setFontSize(size: number): void;
  setTextColor(r: number, g?: number, b?: number): void;
  setDrawColor(r: number, g?: number, b?: number): void;
  setFillColor(r: number, g?: number, b?: number): void;
  setFont(font: string, style?: string): void;
  text(text: string, x: number, y: number, options?: { align?: string }): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  rect(x: number, y: number, w: number, h: number, style?: string): void;
  addPage(): void;
  save(filename: string): void;
  autoTable(options: Record<string, unknown>): void;
  previousAutoTable?: { finalY: number };
  outline?: {
    add: { bold: () => { add: (title: string, options: { pageNumber: number }) => void } };
  };
  setProperties?: (props: Record<string, unknown>) => void;
  addImage?(
    imageData: string,
    format: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): void;
  splitTextToSize?(text: string, maxWidth: number): string[];
}

const DEFAULT_STYLE: TemplateStyle = {
  primaryColor: '#1E3A5F',
  secondaryColor: '#4A90D9',
  fontFamily: 'helvetica',
  headerFontSize: 10,
  bodyFontSize: 8,
  companyName: 'FinPlan Pro',
};

const DEFAULT_VARIABLES: TemplateVariable[] = [
  { key: 'entity', label: 'Entity', defaultValue: 'Company Name' },
  { key: 'period', label: 'Period', defaultValue: 'FY 2026' },
  { key: 'currency', label: 'Currency', defaultValue: 'USD' },
  { key: 'date', label: 'Date', defaultValue: new Date().toLocaleDateString() },
  { key: 'preparedBy', label: 'Prepared By', defaultValue: 'Finance Team' },
];

function substituteVars(text: string, ctx: ExportContext): string {
  return text
    .replace(/\{entity\}/g, ctx.entity)
    .replace(/\{period\}/g, ctx.period)
    .replace(/\{currency\}/g, ctx.currency)
    .replace(/\{date\}/g, ctx.date)
    .replace(/\{preparedBy\}/g, ctx.preparedBy);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export class ExportTemplateEngine {
  private templates = new Map<string, ExportTemplate>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.register(this.createBoardPackTemplate());
    this.register(this.createPLTemplate());
    this.register(this.createBalanceSheetTemplate());
    this.register(this.createCashFlowTemplate());
    this.register(this.createBVATemplate());
    this.register(this.createKPITemplate());
  }

  // --- Registration ---

  register(template: ExportTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): ExportTemplate | undefined {
    return this.templates.get(id);
  }

  listTemplates(): ExportTemplate[] {
    return Array.from(this.templates.values());
  }

  // --- PDF Generation ---

  generatePDF(templateId: string, ctx: ExportContext): void {
    const doc = (window as unknown as { jsPDF: new (o: Record<string, unknown>) => JsPDFDoc })
      .jsPDF;
    if (!doc) return;

    const tpl = this.templates.get(templateId);
    if (!tpl) return;

    const pdf = new doc({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const style = tpl.style;
    const [pr, pg, pb] = hexToRgb(style.primaryColor);
    const pageW = pdf.internal.pageSize.width;
    const margin = 14;

    const addHeader = () => {
      if (style.logoUrl && pdf.addImage) {
        try {
          pdf.addImage(style.logoUrl, 'PNG', margin, 5, 12, 12);
        } catch {
          // Logo rendering failed, continue without it
        }
      }
      const textX = style.logoUrl ? margin + 15 : margin;
      pdf.setFontSize(style.headerFontSize);
      pdf.setTextColor(pr, pg, pb);
      pdf.setFont(style.fontFamily, 'bold');
      pdf.text(substituteVars(style.companyName, ctx), textX, 10);
      pdf.setFont(style.fontFamily, 'normal');
      pdf.text(substituteVars(tpl.name, ctx), pageW - margin, 10, { align: 'right' });
      pdf.setDrawColor(pr, pg, pb);
      pdf.line(margin, 13, pageW - margin, 13);
    };

    const addFooter = (pageNum: number) => {
      pdf.setFontSize(7);
      pdf.setTextColor(150);
      pdf.text(`${ctx.entity} — ${ctx.period}`, margin, 290);
      pdf.text(`Page ${pageNum}`, pageW - margin, 290, { align: 'right' });
      pdf.text('Generated by FinPlan Pro', pageW / 2, 290, { align: 'center' });
    };

    let y = 20;
    const sorted = [...tpl.sections].sort((a, b) => a.order - b.order);

    // Generate Table of Contents for board packs
    if (tpl.type === 'board_pack') {
      const tocSections = sorted.filter((s) => s.type !== 'page_break' && s.title);
      pdf.setFontSize(16);
      pdf.setTextColor(pr, pg, pb);
      pdf.setFont(style.fontFamily, 'bold');
      pdf.text('Table of Contents', margin, y);
      y += 10;
      pdf.setDrawColor(pr, pg, pb);
      pdf.line(margin, y, pageW - margin, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.setFont(style.fontFamily, 'normal');
      for (let i = 0; i < tocSections.length; i++) {
        pdf.setTextColor(60);
        pdf.text(`${i + 1}. ${substituteVars(tocSections[i].title, ctx)}`, margin + 4, y);
        pdf.setTextColor(150);
        pdf.text(`...${i + 2}`, pageW - margin, y, { align: 'right' });
        y += 7;
      }
      pdf.addPage();
      y = 20;
      addHeader();
    }

    for (const section of sorted) {
      if (section.type === 'cover') {
        y = this.renderCoverPage(pdf, section, ctx, style, pageW);
        addHeader();
        addFooter(1);
        continue;
      }

      if (section.type === 'page_break') {
        pdf.addPage();
        y = 20;
        addHeader();
        continue;
      }

      if (y > 250) {
        pdf.addPage();
        y = 20;
        addHeader();
      }

      y = this.renderSection(pdf, section, ctx, style, margin, pageW, y);
    }

    pdf.save(`${tpl.name.replace(/\s+/g, '_')}_${ctx.period}.pdf`);
  }

  private renderCoverPage(
    pdf: JsPDFDoc,
    section: TemplateSection,
    ctx: ExportContext,
    style: TemplateStyle,
    pageW: number
  ): number {
    const [pr, pg, pb] = hexToRgb(style.primaryColor);
    const centerX = pageW / 2;

    pdf.setFillColor(pr, pg, pb);
    pdf.rect(0, 0, pageW, 100, 'F');

    if (style.logoUrl && pdf.addImage) {
      try {
        pdf.addImage(style.logoUrl, 'PNG', centerX - 15, 15, 30, 30);
      } catch {
        // Logo rendering failed, continue without it
      }
    }

    pdf.setFontSize(28);
    pdf.setTextColor(255);
    pdf.setFont(style.fontFamily, 'bold');
    pdf.text(substituteVars(String(section.config.title || ctx.entity), ctx), centerX, 50, {
      align: 'center',
    });

    pdf.setFontSize(16);
    pdf.setFont(style.fontFamily, 'normal');
    pdf.text(substituteVars(String(section.config.subtitle || 'Board Pack'), ctx), centerX, 65, {
      align: 'center',
    });

    pdf.setFontSize(12);
    pdf.text(ctx.period, centerX, 80, { align: 'center' });

    pdf.setTextColor(100);
    pdf.setFontSize(10);
    pdf.text(`Prepared by: ${ctx.preparedBy}`, centerX, 130, { align: 'center' });
    pdf.text(`Date: ${ctx.date}`, centerX, 140, { align: 'center' });

    if (section.config.confidential) {
      pdf.setFontSize(8);
      pdf.setTextColor(180);
      pdf.text('CONFIDENTIAL — For Internal Use Only', centerX, 280, { align: 'center' });
    }

    return 160;
  }

  private renderSection(
    pdf: JsPDFDoc,
    section: TemplateSection,
    ctx: ExportContext,
    style: TemplateStyle,
    margin: number,
    pageW: number,
    startY: number
  ): number {
    const [pr] = hexToRgb(style.primaryColor);
    let y = startY;

    pdf.setFontSize(14);
    pdf.setTextColor(pr);
    pdf.setFont(style.fontFamily, 'bold');
    pdf.text(substituteVars(section.title, ctx), margin, y);
    y += 3;
    pdf.setDrawColor(200);
    pdf.line(margin, y, pageW - margin, y);
    y += 8;

    if (section.type === 'kpi_summary') {
      y = this.renderKPISummary(pdf, section, ctx, style, margin, y);
    } else if (section.type === 'table') {
      y = this.renderTable(pdf, section, ctx, style, margin, y);
    } else if (section.type === 'text') {
      y = this.renderText(pdf, section, ctx, margin, y);
    }

    return y + 5;
  }

  private renderKPISummary(
    pdf: JsPDFDoc,
    section: TemplateSection,
    _ctx: ExportContext,
    style: TemplateStyle,
    margin: number,
    startY: number
  ): number {
    const kpis =
      (section.config.kpis as Array<{ label: string; value: string; change?: string }>) || [];
    const colW = (pdf.internal.pageSize.width - margin * 2) / Math.min(kpis.length, 4);
    let y = startY;

    for (let i = 0; i < kpis.length; i++) {
      const kpi = kpis[i];
      const x = margin + (i % 4) * colW;

      if (i > 0 && i % 4 === 0) y += 35;

      pdf.setFillColor(245, 245, 245);
      pdf.rect(x, y, colW - 4, 30, 'F');

      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.setFont(style.fontFamily, 'normal');
      pdf.text(kpi.label, x + 4, y + 8);

      pdf.setFontSize(14);
      pdf.setTextColor(0);
      pdf.setFont(style.fontFamily, 'bold');
      pdf.text(kpi.value, x + 4, y + 20);

      if (kpi.change) {
        pdf.setFontSize(8);
        const isPositive = kpi.change.startsWith('+');
        pdf.setTextColor(isPositive ? 22 : 220, isPositive ? 160 : 38, isPositive ? 90 : 38);
        pdf.text(kpi.change, x + 4, y + 27);
      }
    }

    return y + 35;
  }

  private renderTable(
    pdf: JsPDFDoc,
    section: TemplateSection,
    ctx: ExportContext,
    style: TemplateStyle,
    margin: number,
    startY: number
  ): number {
    const headers = (section.config.headers as string[]) || [];
    const rows = (section.config.rows as string[][]) || [];
    const [pr, pg, pb] = hexToRgb(style.primaryColor);

    const resolvedHeaders = headers.map((h) => substituteVars(h, ctx));
    const resolvedRows = rows.map((r) => r.map((c) => substituteVars(c, ctx)));

    pdf.autoTable({
      head: [resolvedHeaders],
      body: resolvedRows,
      startY,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [pr, pg, pb],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: style.bodyFontSize,
      },
      styles: { fontSize: style.bodyFontSize, cellPadding: 2 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      didParseCell: (data: { column: { index: number }; cell: { styles: { halign: string } } }) => {
        if (data.column.index > 0) data.cell.styles.halign = 'right';
      },
    });

    return pdf.previousAutoTable?.finalY ?? startY + 20;
  }

  private renderText(
    pdf: JsPDFDoc,
    section: TemplateSection,
    ctx: ExportContext,
    margin: number,
    startY: number
  ): number {
    const content = substituteVars(String(section.config.content || ''), ctx);
    pdf.setFontSize(9);
    pdf.setTextColor(60);
    pdf.setFont('helvetica', 'normal');

    const lines = pdf.splitTextToSize?.(content, pdf.internal.pageSize.width - margin * 2) ?? [
      content,
    ];
    let y = startY;
    for (const line of lines) {
      pdf.text(line, margin, y);
      y += 5;
    }
    return y;
  }

  // --- Built-in Templates ---

  private createBoardPackTemplate(): ExportTemplate {
    return {
      id: 'tpl-board-pack',
      name: 'Monthly Board Pack',
      type: 'board_pack',
      description:
        'Executive board pack with cover page, KPIs, financial statements, and variance analysis',
      sections: [
        {
          id: 'cover',
          type: 'cover',
          title: '{entity}',
          order: 0,
          config: { title: '{entity}', subtitle: '{period} Board Pack', confidential: true },
        },
        {
          id: 'exec',
          type: 'kpi_summary',
          title: 'Executive Summary',
          order: 1,
          config: {
            kpis: [
              { label: 'Total Revenue', value: '$12.4M', change: '+8.2%' },
              { label: 'Net Income', value: '$2.1M', change: '+12.5%' },
              { label: 'EBITDA Margin', value: '24.3%', change: '+1.8pp' },
              { label: 'Cash Position', value: '$8.7M', change: '-3.1%' },
            ],
          },
        },
        {
          id: 'pl',
          type: 'table',
          title: 'Income Statement',
          order: 2,
          config: { headers: ['Line Item', 'Actual', 'Budget', 'Variance', 'Var %'], rows: [] },
        },
        { id: 'pb1', type: 'page_break', title: '', order: 3, config: {} },
        {
          id: 'bs',
          type: 'table',
          title: 'Balance Sheet',
          order: 4,
          config: { headers: ['Account', 'Current', 'Prior', 'Change'], rows: [] },
        },
        {
          id: 'cf',
          type: 'table',
          title: 'Cash Flow Statement',
          order: 5,
          config: { headers: ['Category', 'Q1', 'Q2', 'Q3', 'Q4', 'FY'], rows: [] },
        },
        { id: 'pb2', type: 'page_break', title: '', order: 6, config: {} },
        {
          id: 'var',
          type: 'table',
          title: 'Variance Analysis',
          order: 7,
          config: { headers: ['Item', 'Actual', 'Budget', 'Variance', 'Driver'], rows: [] },
        },
      ],
      style: { ...DEFAULT_STYLE },
      variables: [...DEFAULT_VARIABLES],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
  }

  private createPLTemplate(): ExportTemplate {
    return {
      id: 'tpl-pl',
      name: 'Profit & Loss Statement',
      type: 'pl_statement',
      description: 'Income statement with comparative periods and variance columns',
      sections: [
        {
          id: 'header',
          type: 'text',
          title: 'Income Statement',
          order: 0,
          config: { content: '{entity} — {period} — {currency}' },
        },
        {
          id: 'table',
          type: 'table',
          title: '',
          order: 1,
          config: {
            headers: ['Line Item', 'Actual', 'Budget', 'Prior Year', 'Var vs Budget', 'Var vs PY'],
            rows: [
              ['Revenue', '', '', '', '', ''],
              ['  Product Revenue', '', '', '', '', ''],
              ['  Service Revenue', '', '', '', '', ''],
              ['Cost of Goods Sold', '', '', '', '', ''],
              ['Gross Profit', '', '', '', '', ''],
              ['Operating Expenses', '', '', '', '', ''],
              ['  Sales & Marketing', '', '', '', '', ''],
              ['  Research & Development', '', '', '', '', ''],
              ['  General & Administrative', '', '', '', '', ''],
              ['Total OpEx', '', '', '', '', ''],
              ['EBITDA', '', '', '', '', ''],
              ['Depreciation & Amortization', '', '', '', '', ''],
              ['Operating Income', '', '', '', '', ''],
              ['Interest Income / (Expense)', '', '', '', '', ''],
              ['Pre-Tax Income', '', '', '', '', ''],
              ['Income Tax', '', '', '', '', ''],
              ['Net Income', '', '', '', '', ''],
            ],
          },
        },
      ],
      style: { ...DEFAULT_STYLE },
      variables: [...DEFAULT_VARIABLES],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
  }

  private createBalanceSheetTemplate(): ExportTemplate {
    return {
      id: 'tpl-bs',
      name: 'Balance Sheet',
      type: 'balance_sheet',
      description: 'Balance sheet with comparative periods',
      sections: [
        {
          id: 'header',
          type: 'text',
          title: 'Balance Sheet',
          order: 0,
          config: { content: '{entity} — {period} — {currency}' },
        },
        {
          id: 'table',
          type: 'table',
          title: '',
          order: 1,
          config: {
            headers: ['Account', 'Current Period', 'Prior Period', 'Change', '% Change'],
            rows: [
              ['ASSETS', '', '', '', ''],
              ['Current Assets', '', '', '', ''],
              ['  Cash & Equivalents', '', '', '', ''],
              ['  Accounts Receivable', '', '', '', ''],
              ['  Inventory', '', '', '', ''],
              ['  Prepaid Expenses', '', '', '', ''],
              ['Total Current Assets', '', '', '', ''],
              ['Non-Current Assets', '', '', '', ''],
              ['  Property, Plant & Equipment', '', '', '', ''],
              ['  Goodwill', '', '', '', ''],
              ['  Intangible Assets', '', '', '', ''],
              ['Total Non-Current Assets', '', '', '', ''],
              ['TOTAL ASSETS', '', '', '', ''],
              ['', '', '', '', ''],
              ['LIABILITIES', '', '', '', ''],
              ['Current Liabilities', '', '', '', ''],
              ['  Accounts Payable', '', '', '', ''],
              ['  Accrued Expenses', '', '', '', ''],
              ['  Short-Term Debt', '', '', '', ''],
              ['Total Current Liabilities', '', '', '', ''],
              ['Non-Current Liabilities', '', '', '', ''],
              ['  Long-Term Debt', '', '', '', ''],
              ['  Deferred Tax Liabilities', '', '', '', ''],
              ['Total Non-Current Liabilities', '', '', '', ''],
              ['TOTAL LIABILITIES', '', '', '', ''],
              ['', '', '', '', ''],
              ['EQUITY', '', '', '', ''],
              ['  Common Stock', '', '', '', ''],
              ['  Retained Earnings', '', '', '', ''],
              ['  Other Comprehensive Income', '', '', '', ''],
              ['TOTAL EQUITY', '', '', '', ''],
              ['TOTAL LIABILITIES & EQUITY', '', '', '', ''],
            ],
          },
        },
      ],
      style: { ...DEFAULT_STYLE },
      variables: [...DEFAULT_VARIABLES],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
  }

  private createCashFlowTemplate(): ExportTemplate {
    return {
      id: 'tpl-cf',
      name: 'Cash Flow Statement',
      type: 'cash_flow',
      description: 'Cash flow statement with operating, investing, and financing activities',
      sections: [
        {
          id: 'header',
          type: 'text',
          title: 'Cash Flow Statement',
          order: 0,
          config: { content: '{entity} — {period} — {currency}' },
        },
        {
          id: 'table',
          type: 'table',
          title: '',
          order: 1,
          config: {
            headers: ['Category', 'Q1', 'Q2', 'Q3', 'Q4', 'FY'],
            rows: [
              ['OPERATING ACTIVITIES', '', '', '', '', ''],
              ['Net Income', '', '', '', '', ''],
              ['Depreciation & Amortization', '', '', '', '', ''],
              ['Stock-Based Compensation', '', '', '', '', ''],
              ['Changes in Working Capital', '', '', '', '', ''],
              ['  Accounts Receivable', '', '', '', '', ''],
              ['  Inventory', '', '', '', '', ''],
              ['  Accounts Payable', '', '', '', '', ''],
              ['  Accrued Expenses', '', '', '', '', ''],
              ['Cash from Operations', '', '', '', '', ''],
              ['', '', '', '', '', ''],
              ['INVESTING ACTIVITIES', '', '', '', '', ''],
              ['Capital Expenditures', '', '', '', '', ''],
              ['Acquisitions', '', '', '', '', ''],
              ['Asset Sales', '', '', '', '', ''],
              ['Cash from Investing', '', '', '', '', ''],
              ['', '', '', '', '', ''],
              ['FINANCING ACTIVITIES', '', '', '', '', ''],
              ['Debt Issuance / (Repayment)', '', '', '', '', ''],
              ['Equity Issuance / (Buyback)', '', '', '', '', ''],
              ['Dividends Paid', '', '', '', '', ''],
              ['Cash from Financing', '', '', '', '', ''],
              ['', '', '', '', '', ''],
              ['NET CHANGE IN CASH', '', '', '', '', ''],
              ['Beginning Cash Balance', '', '', '', '', ''],
              ['ENDING CASH BALANCE', '', '', '', '', ''],
            ],
          },
        },
      ],
      style: { ...DEFAULT_STYLE },
      variables: [...DEFAULT_VARIABLES],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
  }

  private createBVATemplate(): ExportTemplate {
    return {
      id: 'tpl-bva',
      name: 'Budget vs Actual',
      type: 'budget_vs_actual',
      description: 'Budget vs actual comparison with variance highlighting',
      sections: [
        {
          id: 'header',
          type: 'text',
          title: 'Budget vs Actual Report',
          order: 0,
          config: { content: '{entity} — {period} — {currency}' },
        },
        {
          id: 'table',
          type: 'table',
          title: '',
          order: 1,
          config: {
            headers: ['Line Item', 'Actual', 'Budget', 'Variance ($)', 'Variance (%)', 'Status'],
            rows: [
              ['Revenue', '', '', '', '', ''],
              ['  Product Revenue', '', '', '', '', ''],
              ['  Service Revenue', '', '', '', '', ''],
              ['Total Revenue', '', '', '', '', ''],
              ['', '', '', '', '', ''],
              ['Cost of Goods Sold', '', '', '', '', ''],
              ['Gross Profit', '', '', '', '', ''],
              ['Gross Margin %', '', '', '', '', ''],
              ['', '', '', '', '', ''],
              ['Operating Expenses', '', '', '', '', ''],
              ['  Sales & Marketing', '', '', '', '', ''],
              ['  R&D', '', '', '', '', ''],
              ['  G&A', '', '', '', '', ''],
              ['Total OpEx', '', '', '', '', ''],
              ['', '', '', '', '', ''],
              ['EBITDA', '', '', '', '', ''],
              ['EBITDA Margin %', '', '', '', '', ''],
              ['Net Income', '', '', '', '', ''],
            ],
          },
        },
      ],
      style: { ...DEFAULT_STYLE },
      variables: [...DEFAULT_VARIABLES],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
  }

  private createKPITemplate(): ExportTemplate {
    return {
      id: 'tpl-kpi',
      name: 'KPI Summary Dashboard',
      type: 'kpi_summary',
      description: 'Executive KPI dashboard with key metrics and trends',
      sections: [
        {
          id: 'cover',
          type: 'cover',
          title: '{entity}',
          order: 0,
          config: { title: '{entity}', subtitle: 'KPI Summary — {period}', confidential: false },
        },
        {
          id: 'kpi1',
          type: 'kpi_summary',
          title: 'Financial KPIs',
          order: 1,
          config: {
            kpis: [
              { label: 'Revenue', value: '$12.4M', change: '+8.2%' },
              { label: 'EBITDA', value: '$3.0M', change: '+15.1%' },
              { label: 'Net Margin', value: '16.9%', change: '+2.1pp' },
              { label: 'ROE', value: '22.4%', change: '+3.2pp' },
            ],
          },
        },
        {
          id: 'kpi2',
          type: 'kpi_summary',
          title: 'Operational KPIs',
          order: 2,
          config: {
            kpis: [
              { label: 'Headcount', value: '142', change: '+12' },
              { label: 'Revenue/Employee', value: '$87K', change: '+5.3%' },
              { label: 'Customer Count', value: '2,847', change: '+186' },
              { label: 'NPS Score', value: '72', change: '+4' },
            ],
          },
        },
        {
          id: 'kpi3',
          type: 'kpi_summary',
          title: 'Cash & Liquidity',
          order: 3,
          config: {
            kpis: [
              { label: 'Cash Position', value: '$8.7M', change: '-3.1%' },
              { label: 'Burn Rate', value: '$1.2M/mo', change: '-8%' },
              { label: 'Runway', value: '7.2 mo', change: '+0.5' },
              { label: 'DSO', value: '38 days', change: '-2' },
            ],
          },
        },
      ],
      style: { ...DEFAULT_STYLE },
      variables: [...DEFAULT_VARIABLES],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
  }
}
