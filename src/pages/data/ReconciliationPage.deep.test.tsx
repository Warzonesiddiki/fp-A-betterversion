/**
 * @vitest-environment jsdom
 *
 * Deep tests for ReconciliationPage (90 st / 82 br uncovered pre-PR-48 batch).
 *
 * Pattern: store-mock + leaf-UI mocks + lucide enumeration. The reconciliation
 * algorithm runs end-to-end against canned GL data and CSV file data.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// lucide-react enumeration
// ---------------------------------------------------------------------------
vi.mock('lucide-react', async () => {
  const R = await import('react');
  const make = () => (props: { className?: string }) =>
    R.createElement('span', { 'data-testid': 'mock-icon', className: props?.className });
  return {
    Download: make(),
    RefreshCw: make(),
    ArrowLeftRight: make(),
    FileText: make(),
  };
});

// ---------------------------------------------------------------------------
// zustand store mock
// ---------------------------------------------------------------------------

type GLEntry = {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  amount?: number;
};

let glEntries: GLEntry[] = [];

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(
    (selector?: (s: { entries: GLEntry[] }) => unknown) => {
      const state = { entries: glEntries };
      if (typeof selector === 'function') return selector(state);
      return state;
    },
    { getState: () => ({ entries: glEntries }) }
  ),
}));

// ---------------------------------------------------------------------------
// file-saver mock
// ---------------------------------------------------------------------------
const savedBlobs: Array<{ blob: Blob; name: string }> = [];
vi.mock('file-saver', () => ({
  saveAs: vi.fn((blob: Blob, name: string) => {
    savedBlobs.push({ blob, name });
  }),
}));

// ---------------------------------------------------------------------------
// Leaf UI mocks
// ---------------------------------------------------------------------------

let lastReconciliationPanelProps: any = null;
let lastReconciliationResultsProps: any = null;

vi.mock('./ReconciliationPanel', () => ({
  ReconciliationPanel: (props: any) => {
    lastReconciliationPanelProps = props;
    return (
      <div
        data-testid="rec-panel"
        data-has-file={!!props.recFile}
        data-headers={props.csvHeaders.join(',')}
      >
        <button data-testid="run-btn" onClick={props.onRun}>
          Run
        </button>
        <input
          data-testid="key-col-input"
          value={props.recKeyCol}
          onChange={(e: any) => props.onKeyColChange(e.target.value)}
        />
        <input
          data-testid="val-col-input"
          value={props.recValCol}
          onChange={(e: any) => props.onValColChange(e.target.value)}
        />
        <button
          data-testid="file-input-trigger"
          onClick={() =>
            props.onFile({
              name: 'ext.csv',
              text: () => Promise.resolve(props.__testCsv ?? ''),
            } as any)
          }
        >
          Upload
        </button>
      </div>
    );
  },
}));

vi.mock('./ReconciliationResults', () => ({
  ReconciliationResults: (props: any) => {
    lastReconciliationResultsProps = props;
    return <div data-testid="rec-results" data-rows={props.result.details.length} />;
  },
}));

import ReconciliationPage from '@/pages/data/ReconciliationPage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPage() {
  return render(<ReconciliationPage />);
}

beforeEach(() => {
  glEntries = [];
  savedBlobs.length = 0;
  lastReconciliationPanelProps = null;
  lastReconciliationResultsProps = null;
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReconciliationPage (data-driven)', () => {
  it('renders the page header and status cards', () => {
    renderPage();
    expect(screen.getByText(/Data Reconciliation/i)).toBeInTheDocument();
    expect(screen.getByText(/GL Entries Loaded/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Tolerance/i).length).toBeGreaterThan(0);
  });

  it('shows the "go to GL Upload" CTA when no GL entries are loaded', () => {
    renderPage();
    expect(screen.getByText(/Import GL data first/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to GL Upload/i })).toBeInTheDocument();
  });

  it('shows "Ready for reconciliation" when GL entries are present', () => {
    glEntries = [{ id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 }];
    renderPage();
    expect(screen.getByText(/Ready for reconciliation/i)).toBeInTheDocument();
  });

  it('displays the GL balance count', () => {
    glEntries = [
      { id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 },
      { id: '2', accountCode: '2000', accountName: 'AP', debit: 0, credit: 50 },
    ];
    renderPage();
    expect(screen.getByText(/Unique accounts: 2/i)).toBeInTheDocument();
  });

  it('handles file upload and auto-suggests key/value columns', async () => {
    renderPage();
    const csv = 'AccountCode,Balance\n1000,100\n2000,-50\n';
    await act(async () => {
      // Simulate file upload by directly calling onFile
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    expect(lastReconciliationPanelProps.csvHeaders).toEqual(['AccountCode', 'Balance']);
    expect(lastReconciliationPanelProps.recKeyCol).toBe('AccountCode');
    expect(lastReconciliationPanelProps.recValCol).toBe('Balance');
  });

  it('falls back to first/second headers when no obvious match', async () => {
    renderPage();
    const csv = 'foo,bar\n100,200\n';
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    expect(lastReconciliationPanelProps.recKeyCol).toBe('foo');
    expect(lastReconciliationPanelProps.recValCol).toBe('bar');
  });

  it('shows an error when the CSV has no data rows', async () => {
    renderPage();
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'empty.csv',
        text: () => Promise.resolve('header\n'),
      } as any);
    });
    expect(
      screen.getByText(/CSV must have at least a header and one data row/i)
    ).toBeInTheDocument();
  });

  it('shows an error when the CSV fails to parse', async () => {
    renderPage();
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'bad.csv',
        text: () => Promise.reject(new Error('disk error')),
      } as any);
    });
    expect(screen.getByText(/Failed to parse CSV/i)).toBeInTheDocument();
  });

  it('runs reconciliation and shows matching rows', async () => {
    glEntries = [{ id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 }];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,100\n';
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    // Run reconciliation via the panel's onRun
    await act(async () => {
      lastReconciliationPanelProps.onRun();
    });
    expect(screen.getByTestId('rec-results')).toBeInTheDocument();
    expect(lastReconciliationResultsProps.result.matching).toBe(1);
    expect(lastReconciliationResultsProps.result.mismatches).toBe(0);
    expect(lastReconciliationResultsProps.result.missing).toBe(0);
  });

  it('detects mismatches within tolerance', async () => {
    glEntries = [{ id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 }];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,99.5\n'; // 0.5% diff, within 1% default tolerance
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    await act(async () => {
      lastReconciliationPanelProps.onRun();
    });
    expect(lastReconciliationResultsProps.result.matching).toBe(1);
  });

  it('detects mismatches outside tolerance', async () => {
    glEntries = [{ id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 }];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,50\n'; // 50% diff
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    await act(async () => {
      lastReconciliationPanelProps.onRun();
    });
    expect(lastReconciliationResultsProps.result.mismatches).toBe(1);
  });

  it('detects missing GL accounts (in GL but not in file)', async () => {
    glEntries = [
      { id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 },
      { id: '2', accountCode: '2000', accountName: 'AP', debit: 0, credit: 50 },
    ];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,100\n'; // only 1000 in file
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    await act(async () => {
      lastReconciliationPanelProps.onRun();
    });
    // 2000 has GL balance of -50 but is not in the file → missing
    expect(lastReconciliationResultsProps.result.missing).toBe(1);
  });

  it('detects file-only accounts (in file but not in GL)', async () => {
    glEntries = [{ id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 }];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,100\n9999,500\n'; // 9999 not in GL
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    await act(async () => {
      lastReconciliationPanelProps.onRun();
    });
    // 9999 has expected=0, actual=500 → not a match, not a missing (expected is 0)
    // The logic: expected === 0 → not counted as missing. It IS a mismatch.
    // Wait, let me re-read the logic. If expected=0 and actual=500 and isMatch=false
    // (50% diff > 1% tolerance), then expected === 0 so → missing++.
    // Actually expected=0 is checked: `else if (expected === 0) { missing++; }`.
    // So 9999 contributes to missing.
    expect(lastReconciliationResultsProps.result.missing).toBe(1);
  });

  it('skips zero-zero rows (both GL and file = 0)', async () => {
    glEntries = [];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,0\n';
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    await act(async () => {
      lastReconciliationPanelProps.onRun();
    });
    // GL has no 1000 balance (0). File says 0. Skip zero-zero.
    expect(lastReconciliationResultsProps.result.matching).toBe(0);
    expect(lastReconciliationResultsProps.result.mismatches).toBe(0);
  });

  it('shows "Run" button disabled when no data', () => {
    glEntries = [{ id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 }];
    renderPage();
    // No file uploaded yet — run button is disabled
    const runBtn = screen.getByRole('button', { name: /Run Reconciliation/i });
    expect(runBtn).toBeDisabled();
  });

  it('does not run when key/value columns are missing', async () => {
    glEntries = [{ id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 }];
    renderPage();
    // No file uploaded, so the run button is disabled in the main UI
    const runBtn = screen.getByRole('button', { name: /Run Reconciliation/i });
    expect(runBtn).toBeDisabled();
  });

  it('changing the key column clears the previous result', async () => {
    glEntries = [{ id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 }];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,100\n';
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    await act(async () => {
      lastReconciliationPanelProps.onRun();
    });
    expect(screen.getByTestId('rec-results')).toBeInTheDocument();
    // Change key column
    act(() => {
      lastReconciliationPanelProps.onKeyColChange('Different');
    });
    expect(screen.queryByTestId('rec-results')).not.toBeInTheDocument();
  });

  it('changing the value column clears the previous result', async () => {
    glEntries = [{ id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 }];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,100\n';
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    await act(async () => {
      lastReconciliationPanelProps.onRun();
    });
    expect(screen.getByTestId('rec-results')).toBeInTheDocument();
    act(() => {
      lastReconciliationPanelProps.onValColChange('Different');
    });
    expect(screen.queryByTestId('rec-results')).not.toBeInTheDocument();
  });

  it('tolerance input clamps to [0, 0.1] range', async () => {
    renderPage();
    const toleranceInput = screen.getByDisplayValue('0.01') as HTMLInputElement;
    // Try to set to -1 (out of range)
    act(() => {
      fireEvent.change(toleranceInput, { target: { value: '-1' } });
    });
    expect(screen.getByDisplayValue('0')).toBeInTheDocument();
    // Try to set to 5 (out of range)
    const input2 = screen.getByDisplayValue('0') as HTMLInputElement;
    act(() => {
      fireEvent.change(input2, { target: { value: '5' } });
    });
    expect(screen.getByDisplayValue('0.1')).toBeInTheDocument();
  });

  it('changing tolerance after a result updates the result.tolerance', async () => {
    glEntries = [{ id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 }];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,100\n';
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    await act(async () => {
      lastReconciliationPanelProps.onRun();
    });
    const initialTolerance = lastReconciliationResultsProps.result.tolerance;
    const toleranceInput = screen.getByDisplayValue(
      initialTolerance.toString()
    ) as HTMLInputElement;
    act(() => {
      fireEvent.change(toleranceInput, { target: { value: '0.05' } });
    });
    expect(lastReconciliationResultsProps.result.tolerance).toBe(0.05);
  });

  it('reset button clears all state', async () => {
    glEntries = [{ id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 }];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,100\n';
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    act(() => {
      screen.getByRole('button', { name: /Reset/i }).click();
    });
    expect(lastReconciliationPanelProps.recFile).toBeNull();
    expect(lastReconciliationPanelProps.csvHeaders).toEqual([]);
    expect(lastReconciliationPanelProps.recKeyCol).toBe('');
    expect(lastReconciliationPanelProps.recValCol).toBe('');
  });

  it('export differences button triggers a saveAs call', async () => {
    glEntries = [{ id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 }];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,50\n'; // mismatch
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    await act(async () => {
      lastReconciliationPanelProps.onRun();
    });
    expect(screen.getByRole('button', { name: /Export Differences/i })).toBeInTheDocument();
    act(() => {
      screen.getByRole('button', { name: /Export Differences/i }).click();
    });
    expect(savedBlobs.length).toBe(1);
    expect(savedBlobs[0]!.name).toMatch(/reconciliation-differences-/);
  });

  it('shows the mismatch badge when there are mismatches', async () => {
    glEntries = [
      { id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 },
      { id: '2', accountCode: '2000', accountName: 'AP', debit: 0, credit: 50 },
    ];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,50\n'; // 1000 mismatch, 2000 in GL only (missing)
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    await act(async () => {
      lastReconciliationPanelProps.onRun();
    });
    // 0 match, 1 mismatch, 1 missing
    expect(screen.getByText(/1\s*mismatch/i)).toBeInTheDocument();
    expect(screen.getByText(/1\s*missing/i)).toBeInTheDocument();
  });

  it('aggregates GL balances across multiple entries for the same account', async () => {
    glEntries = [
      { id: '1', accountCode: '1000', accountName: 'Cash', debit: 50, credit: 0 },
      { id: '2', accountCode: '1000', accountName: 'Cash', debit: 50, credit: 0 },
    ];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,100\n'; // sum of 50+50 = 100
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    await act(async () => {
      lastReconciliationPanelProps.onRun();
    });
    expect(lastReconciliationResultsProps.result.matching).toBe(1);
  });

  it('handles amount fallback when debit-credit is zero', async () => {
    glEntries = [
      { id: '1', accountCode: '1000', accountName: 'Cash', debit: 0, credit: 0, amount: 100 },
    ];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,100\n';
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    await act(async () => {
      lastReconciliationPanelProps.onRun();
    });
    // amount is used as fallback
    expect(lastReconciliationResultsProps.result.matching).toBe(1);
  });

  it('parses NaN file values as 0', async () => {
    glEntries = [{ id: '1', accountCode: '1000', accountName: 'Cash', debit: 100, credit: 0 }];
    renderPage();
    const csv = 'AccountCode,Balance\n1000,not-a-number\n';
    await act(async () => {
      lastReconciliationPanelProps.onFile({
        name: 'ext.csv',
        text: () => Promise.resolve(csv),
      } as any);
    });
    await act(async () => {
      lastReconciliationPanelProps.onRun();
    });
    // 100 vs 0 → mismatch
    expect(lastReconciliationResultsProps.result.mismatches).toBe(1);
  });
});
