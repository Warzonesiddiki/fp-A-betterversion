import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// The page reads its history from MigrationEngine at mount. Stub it so the
// history list can be exercised with a known number of snapshots.
const engineMock = vi.hoisted(() => ({
  getMigrationSnapshots: vi.fn(),
  clearMigrationSnapshots: vi.fn(),
}));
// Every MigrationEngine the page constructs, in construction order. The page
// reads its history from one specific instance, so a test can compare that
// instance with the one the wizard was handed.
const engineInstances = vi.hoisted(() => [] as unknown[]);
// Props the page passed to the (mocked) wizard on its latest render.
const wizardProps = vi.hoisted(() => ({
  current: null as { engine?: unknown; onComplete: (id: string) => void } | null,
}));
vi.mock('@/engines/MigrationEngine', () => ({
  MigrationEngine: class {
    getMigrationSnapshots = engineMock.getMigrationSnapshots;
    clearMigrationSnapshots = engineMock.clearMigrationSnapshots;
    constructor() {
      engineInstances.push(this);
    }
  },
}));

const snapshots: Array<{
  id: string;
  timestamp: string;
  source: 'excel';
  fileName: string;
  plan: { mappings: never[] };
  data: { account: string; amount: number }[];
  applied: boolean;
}> = [];

function makeSnapshot(index: number) {
  return {
    id: `migration-${String(index).padStart(2, '0')}`,
    timestamp: new Date(Date.UTC(2026, 0, index)).toISOString(),
    source: 'excel' as const,
    fileName: `migration-${index}.xlsx`,
    plan: { mappings: [] },
    data: Array.from({ length: index }, () => ({ account: '1000', amount: 1 })),
    applied: true,
  };
}

vi.mock('@/components/migration/MigrationWizard', () => ({
  default: (props: {
    onComplete: (id: string) => void;
    onCancel: () => void;
    engine?: unknown;
  }) => {
    wizardProps.current = props;
    return (
      <div data-testid="migration-wizard">
        <button onClick={() => props.onComplete('snap-1')}>Complete</button>
        <button onClick={props.onCancel}>Cancel</button>
      </div>
    );
  },
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
    snapshots.length = 0;
    wizardProps.current = null;
    // engineInstances is deliberately NOT cleared: MigrationPage constructs its
    // engine at module scope, so entry 0 is the instance every test compares
    // against and it is created exactly once per test file.
    engineMock.getMigrationSnapshots.mockReset();
    engineMock.getMigrationSnapshots.mockImplementation(() => snapshots);
    engineMock.clearMigrationSnapshots.mockReset();
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

  it('renders every stored migration, not only the newest ten', () => {
    for (let i = 1; i <= 12; i += 1) snapshots.push(makeSnapshot(i));
    render(<MigrationPage />);

    expect(screen.getAllByRole('listitem')).toHaveLength(12);
    // The oldest snapshot carries one record; its text exists only on row 12,
    // the row a 10-row window used to drop without any notice.
    expect(screen.getByText(/^1 records ·/)).toBeInTheDocument();
  });

  it('shows the success rate as unavailable, not 0%, when nothing has run', () => {
    render(<MigrationPage />);
    expect(screen.getByTestId('migration-success-rate')).toHaveTextContent('—');
    expect(screen.getByTestId('migration-success-rate')).not.toHaveTextContent('0.0%');
  });

  it('computes the success rate from applied migrations', () => {
    snapshots.push(makeSnapshot(1), makeSnapshot(2), { ...makeSnapshot(3), applied: false });
    render(<MigrationPage />);
    expect(screen.getByTestId('migration-success-rate')).toHaveTextContent('66.7%');
  });

  it('states how many migrations the history holds', () => {
    for (let i = 1; i <= 3; i += 1) snapshots.push(makeSnapshot(i));
    render(<MigrationPage />);
    expect(screen.getByText('3 migrations')).toBeInTheDocument();
  });

  it('hands the wizard the same MigrationEngine instance it reads history from', async () => {
    const user = userEvent.setup();
    render(<MigrationPage />);
    await user.click(screen.getByText('Start with Excel'));

    expect(wizardProps.current).not.toBeNull();
    // The page renders history from `migrationEngine.getMigrationSnapshots()`.
    // If the wizard migrates through a second engine instance, the snapshot its
    // import records is invisible to the list the user is reading: the history
    // stays empty after a successful migration. Snapshots live on the instance,
    // so sharing the instance is what makes the record real.
    expect(engineInstances.length).toBeGreaterThan(0);
    expect(wizardProps.current!.engine).toBe(engineInstances[0]);
  });

  it('lists the migration recorded by the wizard once it completes', async () => {
    const user = userEvent.setup();
    render(<MigrationPage />);
    await user.click(screen.getByText('Start with Excel'));
    // Nothing has been recorded yet, so the history list is empty.
    expect(screen.queryByText('1 migration')).toBeNull();

    // The engine now holds the snapshot the wizard's import recorded.
    snapshots.push(makeSnapshot(1));
    await user.click(screen.getByText('Complete'));

    expect(screen.getByText('1 migration')).toBeInTheDocument();
    expect(screen.getByText(/^1 records ·/)).toBeInTheDocument();
  });
});
