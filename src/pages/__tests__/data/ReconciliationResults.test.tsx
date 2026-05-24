import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  CheckCircle2: () => <span data-testid="mock-icon" />,
  AlertTriangle: () => <span data-testid="mock-icon" />,
  XCircle: () => <span data-testid="mock-icon" />,
  Download: () => <span data-testid="mock-icon" />,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, ...props }: { children: React.ReactNode }) => (
    <span data-testid="badge" {...props}>
      {children}
    </span>
  ),
}));

import { render, screen } from '@/test/testUtils';
import { ReconciliationResults } from '@/pages/data/ReconciliationResults';

const emptyResult = {
  matching: 0,
  mismatches: 0,
  missing: 0,
  details: [],
};

const populatedResult = {
  matching: 10,
  mismatches: 2,
  missing: 1,
  details: [
    { key: '1000-Cash', expected: 50000, actual: 50000, diff: 0 },
    { key: '2000-AP', expected: 30000, actual: 28000, diff: -2000 },
    { key: '3000-AR', expected: 0, actual: 0, diff: 0 },
  ],
};

describe('ReconciliationResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading', () => {
    render(<ReconciliationResults result={emptyResult} />);
    expect(screen.getByText(/Reconciliation Results/i)).toBeInTheDocument();
  });

  it('renders zero summary counts', () => {
    render(<ReconciliationResults result={emptyResult} />);
    expect(screen.getByText(/Matching/i)).toBeInTheDocument();
    expect(screen.getByText(/Mismatches/i)).toBeInTheDocument();
    expect(screen.getByText(/Missing/i)).toBeInTheDocument();
  });

  it('renders populated summary counts', () => {
    render(<ReconciliationResults result={populatedResult} />);
    expect(screen.getByLabelText(/10 matching/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/2 mismatches/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/1 missing/i)).toBeInTheDocument();
  });

  it('renders detail rows with account keys', () => {
    render(<ReconciliationResults result={populatedResult} />);
    expect(screen.getByText('1000-Cash')).toBeInTheDocument();
    expect(screen.getByText('2000-AP')).toBeInTheDocument();
  });

  it('renders export differences button', () => {
    render(<ReconciliationResults result={emptyResult} />);
    expect(screen.getByText(/Export Differences/i)).toBeInTheDocument();
  });
});
