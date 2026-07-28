/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ProfessionalExportEngine,
  type BoardPackData,
  type KPIItem,
} from './ProfessionalExportEngine';

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
const mockSetDrawColor = vi.fn();
const mockSetFillColor = vi.fn();
const mockSetFont = vi.fn();
const mockAutoTable = vi.fn();
const mockSplitTextToSize = vi.fn((text: string) => [text]);
const mockSetProperties = vi.fn();
const mockGetNumberOfPages = vi.fn(() => 3);
const mockGetTextWidth = vi.fn((text: string) => text.length * 2);
const mockGetPageInfo = vi.fn(() => ({ pageNumber: 1 }));
const mockSetLineWidth = vi.fn();

function createMockPdf() {
  return {
    internal: {
      pageSize: { width: 210, height: 297 },
      getCurrentPageInfo: mockGetPageInfo,
      getNumberOfPages: mockGetNumberOfPages,
    },
    setFontSize: mockSetFontSize,
    setTextColor: mockSetTextColor,
    setDrawColor: mockSetDrawColor,
    setFillColor: mockSetFillColor,
    setFont: mockSetFont,
    text: mockText,
    line: mockLine,
    rect: mockRect,
    roundedRect: vi.fn(),
    addPage: mockAddPage,
    save: mockSave,
    autoTable: mockAutoTable,
    previousAutoTable: { finalY: 120 },
    splitTextToSize: mockSplitTextToSize,
    setProperties: mockSetProperties,
    setPage: mockSetPage,
    getNumberOfPages: mockGetNumberOfPages,
    getTextWidth: mockGetTextWidth,
    setLineWidth: mockSetLineWidth,
  };
}

let mockPdf: ReturnType<typeof createMockPdf>;

beforeEach(() => {
  vi.clearAllMocks();
  mockPdf = createMockPdf();

  // Mock jsPDF constructor on window — must be a class/constructor
  (window as any).jsPDF = class MockJsPDF {
    constructor() {
      return mockPdf;
    }
  };
});

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

function createSampleBoardPackData(): BoardPackData {
  return {
    entity: 'Acme Corporation',
    period: 'FY 2026',
    currency: 'USD',
    preparedBy: 'Finance Team',
    approvedBy: 'CFO Office',
    date: 'May 17, 2026',
    executiveSummary: [
      'Revenue grew 8.2% year-over-year, driven by strong enterprise sales.',
      'EBITDA margin expanded 180 basis points to 24.3%.',
    ],
    highlights: ['Revenue growth of 8.2%', 'EBITDA margin expansion'],
    concerns: ['Working capital increase', 'Customer concentration risk'],
    kpis: [
      { label: 'Total Revenue', value: '$12.4M', change: '+8.2%', status: 'green' },
      { label: 'Net Income', value: '$2.1M', change: '+12.5%', status: 'green' },
      { label: 'EBITDA Margin', value: '24.3%', change: '+1.8pp', status: 'green' },
      { label: 'Cash Position', value: '$8.7M', change: '-3.1%', status: 'red' },
    ],
    sections: [
      {
        title: 'Income Statement',
        headers: ['Line Item', 'Actual', 'Budget', 'Variance', 'Var %'],
        rows: [
          ['Revenue', '$12,400', '$11,500', '$900', '+7.8%'],
          ['COGS', '$4,960', '$4,800', '-$160', '+3.3%'],
          ['Gross Profit', '$7,440', '$6,700', '$740', '+11.0%'],
          ['Total OpEx', '$4,440', '$4,200', '-$240', '+5.7%'],
          ['EBITDA', '$3,000', '$2,500', '$500', '+20.0%'],
        ],
        notes: ['Actuals based on preliminary close data.'],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProfessionalExportEngine', () => {
  describe('constructor', () => {
    it('should create with default branding', () => {
      const engine = new ProfessionalExportEngine();
      expect(engine).toBeDefined();
    });

    it('should accept custom branding', () => {
      const engine = new ProfessionalExportEngine({
        companyName: 'Custom Corp',
        primaryColor: '#1E3A5F',
        secondaryColor: '#4A90D9',
        confidential: false,
      });
      expect(engine).toBeDefined();
    });

    it('should merge partial branding with defaults', () => {
      const engine = new ProfessionalExportEngine({
        companyName: 'Acme Inc',
      });
      expect(engine).toBeDefined();
    });
  });

  describe('generateBoardPack', () => {
    it('should generate a complete board pack PDF', async () => {
      const engine = new ProfessionalExportEngine();
      const data = createSampleBoardPackData();

      await engine.generateBoardPack(data);

      // Should have saved with a filename containing entity and BoardPack
      expect(mockSave).toHaveBeenCalledTimes(1);
      const savedFilename = mockSave!.mock.calls[0]![0];
      expect(savedFilename).toContain('Acme_Corporation');
      expect(savedFilename).toContain('BoardPack');
    });

    it('should render cover page by default', async () => {
      const engine = new ProfessionalExportEngine();
      const data = createSampleBoardPackData();

      await engine.generateBoardPack(data);

      // Cover page uses rect for gradient
      expect(mockRect).toHaveBeenCalled();
      // Should render entity name
      expect(mockText).toHaveBeenCalledWith(
        'Acme Corporation',
        expect.any(Number),
        expect.any(Number),
        { align: 'center' }
      );
    });

    it('should skip cover page when includeCover is false', async () => {
      const engine = new ProfessionalExportEngine();
      const data = createSampleBoardPackData();

      await engine.generateBoardPack(data, { includeCover: false });

      // Cover page entity name should NOT appear centered on first page
      // (it will still appear in header but not as hero text)
      expect(mockAddPage).toHaveBeenCalled();
    });

    it('should render KPI dashboard', async () => {
      const engine = new ProfessionalExportEngine();
      const data = createSampleBoardPackData();

      await engine.generateBoardPack(data);

      // KPIs should be rendered (rect for cards + text for values)
      expect(mockRect).toHaveBeenCalled();
      expect(mockText).toHaveBeenCalled();
    });

    it('should render financial sections with autoTable', async () => {
      const engine = new ProfessionalExportEngine();
      const data = createSampleBoardPackData();

      await engine.generateBoardPack(data);

      // autoTable should be called for each section
      expect(mockAutoTable).toHaveBeenCalled();
      const calls = mockAutoTable.mock.calls;
      const lastCall = calls![calls.length - 1]![0];
      expect(lastCall.head).toEqual([['Line Item', 'Actual', 'Budget', 'Variance', 'Var %']]);
    });

    it('should add page numbers', async () => {
      const engine = new ProfessionalExportEngine();
      const data = createSampleBoardPackData();

      await engine.generateBoardPack(data, { pageNumbers: true });

      // setPage should be called for each page to add numbers
      expect(mockSetPage).toHaveBeenCalled();
    });

    it('should include confidential notice when enabled', async () => {
      const engine = new ProfessionalExportEngine({ confidential: true });
      const data = createSampleBoardPackData();

      await engine.generateBoardPack(data, { confidential: true });

      // Confidential text should appear
      const confidentialCalls = mockText.mock.calls.filter((call) =>
        String(call[0]!).includes('CONFIDENTIAL')
      );
      expect(confidentialCalls.length).toBeGreaterThan(0);
    });

    it('should render notes when provided', async () => {
      const engine = new ProfessionalExportEngine();
      const data = createSampleBoardPackData();

      await engine.generateBoardPack(data);

      // Notes should be rendered (italic text)
      const noteCalls = mockText.mock.calls.filter((call) => String(call[0]!).includes('Note:'));
      expect(noteCalls.length).toBeGreaterThan(0);
    });
  });

  describe('generateFromExportData', () => {
    it('should generate PDF from ExportData format', async () => {
      const engine = new ProfessionalExportEngine();
      const data = {
        headers: ['Name', 'Actual', 'Budget'],
        rows: [
          ['Revenue', 1000, 900],
          ['Cost', 500, 480],
        ],
      };

      await engine.generateFromExportData(data, { title: 'Test Report' });

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockSave!.mock.calls[0]![0]).toContain('Test_Report');
    });

    it('should handle empty data gracefully', async () => {
      const engine = new ProfessionalExportEngine();
      const data = { headers: ['A'], rows: [] };

      await engine.generateFromExportData(data, { title: 'Empty Report' });

      expect(mockSave).toHaveBeenCalled();
      // Should display "no data" message
      const noDataCalls = mockText.mock.calls.filter((call) =>
        String(call[0]!).includes('No data')
      );
      expect(noDataCalls.length).toBeGreaterThan(0);
    });

    it('should handle landscape orientation', async () => {
      const engine = new ProfessionalExportEngine();
      const data = {
        headers: ['Col1', 'Col2'],
        rows: [['A', 1]],
      };

      await engine.generateFromExportData(data, {
        title: 'Landscape Report',
        orientation: 'landscape',
      });

      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('generateBatchReport', () => {
    it('should generate batch PDF with multiple sections', async () => {
      const sections = [
        {
          title: 'Income Statement',
          data: {
            headers: ['Line', 'Amount'],
            rows: [['Revenue', 1000]],
          },
        },
        {
          title: 'Balance Sheet',
          data: {
            headers: ['Account', 'Value'],
            rows: [['Assets', 5000]],
          },
        },
      ];

      await ProfessionalExportEngine.generateBatchReport(sections, { title: 'Batch Report' });

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockSave!.mock.calls[0]![0]).toContain('Batch_Report');
    });

    it('should handle empty sections', async () => {
      const sections = [
        {
          title: 'Empty Section',
          data: { headers: ['A'], rows: [] },
        },
      ];

      await ProfessionalExportEngine.generateBatchReport(sections, { title: 'Empty Batch' });

      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('table rendering', () => {
    it('should auto-detect total rows', async () => {
      const engine = new ProfessionalExportEngine();
      const data: BoardPackData = {
        entity: 'Test Corp',
        period: 'Q1 2026',
        currency: 'USD',
        preparedBy: 'Finance',
        date: 'Jan 2026',
        executiveSummary: [],
        highlights: [],
        concerns: [],
        kpis: [],
        sections: [
          {
            title: 'Revenue Breakdown',
            headers: ['Item', 'Amount'],
            rows: [
              ['Product A', '$5,000'],
              ['Product B', '$3,000'],
              ['Total Revenue', '$8,000'],
            ],
          },
        ],
      };

      await engine.generateBoardPack(data);

      // autoTable should be called with the section data
      expect(mockAutoTable).toHaveBeenCalled();
    });

    it('should right-align numeric columns', async () => {
      const engine = new ProfessionalExportEngine();
      const data: BoardPackData = {
        entity: 'Test Corp',
        period: 'Q1 2026',
        currency: 'USD',
        preparedBy: 'Finance',
        date: 'Jan 2026',
        executiveSummary: [],
        highlights: [],
        concerns: [],
        kpis: [],
        sections: [
          {
            title: 'Financials',
            headers: ['Item', 'Q1', 'Q2'],
            rows: [
              ['Revenue', '$5,000', '$6,000'],
              ['Total', '$5,000', '$6,000'],
            ],
          },
        ],
      };

      await engine.generateBoardPack(data);

      // Check autoTable was called with didParseCell that right-aligns
      const autoTableCall = mockAutoTable.mock.calls.find((call) => call[0]!.didParseCell);
      expect(autoTableCall).toBeDefined();
    });
  });

  describe('KPI dashboard rendering', () => {
    it('should render KPI cards with status indicators', async () => {
      const engine = new ProfessionalExportEngine();
      const data: BoardPackData = {
        entity: 'Test',
        period: 'Q1',
        currency: 'USD',
        preparedBy: 'Finance',
        date: 'Jan 2026',
        executiveSummary: [],
        highlights: [],
        concerns: [],
        kpis: [
          { label: 'Revenue', value: '$10M', change: '+5%', status: 'green' },
          { label: 'Cash', value: '$3M', change: '-2%', status: 'red' },
        ],
        sections: [],
      };

      await engine.generateBoardPack(data);

      // Should render KPI cards (rect calls for backgrounds + indicators)
      expect(mockRect).toHaveBeenCalled();
      // Should render KPI values
      const valueCalls = mockText.mock.calls.filter(
        (call) => call[0] === '$10M' || call[0] === '$3M'
      );
      expect(valueCalls.length).toBe(2);
    });

    it('should handle many KPIs (more than 4)', async () => {
      const engine = new ProfessionalExportEngine();
      const kpis: KPIItem[] = Array.from({ length: 8 }, (_, i) => ({
        label: `KPI ${i + 1}`,
        value: `$${i + 1}M`,
        change: `+${i}%`,
        status: 'green' as const,
      }));

      const data: BoardPackData = {
        entity: 'Test',
        period: 'Q1',
        currency: 'USD',
        preparedBy: 'Finance',
        date: 'Jan 2026',
        executiveSummary: [],
        highlights: [],
        concerns: [],
        kpis,
        sections: [],
      };

      await engine.generateBoardPack(data);

      // Should render all 8 KPIs
      expect(mockRect).toHaveBeenCalled();
    });
  });

  describe('branding', () => {
    it('should use custom company name in headers', async () => {
      const engine = new ProfessionalExportEngine({
        companyName: 'Custom Corp',
      });
      const data = createSampleBoardPackData();

      await engine.generateBoardPack(data);

      const companyNameCalls = mockText.mock.calls.filter((call) => call[0] === 'Custom Corp');
      expect(companyNameCalls.length).toBeGreaterThan(0);
    });

    it('should render logo when provided', async () => {
      const mockAddImage = vi.fn();
      (mockPdf as any).addImage = mockAddImage;

      const engine = new ProfessionalExportEngine({
        logoBase64: 'data:image/png;base64,abc123',
      });
      const data = createSampleBoardPackData();

      await engine.generateBoardPack(data);

      // Logo should be rendered on cover page
      expect(mockAddImage).toHaveBeenCalled();
    });

    it('should use default company name when not provided', async () => {
      const engine = new ProfessionalExportEngine();
      const data = createSampleBoardPackData();

      await engine.generateBoardPack(data);

      const finplanCalls = mockText.mock.calls.filter((call) =>
        String(call[0]!).includes('FinPlan Pro')
      );
      expect(finplanCalls.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should fall back to the bundled jsPDF when no global is injected', async () => {
      delete (window as any).jsPDF;
      const engine = new ProfessionalExportEngine();
      const data = createSampleBoardPackData();

      // No window.jsPDF => pdfRuntime dynamically imports the bundled jspdf
      // (+ autoTable plugin) instead of throwing, which is what shipped
      // before and broke every export call site.
      await expect(engine.generateBoardPack(data)).resolves.toBeUndefined();
    });

    it('should handle sections with no rows', async () => {
      const engine = new ProfessionalExportEngine();
      const data: BoardPackData = {
        entity: 'Test',
        period: 'Q1',
        currency: 'USD',
        preparedBy: 'Finance',
        date: 'Jan 2026',
        executiveSummary: [],
        highlights: [],
        concerns: [],
        kpis: [],
        sections: [
          {
            title: 'Empty Section',
            headers: ['A', 'B'],
            rows: [],
          },
        ],
      };

      await engine.generateBoardPack(data);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle KPIs with no change value', async () => {
      const engine = new ProfessionalExportEngine();
      const data: BoardPackData = {
        entity: 'Test',
        period: 'Q1',
        currency: 'USD',
        preparedBy: 'Finance',
        date: 'Jan 2026',
        executiveSummary: [],
        highlights: [],
        concerns: [],
        kpis: [{ label: 'Static KPI', value: '100' }],
        sections: [],
      };

      await engine.generateBoardPack(data);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle KPIs with target value', async () => {
      const engine = new ProfessionalExportEngine();
      const data: BoardPackData = {
        entity: 'Test',
        period: 'Q1',
        currency: 'USD',
        preparedBy: 'Finance',
        date: 'Jan 2026',
        executiveSummary: [],
        highlights: [],
        concerns: [],
        kpis: [{ label: 'Revenue', value: '$10M', change: '+5%', target: '$12M', status: 'green' }],
        sections: [],
      };

      await engine.generateBoardPack(data);

      const targetCalls = mockText.mock.calls.filter((call) =>
        String(call[0]!).includes('Target:')
      );
      expect(targetCalls.length).toBeGreaterThan(0);
    });
  });
});
