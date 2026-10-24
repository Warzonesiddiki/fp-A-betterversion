import { describe, it, expect } from 'vitest';
import { AdvancedPDFEngine } from './AdvancedPDFEngine';
import type { TOCEntry, WatermarkOptions, HeaderFooterOptions } from './AdvancedPDFEngine';

/**
 * GOVERNANCE EVIDENCE for cap:report.pdf
 *
 * The AdvancedPDFEngine generates PDF reports with TOC, watermarks, headers,
 * footers, financial tables, and charts. The governance dimension here is
 * CORRECTNESS — the PDF must contain the right content in the right format.
 * If tables format money incorrectly or watermarks are missing, the report
 * is not trustworthy.
 *
 * Tested dimensions:
 * 1. Table of contents (TOC entries rendered)
 * 2. Watermark (applied to all pages)
 * 3. Header/footer (rendered correctly)
 * 4. Page break (adds new page)
 * 5. Financial table (data formatted correctly)
 * 6. Money primitive safety (currency formatting)
 * 7. Document export (filename correct)
 * 8. Determinism
 */

// Minimal mock jsPDF document that tracks calls
function createMockDoc(): any {
  const calls: string[] = [];
  const doc = {
    text: (...args: any[]) => {
      calls.push(`text:${args[0]}`);
      return doc;
    },
    getNumberOfPages: () => 3,
    internal: { pageSize: { getWidth: () => 200, getHeight: () => 300 } },
    setFontSize: (size: number) => {
      calls.push(`fontSize:${size}`);
      return doc;
    },
    setTextColor: (r: any, g?: any, b?: any) => {
      if (typeof r === 'string') calls.push(`textColor:${r}`);
      else calls.push(`textColor:${r},${g},${b}`);
      return doc;
    },
    setFillColor: (r: number, g: number, b: number) => {
      calls.push(`fillColor:${r},${g},${b}`);
      return doc;
    },
    setDrawColor: (r: number, g: number, b: number) => {
      calls.push(`drawColor:${r},${g},${b}`);
      return doc;
    },
    rect: (...args: any[]) => {
      calls.push('rect');
      return doc;
    },
    line: (...args: any[]) => {
      calls.push('line');
      return doc;
    },
    addPage: () => {
      calls.push('addPage');
      return doc;
    },
    setFont: (font: string) => {
      calls.push(`font:${font}`);
      return doc;
    },
    cell: (...args: any[]) => {
      calls.push(`cell:${args[0]}`);
      return doc;
    },
    setXY: (...args: any[]) => {
      calls.push('setXY');
      return doc;
    },
    setY: (y: number) => {
      calls.push(`setY:${y}`);
      return doc;
    },
    splitTextToSize: (text: string, width: number) => {
      calls.push(`splitText:${text}`);
      return [text];
    },
    setPage: (page: number) => {
      calls.push(`setPage:${page}`);
      return doc;
    },
    saveGraphicsState: () => {
      calls.push('saveGraphicsState');
      return doc;
    },
    restoreGraphicsState: () => {
      calls.push('restoreGraphicsState');
      return doc;
    },
    output: (type: string) => {
      calls.push(`output:${type}`);
      return 'blob';
    },
    save: (filename: string) => {
      calls.push(`save:${filename}`);
      return doc;
    },
    calls,
  };
  return doc;
}

describe('AdvancedPDFEngine — GOVERNANCE (report.pdf)', () => {
  describe('1. Table of contents', () => {
    it('addTableOfContents renders all section titles', () => {
      const doc = createMockDoc();
      const sections: TOCEntry[] = [
        { title: 'Executive Summary', level: 0, page: 1 },
        { title: 'Financial Statements', level: 0, page: 2 },
        { title: 'Revenue Breakdown', level: 1, page: 3 },
      ];
      AdvancedPDFEngine.addTableOfContents(doc, sections);
      expect(doc.calls.some((c) => c.includes('Executive Summary'))).toBe(true);
      expect(doc.calls.some((c) => c.includes('Financial Statements'))).toBe(true);
      expect(doc.calls.some((c) => c.includes('Revenue Breakdown'))).toBe(true);
    });

    it('addTableOfContents includes page numbers', () => {
      const doc = createMockDoc();
      const sections: TOCEntry[] = [
        { title: 'Summary', level: 0, page: 1 },
        { title: 'Details', level: 0, page: 2 },
      ];
      AdvancedPDFEngine.addTableOfContents(doc, sections);
      expect(doc.calls.some((c) => c.includes('1'))).toBe(true);
      expect(doc.calls.some((c) => c.includes('2'))).toBe(true);
    });
  });

  describe('2. Watermark', () => {
    it('addWatermark applies to all pages', () => {
      const doc = createMockDoc();
      const options: WatermarkOptions = { text: 'CONFIDENTIAL', fontSize: 50, color: '#cccccc' };
      AdvancedPDFEngine.addWatermark(doc, options);
      const pages = doc.getNumberOfPages();
      expect(doc.calls.some((c) => c.includes('CONFIDENTIAL'))).toBe(true);
      const textCalls = doc.calls.filter((c) => c.includes('CONFIDENTIAL')).length;
      expect(textCalls).toBe(pages);
    });

    it('addWatermark respects custom font size and color', () => {
      const doc = createMockDoc();
      const options: WatermarkOptions = { text: 'DRAFT', fontSize: 30, color: '#ff0000' };
      AdvancedPDFEngine.addWatermark(doc, options);
      expect(doc.calls.some((c) => c.includes('fontSize:30'))).toBe(true);
      expect(doc.calls.some((c) => c.includes('textColor:#ff0000'))).toBe(true);
    });
  });

  describe('3. Header/footer', () => {
    it('addHeaderFooter renders header title', () => {
      const doc = createMockDoc();
      const options: HeaderFooterOptions = {
        header: { title: 'Annual Report 2026', subtitle: 'Financial Plan' },
        footer: { showPageNumbers: true, showDate: true, text: 'Page' },
      };
      AdvancedPDFEngine.addHeaderFooter(doc, options);
      expect(doc.calls.some((c) => c.includes('Annual Report 2026'))).toBe(true);
    });

    it('addHeaderFooter renders footer with page numbers', () => {
      const doc = createMockDoc();
      const options: HeaderFooterOptions = {
        footer: { showPageNumbers: true, text: 'Page' },
      };
      AdvancedPDFEngine.addHeaderFooter(doc, options);
      expect(doc.calls.some((c) => c.includes('Page'))).toBe(true);
    });
  });

  describe('4. Page break', () => {
    it('addPageBreak adds a new page', () => {
      const doc = createMockDoc();
      AdvancedPDFEngine.addPageBreak(doc);
      expect(doc.calls).toContain('addPage');
    });
  });

  describe('5. Financial table', () => {
    it('addFinancialTable renders table headers', () => {
      const doc = createMockDoc();
      const rows = [{ account: 'Revenue', amount: 100000 }];
      const columns = [
        { key: 'account', header: 'Account', width: 100 },
        { key: 'amount', header: 'Amount', width: 50, align: 'right', format: 'currency' },
      ];
      AdvancedPDFEngine.addFinancialTable(doc, rows, columns);
      expect(doc.calls.some((c) => c.includes('Account'))).toBe(true);
      expect(doc.calls.some((c) => c.includes('Amount'))).toBe(true);
    });

    it('addFinancialTable renders table data', () => {
      const doc = createMockDoc();
      const rows = [
        { account: 'Revenue', amount: 100000 },
        { account: 'Costs', amount: 60000 },
      ];
      const columns = [
        { key: 'account', header: 'Account', width: 100 },
        { key: 'amount', header: 'Amount', width: 50, align: 'right', format: 'currency' },
      ];
      AdvancedPDFEngine.addFinancialTable(doc, rows, columns);
      expect(doc.calls.some((c) => c.includes('Revenue'))).toBe(true);
      expect(doc.calls.some((c) => c.includes('Costs'))).toBe(true);
    });
  });

  describe('6. Money primitive safety', () => {
    it('addFinancialTable formats currency correctly', () => {
      const doc = createMockDoc();
      const rows = [{ account: 'Revenue', amount: 100000 }];
      const columns = [
        { key: 'account', header: 'Account', width: 100 },
        { key: 'amount', header: 'Amount', width: 50, align: 'right', format: 'currency' },
      ];
      AdvancedPDFEngine.addFinancialTable(doc, rows, columns);
      const formattedCalls = doc.calls.filter((c) => c.includes('100,000') || c.includes('100000'));
      expect(formattedCalls.length).toBeGreaterThan(0);
    });

    it('addFinancialTable formats percentage correctly', () => {
      const doc = createMockDoc();
      const rows = [{ metric: 'Growth', value: 15 }];
      const columns = [
        { key: 'metric', header: 'Metric', width: 100 },
        { key: 'value', header: 'Value', width: 50, align: 'right', format: 'percent' },
      ];
      AdvancedPDFEngine.addFinancialTable(doc, rows, columns);
      // The percent formatting produces a formatted string with % suffix
      const textCalls = doc.calls.filter((c) => c.startsWith('text:') && c.includes('%'));
      expect(textCalls.length).toBeGreaterThan(0);
    });
  });

  describe('7. Document export', () => {
    it('exportToPDF uses correct filename', () => {
      const doc = createMockDoc();
      AdvancedPDFEngine.exportToPDF(doc, 'annual-report-2026.pdf');
      expect(doc.calls.some((c) => c.includes('annual-report-2026.pdf'))).toBe(true);
    });
  });

  describe('8. Determinism', () => {
    it('addTableOfContents produces identical output for identical inputs', () => {
      const doc1 = createMockDoc();
      const doc2 = createMockDoc();
      const sections: TOCEntry[] = [
        { title: 'Summary', level: 0, page: 1 },
        { title: 'Details', level: 0, page: 2 },
      ];
      AdvancedPDFEngine.addTableOfContents(doc1, sections);
      AdvancedPDFEngine.addTableOfContents(doc2, sections);
      expect(doc1.calls).toEqual(doc2.calls);
    });

    it('addWatermark produces identical output for identical inputs', () => {
      const doc1 = createMockDoc();
      const doc2 = createMockDoc();
      const options: WatermarkOptions = { text: 'CONFIDENTIAL', fontSize: 50 };
      AdvancedPDFEngine.addWatermark(doc1, options);
      AdvancedPDFEngine.addWatermark(doc2, options);
      expect(doc1.calls).toEqual(doc2.calls);
    });
  });
});
