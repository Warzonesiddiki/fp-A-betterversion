import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/components/migration/MigrationWizard', () => ({
  default: ({
    onComplete,
    onCancel,
  }: {
    onComplete: (id: string) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="migration-wizard">
      <button onClick={() => onComplete('snap-1')}>Complete</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('@/engines/CubeMigrationEngine', () => ({
  CubeMigrationEngine: vi.fn(),
}));

// MigrationPage imports 11 icons from lucide-react; this mock previously
// stubbed only 2, so any icon used by the page beyond Database/ArrowLeft
// crashed the render with "no export is defined on the mock". Cover every
// icon the page actually imports.
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="mock-icon" />,
  Database: () => <span data-testid="mock-icon" />,
  FileSpreadsheet: () => <span data-testid="mock-icon" />,
  FileText: () => <span data-testid="mock-icon" />,
  Layers: () => <span data-testid="mock-icon" />,
  Building2: () => <span data-testid="mock-icon" />,
  Trash2: () => <span data-testid="mock-icon" />,
  Play: () => <span data-testid="mock-icon" />,
  CheckCircle2: () => <span data-testid="mock-icon" />,
  AlertCircle: () => <span data-testid="mock-icon" />,
  Clock: () => <span data-testid="mock-icon" />,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
}));

import { render, screen } from '@/test/testUtils';
import userEvent from '@testing-library/user-event';
import MigrationPage from '@/pages/data/MigrationPage';

describe('MigrationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<MigrationPage />);
    // The picker view's empty-migrations-history panel also mentions "data
    // migration" in its helper copy ("start your first data migration"), so
    // a loose text match matches two elements. Scope to the actual <h1>.
    expect(screen.getByRole('heading', { level: 1, name: /Data Migration/i })).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<MigrationPage />);
    expect(screen.getByText(/Migrate data from Excel/i)).toBeInTheDocument();
  });

  it('renders the migration wizard', async () => {
    // MigrationWizard only mounts once a source has been chosen (showWizard
    // becomes true); the picker screen renders first. Drive that real user
    // flow via the empty-state "Start with Excel" shortcut rather than
    // asserting the wizard is present before any source is selected.
    const user = userEvent.setup();
    render(<MigrationPage />);
    await user.click(screen.getByText('Start with Excel'));
    expect(screen.getByTestId('migration-wizard')).toBeInTheDocument();
  });

  it('renders the back button', () => {
    render(<MigrationPage />);
    expect(screen.getByText(/Back to Data/i)).toBeInTheDocument();
  });
});
