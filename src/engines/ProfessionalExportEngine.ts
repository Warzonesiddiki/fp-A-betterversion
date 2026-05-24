// =============================================================================
// PROFESSIONAL EXPORT ENGINE — Board-Pack-Grade PDF Generation
//
// Design principles (McKinsey board-pack standard):
//   1. Typography hierarchy: title > subtitle > section > body > footnote
//   2. Grid-based layout: 14mm margins, 4mm gutter, consistent baselines
//   3. White space is a feature, not a bug
//   4. Every number must be right-aligned; every label left-aligned
//   5. Color = meaning: green = favorable, red = unfavorable, blue = neutral
//   6. No element shall touch another without intentional proximity
//   7. Page breaks respect content — never orphan a header or KPI card
// =============================================================================

import type { ExportData, ExportConfig } from './ExportEngine';

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

interface JsPDFDoc {
  internal: {
    pageSize: { width: number; height: number };
    getCurrentPageInfo(): { pageNumber: number };
    getNumberOfPages(): number;
  };
  setFontSize(size: number): void;
  setTextColor(r: number, g?: number, b?: number): void;
  setDrawColor(r: number, g?: number, b?: number): void;
  setFillColor(r: number, g?: number, b?: number): void;
  setFont(font: string, style?: string): void;
  text(text: string, x: number, y: number, options?: { align?: string }): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  rect(x: number, y: number, w: number, h: number, style?: string): void;
  roundedRect(
    x: number,
    y: number,
    w: number,
    h: number,
    rx: number,
    ry: number,
    style?: string
  ): void;
  addPage(): void;
  save(filename: string): void;
  autoTable(options: Record<string, unknown>): void;
  previousAutoTable?: { finalY: number };
  setProperties?(props: Record<string, unknown>): void;
  addImage?(imageData: string, format: string, x: number, y: number, w: number, h: number): void;
  splitTextToSize(text: string, maxWidth: number): string[];
  setPage?(pageNumber: number): void;
  getNumberOfPages?(): number;
  setLineWidth?(width: number): void;
  getTextWidth?(text: string): number;
  outline?: {
    add: { bold: () => { add: (title: string, opts: { pageNumber: number }) => void } };
  };
}

interface BrandingConfig {
  companyName: string;
  logoBase64?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tagline?: string;
  confidential: boolean;
}

interface KPIItem {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'flat';
  target?: string;
  status?: 'green' | 'yellow' | 'red';
}

interface TableSection {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  totalRowIndex?: number;
  notes?: string[];
}

interface ChartPlaceholder {
  title: string;
  type: 'bar' | 'line' | 'pie' | 'waterfall';
  description: string;
}

interface BoardPackData {
  entity: string;
  period: string;
  currency: string;
  preparedBy: string;
  approvedBy?: string;
  date: string;
  executiveSummary: string[];
  highlights: string[];
  concerns: string[];
  kpis: KPIItem[];
  sections: TableSection[];
  charts?: ChartPlaceholder[];
  appendix?: TableSection[];
}

interface BoardPackOptions {
  branding?: Partial<BrandingConfig>;
  includeCover?: boolean;
  includeTOC?: boolean;
  includeExecutiveSummary?: boolean;
  includeAppendix?: boolean;
  pageNumbers?: boolean;
  confidential?: boolean;
}

// ---------------------------------------------------------------------------
// Design tokens — the DNA of the report
// ---------------------------------------------------------------------------

const TOKENS = {
  // Page geometry (A4 portrait: 210 x 297 mm)
  page: {
    width: 210,
    height: 297,
    margin: { top: 20, bottom: 25, left: 18, right: 18 },
    headerHeight: 12,
    footerY: 287,
  },

  // Typography scale (mm)
  font: {
    title: 24,
    subtitle: 16,
    section: 13,
    subsection: 11,
    body: 9,
    small: 7.5,
    footnote: 6.5,
  },

  // Line heights (mm) — 1.4x font size
  lineHeight: {
    title: 10,
    subtitle: 7,
    section: 5.5,
    body: 4.2,
    small: 3.5,
  },

  // Spacing (mm)
  spacing: {
    afterTitle: 8,
    afterSubtitle: 6,
    afterSection: 4,
    afterBody: 3,
    betweenKPIs: 4,
    afterTOCEntry: 5.5,
    sectionGap: 10,
    paragraphGap: 5,
  },

  // Colors (RGB)
  colors: {
    primary: [15, 40, 80] as [number, number, number], // Deep navy
    secondary: [41, 90, 160] as [number, number, number], // Corporate blue
    accent: [0, 120, 200] as [number, number, number], // Bright blue
    text: [35, 35, 35] as [number, number, number], // Near-black
    textMuted: [120, 120, 120] as [number, number, number], // Gray
    textLight: [170, 170, 170] as [number, number, number], // Light gray
    favorable: [22, 130, 60] as [number, number, number], // Green
    unfavorable: [200, 40, 40] as [number, number, number], // Red
    warning: [200, 150, 0] as [number, number, number], // Amber
    white: [255, 255, 255] as [number, number, number],
    bgLight: [248, 250, 252] as [number, number, number], // Off-white
    bgKPI: [242, 246, 252] as [number, number, number], // Light blue bg
    border: [210, 215, 225] as [number, number, number], // Subtle border
    tableHeader: [15, 40, 80] as [number, number, number], // Navy header
    tableAltRow: [248, 250, 254] as [number, number, number],
    tableTotalRow: [235, 240, 250] as [number, number, number],
    gradientStart: [10, 30, 65] as [number, number, number],
    gradientEnd: [30, 80, 150] as [number, number, number],
  },

  // KPI card dimensions
  kpi: {
    cardHeight: 28,
    cardPadding: 4,
    indicatorWidth: 3,
    cornerRadius: 1.5,
  },
} as const;

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function isVariationFavorable(change: string): boolean {
  if (change.startsWith('+')) return true;
  if (change.startsWith('-')) return false;
  return true;
}

function wrapText(pdf: JsPDFDoc, text: string, maxWidth: number, fontSize: number): string[] {
  pdf.setFontSize(fontSize);
  return pdf.splitTextToSize(text, maxWidth);
}

// ---------------------------------------------------------------------------
// ProfessionalExportEngine
// ---------------------------------------------------------------------------

export class ProfessionalExportEngine {
  private pdf!: JsPDFDoc;
  private branding: BrandingConfig;
  private pageW: number;
  private pageH: number;
  private margin: typeof TOKENS.page.margin;
  private contentW: number;
  private y: number = 0;
  private tocEntries: Array<{ title: string; page: number; level: number }> = [];

  constructor(branding?: Partial<BrandingConfig>) {
    this.branding = {
      companyName: branding?.companyName ?? 'FinPlan Pro',
      logoBase64: branding?.logoBase64,
      primaryColor: branding?.primaryColor ?? '#0F2850',
      secondaryColor: branding?.secondaryColor ?? '#295AA0',
      accentColor: branding?.accentColor ?? '#0078C8',
      tagline: branding?.tagline,
      confidential: branding?.confidential ?? true,
    };

    this.pageW = TOKENS.page.width;
    this.pageH = TOKENS.page.height;
    this.margin = TOKENS.page.margin;
    this.contentW = this.pageW - this.margin.left - this.margin.right;
  }

  // =========================================================================
  // PUBLIC API — Generate a complete board pack
  // =========================================================================

  generateBoardPack(data: BoardPackData, options: BoardPackOptions = {}): void {
    const jsPDFCtor = (window as unknown as { jsPDF: new (o: Record<string, unknown>) => JsPDFDoc })
      .jsPDF;
    if (!jsPDFCtor) throw new Error('jsPDF not loaded');

    this.pdf = new jsPDFCtor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.tocEntries = [];

    const opts: Required<BoardPackOptions> = {
      branding: options.branding ?? {},
      includeCover: options.includeCover ?? true,
      includeTOC: options.includeTOC ?? true,
      includeExecutiveSummary: options.includeExecutiveSummary ?? true,
      includeAppendix: options.includeAppendix ?? true,
      pageNumbers: options.pageNumbers ?? true,
      confidential: options.confidential ?? true,
    };

    // Set PDF metadata
    if (this.pdf.setProperties) {
      this.pdf.setProperties({
        title: `${data.entity} — ${data.period} Board Pack`,
        subject: 'Financial Board Pack',
        author: data.preparedBy,
        creator: `${this.branding.companyName} — Professional Export Engine`,
      });
    }

    // 1. Cover page
    if (opts.includeCover) {
      this.renderCoverPage(data, opts.confidential);
    }

    // 2. Table of Contents (rendered as placeholder, filled at end)
    let tocPageNum = 0;
    if (opts.includeTOC) {
      this.pdf.addPage();
      tocPageNum = this.pdf.internal.getCurrentPageInfo().pageNumber;
      this.renderTOCPlaceholder();
    }

    // 3. Executive Summary
    if (opts.includeExecutiveSummary && data.executiveSummary.length > 0) {
      this.pdf.addPage();
      this.renderPageHeader(data.entity, data.period);
      this.renderExecutiveSummary(data);
      this.renderPageFooter(data.entity, data.period);
    }

    // 4. KPI Dashboard
    if (data.kpis.length > 0) {
      this.pdf.addPage();
      this.renderPageHeader(data.entity, data.period);
      this.tocEntries.push({
        title: 'Key Performance Indicators',
        page: this.pdf.internal.getCurrentPageInfo().pageNumber,
        level: 1,
      });
      this.renderSectionTitle('Key Performance Indicators');
      this.renderKPIDashboard(data.kpis);
      this.renderPageFooter(data.entity, data.period);
    }

    // 5. Financial sections
    for (const section of data.sections) {
      this.pdf.addPage();
      this.renderPageHeader(data.entity, data.period);
      this.tocEntries.push({
        title: section.title,
        page: this.pdf.internal.getCurrentPageInfo().pageNumber,
        level: 1,
      });
      this.renderSectionTitle(section.title);
      this.renderFinancialTable(section);
      if (section.notes) this.renderNotes(section.notes);
      this.renderPageFooter(data.entity, data.period);
    }

    // 6. Appendix
    if (opts.includeAppendix && data.appendix && data.appendix.length > 0) {
      this.pdf.addPage();
      this.renderPageHeader(data.entity, data.period);
      this.renderSectionTitle('Appendix');
      for (const section of data.appendix) {
        this.tocEntries.push({
          title: section.title,
          page: this.pdf.internal.getCurrentPageInfo().pageNumber,
          level: 2,
        });
        this.renderSubsectionTitle(section.title);
        this.renderFinancialTable(section);
        this.y += TOKENS.spacing.sectionGap;
      }
      this.renderPageFooter(data.entity, data.period);
    }

    // 7. Backfill TOC with actual page numbers
    if (opts.includeTOC && tocPageNum > 0) {
      this.renderTOC(tocPageNum, data.entity, data.period);
    }

    // 8. Add page numbers to all pages
    if (opts.pageNumbers) {
      this.addPageNumbersToAllPages(data.entity, data.period);
    }

    const filename = `${data.entity.replace(/[^a-zA-Z0-9]/g, '_')}_${data.period.replace(/[^a-zA-Z0-9]/g, '_')}_BoardPack.pdf`;
    this.pdf.save(filename);
  }

  // =========================================================================
  // LEGACY COMPATIBILITY — Enhance existing ExportEngine data
  // =========================================================================

  generateFromExportData(data: ExportData, config: ExportConfig): void {
    const jsPDFCtor = (window as unknown as { jsPDF: new (o: Record<string, unknown>) => JsPDFDoc })
      .jsPDF;
    if (!jsPDFCtor) throw new Error('jsPDF not loaded');

    this.pdf = new jsPDFCtor({
      orientation:
        config.orientation === 'l' || config.orientation === 'landscape' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: config.pageSize || 'a4',
    });

    if (config.orientation === 'l' || config.orientation === 'landscape') {
      (this as unknown as { pageW: number }).pageW = 297;
      (this as unknown as { pageH: number }).pageH = 210;
      (this as unknown as { contentW: number }).contentW =
        297 - this.margin.left - this.margin.right;
    }

    this.renderPageHeader(
      config.companyName || this.branding.companyName,
      config.title || 'Report'
    );

    this.tocEntries.push({
      title: config.title || 'Report',
      page: this.pdf.internal.getCurrentPageInfo().pageNumber,
      level: 1,
    });

    if (data.rows.length === 0) {
      this.y = 80;
      this.pdf.setFontSize(TOKENS.font.body);
      this.pdf.setTextColor(...TOKENS.colors.textMuted);
      this.pdf.text('No data available for this report.', this.pageW / 2, this.y, {
        align: 'center',
      });
    } else {
      this.y = this.margin.top + TOKENS.page.headerHeight + 6;
      this.renderProfessionalTable(data, config);
    }

    this.renderPageFooter(
      config.companyName || this.branding.companyName,
      config.title || 'Report'
    );

    this.addPageNumbersToAllPages(
      config.companyName || this.branding.companyName,
      config.title || 'Report'
    );

    this.pdf.save(`${(config.title || 'report').replace(/\s+/g, '_')}.pdf`);
  }

  // =========================================================================
  // RENDERING — Cover Page
  // =========================================================================

  private renderCoverPage(data: BoardPackData, confidential: boolean): void {
    const pdf = this.pdf;
    const [r, g, b] = TOKENS.colors.primary;

    // Full-page gradient background (simulated with stacked rectangles)
    for (let i = 0; i < 60; i++) {
      const ratio = i / 60;
      const cr = Math.round(r + (30 - r) * ratio);
      const cg = Math.round(g + (80 - g) * ratio);
      const cb = Math.round(b + (150 - b) * ratio);
      pdf.setFillColor(cr, cg, cb);
      pdf.rect(0, (this.pageH / 60) * i, this.pageW, this.pageH / 60 + 0.5, 'F');
    }

    // Decorative geometric accent — thin horizontal lines
    pdf.setDrawColor(255, 255, 255);
    for (let i = 0; i < 5; i++) {
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth?.(0.2);
      pdf.line(0, 40 + i * 3, this.pageW, 40 + i * 3);
    }

    // Company logo (if provided)
    const centerY = this.pageH / 2 - 30;
    if (this.branding.logoBase64 && pdf.addImage) {
      try {
        pdf.addImage(this.branding.logoBase64, 'PNG', this.pageW / 2 - 15, centerY - 30, 30, 30);
      } catch {
        /* logo rendering failed silently */
      }
    }

    // Company name
    pdf.setFontSize(14);
    pdf.setTextColor(200, 210, 230);
    pdf.setFont('helvetica', 'normal');
    pdf.text(this.branding.companyName.toUpperCase(), this.pageW / 2, centerY, { align: 'center' });

    // Thin separator
    pdf.setDrawColor(200, 210, 230);
    pdf.line(this.pageW / 2 - 30, centerY + 4, this.pageW / 2 + 30, centerY + 4);

    // Entity name — the hero text
    pdf.setFontSize(TOKENS.font.title);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text(data.entity, this.pageW / 2, centerY + 22, { align: 'center' });

    // Report title
    pdf.setFontSize(TOKENS.font.subtitle);
    pdf.setTextColor(200, 215, 240);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Board Pack — ${data.period}`, this.pageW / 2, centerY + 34, { align: 'center' });

    // Date and prepared by
    pdf.setFontSize(TOKENS.font.body);
    pdf.setTextColor(180, 195, 220);
    const metaY = centerY + 52;
    pdf.text(`Prepared by: ${data.preparedBy}`, this.pageW / 2, metaY, { align: 'center' });
    if (data.approvedBy) {
      pdf.text(`Approved by: ${data.approvedBy}`, this.pageW / 2, metaY + 6, { align: 'center' });
    }
    pdf.text(data.date, this.pageW / 2, metaY + (data.approvedBy ? 12 : 6), { align: 'center' });

    // Confidentiality notice
    if (confidential) {
      pdf.setFontSize(TOKENS.font.footnote);
      pdf.setTextColor(160, 175, 200);
      pdf.text('CONFIDENTIAL — FOR INTERNAL USE ONLY', this.pageW / 2, this.pageH - 20, {
        align: 'center',
      });

      // Thin border around confidentiality notice
      pdf.setDrawColor(160, 175, 200);
      const cw = 80;
      pdf.line(this.pageW / 2 - cw / 2, this.pageH - 23, this.pageW / 2 + cw / 2, this.pageH - 23);
    }

    // Tagline
    if (this.branding.tagline) {
      pdf.setFontSize(TOKENS.font.footnote);
      pdf.setTextColor(140, 155, 180);
      pdf.text(this.branding.tagline, this.pageW / 2, this.pageH - 12, { align: 'center' });
    }
  }

  // =========================================================================
  // RENDERING — Page Header & Footer
  // =========================================================================

  private renderPageHeader(entity: string, period: string): void {
    const pdf = this.pdf;
    const [r, g, b] = TOKENS.colors.primary;

    // Logo (small)
    if (this.branding.logoBase64 && pdf.addImage) {
      try {
        pdf.addImage(this.branding.logoBase64, 'PNG', this.margin.left, this.margin.top - 6, 8, 8);
      } catch {
        /* logo failed */
      }
    }

    const textX = this.branding.logoBase64 ? this.margin.left + 11 : this.margin.left;

    // Company name
    pdf.setFontSize(TOKENS.font.small);
    pdf.setTextColor(r, g, b);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.branding.companyName, textX, this.margin.top);

    // Report title (right-aligned)
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...TOKENS.colors.textMuted);
    pdf.text(`${entity} — ${period}`, this.pageW - this.margin.right, this.margin.top, {
      align: 'right',
    });

    // Separator line
    pdf.setDrawColor(r, g, b);
    pdf.setLineWidth?.(0.4);
    pdf.line(
      this.margin.left,
      this.margin.top + 3,
      this.pageW - this.margin.right,
      this.margin.top + 3
    );

    this.y = this.margin.top + 10;
  }

  private renderPageFooter(entity: string, period: string): void {
    const pdf = this.pdf;
    const footerY = TOKENS.page.footerY;

    // Top border
    pdf.setDrawColor(...TOKENS.colors.border);
    pdf.setLineWidth?.(0.2);
    pdf.line(this.margin.left, footerY - 4, this.pageW - this.margin.right, footerY - 4);

    // Footer text
    pdf.setFontSize(TOKENS.font.footnote);
    pdf.setTextColor(...TOKENS.colors.textLight);

    // Left: entity and period
    pdf.text(`${entity} — ${period}`, this.margin.left, footerY);

    // Center: confidential
    if (this.branding.confidential) {
      pdf.setTextColor(...TOKENS.colors.textLight);
      pdf.text('CONFIDENTIAL', this.pageW / 2, footerY, { align: 'center' });
    }

    // Right: generated by
    pdf.setTextColor(...TOKENS.colors.textLight);
    pdf.text(
      `Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`,
      this.pageW - this.margin.right,
      footerY,
      { align: 'right' }
    );
  }

  private addPageNumbersToAllPages(_entity: string, _period: string): void {
    const pdf = this.pdf;
    const totalPages = pdf.internal.getNumberOfPages ? pdf.internal.getNumberOfPages() : 1;
    const footerY = TOKENS.page.footerY;

    for (let i = 1; i <= totalPages; i++) {
      if (pdf.setPage) pdf.setPage(i);

      // Page number (right side of footer)
      pdf.setFontSize(TOKENS.font.footnote);
      pdf.setTextColor(...TOKENS.colors.textMuted);
      pdf.text(`Page ${i} of ${totalPages}`, this.pageW - this.margin.right, footerY + 4, {
        align: 'right',
      });
    }
  }

  // =========================================================================
  // RENDERING — Table of Contents
  // =========================================================================

  private renderTOCPlaceholder(): void {
    const pdf = this.pdf;
    this.y = this.margin.top;

    // Title
    pdf.setFontSize(TOKENS.font.subtitle);
    pdf.setTextColor(...TOKENS.colors.primary);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Table of Contents', this.margin.left, this.y);
    this.y += TOKENS.spacing.afterSubtitle;

    // Separator
    pdf.setDrawColor(...TOKENS.colors.primary);
    pdf.setLineWidth?.(0.5);
    pdf.line(this.margin.left, this.y, this.pageW - this.margin.right, this.y);
    this.y += 8;

    // Placeholder entries (will be filled later)
    pdf.setFontSize(TOKENS.font.body);
    pdf.setTextColor(...TOKENS.colors.text);
    pdf.text('Generating...', this.margin.left, this.y);
  }

  private renderTOC(tocPageNum: number, _entity: string, _period: string): void {
    const pdf = this.pdf;

    if (pdf.setPage) pdf.setPage(tocPageNum);

    this.y = this.margin.top;

    // Title
    pdf.setFontSize(TOKENS.font.subtitle);
    pdf.setTextColor(...TOKENS.colors.primary);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Table of Contents', this.margin.left, this.y);
    this.y += TOKENS.spacing.afterSubtitle;

    // Separator
    pdf.setDrawColor(...TOKENS.colors.primary);
    pdf.setLineWidth?.(0.5);
    pdf.line(this.margin.left, this.y, this.pageW - this.margin.right, this.y);
    this.y += 8;

    // Entries
    for (const entry of this.tocEntries) {
      const indent = entry.level === 2 ? 8 : 0;
      const fontSize = entry.level === 1 ? TOKENS.font.body : TOKENS.font.small;

      pdf.setFontSize(fontSize);
      pdf.setTextColor(...TOKENS.colors.text);
      pdf.setFont('helvetica', entry.level === 1 ? 'bold' : 'normal');
      pdf.text(entry.title, this.margin.left + indent, this.y);

      // Dotted leader
      const titleWidth = pdf.getTextWidth
        ? pdf.getTextWidth?.(entry.title)
        : entry.title.length * 2;
      const pageNumStr = String(entry.page);
      const pageNumWidth = pdf.getTextWidth
        ? pdf.getTextWidth?.(pageNumStr)
        : pageNumStr.length * 2;
      const dotStart = this.margin.left + indent + titleWidth + 4;
      const dotEnd = this.pageW - this.margin.right - pageNumWidth - 4;

      pdf.setTextColor(...TOKENS.colors.textLight);
      pdf.setFontSize(fontSize);
      let dotX = dotStart;
      while (dotX < dotEnd) {
        pdf.text('.', dotX, this.y);
        dotX += 2;
      }

      // Page number
      pdf.setTextColor(...TOKENS.colors.textMuted);
      pdf.text(pageNumStr, this.pageW - this.margin.right, this.y, { align: 'right' });

      this.y += TOKENS.spacing.afterTOCEntry;
    }

    // Back to last page
    if (pdf.setPage)
      pdf.setPage(pdf.internal.getNumberOfPages ? pdf.internal.getNumberOfPages() : tocPageNum);
  }

  // =========================================================================
  // RENDERING — Executive Summary
  // =========================================================================

  private renderExecutiveSummary(data: BoardPackData): void {
    const pdf = this.pdf;
    this.tocEntries.push({
      title: 'Executive Summary',
      page: pdf.internal.getCurrentPageInfo().pageNumber,
      level: 1,
    });

    this.renderSectionTitle('Executive Summary');

    // Highlights box
    if (data.highlights.length > 0) {
      this.renderCalloutBox('Key Highlights', data.highlights, TOKENS.colors.favorable);
    }

    this.y += TOKENS.spacing.paragraphGap;

    // Concerns box
    if (data.concerns.length > 0) {
      this.renderCalloutBox('Areas of Attention', data.concerns, TOKENS.colors.unfavorable);
    }

    this.y += TOKENS.spacing.paragraphGap;

    // Summary paragraphs
    pdf.setFontSize(TOKENS.font.body);
    pdf.setTextColor(...TOKENS.colors.text);
    pdf.setFont('helvetica', 'normal');

    for (const paragraph of data.executiveSummary) {
      const lines = wrapText(pdf, paragraph, this.contentW, TOKENS.font.body);
      for (const line of lines) {
        if (this.y > TOKENS.page.footerY - 10) return;
        pdf.text(line, this.margin.left, this.y);
        this.y += TOKENS.lineHeight.body;
      }
      this.y += TOKENS.spacing.paragraphGap;
    }
  }

  private renderCalloutBox(title: string, items: string[], color: [number, number, number]): void {
    const pdf = this.pdf;
    const boxX = this.margin.left;
    const boxW = this.contentW;
    const itemHeight = TOKENS.lineHeight.body + 1;
    const boxPadding = 4;
    const boxH = items.length * itemHeight + boxPadding * 2 + 8;

    // Background
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(boxX, this.y, boxW, boxH, 'F');

    // Left accent bar
    pdf.setFillColor(color[0] + 30, color[1] + 30, color[2] + 30);
    pdf.rect(boxX, this.y, 3, boxH, 'F');

    // Title
    this.y += boxPadding + 5;
    pdf.setFontSize(TOKENS.font.subsection);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, boxX + 8, this.y);

    // Items
    this.y += 5;
    pdf.setFontSize(TOKENS.font.body);
    pdf.setFont('helvetica', 'normal');
    for (const item of items) {
      const bullet = String.fromCharCode(8226); // bullet character
      pdf.text(`${bullet}  ${item}`, boxX + 8, this.y);
      this.y += itemHeight;
    }

    this.y += boxPadding;
  }

  // =========================================================================
  // RENDERING — KPI Dashboard
  // =========================================================================

  private renderKPIDashboard(kpis: KPIItem[]): void {
    const pdf = this.pdf;
    const cols = kpis.length <= 4 ? kpis.length : kpis.length <= 8 ? 4 : 5;
    const gutter = TOKENS.spacing.betweenKPIs;
    const cardW = (this.contentW - gutter * (cols - 1)) / cols;
    const cardH = TOKENS.kpi.cardHeight;

    let col = 0;
    for (const kpi of kpis) {
      const x = this.margin.left + col * (cardW + gutter);

      if (col === 0 && this.y + cardH + 10 > TOKENS.page.footerY - 10) {
        return; // avoid overflow
      }

      // Card background
      pdf.setFillColor(...TOKENS.colors.bgKPI);
      pdf.rect(x, this.y, cardW, cardH, 'F');

      // Status indicator bar (left edge)
      const statusColor =
        kpi.status === 'red'
          ? TOKENS.colors.unfavorable
          : kpi.status === 'yellow'
            ? TOKENS.colors.warning
            : TOKENS.colors.favorable;
      pdf.setFillColor(...statusColor);
      pdf.rect(x, this.y, TOKENS.kpi.indicatorWidth, cardH, 'F');

      // Label
      pdf.setFontSize(TOKENS.font.small);
      pdf.setTextColor(...TOKENS.colors.textMuted);
      pdf.setFont('helvetica', 'normal');
      pdf.text(kpi.label, x + TOKENS.kpi.indicatorWidth + 3, this.y + 6);

      // Value
      pdf.setFontSize(TOKENS.font.section);
      pdf.setTextColor(...TOKENS.colors.text);
      pdf.setFont('helvetica', 'bold');
      pdf.text(kpi.value, x + TOKENS.kpi.indicatorWidth + 3, this.y + 16);

      // Change indicator
      if (kpi.change) {
        const isPositive = isVariationFavorable(kpi.change);
        const changeColor = isPositive ? TOKENS.colors.favorable : TOKENS.colors.unfavorable;
        pdf.setFontSize(TOKENS.font.small);
        pdf.setTextColor(...changeColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(kpi.change, x + TOKENS.kpi.indicatorWidth + 3, this.y + 23);

        // Trend arrow
        const arrowX = x + TOKENS.kpi.indicatorWidth + 3 + kpi.change.length * 2 + 2;
        const arrowChar = isPositive ? '\u25B2' : '\u25BC'; // triangle up/down
        pdf.text(arrowChar, arrowX, this.y + 23);
      }

      // Target (if provided)
      if (kpi.target) {
        pdf.setFontSize(TOKENS.font.footnote);
        pdf.setTextColor(...TOKENS.colors.textLight);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Target: ${kpi.target}`, x + TOKENS.kpi.indicatorWidth + 3, this.y + cardH - 3);
      }

      col++;
      if (col >= cols) {
        col = 0;
        this.y += cardH + gutter;
      }
    }

    if (col > 0) this.y += cardH + gutter;
  }

  // =========================================================================
  // RENDERING — Financial Tables
  // =========================================================================

  private renderFinancialTable(section: TableSection): void {
    const pdf = this.pdf;
    const [r, g, b] = TOKENS.colors.primary;

    // Check if total row index is provided; auto-detect if not
    const totalRowIdx = section.totalRowIndex ?? this.detectTotalRow(section);

    pdf.autoTable({
      head: [section.headers],
      body: section.rows.map((row, _rowIdx) => {
        return row.map((cell, colIdx) => {
          if (colIdx === 0) return String(cell);
          return cell;
        });
      }),
      startY: this.y,
      margin: {
        left: this.margin.left,
        right: this.margin.right,
        top: this.margin.top + TOKENS.page.headerHeight,
        bottom: this.margin.bottom,
      },
      pageBreak: 'auto',
      showHead: 'everyPage',

      // Header styles
      headStyles: {
        fillColor: [r, g, b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: TOKENS.font.small,
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        halign: 'left',
        lineWidth: 0,
      },

      // Body styles
      styles: {
        fontSize: TOKENS.font.small,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
        textColor: TOKENS.colors.text,
        lineColor: TOKENS.colors.border,
        lineWidth: 0.1,
        minCellHeight: 6,
      },

      // Alternating row colors
      alternateRowStyles: {
        fillColor: TOKENS.colors.tableAltRow,
      },

      // Cell parsing — right-align numbers, format currency, color variances
      didParseCell: (data: {
        column: { index: number };
        row: { index: number };
        cell: { styles: Record<string, unknown>; raw: unknown };
        section: string;
      }) => {
        if (data.section === 'head') return;

        // Right-align all columns except the first (label)
        if (data.column.index > 0) {
          data.cell.styles.halign = 'right';
        }

        // Bold total rows
        if (data.row.index === totalRowIdx) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = TOKENS.colors.tableTotalRow;
          data.cell.styles.lineWidth = 0.3;
        }

        // Bold section header rows (rows where first cell is all caps and rest are empty)
        const firstCell = String(data.cell.raw || '');
        if (
          data.column.index === 0 &&
          firstCell === firstCell.toUpperCase() &&
          firstCell.length > 2
        ) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = TOKENS.font.small + 0.5;
        }

        // Color variance columns (last 1-2 columns typically)
        const colCount = section.headers.length;
        if (data.column.index >= colCount - 2 && data.column.index > 0) {
          const val = data.cell.raw;
          if (typeof val === 'number') {
            if (val > 0) data.cell.styles.textColor = TOKENS.colors.favorable;
            else if (val < 0) data.cell.styles.textColor = TOKENS.colors.unfavorable;
          } else if (typeof val === 'string') {
            if (val.startsWith('+')) data.cell.styles.textColor = TOKENS.colors.favorable;
            else if (val.startsWith('-') || val.startsWith('('))
              data.cell.styles.textColor = TOKENS.colors.unfavorable;
          }
        }
      },

      // Page hooks — add header/footer to continuation pages
      didDrawPage: () => {
        this.renderPageHeader(section.title, '');
        this.renderPageFooter('', '');
      },
    });

    this.y = (pdf.previousAutoTable?.finalY ?? this.y) + 5;
  }

  private detectTotalRow(section: TableSection): number {
    // Find the last row that looks like a total (first cell contains "total", "net", "gross", "ebitda", etc.)
    for (let i = section.rows.length - 1; i >= 0; i--) {
      const label = String(section.rows[i][0] || '').toLowerCase();
      if (
        label.includes('total') ||
        label.includes('net ') ||
        label.includes('gross') ||
        label.includes('ebitda') ||
        label.includes('income') ||
        label.includes('ending') ||
        label.includes('balance')
      ) {
        return i;
      }
    }
    return -1;
  }

  // =========================================================================
  // RENDERING — Section Titles & Text
  // =========================================================================

  private renderSectionTitle(title: string): void {
    const pdf = this.pdf;

    // Section title
    pdf.setFontSize(TOKENS.font.section);
    pdf.setTextColor(...TOKENS.colors.primary);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, this.margin.left, this.y);
    this.y += TOKENS.spacing.afterSection;

    // Underline
    pdf.setDrawColor(...TOKENS.colors.primary);
    pdf.setLineWidth?.(0.5);
    pdf.line(this.margin.left, this.y, this.margin.left + 40, this.y);

    this.y += TOKENS.spacing.afterSection + 2;
  }

  private renderSubsectionTitle(title: string): void {
    const pdf = this.pdf;

    pdf.setFontSize(TOKENS.font.subsection);
    pdf.setTextColor(...TOKENS.colors.secondary);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, this.margin.left, this.y);
    this.y += TOKENS.spacing.afterBody;

    pdf.setDrawColor(...TOKENS.colors.border);
    pdf.setLineWidth?.(0.2);
    pdf.line(this.margin.left, this.y, this.pageW - this.margin.right, this.y);

    this.y += TOKENS.spacing.afterBody + 1;
  }

  private renderNotes(notes: string[]): void {
    const pdf = this.pdf;

    this.y += 3;
    pdf.setFontSize(TOKENS.font.footnote);
    pdf.setTextColor(...TOKENS.colors.textMuted);
    pdf.setFont('helvetica', 'italic');

    for (const note of notes) {
      if (this.y > TOKENS.page.footerY - 10) break;
      const lines = wrapText(pdf, `Note: ${note}`, this.contentW, TOKENS.font.footnote);
      for (const line of lines) {
        pdf.text(line, this.margin.left, this.y);
        this.y += TOKENS.lineHeight.small;
      }
    }
  }

  // =========================================================================
  // RENDERING — Professional Table (from ExportData)
  // =========================================================================

  private renderProfessionalTable(data: ExportData, _config: ExportConfig): void {
    const pdf = this.pdf;
    const [r, g, b] = TOKENS.colors.primary;

    pdf.autoTable({
      head: [data.headers],
      body: data.rows,
      startY: this.y,
      margin: {
        left: this.margin.left,
        right: this.margin.right,
        top: this.margin.top + TOKENS.page.headerHeight,
        bottom: this.margin.bottom,
      },
      pageBreak: 'auto',
      showHead: 'everyPage',

      headStyles: {
        fillColor: [r, g, b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: TOKENS.font.small,
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        halign: 'left',
        lineWidth: 0,
      },

      styles: {
        fontSize: TOKENS.font.small,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
        textColor: TOKENS.colors.text,
        lineColor: TOKENS.colors.border,
        lineWidth: 0.1,
      },

      alternateRowStyles: {
        fillColor: TOKENS.colors.tableAltRow,
      },

      didParseCell: (data: {
        column: { index: number };
        cell: { styles: { halign: string; textColor?: number[] } };
      }) => {
        if (data.column.index > 0) {
          data.cell.styles.halign = 'right';
        }
      },
    });

    this.y = (pdf.previousAutoTable?.finalY ?? this.y) + 5;
  }

  // =========================================================================
  // BATCH PDF — Multiple sections with bookmarks
  // =========================================================================

  static generateBatchReport(
    sections: Array<{ title: string; data: ExportData }>,
    config: ExportConfig,
    branding?: Partial<BrandingConfig>
  ): void {
    const engine = new ProfessionalExportEngine(branding);
    const jsPDFCtor = (window as unknown as { jsPDF: new (o: Record<string, unknown>) => JsPDFDoc })
      .jsPDF;
    if (!jsPDFCtor) throw new Error('jsPDF not loaded');

    engine.pdf = new jsPDFCtor({
      orientation:
        config.orientation === 'l' || config.orientation === 'landscape' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: config.pageSize || 'a4',
    });

    if (config.orientation === 'l' || config.orientation === 'landscape') {
      (engine as unknown as { pageW: number }).pageW = 297;
      (engine as unknown as { pageH: number }).pageH = 210;
      (engine as unknown as { contentW: number }).contentW =
        297 - engine.margin.left - engine.margin.right;
    }

    sections.forEach((section, idx) => {
      if (idx > 0) engine.pdf.addPage();

      engine.renderPageHeader(config.companyName || 'FinPlan Pro', config.title || 'Report');
      engine.y = engine.margin.top + TOKENS.page.headerHeight + 6;

      engine.tocEntries.push({
        title: section.title,
        page: engine.pdf.internal.getCurrentPageInfo().pageNumber,
        level: 1,
      });

      engine.renderSectionTitle(section.title);

      if (section.data.rows.length === 0) {
        engine.pdf.setFontSize(TOKENS.font.body);
        engine.pdf.setTextColor(...TOKENS.colors.textMuted);
        engine.pdf.text('No data available.', engine.margin.left, engine.y);
      } else {
        engine.renderProfessionalTable(section.data, config);
      }

      engine.renderPageFooter(config.companyName || 'FinPlan Pro', config.title || 'Report');
    });

    engine.addPageNumbersToAllPages(config.companyName || 'FinPlan Pro', config.title || 'Report');
    engine.pdf.save(`${(config.title || 'batch_report').replace(/\s+/g, '_')}.pdf`);
  }
}

// ---------------------------------------------------------------------------
// Export types for consumers
// ---------------------------------------------------------------------------

export type {
  BrandingConfig,
  KPIItem,
  TableSection,
  ChartPlaceholder,
  BoardPackData,
  BoardPackOptions,
};
