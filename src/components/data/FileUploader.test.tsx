import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploader } from './FileUploader';

const mockImportResult = {
  valid: true,
  errors: [],
  warnings: [],
  rowCount: 10,
  columnCount: 3,
  columns: ['account', 'date', 'amount'],
  preview: [{ account: '1000', date: '2024-01-01', amount: '100' }],
};

const mockSnapshot = {
  id: 'snap-1',
  timestamp: '2024-01-01T00:00:00Z',
  format: 'csv' as const,
  fileName: 'test.csv',
  rowCount: 10,
  columns: ['account', 'date', 'amount'],
  data: [],
  applied: false,
};

const mockEngineInstance = {
  onProgress: vi.fn((listener: (p: unknown) => void) => {
    listener({ status: 'idle', percent: 0, message: '' });
    return vi.fn();
  }),
  getSnapshots: vi.fn(() => []),
  importFile: vi.fn(async () => ({
    result: mockImportResult,
    snapshot: mockSnapshot,
  })),
  rollback: vi.fn(),
};

vi.mock('@/engines/ImportEngine', () => ({
  ImportEngine: class MockImportEngine {
    onProgress = mockEngineInstance.onProgress;
    getSnapshots = mockEngineInstance.getSnapshots;
    importFile = mockEngineInstance.importFile;
    rollback = mockEngineInstance.rollback;
  },
}));

vi.mock('@/components/ui/FileDropZone', () => ({
  FileDropZone: ({ onFile, accept }: { onFile: (f: File) => void; accept?: string }) => (
    <div data-testid="file-drop-zone">
      <span data-testid="accept">{accept}</span>
      <button
        data-testid="trigger-upload"
        onClick={() => onFile(new File(['data'], 'test.csv', { type: 'text/csv' }))}
      >
        Upload
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, ...props }: Record<string, unknown>) => (
    <button onClick={onClick as () => void} disabled={disabled as boolean} {...props}>
      {children as React.ReactNode}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  CheckCircle2: () => <span data-testid="check-circle" />,
  AlertCircle: () => <span data-testid="alert-circle" />,
  RotateCcw: () => <span data-testid="rotate-ccw" />,
  FileText: () => <span data-testid="file-text" />,
}));

describe('FileUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEngineInstance.getSnapshots.mockReturnValue([]);
    mockEngineInstance.importFile.mockResolvedValue({
      result: mockImportResult,
      snapshot: mockSnapshot,
    });
  });

  it('renders without crashing', () => {
    render(<FileUploader />);
    expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
  });

  it('renders with correct accept attribute', () => {
    render(<FileUploader />);
    expect(screen.getByTestId('accept').textContent).toBe('.csv,.xlsx,.xls,.json');
  });

  it('renders drop zone', () => {
    render(<FileUploader />);
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });

  it('handles file upload and shows validation result', async () => {
    render(<FileUploader />);
    fireEvent.click(screen.getByTestId('trigger-upload'));

    await waitFor(() => {
      expect(screen.getByText(/10 rows/)).toBeInTheDocument();
    });
  });

  it('shows confirm button after successful validation', async () => {
    render(<FileUploader />);
    fireEvent.click(screen.getByTestId('trigger-upload'));

    await waitFor(() => {
      expect(screen.getByText('Confirm & Import')).toBeInTheDocument();
    });
  });

  it('calls onImport when confirm is clicked', async () => {
    const onImport = vi.fn();
    render(<FileUploader onImport={onImport} />);
    fireEvent.click(screen.getByTestId('trigger-upload'));

    await waitFor(() => {
      expect(screen.getByText('Confirm & Import')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Confirm & Import'));
    expect(onImport).toHaveBeenCalledWith(
      [{ account: '1000', date: '2024-01-01', amount: '100' }],
      ['account', 'date', 'amount']
    );
  });

  it('renders with requiredColumns prop', () => {
    render(<FileUploader requiredColumns={['account']} />);
    expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
  });

  it('renders with numericColumns prop', () => {
    render(<FileUploader numericColumns={['amount']} />);
    expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
  });

  it('renders with dateColumns prop', () => {
    render(<FileUploader dateColumns={['date']} />);
    expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
  });

  it('renders with maxRows prop', () => {
    render(<FileUploader maxRows={1000} />);
    expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
  });
});
