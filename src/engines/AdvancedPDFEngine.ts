/**
 * AdvancedPDFEngine — Professional PDF generation for FinPlan Pro
 * Features: TOC, watermarks, headers/footers, charts, financial tables
 */

import jsPDF from 'jspdf';

interface TOCEntry {
  title: string;
  level: number;
  page: number;
}

interface WatermarkOptions {
  text: string;
  fontSize?: number;
  color?: string;
  opacity?: number;
  angle?: number;
}

interface HeaderFooterOptions {
  header?: { title: string; subtitle?: string };
  footer?: { showPageNumbers?: boolean; showDate?: boolean; text?: string };
}

interface FinancialTableColumn {
  key: string;
  header: string;
  width: number;
  align?: 'left' | 'right' | 'center';
  format?: 'currency' | 'number' | 'percent' | 'text';
}

export class AdvancedPDFEngine {
  /**
   * Add table of contents to PDF
   */
  static addTableOfContents(doc: jsPDF, sections: TOCEntry[]): void {
    doc.setFontSize(24);
    doc.text('Table of Contents', 20, 30);
    doc.setFontSize(12);

    let y = 50;
    for (const section of sections) {
      const indent = section.level * 20;
      doc.text(section.title, 20 + indent, y);
      doc.text(`${section.page}`, 180, y);
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }
    doc.addPage();
  }

  /**
   * Add watermark to every page
   */
  static addWatermark(doc: jsPDF, options: WatermarkOptions): void {
    const { text, fontSize = 50, color = '#cccccc', opacity = 0.3, angle = -45 } = options;
    const pages = doc.getNumberOfPages();

    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.saveGraphicsState();
      doc.setTextColor(color);
      doc.setFontSize(fontSize);

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;

      doc.text(text, centerX, centerY, {
        align: 'center',
        angle: angle,
      });

      doc.restoreGraphicsState();
    }
  }

  /**
   * Add header and footer to every page
   */
  static addHeaderFooter(doc: jsPDF, options: HeaderFooterOptions): void {
    const pages = doc.getNumberOfPages();

    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      if (options.header) {
        doc.setFontSize(16);
        doc.text(options.header.title, 20, 15);
        if (options.header.subtitle) {
          doc.setFontSize(10);
          doc.text(options.header.subtitle, 20, 22);
        }
        doc.line(20, 25, pageWidth - 20, 25);
      }

      if (options.footer) {
        doc.setFontSize(8);
        doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);

        if (options.footer.text) {
          doc.text(options.footer.text, 20, pageHeight - 10);
        }

        if (options.footer.showPageNumbers) {
          doc.text(`Page ${i} of ${pages}`, pageWidth - 40, pageHeight - 10);
        }

        if (options.footer.showDate) {
          doc.text(new Date().toLocaleDateString(), pageWidth / 2, pageHeight - 10);
        }
      }
    }
  }

  /**
   * Add page break
   */
  static addPageBreak(doc: jsPDF): void {
    doc.addPage();
  }

  /**
   * Add financial table to PDF
   */
  static addFinancialTable(
    doc: jsPDF,
    data: Record<string, unknown>[],
    columns: FinancialTableColumn[],
    startY: number = 40
  ): number {
    let y = startY;
    const rowHeight = 20;

    // Header row
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(30, 64, 175);
    doc.rect(20, y, 170, rowHeight, 'F');

    let x = 22;
    for (const col of columns) {
      doc.text(col.header, x, y + 14);
      x += col.width;
    }
    y += rowHeight;

    // Data rows
    doc.setTextColor(30, 30, 30);
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      if (i % 2 === 0) {
        doc.setFillColor(240, 245, 255);
        doc.rect(20, y, 170, rowHeight, 'F');
      }

      x = 22;
      for (const col of columns) {
        const value = row[col.key];
        let formatted: string;

        switch (col.format) {
          case 'currency':
            formatted =
              typeof value === 'number'
                ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : String(value ?? '');
            break;
          case 'percent':
            formatted =
              typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : String(value ?? '');
            break;
          case 'number':
            formatted =
              typeof value === 'number' ? value.toLocaleString('en-US') : String(value ?? '');
            break;
          default:
            formatted = String(value ?? '');
        }

        if (col.align === 'right') {
          doc.text(formatted, x + col.width - 4, y + 14, { align: 'right' });
        } else {
          doc.text(formatted, x, y + 14);
        }
        x += col.width;
      }
      y += rowHeight;
    }

    return y;
  }

  /**
   * Add chart as image to PDF
   */
  static addChart(
    doc: jsPDF,
    svgElement: SVGElement | null,
    x: number = 20,
    y: number = 40,
    width: number = 170,
    height: number = 120
  ): void {
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);

      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', x, y, width, height);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }

  /**
   * Generate full report with sections
   */
  static generateReport(
    sections: Array<{
      title: string;
      content?: string;
      table?: { data: Record<string, unknown>[]; columns: FinancialTableColumn[] };
      chart?: SVGElement;
    }>,
    options?: {
      title?: string;
      subtitle?: string;
      watermark?: string;
      includeTOC?: boolean;
      includePageNumbers?: boolean;
    }
  ): jsPDF {
    const doc = new jsPDF();
    const tocEntries: TOCEntry[] = [];
    let pageNum = 1;

    // Title page
    if (options?.title) {
      doc.setFontSize(28);
      doc.text(options.title, 20, 60);
      if (options.subtitle) {
        doc.setFontSize(16);
        doc.text(options.subtitle, 20, 75);
      }
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 90);
      doc.addPage();
      pageNum++;
    }

    // TOC placeholder (fill in after)
    const tocPage = pageNum;

    // Content sections
    for (const section of sections) {
      doc.addPage();
      pageNum++;

      tocEntries.push({ title: section.title, level: 0, page: pageNum });
      doc.setFontSize(18);
      doc.text(section.title, 20, 30);
      doc.line(20, 33, 190, 33);

      let y = 45;

      if (section.content) {
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(section.content, 170);
        doc.text(lines, 20, y);
        y += lines.length * 6;
      }

      if (section.table) {
        y = this.addFinancialTable(doc, section.table.data, section.table.columns, y + 10);
      }

      if (section.chart) {
        this.addChart(doc, section.chart, 20, y + 10, 170, 120);
      }
    }

    // Fill in TOC
    if (options?.includeTOC && tocEntries.length > 0) {
      doc.setPage(tocPage);
      this.addTableOfContents(doc, tocEntries);
    }

    // Header/Footer
    this.addHeaderFooter(doc, {
      header: { title: options?.title ?? 'FinPlan Pro Report' },
      footer: { showPageNumbers: true, showDate: true },
    });

    // Watermark
    if (options?.watermark) {
      this.addWatermark(doc, { text: options.watermark });
    }

    return doc;
  }

  /**
   * Export PDF with download
   */
  static exportToPDF(doc: jsPDF, filename: string): void {
    doc.save(filename);
  }
}
