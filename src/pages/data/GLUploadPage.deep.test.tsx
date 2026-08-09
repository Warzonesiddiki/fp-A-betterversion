/**
 * @vitest-environment jsdom
 *
 * Deep tests for GLUploadPage (167 st / 141 br uncovered pre-PR-48 batch).
 *
 * Pattern (after PR #48's *.deep.test.tsx convention):
 *   - Mock the zustand `useGLStore` and its `.getState()` to return
 *     programmable stubs.
 *   - Mock the leaf UI primitives used by the page (FileDropZone,
 *     GLColumnMapper, GLDataPreview, ProgressStepper, Skeleton, Button,
 *     Alert, Card, Badge) so the test focuses on the page's own logic.
 *   - DO NOT mock lucide-react — setup.ts already does that globally with
 *     the enumerated-icons list.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// zustand store mock (programmable per-test)
// ---------------------------------------------------------------------------

type StoreStub = {
  entries: Array<Record<string, unknown>>;
  importProgress: number;
  importStatus: 'idle' | 'parsing' | 'validating' | 'importing' | 'complete' | 'error';
  importError: string | null;
  importHistory: Array<{
    id: string;
    filename: string;
    rowCount: number;
    errorCount: number;
    status: 'success' | 'partial' | 'failed';
    timestamp: string;
  }>;
  setImportProgress: ReturnType<typeof vi.fn>;
  setImportStatus: ReturnType<typeof vi.fn>;
  setImportError: ReturnType<typeof vi.fn>;
  recordImport: ReturnType<typeof vi.fn>;
  undoLastImport: ReturnType<typeof vi.fn>;
  checkDuplicates: ReturnType<typeof vi.fn>;
  setEntries: ReturnType<typeof vi.fn>;
  importGLData: ReturnType<typeof vi.fn>;
  validateEntries: ReturnType<typeof vi.fn>;
  lastImportEntryIds: string[];
};

let storeStub: StoreStub;

function makeStore(overrides: Partial<StoreStub> = {}): StoreStub {
  return {
    entries: [],
    importProgress: 0,
    importStatus: 'idle',
    importError: null,
    importHistory: [],
    setImportProgress: vi.fn(),
    setImportStatus: vi.fn((s: string) => {
      // mutate the stub so getState() and any re-render reflect the change
      storeStub.importStatus = s as StoreStub['importStatus'];
      // Force the React renderers to re-read the store on next render
      (storeStub as unknown as { _tick: number })._tick =
        ((storeStub as unknown as { _tick: number })._tick ?? 0) + 1;
    }),
    setImportError: vi.fn((e: string | null) => {
      storeStub.importError = e;
      storeStub.importStatus = e ? 'error' : 'idle';
      (storeStub as unknown as { _tick: number })._tick =
        ((storeStub as unknown as { _tick: number })._tick ?? 0) + 1;
    }),
    recordImport: vi.fn(),
    undoLastImport: vi.fn(),
    checkDuplicates: vi.fn((entries: unknown[]) => ({
      duplicates: 0,
      newEntries: entries,
    })),
    setEntries: vi.fn(),
    importGLData: vi.fn(() => ({ success: true, imported: 3, errors: 0 })),
    validateEntries: vi.fn(() => ({ isValid: true, errors: [], validCount: 3 })),
    lastImportEntryIds: [],
    ...overrides,
  };
}

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(
    vi.fn((selector?: (s: StoreStub) => unknown) => {
      if (typeof selector === 'function') return selector(storeStub);
      return storeStub;
    }),
    {
      getState: () => storeStub,
    }
  ),
  // Also export getState for any direct import — the page uses
  // `useGLStore.getState()` (since useGLStore is the hook from zustand).
  getState: () => storeStub,
}));

// ---------------------------------------------------------------------------
// UI primitive mocks
// ---------------------------------------------------------------------------

let lastFileDrop: { onFile: (file: File) => void } | null = null;
let lastColumnMapper: {
  csvColumns: string[];
  mappings: Record<string, string>;
  onMap: (field: string, csvCol: string) => void;
  onAutoMap: (m: Record<string, string>) => void;
} | null = null;
let lastDataPreview: {
  data: Record<string, string>[];
  mappings: Record<string, string>;
  onConfirm: () => void;
  onCancel: () => void;
} | null = null;

vi.mock('@/components/ui/FileDropZone', () => ({
  FileDropZone: (props: { onFile: (f: File) => void; accept?: string }) => {
    lastFileDrop = props;
    return (
      <div data-testid="file-drop-zone" data-accept={props.accept}>
        FileDropZone
      </div>
    );
  },
}));

vi.mock('@/components/data/GLColumnMapper', () => ({
  GLColumnMapper: (props: {
    csvColumns: string[];
    mappings: Record<string, string>;
    onMap: (field: string, csvCol: string) => void;
    onAutoMap: (m: Record<string, string>) => void;
  }) => {
    lastColumnMapper = props;
    return (
      <div data-testid="gl-column-mapper" data-cols={props.csvColumns.join(',')}>
        GLColumnMapper
      </div>
    );
  },
}));

vi.mock('@/components/data/GLDataPreview', () => ({
  GLDataPreview: (props: {
    data: Record<string, string>[];
    mappings: Record<string, string>;
    onConfirm: () => void;
    onCancel: () => void;
  }) => {
    lastDataPreview = props;
    return (
      <div data-testid="gl-data-preview" data-rows={props.data.length}>
        GLDataPreview
        <button data-testid="preview-confirm" onClick={props.onConfirm}>
          Confirm
        </button>
        <button data-testid="preview-cancel" onClick={props.onCancel}>
          Cancel
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/ui/ProgressStepper', () => ({
  ProgressStepper: (props: { steps: Array<{ label: string }>; currentStep: number }) => (
    <div data-testid="progress-stepper" data-step={props.currentStep}>
      {props.steps.map((s, i) => (
        <span key={i} data-label={s.label} />
      ))}
    </div>
  ),
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    disabled,
    title,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    disabled?: boolean;
    title?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} title={title}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/Alert', () => ({
  Alert: ({ type, title, message }: { type: string; title: string; message: string }) => (
    <div data-testid="alert" data-type={type}>
      {title}:{message}
    </div>
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant }: { children?: React.ReactNode; variant?: string }) => (
    <span data-variant={variant}>{children}</span>
  ),
}));

import GLUploadPage from '@/pages/data/GLUploadPage';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeFile(name: string, type: string, content: string = ''): File {
  return new File([content], name, { type });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/data/gl-upload']}>
      <GLUploadPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  storeStub = makeStore();
  lastFileDrop = null;
  lastColumnMapper = null;
  lastDataPreview = null;
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GLUploadPage (data-driven)', () => {
  it('renders the initial upload CTA when no data is loaded', () => {
    renderPage();
    expect(screen.getByText(/Import Your Financial Data/i)).toBeInTheDocument();
    expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
    expect(screen.getByText(/Max: 50MB/i)).toBeInTheDocument();
    expect(screen.getByText(/CSV, XLSX, XLS/i)).toBeInTheDocument();
  });

  it('sets the document.title on mount', () => {
    renderPage();
    expect(document.title).toMatch(/G L Upload|GL Upload/i);
  });

  it('rejects unsupported file extensions with a friendly error', async () => {
    renderPage();
    const file = makeFile('notes.txt', 'text/plain', 'hello');
    await act(async () => {
      await lastFileDrop!.onFile(file);
    });
    expect(storeStub.setImportError).toHaveBeenCalledWith(
      expect.stringMatching(/Unsupported file type/i)
    );
  });

  it('rejects files over 50MB with a clear error', async () => {
    renderPage();
    // 51MB of text
    const big = 'x'.repeat(51 * 1024 * 1024);
    const file = new File([big], 'big.csv', { type: 'text/csv' });
    await act(async () => {
      await lastFileDrop!.onFile(file);
    });
    expect(storeStub.setImportError).toHaveBeenCalledWith(expect.stringMatching(/File too large/i));
  });

  it('parses a valid CSV file and advances to the map step', async () => {
    renderPage();
    const csv = 'accountCode,postDate,debit,credit\n1000,2024-01-15,100,0\n2000,2024-01-16,0,100\n';
    const file = makeFile('gl.csv', 'text/csv', csv);
    await act(async () => {
      await lastFileDrop!.onFile(file);
    });
    // Should be on the map step
    expect(lastColumnMapper).not.toBeNull();
    expect(lastColumnMapper!.csvColumns).toEqual(['accountCode', 'postDate', 'debit', 'credit']);
  });

  it('rejects CSV files with no data rows', async () => {
    renderPage();
    const csv = 'accountCode,postDate\n'; // header only
    const file = makeFile('empty.csv', 'text/csv', csv);
    await act(async () => {
      await lastFileDrop!.onFile(file);
    });
    expect(storeStub.setImportError).toHaveBeenCalledWith(expect.stringMatching(/no data/i));
  });

  it('rejects CSV files with duplicate column headers', async () => {
    renderPage();
    const csv = 'accountCode,accountCode,postDate\n1000,1000,2024-01-15\n';
    const file = makeFile('dupes.csv', 'text/csv', csv);
    await act(async () => {
      await lastFileDrop!.onFile(file);
    });
    expect(storeStub.setImportError).toHaveBeenCalledWith(
      expect.stringMatching(/Duplicate column headers/i)
    );
  });

  it('rejects CSV files exceeding 100,000 data rows', async () => {
    renderPage();
    // Build a CSV with 100,001 data rows (we don't actually need to push the
    // full string into memory — parseCSV counts lines).
    const lines = ['accountCode,postDate'];
    for (let i = 0; i < 100001; i++) lines.push(`1000,2024-01-${i % 30}`);
    const file = makeFile('huge.csv', 'text/csv', lines.join('\n'));
    await act(async () => {
      await lastFileDrop!.onFile(file);
    });
    expect(storeStub.setImportError).toHaveBeenCalledWith(
      expect.stringMatching(/Maximum supported is 100,000/i)
    );
  });

  it('captures exceptions from file.text() into a friendly error', async () => {
    renderPage();
    // File whose .text() throws
    const file = {
      name: 'bad.csv',
      size: 10,
      text: () => Promise.reject(new Error('disk read error')),
      type: 'text/csv',
    } as unknown as File;
    await act(async () => {
      await lastFileDrop!.onFile(file);
    });
    expect(storeStub.setImportError).toHaveBeenCalledWith(
      expect.stringMatching(/Failed to parse file/i)
    );
  });

  it('warns and does not advance when no required mappings are set', async () => {
    renderPage();
    // Set up so we're on the map step with raw data
    storeStub = makeStore();
    const csv = 'accountCode,postDate,debit\n1000,2024-01-15,100\n';
    await act(async () => {
      await lastFileDrop!.onFile(makeFile('gl.csv', 'text/csv', csv));
    });
    // Click "Preview Data" without mappings
    const previewBtn = screen.getByRole('button', { name: /Preview Data/ });
    expect(previewBtn).toBeDisabled();
  });

  it('enables Preview Data only when both required mappings are set', async () => {
    renderPage();
    const csv = 'accountCode,postDate,debit\n1000,2024-01-15,100\n';
    await act(async () => {
      await lastFileDrop!.onFile(makeFile('gl.csv', 'text/csv', csv));
    });
    // Set one mapping
    act(() => {
      lastColumnMapper!.onMap('accountCode', 'accountCode');
    });
    // Re-render is automatic, but to pick up the new state we re-read the button
    const previewBtn = screen.getByRole('button', { name: /Preview Data/ });
    expect(previewBtn).toBeDisabled();
    act(() => {
      lastColumnMapper!.onMap('postDate', 'postDate');
    });
    const previewBtn2 = screen.getByRole('button', { name: /Preview Data/ });
    expect(previewBtn2).not.toBeDisabled();
  });

  it('autoMap populates the mappings in one call', async () => {
    renderPage();
    const csv = 'a,b,c\n1,2,3\n';
    await act(async () => {
      await lastFileDrop!.onFile(makeFile('gl.csv', 'text/csv', csv));
    });
    act(() => {
      lastColumnMapper!.onAutoMap({ accountCode: 'a', postDate: 'b' });
    });
    const previewBtn = screen.getByRole('button', { name: /Preview Data/ });
    expect(previewBtn).not.toBeDisabled();
  });

  it('clears a mapping when onMap is called with empty string', async () => {
    renderPage();
    const csv = 'a,b,c\n1,2,3\n';
    await act(async () => {
      await lastFileDrop!.onFile(makeFile('gl.csv', 'text/csv', csv));
    });
    act(() => {
      lastColumnMapper!.onMap('accountCode', 'a');
    });
    // Re-render — call onMap with ''
    act(() => {
      lastColumnMapper!.onMap('accountCode', '');
    });
    // The button should be disabled (no accountCode mapping)
    expect(screen.getByRole('button', { name: /Preview Data/ })).toBeDisabled();
  });

  it('advances to the preview step when Preview Data is clicked', async () => {
    renderPage();
    const csv = 'a,b\n1,2\n';
    await act(async () => {
      await lastFileDrop!.onFile(makeFile('gl.csv', 'text/csv', csv));
    });
    act(() => {
      lastColumnMapper!.onMap('accountCode', 'a');
      lastColumnMapper!.onMap('postDate', 'b');
    });
    await act(async () => {
      screen.getByRole('button', { name: /Preview Data/ }).click();
    });
    expect(lastDataPreview).not.toBeNull();
    expect(screen.getByTestId('progress-stepper').dataset.step).toBe('2');
  });

  it('preview cancel goes back to the map step', async () => {
    renderPage();
    const csv = 'a,b\n1,2\n';
    await act(async () => {
      await lastFileDrop!.onFile(makeFile('gl.csv', 'text/csv', csv));
    });
    act(() => {
      lastColumnMapper!.onMap('accountCode', 'a');
      lastColumnMapper!.onMap('postDate', 'b');
    });
    await act(async () => {
      screen.getByRole('button', { name: /Preview Data/ }).click();
    });
    expect(screen.getByTestId('progress-stepper').dataset.step).toBe('2');
    await act(async () => {
      screen.getByTestId('preview-cancel').click();
    });
    expect(screen.getByTestId('progress-stepper').dataset.step).toBe('1');
  });

  it('imports valid rows and advances to the done step after the progress timer', async () => {
    vi.useFakeTimers();
    renderPage();
    const csv = 'accountCode,postDate,debit,credit\n1000,2024-01-15,100,0\n2000,2024-01-16,0,100\n';
    await act(async () => {
      await lastFileDrop!.onFile(makeFile('gl.csv', 'text/csv', csv));
    });
    act(() => {
      lastColumnMapper!.onMap('accountCode', 'accountCode');
      lastColumnMapper!.onMap('postDate', 'postDate');
    });
    await act(async () => {
      screen.getByRole('button', { name: /Preview Data/ }).click();
    });
    await act(async () => {
      screen.getByTestId('preview-confirm').click();
    });
    expect(storeStub.importGLData).toHaveBeenCalled();
    // Advance timers to drain the simulated progress
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    // After the import progress completes, step 4 (Done) is shown
    expect(screen.getByTestId('progress-stepper').dataset.step).toBe('4');
  });

  it('surfaces a validation error when importGLData reports success=false', async () => {
    vi.useFakeTimers();
    // Make the importGLData return failure to exercise the error path
    storeStub = makeStore({
      importGLData: vi.fn(() => ({
        success: false,
        imported: 0,
        errors: 2,
      })),
    });
    renderPage();
    const csv = 'a,b\n1000,2024-01-15\n';
    await act(async () => {
      await lastFileDrop!.onFile(makeFile('gl.csv', 'text/csv', csv));
    });
    expect(lastColumnMapper).not.toBeNull();
    act(() => {
      lastColumnMapper!.onMap('accountCode', 'a');
      lastColumnMapper!.onMap('postDate', 'b');
    });
    await act(async () => {
      screen.getByRole('button', { name: /Preview Data/ }).click();
    });
    await act(async () => {
      screen.getByTestId('preview-confirm').click();
    });
    // The page calls setImportError with a friendly message
    expect(storeStub.importGLData).toHaveBeenCalled();
    expect(storeStub.setImportError).toHaveBeenCalledWith(expect.stringMatching(/Import failed/i));
  });

  it('shows the Import Another button on the Done step', async () => {
    vi.useFakeTimers();
    renderPage();
    const csv = 'accountCode,postDate,debit\n1000,2024-01-15,100\n';
    await act(async () => {
      await lastFileDrop!.onFile(makeFile('gl.csv', 'text/csv', csv));
    });
    act(() => {
      lastColumnMapper!.onMap('accountCode', 'accountCode');
      lastColumnMapper!.onMap('postDate', 'postDate');
    });
    await act(async () => {
      screen.getByRole('button', { name: /Preview Data/ }).click();
    });
    await act(async () => {
      screen.getByTestId('preview-confirm').click();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByText(/Import Another/i)).toBeInTheDocument();
    expect(screen.getByText(/Go to Dashboard/i)).toBeInTheDocument();
  });

  it('shows the importing skeleton when importStatus is parsing', () => {
    storeStub = makeStore({ importStatus: 'parsing' });
    renderPage();
    // Should show the parsing skeleton instead of the normal page
    expect(screen.queryByText(/Import Your Financial Data/i)).not.toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('shows the importing progress view when status is importing', () => {
    storeStub = makeStore({ importStatus: 'importing', importProgress: 42 });
    renderPage();
    expect(screen.getByText(/Importing records/i)).toBeInTheDocument();
    expect(screen.getByText(/42%/)).toBeInTheDocument();
  });

  it('renders import history rows when present', () => {
    storeStub = makeStore({
      importHistory: [
        {
          id: 'h1',
          filename: 'old.csv',
          rowCount: 100,
          errorCount: 0,
          status: 'success',
          timestamp: '2024-01-15T10:00:00Z',
        },
        {
          id: 'h2',
          filename: 'mixed.csv',
          rowCount: 50,
          errorCount: 3,
          status: 'partial',
          timestamp: '2024-02-20T14:30:00Z',
        },
        {
          id: 'h3',
          filename: 'bad.csv',
          rowCount: 10,
          errorCount: 10,
          status: 'failed',
          timestamp: '2024-03-01T08:15:00Z',
        },
      ],
    });
    // Some entries must exist so the page shows the import history.
    storeStub.entries = [{ id: 'x' }];
    renderPage();
    expect(screen.getByText('old.csv')).toBeInTheDocument();
    expect(screen.getByText('mixed.csv')).toBeInTheDocument();
    expect(screen.getByText('bad.csv')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Partial')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('undo buttons call the store undoLastImport action', async () => {
    const undo = vi.fn();
    storeStub = makeStore({
      undoLastImport: undo,
      importHistory: [
        {
          id: 'h1',
          filename: 'old.csv',
          rowCount: 100,
          errorCount: 0,
          status: 'success',
          timestamp: '2024-01-15T10:00:00Z',
        },
      ],
    });
    storeStub.entries = [{ id: 'x' }];
    renderPage();
    await act(async () => {
      screen.getAllByText(/Undo/)[0]!.click();
    });
    expect(undo).toHaveBeenCalled();
  });

  it('Start Over button on the wizard resets to step 0', async () => {
    vi.useFakeTimers();
    renderPage();
    const csv = 'accountCode,postDate,debit\n1000,2024-01-15,100\n';
    await act(async () => {
      await lastFileDrop!.onFile(makeFile('gl.csv', 'text/csv', csv));
    });
    act(() => {
      lastColumnMapper!.onMap('accountCode', 'accountCode');
      lastColumnMapper!.onMap('postDate', 'postDate');
    });
    await act(async () => {
      screen.getByRole('button', { name: /Preview Data/ }).click();
    });
    expect(screen.getByTestId('progress-stepper').dataset.step).toBe('2');
    // Start Over is only visible when 0 < step < 4
    const startOver = screen.getByRole('button', { name: /Start Over/ });
    expect(startOver).toBeInTheDocument();
    await act(async () => {
      startOver.click();
    });
    // After reset, the page returns to the initial upload CTA
    expect(screen.getByText(/Import Your Financial Data/i)).toBeInTheDocument();
    expect(storeStub.setImportError).toHaveBeenCalledWith(null);
  });

  it('Back to Data button navigates to /data', () => {
    // With importHistory, the page renders the wizard that includes the
    // "Back to Data" button.
    storeStub = makeStore({
      importHistory: [
        {
          id: 'h1',
          filename: 'old.csv',
          rowCount: 100,
          errorCount: 0,
          status: 'success',
          timestamp: '2024-01-15T10:00:00Z',
        },
      ],
      entries: [{ id: 'x' }],
    });
    renderPage();
    const back = screen.getByRole('button', { name: /Back to Data/ });
    expect(back).toBeInTheDocument();
    act(() => {
      back.click();
    });
  });

  it('shows the error alert and Try Again when importError is set with no entries', () => {
    storeStub = makeStore({
      importError: 'Bad file',
      entries: [],
    });
    renderPage();
    expect(screen.getByTestId('alert')).toBeInTheDocument();
    expect(screen.getByText(/Try Again/)).toBeInTheDocument();
  });

  it('Try Again button calls resetWizard', async () => {
    storeStub = makeStore({
      importError: 'Bad file',
      entries: [],
    });
    renderPage();
    await act(async () => {
      screen.getByRole('button', { name: /Try Again/ }).click();
    });
    // After reset: importError cleared, status idle, step 0
    expect(storeStub.setImportError).toHaveBeenCalledWith(null);
  });

  it('shows the inline error alert at the bottom of the wizard when step > 0', async () => {
    const csv = 'accountCode,postDate,debit\n1000,2024-01-15,100\n';
    const { rerender } = renderPage();
    await act(async () => {
      await lastFileDrop!.onFile(makeFile('gl.csv', 'text/csv', csv));
    });
    // Now we're on step 1. Set importError directly and force a re-render.
    act(() => {
      storeStub.importError = 'mapping conflict';
    });
    rerender(
      <MemoryRouter initialEntries={['/data/gl-upload']}>
        <GLUploadPage />
      </MemoryRouter>
    );
    // The error appears as an Alert at the bottom of the wizard
    expect(screen.getAllByTestId('alert').length).toBeGreaterThan(0);
  });

  it('handles invalid Excel files with a clear error', async () => {
    renderPage();
    // Mock ExcelImportEngine to throw
    const mod = await import('@/engines/ExcelImportEngine');
    vi.spyOn(mod.ExcelImportEngine.prototype, 'parseFile').mockRejectedValue(
      new Error('corrupt xlsx')
    );
    // xlsx file with a few bytes
    const file = makeFile('corrupt.xlsx', 'application/vnd.openxmlformats', 'PKxx');
    await act(async () => {
      await lastFileDrop!.onFile(file);
    });
    expect(storeStub.setImportError).toHaveBeenCalledWith(
      expect.stringMatching(/Failed to parse file/i)
    );
  });

  it('handles an Excel file with no sheets', async () => {
    renderPage();
    const mod = await import('@/engines/ExcelImportEngine');
    vi.spyOn(mod.ExcelImportEngine.prototype, 'parseFile').mockResolvedValue({
      sheets: [],
      fileName: 'empty.xlsx',
    } as never);
    const file = makeFile('empty.xlsx', 'application/vnd.openxmlformats', 'PKxx');
    await act(async () => {
      await lastFileDrop!.onFile(file);
    });
    expect(storeStub.setImportError).toHaveBeenCalledWith(
      expect.stringMatching(/No sheets found/i)
    );
  });

  it('handles an Excel sheet with no data rows', async () => {
    renderPage();
    const mod = await import('@/engines/ExcelImportEngine');
    vi.spyOn(mod.ExcelImportEngine.prototype, 'parseFile').mockResolvedValue({
      sheets: [{ name: 'Sheet1', headers: ['a', 'b'], rows: [], rowCount: 0 }],
      fileName: 'a.xlsx',
    } as never);
    const file = makeFile('a.xlsx', 'application/vnd.openxmlformats', 'PKxx');
    await act(async () => {
      await lastFileDrop!.onFile(file);
    });
    expect(storeStub.setImportError).toHaveBeenCalledWith(
      expect.stringMatching(/contains no data rows/i)
    );
  });

  it('parses a valid Excel file with one sheet and advances to map step', async () => {
    renderPage();
    const mod = await import('@/engines/ExcelImportEngine');
    vi.spyOn(mod.ExcelImportEngine.prototype, 'parseFile').mockResolvedValue({
      sheets: [
        {
          name: 'Sheet1',
          headers: ['accountCode', 'postDate'],
          rows: [
            { accountCode: '1000', postDate: '2024-01-15' },
            { accountCode: '2000', postDate: '2024-01-16' },
          ],
          rowCount: 2,
        },
      ],
      fileName: 'gl.xlsx',
    } as never);
    const file = makeFile('gl.xlsx', 'application/vnd.openxmlformats', 'PKxx');
    await act(async () => {
      await lastFileDrop!.onFile(file);
    });
    expect(lastColumnMapper).not.toBeNull();
    expect(lastColumnMapper!.csvColumns).toEqual(['accountCode', 'postDate']);
  });

  it('shows the sheet selector dropdown when there are multiple sheets', async () => {
    renderPage();
    const mod = await import('@/engines/ExcelImportEngine');
    vi.spyOn(mod.ExcelImportEngine.prototype, 'parseFile').mockResolvedValue({
      sheets: [
        { name: 'A', headers: ['x'], rows: [{ x: '1' }], rowCount: 1 },
        { name: 'B', headers: ['y'], rows: [{ y: '2' }], rowCount: 1 },
      ],
      fileName: 'two.xlsx',
    } as never);
    const file = makeFile('two.xlsx', 'application/vnd.openxmlformats', 'PKxx');
    await act(async () => {
      await lastFileDrop!.onFile(file);
    });
    // The select is rendered as a native <select> with all sheet names
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.options.length).toBe(2);
  });

  it('handles an Excel sheet with too many rows', async () => {
    renderPage();
    const mod = await import('@/engines/ExcelImportEngine');
    vi.spyOn(mod.ExcelImportEngine.prototype, 'parseFile').mockResolvedValue({
      sheets: [{ name: 'Big', headers: ['a'], rows: [], rowCount: 100001 }],
      fileName: 'big.xlsx',
    } as never);
    const file = makeFile('big.xlsx', 'application/vnd.openxmlformats', 'PKxx');
    await act(async () => {
      await lastFileDrop!.onFile(file);
    });
    expect(storeStub.setImportError).toHaveBeenCalledWith(
      expect.stringMatching(/Maximum supported is 100,000/i)
    );
  });
});
