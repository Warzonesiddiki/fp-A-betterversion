import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({}));

import { render, screen } from '@/test/testUtils';
import { DataSummaryCard } from '@/pages/data/DataSummaryCard';

const emptySummary = {
  totalEntries: 0,
  totalAccounts: 0,
  totalDebit: 0,
  totalCredit: 0,
  lastImport: null,
};

const populatedSummary = {
  totalEntries: 1500,
  totalAccounts: 42,
  totalDebit: 250000,
  totalCredit: 248000,
  lastImport: { filename: 'gl_2024.xlsx', timestamp: '2024-12-01T10:00:00Z' },
};

describe('DataSummaryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading', () => {
    render(<DataSummaryCard summary={emptySummary} />);
    expect(screen.getByText(/Current Data Summary/i)).toBeInTheDocument();
  });

  it('renders zero values for empty summary', () => {
    render(<DataSummaryCard summary={emptySummary} />);
    expect(screen.getByText('Total Entries')).toBeInTheDocument();
    expect(screen.getByText('Total Accounts')).toBeInTheDocument();
    expect(screen.getByText('Total Debits')).toBeInTheDocument();
    expect(screen.getByText('Total Credits')).toBeInTheDocument();
  });

  it('renders populated values', () => {
    render(<DataSummaryCard summary={populatedSummary} />);
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders last import info when available', () => {
    render(<DataSummaryCard summary={populatedSummary} />);
    expect(screen.getByText(/gl_2024.xlsx/i)).toBeInTheDocument();
  });

  it('does not render last import when null', () => {
    render(<DataSummaryCard summary={emptySummary} />);
    expect(screen.queryByText(/Last import/i)).not.toBeInTheDocument();
  });
});
