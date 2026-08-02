import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));
vi.mock('@/store/reportStore', () => ({
  useReportStore: vi.fn(() => ({
    reports: [],
    createReport: vi.fn(),
    templates: [],
  })),
}));

import { render, screen } from '@/test/testUtils';
import ReportBookBuilderPage from '@/pages/reports/ReportBookBuilder';

describe('ReportBookBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no entries', () => {
    render(<ReportBookBuilderPage />);
    expect(screen.getByText(/No GL Data/i)).toBeInTheDocument();
  });

  it('renders with entries', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [
        {
          id: '1',
          accountCode: '1100',
          accountName: 'Cash',
          debit: 50000,
          credit: 0,
          netChange: 50000,
            amount: 50000,
          date: '2024-01-01',
        },
      ],
    });
    render(<ReportBookBuilderPage />);
    expect(screen.getByText(/Report Book Builder/i)).toBeInTheDocument();
  });
});
