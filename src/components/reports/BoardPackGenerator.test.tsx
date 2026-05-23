/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BoardPackGenerator } from './BoardPackGenerator';

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

const mockBook = {
  id: 'book-1',
  name: 'Board Pack',
  description: 'Monthly board pack',
  entries: [
    { id: 'e1', reportName: 'Profit & Loss', templateId: 'preset-pl', entityIds: ['ent-1'], variables: { period: 'May 2026' }, enabled: true, order: 0 },
    { id: 'e2', reportName: 'Balance Sheet', templateId: 'preset-bs', entityIds: ['ent-1'], variables: { period: 'May 2026' }, enabled: true, order: 1 },
  ],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

vi.mock('@/engines/ReportBookEngine', () => {
  class MockReportBookEngine {
    createBook = vi.fn().mockReturnValue(mockBook);
    addEntry = vi.fn();
    listBooks = vi.fn().mockReturnValue([mockBook]);
    getBook = vi.fn().mockReturnValue(mockBook);
  }

  class MockBoardPackGenerator {
    generateBoardPack = vi.fn().mockResolvedValue({
      sections: [
        {
          id: 'sec-1',
          title: 'Profit & Loss',
          reports: [
            {
              entityName: 'Acme Corp',
              reportName: 'P&L',
              data: { rows: [['Revenue', '1000'], ['Expenses', '500']] },
            },
          ],
        },
      ],
    });
  }

  return {
    ReportBookEngine: MockReportBookEngine,
    BoardPackGenerator: MockBoardPackGenerator,
    REPORT_TEMPLATE_PRESETS: {},
  };
});

describe('BoardPackGenerator', () => {
  it('renders without crashing', () => {
    render(<BoardPackGenerator />);
  });

  it('renders the configuration heading', () => {
    render(<BoardPackGenerator />);
    expect(screen.getByText('Board Pack Configuration')).toBeInTheDocument();
  });

  it('renders the template selector', () => {
    render(<BoardPackGenerator />);
    expect(screen.getByText('Template')).toBeInTheDocument();
  });

  it('renders the title input with default value', () => {
    render(<BoardPackGenerator />);
    // "Monthly Board Pack" appears in both title input and select option
    const matches = screen.getAllByDisplayValue('Monthly Board Pack');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the company name input', () => {
    render(<BoardPackGenerator />);
    expect(screen.getByText('Company Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Acme Corporation')).toBeInTheDocument();
  });

  it('renders the cover date input', () => {
    render(<BoardPackGenerator />);
    expect(screen.getByText('Cover Date')).toBeInTheDocument();
    expect(screen.getByDisplayValue('May 2026')).toBeInTheDocument();
  });

  it('renders the generate button with report count', () => {
    render(<BoardPackGenerator />);
    expect(screen.getByRole('button', { name: /generate board pack/i })).toBeInTheDocument();
  });

  it('renders the cover page preview', () => {
    render(<BoardPackGenerator />);
    expect(screen.getByText('Cover Page Preview')).toBeInTheDocument();
  });

  it('renders the table of contents section', () => {
    render(<BoardPackGenerator />);
    expect(screen.getByText('Table of Contents')).toBeInTheDocument();
  });

  it('renders the empty state message before generation', () => {
    render(<BoardPackGenerator />);
    expect(screen.getByText(/configure the board pack/i)).toBeInTheDocument();
  });

  it('renders checkbox options', () => {
    render(<BoardPackGenerator />);
    expect(screen.getByText('Include Table of Contents')).toBeInTheDocument();
    expect(screen.getByText('Include Executive Summary')).toBeInTheDocument();
  });
});
