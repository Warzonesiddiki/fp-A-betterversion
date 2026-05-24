import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ReportLivePreview } from '../ReportLivePreview';

vi.mock('lucide-react', () => {
  const makeIcon = (n: string) => (p: any) => <span data-testid={`icon-${n}`} {...p} />;
  return { Eye: makeIcon('Eye') };
});
vi.mock('../ReportGrid', () => ({ ReportGrid: () => <div data-testid="report-grid" /> }));

describe('ReportLivePreview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders preview header', () => {
    render(<ReportLivePreview layout={{ rows: [], columns: [] } as any} cubeData={{}} />);
    expect(screen.getByText('Live Preview')).toBeTruthy();
  });
});
