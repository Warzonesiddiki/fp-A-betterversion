/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportDialog } from './ExportDialog';
import type { ReportDefinition } from '@/engines/ReportBuilderEngine';

vi.mock('@/engines/ReportBuilderEngine', () => ({
  ReportBuilderEngine: {
    generatePDFMetadata: vi.fn(() => ({
      reportId: 'rpt-1',
      title: 'Test Report',
      orientation: 'landscape',
      pageSize: 'letter',
      showPageNumbers: true,
      showTimestamp: true,
    })),
    generateExcelExport: vi.fn(() => ({
      sheets: [{ name: 'Test', data: [['A', 'B'], [1, 2]], columnWidths: [100, 100] }],
      metadata: { title: 'Test', createdAt: '', author: '', orientation: 'landscape' },
    })),
    generateCSVExport: vi.fn(() => ({
      content: 'A,B\n1,2',
      filename: 'Test.csv',
      mimeType: 'text/csv',
    })),
    resolveLayout: vi.fn(() => []),
    getVisibleColumns: vi.fn(() => []),
    getVisibleRows: vi.fn(() => []),
    formatNumber: vi.fn((v: number) => String(v)),
  },
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn(),
    exportToExcel: vi.fn(),
  },
}));

function createTestReport(): ReportDefinition {
  return {
    id: 'rpt-1',
    name: 'Test Report',
    description: 'A test report',
    template: 'custom',
    layout: {
      rows: [],
      columns: [],
      columnWidths: {},
      defaultRowHeight: 28,
      frozenColumns: 0,
      frozenRows: 0,
    },
    filters: [],
    shares: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    createdBy: 'user-1',
    tags: [],
    isArchived: false,
    version: 1,
  };
}

describe('ExportDialog', () => {
  const defaultProps = {
    report: createTestReport(),
    cubeData: {},
    onClose: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<ExportDialog {...defaultProps} />);
  });

  it('renders the header', () => {
    render(<ExportDialog {...defaultProps} />);
    expect(screen.getByText('Export Report')).toBeInTheDocument();
  });

  it('renders all export format options', () => {
    render(<ExportDialog {...defaultProps} />);
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
  });

  it('renders export button', () => {
    render(<ExportDialog {...defaultProps} />);
    expect(screen.getByText(/Export PDF/)).toBeInTheDocument();
  });

  it('shows PDF options when PDF is selected', () => {
    render(<ExportDialog {...defaultProps} />);
    expect(screen.getByText('PDF Options')).toBeInTheDocument();
    expect(screen.getByText('Orientation')).toBeInTheDocument();
    expect(screen.getByText('Page Size')).toBeInTheDocument();
  });

  it('shows report summary', () => {
    render(<ExportDialog {...defaultProps} />);
    expect(screen.getByText('Test Report')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<ExportDialog {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close export dialog'));
    expect(onClose).toHaveBeenCalled();
  });

  it('allows switching to Excel format', () => {
    render(<ExportDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Excel'));
    expect(screen.getByText(/Export EXCEL/)).toBeInTheDocument();
  });

  it('allows switching to CSV format', () => {
    render(<ExportDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('CSV'));
    expect(screen.getByText(/Export CSV/)).toBeInTheDocument();
  });

  it('hides PDF options when not PDF format', () => {
    render(<ExportDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Excel'));
    expect(screen.queryByText('PDF Options')).not.toBeInTheDocument();
  });

  it('shows watermark input for PDF', () => {
    render(<ExportDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('DRAFT, CONFIDENTIAL, etc.')).toBeInTheDocument();
  });

  it('shows page numbers checkbox', () => {
    render(<ExportDialog {...defaultProps} />);
    expect(screen.getByText('Page numbers')).toBeInTheDocument();
  });

  it('shows timestamp checkbox', () => {
    render(<ExportDialog {...defaultProps} />);
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
  });
});
