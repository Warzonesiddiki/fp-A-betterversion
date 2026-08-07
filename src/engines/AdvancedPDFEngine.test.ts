/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvancedPDFEngine } from './AdvancedPDFEngine';
import { setCanvasFactory, setImageFactory, resetCanvasFactory } from '@/utils/canvasFactory';

// ---------------------------------------------------------------------------
// Mock jsPDF
// ---------------------------------------------------------------------------

const mockSave = vi.fn();
const mockAddPage = vi.fn();
const mockSetPage = vi.fn();
const mockText = vi.fn();
const mockLine = vi.fn();
const mockRect = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetFillColor = vi.fn();
const mockSaveGraphicsState = vi.fn();
const mockRestoreGraphicsState = vi.fn();
const mockSplitTextToSize = vi.fn((text: string) => [text]);
const mockGetNumberOfPages = vi.fn(() => 3);
const mockAddImage = vi.fn();

function createMockPdf() {
  return {
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    setFontSize: mockSetFontSize,
    setTextColor: mockSetTextColor,
    setFillColor: mockSetFillColor,
    text: mockText,
    line: mockLine,
    rect: mockRect,
    addPage: mockAddPage,
    setPage: mockSetPage,
    saveGraphicsState: mockSaveGraphicsState,
    restoreGraphicsState: mockRestoreGraphicsState,
    getNumberOfPages: mockGetNumberOfPages,
    splitTextToSize: mockSplitTextToSize,
    addImage: mockAddImage,
    save: mockSave,
  };
}

let mockPdf: ReturnType<typeof createMockPdf>;

beforeEach(() => {
  vi.clearAllMocks();
  mockPdf = createMockPdf();
  resetCanvasFactory();
});

describe('AdvancedPDFEngine', () => {
  describe('addTableOfContents', () => {
    it('renders TOC entries and handles pagination', () => {
      const sections = [
        { title: 'Executive Summary', level: 0, page: 2 },
        { title: 'P&L Statement', level: 1, page: 3 },
        { title: 'Balance Sheet', level: 1, page: 4 },
        { title: 'Cash Flow', level: 1, page: 5 },
      ];

      AdvancedPDFEngine.addTableOfContents(mockPdf as any, sections);

      expect(mockSetFontSize).toHaveBeenCalledWith(24);
      expect(mockSetFontSize).toHaveBeenCalledWith(12);
      expect(mockText).toHaveBeenCalledWith('Table of Contents', 20, 30);
      expect(mockText).toHaveBeenCalledWith('Executive Summary', 20, 50);
      expect(mockText).toHaveBeenCalledWith('2', 180, 50);
      expect(mockText).toHaveBeenCalledWith('P&L Statement', 40, 58);
      expect(mockAddPage).toHaveBeenCalled();
    });

    it('adds new page when TOC exceeds vertical limit', () => {
      const sections = Array.from({ length: 40 }, (_, i) => ({
        title: `Section ${i + 1}`,
        level: 0,
        page: i + 2,
      }));

      AdvancedPDFEngine.addTableOfContents(mockPdf as any, sections);
      expect(mockAddPage).toHaveBeenCalledTimes(2); // One mid-TOC, one at end
    });
  });

  describe('addWatermark', () => {
    it('adds watermark across all pages with custom options', () => {
      mockGetNumberOfPages.mockReturnValue(2);

      AdvancedPDFEngine.addWatermark(mockPdf as any, {
        text: 'CONFIDENTIAL',
        fontSize: 60,
        color: '#ff0000',
        angle: -30,
      });

      expect(mockSetPage).toHaveBeenCalledWith(1);
      expect(mockSetPage).toHaveBeenCalledWith(2);
      expect(mockSaveGraphicsState).toHaveBeenCalledTimes(2);
      expect(mockRestoreGraphicsState).toHaveBeenCalledTimes(2);
      expect(mockSetTextColor).toHaveBeenCalledWith('#ff0000');
      expect(mockSetFontSize).toHaveBeenCalledWith(60);
      expect(mockText).toHaveBeenCalledWith('CONFIDENTIAL', 105, 148.5, {
        align: 'center',
        angle: -30,
      });
    });

    it('uses default watermark styling when options are omitted', () => {
      mockGetNumberOfPages.mockReturnValue(1);

      AdvancedPDFEngine.addWatermark(mockPdf as any, {
        text: 'DRAFT',
      });

      expect(mockSetTextColor).toHaveBeenCalledWith('#cccccc');
      expect(mockSetFontSize).toHaveBeenCalledWith(50);
      expect(mockText).toHaveBeenCalledWith('DRAFT', 105, 148.5, {
        align: 'center',
        angle: -45,
      });
    });
  });

  describe('addHeaderFooter', () => {
    it('renders headers, footers, page numbers, and dates', () => {
      mockGetNumberOfPages.mockReturnValue(2);

      AdvancedPDFEngine.addHeaderFooter(mockPdf as any, {
        header: { title: 'Q1 Financial Report', subtitle: 'Preliminary Close' },
        footer: { showPageNumbers: true, showDate: true, text: 'Acme Corp' },
      });

      expect(mockSetPage).toHaveBeenCalledWith(1);
      expect(mockSetPage).toHaveBeenCalledWith(2);
      expect(mockText).toHaveBeenCalledWith('Q1 Financial Report', 20, 15);
      expect(mockText).toHaveBeenCalledWith('Preliminary Close', 20, 22);
      expect(mockText).toHaveBeenCalledWith('Acme Corp', 20, 287);
      expect(mockText).toHaveBeenCalledWith('Page 1 of 2', 170, 287);
      expect(mockLine).toHaveBeenCalledWith(20, 25, 190, 25); // Header rule
      expect(mockLine).toHaveBeenCalledWith(20, 282, 190, 282); // Footer rule
    });

    it('handles header without subtitle and minimal footer', () => {
      mockGetNumberOfPages.mockReturnValue(1);

      AdvancedPDFEngine.addHeaderFooter(mockPdf as any, {
        header: { title: 'Simple Title' },
        footer: { text: 'Footer only' },
      });

      expect(mockText).toHaveBeenCalledWith('Simple Title', 20, 15);
      expect(mockText).toHaveBeenCalledWith('Footer only', 20, 287);
    });
  });

  describe('addPageBreak', () => {
    it('calls addPage on document', () => {
      AdvancedPDFEngine.addPageBreak(mockPdf as any);
      expect(mockAddPage).toHaveBeenCalledTimes(1);
    });
  });

  describe('addFinancialTable', () => {
    it('renders financial table with alternating rows and formatted columns', () => {
      const data = [
        { item: 'Revenue', amount: 1250000.5, growth: 0.082, volume: 1500 },
        { item: 'COGS', amount: 500000, growth: 0.031, volume: 1400 },
        { item: 'Gross Profit', amount: 750000.5, growth: 0.125, volume: null },
      ];

      const columns = [
        {
          key: 'item',
          header: 'Line Item',
          width: 60,
          align: 'left' as const,
          format: 'text' as const,
        },
        {
          key: 'amount',
          header: 'Amount ($)',
          width: 40,
          align: 'right' as const,
          format: 'currency' as const,
        },
        {
          key: 'growth',
          header: 'Growth (%)',
          width: 35,
          align: 'right' as const,
          format: 'percent' as const,
        },
        {
          key: 'volume',
          header: 'Units',
          width: 35,
          align: 'right' as const,
          format: 'number' as const,
        },
      ];

      const endY = AdvancedPDFEngine.addFinancialTable(mockPdf as any, data, columns, 40);

      expect(mockSetFillColor).toHaveBeenCalledWith(30, 64, 175); // Header fill
      expect(mockRect).toHaveBeenCalledWith(20, 40, 170, 20, 'F'); // Header rect
      expect(mockText).toHaveBeenCalledWith('Line Item', 22, 54);
      expect(mockText).toHaveBeenCalledWith('$1,250,000.50', 118, 74, { align: 'right' });
      expect(mockText).toHaveBeenCalledWith('8.2%', 153, 74, { align: 'right' });
      expect(mockText).toHaveBeenCalledWith('1,500', 188, 74, { align: 'right' });
      expect(endY).toBe(120);
    });

    it('handles pagination when table exceeds page limit', () => {
      const data = Array.from({ length: 15 }, (_, i) => ({
        item: `Row ${i + 1}`,
        val: i * 100,
      }));
      const columns = [
        { key: 'item', header: 'Item', width: 80 },
        { key: 'val', header: 'Value', width: 80, format: 'number' as const },
      ];

      AdvancedPDFEngine.addFinancialTable(mockPdf as any, data, columns, 100);
      expect(mockAddPage).toHaveBeenCalled();
    });
  });

  describe('addChart', () => {
    it('skips rendering when svgElement is null', () => {
      AdvancedPDFEngine.addChart(mockPdf as any, null);
      expect(mockAddImage).not.toHaveBeenCalled();
    });

    it('renders SVG chart via canvasFactory', () => {
      const mockCanvas = {
        getContext: vi.fn(() => ({
          scale: vi.fn(),
          fillStyle: '',
          fillRect: vi.fn(),
          drawImage: vi.fn(),
        })),
        toDataURL: vi.fn(() => 'data:image/png;base64,mockdata'),
        width: 0,
        height: 0,
      };

      const mockImage = {
        width: 100,
        height: 80,
        src: '',
        onload: null as (() => void) | null,
      };

      setCanvasFactory({
        createCanvas: () => mockCanvas as any,
      });
      setImageFactory({
        createImage: () => mockImage as any,
      });

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100');
      svg.setAttribute('height', '80');

      AdvancedPDFEngine.addChart(mockPdf as any, svg, 25, 45, 160, 100);

      // Trigger onload handler
      if (mockImage.onload) {
        mockImage.onload();
      }

      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
      expect(mockAddImage).toHaveBeenCalledWith(
        'data:image/png;base64,mockdata',
        'PNG',
        25,
        45,
        160,
        100
      );
    });
  });

  describe('generateReport and exportToPDF', () => {
    it('generates full multi-section report with TOC, watermark, tables and header/footer', () => {
      // Mock jsPDF constructor globally for generateReport
      (window as any).jsPDF = class MockJsPDF {
        constructor() {
          return mockPdf;
        }
      };

      const sections = [
        {
          title: 'Section 1: Revenue Analysis',
          content: 'This section contains preliminary revenue metrics.',
          table: {
            data: [{ product: 'SaaS', rev: 50000 }],
            columns: [
              { key: 'product', header: 'Product', width: 80 },
              { key: 'rev', header: 'Revenue', width: 80, format: 'currency' as const },
            ],
          },
        },
        {
          title: 'Section 2: Cost Breakdown',
          content: 'Operating and administrative expenses.',
        },
      ];

      const doc = AdvancedPDFEngine.generateReport(sections, {
        title: 'Board Report',
        subtitle: 'Q2 2026',
        watermark: 'STRICTLY CONFIDENTIAL',
        includeTOC: true,
        includePageNumbers: true,
      });

      expect(doc).toBeDefined();
      expect(doc.internal.pageSize.getWidth()).toBeGreaterThan(0);

      // Export to PDF
      const saveSpy = vi.spyOn(doc, 'save').mockImplementation(() => {});
      AdvancedPDFEngine.exportToPDF(doc, 'Board_Report.pdf');
      expect(saveSpy).toHaveBeenCalledWith('Board_Report.pdf');
    });
  });
});
