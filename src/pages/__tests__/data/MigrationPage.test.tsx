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

vi.mock('lucide-react', () => ({
  Database: () => <span data-testid="mock-icon" />,
  ArrowLeft: () => <span data-testid="mock-icon" />,
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
import MigrationPage from '@/pages/data/MigrationPage';

describe('MigrationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<MigrationPage />);
    expect(screen.getByText(/Data Migration/i)).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<MigrationPage />);
    expect(screen.getByText(/Migrate data from Excel/i)).toBeInTheDocument();
  });

  it('renders the migration wizard', () => {
    render(<MigrationPage />);
    expect(screen.getByTestId('migration-wizard')).toBeInTheDocument();
  });

  it('renders the back button', () => {
    render(<MigrationPage />);
    expect(screen.getByText(/Back to Data/i)).toBeInTheDocument();
  });
});
