// =============================================================================
// DocumentsPage tests
// -----------------------------------------------------------------------------
// Real stores (no store-module mocks): documentStore drives the register.
// lucide-react is mocked globally in src/test/setup.ts. The ConfirmDialog host
// normally lives in AppLayout; it is mounted beside the page here so the FIFO
// delete-confirm flow is exercised end-to-end.
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { render, screen, fireEvent, waitFor, within } from '@/test/testUtils';
import { DocumentsPage } from './DocumentsPage';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDocumentStore, type ManagedDocument } from '@/store/documentStore';
import { actAs } from '@/test/rbacFixtures';

expect.extend(toHaveNoViolations);

function makeDoc(overrides: Partial<ManagedDocument> & { id: string }): ManagedDocument {
  return {
    name: 'Q3 budget.xlsx',
    category: 'budget',
    tags: [],
    entityId: null,
    periodId: null,
    size: 2048,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    contentRef: {},
    ...overrides,
  };
}

function resetStore() {
  // Merge mode (no replace flag) — actions must survive the reset.
  useDocumentStore.setState({ documents: [] });
}

beforeEach(() => {
  actAs('Admin');
  resetStore();
});

describe('DocumentsPage', () => {
  it('renders the header and an honest empty state when the register is empty', () => {
    render(<DocumentsPage />);
    expect(screen.getByRole('heading', { name: /documents/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText('0 documents')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Upload your first CSV or Excel artifact above to start the document register.'
      )
    ).toBeInTheDocument();
  });

  it('is axe-clean when empty', async () => {
    const { container } = render(<DocumentsPage />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders documents from the real store and filters by category', () => {
    useDocumentStore.setState({
      documents: [
        makeDoc({ id: 'doc-1', name: 'Q3 budget.xlsx', category: 'budget', tags: ['q3'] }),
        makeDoc({ id: 'doc-2', name: 'Revenue forecast.csv', category: 'forecast' }),
      ],
    });
    render(<DocumentsPage />);

    const list = screen.getByRole('list', { name: /document list/i });
    expect(within(list).getByText('Q3 budget.xlsx')).toBeInTheDocument();
    expect(within(list).getByText('Revenue forecast.csv')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/filter by category/i), {
      target: { value: 'forecast' },
    });
    expect(within(list).queryByText('Q3 budget.xlsx')).toBeNull();
    expect(within(list).getByText('Revenue forecast.csv')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/filter by category/i), { target: { value: 'all' } });
    fireEvent.click(screen.getByRole('button', { name: '#q3' }));
    expect(within(list).getByText('Q3 budget.xlsx')).toBeInTheDocument();
    expect(within(list).queryByText('Revenue forecast.csv')).toBeNull();
  });

  it('uploads a file into the store (happy path) and selects it for preview', () => {
    render(<DocumentsPage />);
    fireEvent.change(screen.getByLabelText(/tags \(comma-separated\)/i), {
      target: { value: 'board, q3' },
    });
    fireEvent.change(screen.getByLabelText(/entity id/i), { target: { value: 'entity-001' } });

    const csv = new File(['account,amount\n1000,50'], 'transactions.csv', { type: 'text/csv' });
    fireEvent.change(document.getElementById('file-input')!, { target: { files: [csv] } });

    const list = screen.getByRole('list', { name: /document list/i });
    expect(within(list).getByText('transactions.csv')).toBeInTheDocument();
    expect(screen.getByText('1 document')).toBeInTheDocument();

    const stored = useDocumentStore.getState().documents[0]!;
    expect(stored.category).toBe('report');
    expect(stored.tags).toEqual(['board', 'q3']);
    expect(stored.entityId).toBe('entity-001');
    expect(stored.size).toBe(csv.size);
    expect(stored.mimeType).toBe('text/csv');

    const panel = screen.getByRole('region', { name: /details for transactions\.csv/i });
    expect(within(panel).getByText('report')).toBeInTheDocument();
    expect(within(panel).getByTestId('version-count')).toHaveTextContent('1');
  });

  it('deletes through the ConfirmDialog FIFO flow', async () => {
    useDocumentStore.setState({
      documents: [makeDoc({ id: 'doc-1', name: 'Q3 budget.xlsx' })],
    });
    render(
      <>
        <DocumentsPage />
        <ConfirmDialog />
      </>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete Q3 budget.xlsx' }));
    const dialog = await screen.findByRole('dialog', { name: /delete q3 budget\.xlsx\?/i });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(useDocumentStore.getState().documents).toHaveLength(0);
    });
    expect(screen.queryByRole('list', { name: /document list/i })).toBeNull();
  });

  it('renames from the metadata panel', () => {
    useDocumentStore.setState({
      documents: [makeDoc({ id: 'doc-1', name: 'Draft pack' })],
    });
    render(<DocumentsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Select Draft pack' }));
    fireEvent.change(screen.getByLabelText('Document name'), { target: { value: 'Final pack' } });
    fireEvent.click(screen.getByRole('button', { name: /save name/i }));

    expect(useDocumentStore.getState().documents[0]!.name).toBe('Final pack');
    expect(screen.getByRole('region', { name: /details for final pack/i })).toBeInTheDocument();
  });

  it('is axe-clean with content', async () => {
    useDocumentStore.setState({
      documents: [
        makeDoc({ id: 'doc-1', tags: ['q3'] }),
        makeDoc({ id: 'doc-2', name: 'Scenario pack.pdf', category: 'scenario' }),
      ],
    });
    const { container } = render(<DocumentsPage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
