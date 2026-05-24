import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  ArrowLeftRight: () => <span data-testid="mock-icon" />,
}));

vi.mock('@/components/ui/FileDropZone', () => ({
  FileDropZone: (props: Record<string, unknown>) => <div data-testid="file-drop-zone" {...props} />,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/Alert', () => ({
  Alert: ({ title, message }: { title: string; message: string }) => (
    <div data-testid="alert">
      <span>{title}</span>
      <span>{message}</span>
    </div>
  ),
}));

import { render, screen } from '@/test/testUtils';
import { ReconciliationPanel } from '@/pages/data/ReconciliationPanel';

const defaultProps = {
  recFile: null,
  recData: [],
  recKeyCol: '',
  recValCol: '',
  recError: null,
  csvHeaders: [],
  onFile: vi.fn(),
  onKeyColChange: vi.fn(),
  onValColChange: vi.fn(),
  onRun: vi.fn(),
};

describe('ReconciliationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading', () => {
    render(<ReconciliationPanel {...defaultProps} />);
    expect(screen.getByText(/Data Reconciliation/i)).toBeInTheDocument();
  });

  it('renders the file drop zone', () => {
    render(<ReconciliationPanel {...defaultProps} />);
    expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<ReconciliationPanel {...defaultProps} />);
    expect(screen.getByText(/Upload a CSV file/i)).toBeInTheDocument();
  });

  it('does not show column selectors when no data loaded', () => {
    render(<ReconciliationPanel {...defaultProps} />);
    expect(screen.queryByText(/Account Key Column/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Balance Column/i)).not.toBeInTheDocument();
  });

  it('shows column selectors when data is loaded', () => {
    render(
      <ReconciliationPanel
        {...defaultProps}
        recFile={new File([''], 'test.csv')}
        recData={[{ Account: '1000', Balance: '5000' }]}
        csvHeaders={['Account', 'Balance']}
        recKeyCol="Account"
        recValCol="Balance"
      />
    );
    expect(screen.getByText(/Account Key Column/i)).toBeInTheDocument();
    expect(screen.getByText(/Balance Column/i)).toBeInTheDocument();
    expect(screen.getByText(/Run Reconciliation/i)).toBeInTheDocument();
  });

  it('renders error alert when recError is set', () => {
    render(<ReconciliationPanel {...defaultProps} recError="File format not supported" />);
    expect(screen.getByText(/File format not supported/i)).toBeInTheDocument();
  });
});
