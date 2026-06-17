import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/entityStore', () => ({
  useEntityStore: vi.fn(() => ({
    entities: [],
    addEntity: vi.fn(),
    updateEntity: vi.fn(),
    deleteEntity: vi.fn(),
  })),
}));
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [
      {
        id: '1',
        accountCode: '4100',
        accountName: 'Revenue',
        debit: 50000,
        credit: 0,
        date: '2024-01-01',
      },
    ],
  })),
}));
vi.mock('@/engines/SegmentReportingEngine', () => ({
  SegmentReportingEngine: {
    getSegmentReport: () => [
      {
        segment: { id: '1', name: 'North America', type: 'geographic' },
        revenue: 5000000,
        expenses: 2000000,
        netIncome: 3000000,
        margin: 0.6,
      },
    ],
    getSegments: () => [],
    defineSegment: () => ({}),
    reportSegmentData: () => {},
    reset: () => {},
  },
}));

import { render, screen } from '@/test/testUtils';
import SegmentReportingPage from '@/pages/reports/SegmentReportingPage';

describe('SegmentReportingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the segment reporting page', () => {
    render(<SegmentReportingPage />);
    expect(screen.getAllByText(/segment reporting/i).length).toBeGreaterThan(0);
  });
});
