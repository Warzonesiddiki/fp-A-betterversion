/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportBookBuilder } from './ReportBookBuilder';

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, className, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) => (
    <button className={className} disabled={disabled} {...props}>{children}</button>
  ),
}));

vi.mock('@/engines/ReportBookEngine', () => {
  class MockReportBookEngine {
    createBook = vi.fn().mockReturnValue({
      id: 'book-1',
      name: 'Board Pack',
      description: 'Monthly board pack',
      entries: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });
    addEntry = vi.fn();
    getBook = vi.fn().mockReturnValue({
      id: 'book-1',
      name: 'Board Pack',
      description: 'Monthly board pack',
      entries: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });
    updateEntry = vi.fn();
    removeEntry = vi.fn();
    reorderEntries = vi.fn();
    getAvailableVariables = vi.fn().mockReturnValue([
      { key: 'period', label: 'Period', description: 'Reporting period' },
      { key: 'entity', label: 'Entity', description: 'Entity name' },
    ]);
    generateReports = vi.fn().mockResolvedValue([]);
  }

  return {
    ReportBookEngine: MockReportBookEngine,
    REPORT_TEMPLATE_PRESETS: {
      'preset-pl': { id: 'preset-pl', name: 'Profit & Loss', description: 'Income statement template', defaultVariables: { period: 'FY 2026' } },
      'preset-bs': { id: 'preset-bs', name: 'Balance Sheet', description: 'Balance sheet template', defaultVariables: {} },
      'preset-cf': { id: 'preset-cf', name: 'Cash Flow', description: 'Cash flow template', defaultVariables: {} },
    },
  };
});

describe('ReportBookBuilder', () => {
  it('renders without crashing', () => {
    render(<ReportBookBuilder />);
  });

  it('renders the report templates heading', () => {
    render(<ReportBookBuilder />);
    expect(screen.getByText('Report Templates')).toBeInTheDocument();
  });

  it('renders available preset templates', () => {
    render(<ReportBookBuilder />);
    expect(screen.getByText('Profit & Loss')).toBeInTheDocument();
    expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
  });

  it('renders preset descriptions', () => {
    render(<ReportBookBuilder />);
    expect(screen.getByText('Income statement template')).toBeInTheDocument();
    expect(screen.getByText('Balance sheet template')).toBeInTheDocument();
  });

  it('renders the available variables section', () => {
    render(<ReportBookBuilder />);
    expect(screen.getByText('Available Variables')).toBeInTheDocument();
    expect(screen.getAllByText(/period/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/entity/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders the book name input', () => {
    render(<ReportBookBuilder />);
    expect(screen.getByDisplayValue('Board Pack')).toBeInTheDocument();
  });

  it('renders the Generate All button', () => {
    render(<ReportBookBuilder />);
    expect(screen.getByRole('button', { name: /generate all/i })).toBeInTheDocument();
  });

  it('renders the empty state message when no entries exist', () => {
    render(<ReportBookBuilder />);
    expect(screen.getByText(/add reports from the template catalog/i)).toBeInTheDocument();
  });

  it('renders the preview heading', () => {
    render(<ReportBookBuilder />);
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('renders the preview empty state', () => {
    render(<ReportBookBuilder />);
    expect(screen.getByText(/click a report entry to preview/i)).toBeInTheDocument();
  });
});
