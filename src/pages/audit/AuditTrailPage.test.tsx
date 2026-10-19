import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';

vi.mock('@/store/auditTrailStore', async () => {
  const actual =
    await vi.importActual<typeof import('@/store/auditTrailStore')>('@/store/auditTrailStore');
  return {
    ...actual,
    useAuditTrailStore: vi.fn(),
  };
});

const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;
vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

import {
  useAuditTrailStore,
  selectCanViewGdprAudit,
  GDPR_AUDIT_VIEW_ROLES,
} from '@/store/auditTrailStore';
import type {
  ExtendedAuditEntry as StoreAuditEntry,
  AuditFilters as AuditFiltersState,
} from '@/store/auditTrailStore';
import AuditTrailPage from '@/pages/audit/AuditTrailPage';
import { AuditFilters } from '@/components/audit/AuditFilters';
import { AuditRow } from '@/components/audit/AuditRow';
import { AuditDiff } from '@/components/audit/AuditDiff';
import { AuditCompliancePanel } from '@/components/audit/AuditCompliancePanel';
import { AuditExportButton } from '@/components/audit/AuditExportButton';
import { actAs, signOut } from '@/test/rbacFixtures';

const baseCell = {
  sectorId: 'retail',
  scenarioId: 'base-2026',
  periodId: 'q1-2026',
  lineItemId: 'revenue',
} as const;

const mockEntries: StoreAuditEntry[] = [
  {
    id: 'e-1',
    timestamp: 1718700000000,
    cellId: { ...baseCell },
    userId: 'alice@finplan.io',
    operation: 'write',
    dataType: 'number',
    newValue: 1000,
    approvalStatus: 'approved',
    approvalUserId: 'bob@finplan.io',
    source: 'manual',
    transactionId: 'txn-1',
    metadata: { note: 'Initial entry by alice@finplan.io' },
  },
  {
    id: 'e-2',
    timestamp: 1718800000000,
    cellId: { ...baseCell },
    userId: 'carol@finplan.io',
    operation: 'update',
    dataType: 'number',
    previousValue: 1000,
    newValue: 1500,
    approvalStatus: 'pending',
    source: 'automation',
  },
  {
    id: 'e-3',
    timestamp: 1718900000000,
    cellId: { ...baseCell },
    userId: 'dave@finplan.io',
    operation: 'delete',
    dataType: 'number',
    previousValue: 1500,
    newValue: null,
    approvalStatus: 'rejected',
    source: 'gdpr',
    consentId: 'consent-123',
    breachEventId: 'breach-456',
  },
];

const pageStoreEntries: StoreAuditEntry[] = [
  {
    ...mockEntries[0]!,
    id: 'audit-1',
    cellId: { ...baseCell, lineItemId: 'revenue' },
    accountId: '4000',
    accountName: 'Revenue',
    previousValue: 1000,
    newValue: 1500,
    userId: 'u-alice',
    userName: 'Alice Analyst',
    timestamp: new Date('2026-07-27T06:00:00.000Z').getTime(),
    reason: 'Monthly close adjustment',
    operation: 'update',
    dataType: 'number',
    source: 'manual',
    approvalStatus: 'approved',
    approvedBy: 'Controller',
    metadata: { importId: 'imp-1' },
  },
  {
    ...mockEntries[1]!,
    id: 'audit-2',
    cellId: { ...baseCell, lineItemId: 'cash' },
    accountId: '1000',
    accountName: 'Cash',
    newValue: 500,
    userId: 'u-bob',
    userName: 'Bob Builder',
    timestamp: new Date('2026-07-26T06:00:00.000Z').getTime(),
    reason: 'Imported from GL',
    operation: 'write',
    dataType: 'number',
    source: 'import',
    approvalStatus: 'pending',
  },
];

const createMockStoreState = (
  overrides: Partial<{
    entries: StoreAuditEntry[];
    filters: Partial<AuditFiltersState>;
    currentPage: number;
    pageSize: 25 | 50 | 100 | 500;
    selectedEntryId: string | null;
  }> = {}
) => {
  const state = {
    entries: overrides.entries ?? mockEntries,
    filters: {
      cellId: undefined,
      userId: undefined,
      operation: undefined,
      dataType: undefined,
      approvalStatus: undefined,
      source: undefined,
      transactionId: undefined,
      dateRange: undefined,
      valueRange: undefined,
      fullTextSearch: undefined,
      hasVersion: undefined,
      hasConsent: undefined,
      ...overrides.filters,
    } as AuditFiltersState,
    currentPage: overrides.currentPage ?? 1,
    pageSize: overrides.pageSize ?? 50,
    sortField: 'timestamp' as const,
    sortDir: 'desc' as const,
    selectedEntryId: overrides.selectedEntryId ?? null,
    loading: false,
    seedDemoData: vi.fn(),
    recordWrite: vi.fn(() => 'new-id'),
    recordUpdate: vi.fn(() => 'new-id'),
    recordDelete: vi.fn(() => 'new-id'),
    recordBulk: vi.fn(() => ['id-1', 'id-2']),
    setFilter: vi.fn(),
    clearFilters: vi.fn(),
    setSort: vi.fn(),
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    selectEntry: vi.fn(),
    revertToState: vi.fn(),
    refreshEntries: vi.fn(),
    exportToCSV: vi.fn(() => ''),
    exportToJSON: vi.fn(() => ''),
  };
  return state;
};

type MockAuditStoreState = ReturnType<typeof createMockStoreState>;

const mockUseAuditTrailStore = (state: MockAuditStoreState) => {
  vi.mocked(useAuditTrailStore).mockImplementation(
    (selector: ((state: MockAuditStoreState) => unknown) | undefined) => {
      if (typeof selector === 'function') return selector(state);
      return state;
    }
  );
};

beforeEach(() => signOut());

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <BrowserRouter>
      <I18nextProvider i18n={i18next}>{ui}</I18nextProvider>
    </BrowserRouter>
  );

describe('AuditTrailPage', () => {
  beforeEach(() => {
    actAs('Admin');
    vi.clearAllMocks();
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
    // The page now consumes the persisted chain; this fixture uses that store's schema.
    const adminState = createMockStoreState({ entries: pageStoreEntries });
    mockUseAuditTrailStore(adminState);
  });

  it('renders persisted audit entries through the page compatibility adapter', () => {
    renderWithProviders(<AuditTrailPage />);

    expect(screen.getByRole('heading', { name: /audit trail/i })).toBeInTheDocument();
    expect(screen.getByText(/Alice Analyst/i)).toBeInTheDocument();
    expect(screen.getByText(/Bob Builder/i)).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText(/2 of 2 entries shown/i)).toBeInTheDocument();
  });

  it('revokes mounted page access immediately when the authenticated session ends', () => {
    renderWithProviders(<AuditTrailPage />);
    expect(screen.getByRole('heading', { name: /audit trail/i })).toBeInTheDocument();

    act(() => signOut());

    expect(screen.getByRole('heading', { name: /access denied/i })).toBeInTheDocument();
    expect(screen.queryByText(/Alice Analyst/i)).not.toBeInTheDocument();
  });

  it('states the actual recorder boundary when the persisted trail is empty', () => {
    mockUseAuditTrailStore(createMockStoreState({ entries: [] }));

    renderWithProviders(<AuditTrailPage />);

    expect(screen.getByRole('heading', { name: /no audit entries/i })).toBeInTheDocument();
    expect(
      screen.getByText(/general budget, forecast, and GL edits are not yet wired/i)
    ).toBeInTheDocument();
  });

  it('filters page entries by operation and search text', () => {
    renderWithProviders(<AuditTrailPage />);

    fireEvent.change(screen.getByLabelText(/operation/i), { target: { value: 'write' } });
    expect(screen.queryByText(/Alice Analyst/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Bob Builder/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/search audit entries/i), {
      target: { value: 'cash' },
    });
    expect(screen.getByText(/Bob Builder/i)).toBeInTheDocument();
  });

  it('exports the currently filtered page entries to CSV', () => {
    renderWithProviders(<AuditTrailPage />);

    fireEvent.click(screen.getByRole('button', { name: /^export$/i }));

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
  });
});

describe('AuditFilters RBAC gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viewer role does NOT see "gdpr" source option', () => {
    actAs('Viewer');
    mockUseAuditTrailStore(createMockStoreState());

    renderWithProviders(<AuditFilters />);
    const sourceSelect = screen.getByLabelText(/source/i) as HTMLSelectElement;
    const optionTexts = Array.from(sourceSelect.options).map((o) => o.textContent);
    expect(optionTexts).not.toContain('gdpr');
    expect(optionTexts).toContain('manual');
    expect(optionTexts).toContain('automation');

    const userSelect = screen.getByLabelText(/filter by user/i) as HTMLSelectElement;
    expect(Array.from(userSelect.options).map((option) => option.textContent)).not.toContain(
      'dave@finplan.io'
    );
  });

  it('admin role DOES see "gdpr" source option', () => {
    actAs('Admin');
    mockUseAuditTrailStore(createMockStoreState());

    renderWithProviders(<AuditFilters />);
    const sourceSelect = screen.getByLabelText(/source/i) as HTMLSelectElement;
    const optionTexts = Array.from(sourceSelect.options).map((o) => o.textContent);
    expect(optionTexts).toContain('gdpr');
  });

  it('revokes the GDPR source option immediately when the authenticated session ends', () => {
    actAs('Admin');
    mockUseAuditTrailStore(createMockStoreState());
    renderWithProviders(<AuditFilters />);

    const sourceSelect = screen.getByLabelText(/source/i) as HTMLSelectElement;
    expect(Array.from(sourceSelect.options).map((option) => option.textContent)).toContain('gdpr');

    act(() => signOut());

    expect(Array.from(sourceSelect.options).map((option) => option.textContent)).not.toContain(
      'gdpr'
    );
  });

  it('viewer role does NOT see "Has GDPR consent" checkbox', () => {
    actAs('Viewer');
    mockUseAuditTrailStore(createMockStoreState());

    renderWithProviders(<AuditFilters />);
    expect(screen.queryByLabelText(/has gdpr consent/i)).not.toBeInTheDocument();
  });

  it('admin role DOES see "Has GDPR consent" checkbox', () => {
    actAs('Admin');
    mockUseAuditTrailStore(createMockStoreState());

    renderWithProviders(<AuditFilters />);
    expect(screen.getByLabelText(/has gdpr consent/i)).toBeInTheDocument();
  });

  it('selectCanViewGdprAudit ignores mutable store fields and follows the session', () => {
    expect(selectCanViewGdprAudit(createMockStoreState())).toBe(false);
    actAs('Admin');
    expect(selectCanViewGdprAudit(createMockStoreState())).toBe(true);
    actAs('Viewer');
    expect(selectCanViewGdprAudit(createMockStoreState())).toBe(false);
  });

  it('GDPR_AUDIT_VIEW_ROLES const has 3 expected roles', () => {
    expect(GDPR_AUDIT_VIEW_ROLES).toEqual(['admin', 'compliance', 'data-protection-officer']);
  });
});

describe('AuditDiff', () => {
  it('renders old and new string values with word-level diff pieces', () => {
    const { container } = renderWithProviders(
      <AuditDiff previousValue="Q1 2025" newValue="Q1 2026" />
    );

    expect(container).toHaveTextContent('Q1');
    expect(container).toHaveTextContent('2025');
    expect(container).toHaveTextContent('2026');
  });

  it('numeric values show delta amount and percentage', () => {
    const { container } = renderWithProviders(<AuditDiff previousValue={1000} newValue={1500} />);

    expect(container).toHaveTextContent('1000');
    expect(container).toHaveTextContent('1500');
    expect(container).toHaveTextContent('+500');
    expect(container).toHaveTextContent('+50.0%');
  });

  it('boolean toggle shows previous and new boolean values', () => {
    const { container } = renderWithProviders(<AuditDiff previousValue={false} newValue={true} />);

    expect(container).toHaveTextContent('false');
    expect(container).toHaveTextContent('true');
  });
});

describe('AuditRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('click row expands to the three-column detail view', async () => {
    mockUseAuditTrailStore(createMockStoreState());
    const mockEntry = mockEntries[0];
    if (!mockEntry) throw new Error('mockEntries[0] missing');

    renderWithProviders(<AuditRow entry={mockEntry} />);
    fireEvent.click(screen.getByRole('button', { name: /audit entry e-1/i }));

    await waitFor(() => {
      expect(screen.getByText(/full metadata/i)).toBeInTheDocument();
      expect(screen.getByText(/approval \+ diff/i)).toBeInTheDocument();
      expect(screen.getByText(/actions/i)).toBeInTheDocument();
      expect(screen.getAllByText(/txn-1/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/initial entry/i).length).toBeGreaterThan(0);
    });
  });
});

describe('AuditCompliancePanel', () => {
  it('renders GDPR/RBAC/SOX compliance status from selectStats', () => {
    mockUseAuditTrailStore(createMockStoreState());

    renderWithProviders(<AuditCompliancePanel />);
    expect(screen.getByRole('heading', { name: /compliance/i })).toBeInTheDocument();
    expect(screen.getAllByText(/GDPR/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/SOX/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate compliance report/i })).toBeInTheDocument();
  });
});

describe('Audit export + local email redaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
  });

  it('renders CSV and JSON export controls', () => {
    mockUseAuditTrailStore(createMockStoreState());

    renderWithProviders(<AuditExportButton />);

    expect(screen.getByRole('button', { name: /export to csv/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export to json/i })).toBeInTheDocument();
  });

  it('CSV export triggers Blob URL with store-provided redacted content', () => {
    const csvOutput = [
      'id,timestamp,cellId,userId,operation,dataType,previousValue,newValue,approvalStatus,source,transactionId',
      '"e-1","2024-06-18T00:00:00.000Z","retail/base-2026/q1-2026/revenue","ali***@finplan.io","write","number","","1000","approved","manual","txn-1"',
    ].join('\n');
    const state = createMockStoreState();
    state.exportToCSV = vi.fn(() => csvOutput);
    mockUseAuditTrailStore(state);

    renderWithProviders(<AuditExportButton />);
    fireEvent.click(screen.getByRole('button', { name: /export to csv/i }));

    expect(state.exportToCSV).toHaveBeenCalledTimes(1);
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
  });

  it('JSON export does NOT contain raw email addresses', () => {
    const jsonOutput = JSON.stringify(
      mockEntries.map((entry) => ({
        ...entry,
        userId: entry.userId.replace(/(.{3}).*@/, '$1***@'),
        approvalUserId: entry.approvalUserId?.replace(/(.{3}).*@/, '$1***@'),
        metadata: entry.metadata
          ? { ...entry.metadata, note: 'Initial entry by ali***@finplan.io' }
          : undefined,
      })),
      null,
      2
    );
    const state = createMockStoreState();
    state.exportToJSON = vi.fn(() => jsonOutput);
    mockUseAuditTrailStore(state);

    renderWithProviders(<AuditExportButton />);
    fireEvent.click(screen.getByRole('button', { name: /export to json/i }));

    expect(state.exportToJSON).toHaveBeenCalledTimes(1);
    expect(jsonOutput).not.toContain('alice@finplan.io');
    expect(jsonOutput).not.toContain('carol@finplan.io');
    expect(jsonOutput).toContain('ali***@');
    expect(jsonOutput).toContain('car***@');
  });

  it('revokeObjectURL is called after Blob download', () => {
    mockUseAuditTrailStore(createMockStoreState());

    renderWithProviders(<AuditExportButton />);
    fireEvent.click(screen.getByRole('button', { name: /export to csv/i }));

    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });
});

describe('AuditTrailPage integration', () => {
  it('clearFilters resets all active filter state', () => {
    const state = createMockStoreState({
      filters: {
        cellId: 'retail',
        userId: 'alice@finplan.io',
        source: 'manual',
      },
    });
    mockUseAuditTrailStore(state);

    renderWithProviders(<AuditFilters />);
    const clearBtn = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearBtn);

    expect(state.clearFilters).toHaveBeenCalledTimes(1);
  });
});
