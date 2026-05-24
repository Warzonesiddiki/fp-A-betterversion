import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  CheckCircle2: () => <span data-testid="mock-icon" />,
  AlertTriangle: () => <span data-testid="mock-icon" />,
  XCircle: () => <span data-testid="mock-icon" />,
  FileSpreadsheet: () => <span data-testid="mock-icon" />,
  Globe: () => <span data-testid="mock-icon" />,
  Shield: () => <span data-testid="mock-icon" />,
  Upload: () => <span data-testid="mock-icon" />,
}));

vi.mock('@/components/ui/FileDropZone', () => ({
  FileDropZone: (props: Record<string, unknown>) => <div data-testid="file-drop-zone" {...props} />,
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

vi.mock('@/components/ui/Alert', () => ({
  Alert: ({ title, message }: { title: string; message: string }) => (
    <div data-testid="alert">
      <span>{title}</span>
      <span>{message}</span>
    </div>
  ),
}));

import { render, screen } from '@/test/testUtils';
import { MigrationWizard } from '@/pages/data/MigrationWizard';

const defaultProps = {
  wizardStep: 'upload' as const,
  detectedSource: 'excel' as const,
  readiness: null,
  columnMappings: [],
  migrationProgress: 0,
  migrationError: null,
  onFile: vi.fn(),
  onColumnMappingChange: vi.fn(),
  onExecuteMigration: vi.fn(),
  onRollback: vi.fn(),
  onStepChange: vi.fn(),
  onFileReset: vi.fn(),
};

describe('MigrationWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading', () => {
    render(<MigrationWizard {...defaultProps} />);
    expect(screen.getByText(/Migration Wizard/i)).toBeInTheDocument();
  });

  it('renders upload step with file drop zone', () => {
    render(<MigrationWizard {...defaultProps} />);
    expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
    expect(screen.getByText(/Upload a file to migrate/i)).toBeInTheDocument();
  });

  it('renders analyze step with spinner', () => {
    render(<MigrationWizard {...defaultProps} wizardStep="analyze" />);
    expect(screen.getByText(/Analyzing file structure/i)).toBeInTheDocument();
  });

  it('renders map step with readiness info', () => {
    render(
      <MigrationWizard
        {...defaultProps}
        wizardStep="map"
        readiness={{
          score: 85,
          status: 'green',
          issues: [],
          sheetCount: 3,
          totalRows: 5000,
          detectedColumns: [],
          unmappedColumns: [],
          formulaComplexity: 'simple',
          hasExternalLinks: false,
          hasMergedCells: false,
          hasHiddenRows: false,
        }}
      />
    );
    expect(screen.getByText(/Migration Readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/85%/i)).toBeInTheDocument();
  });

  it('renders verify step with completion message', () => {
    render(<MigrationWizard {...defaultProps} wizardStep="verify" />);
    expect(screen.getByText(/Migration Complete/i)).toBeInTheDocument();
  });

  it('renders error alert when migrationError is set', () => {
    render(<MigrationWizard {...defaultProps} migrationError="Something went wrong" />);
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });
});
