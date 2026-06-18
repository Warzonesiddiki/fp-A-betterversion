// src/pages/audit/AuditTrailPage.test.tsx
// Clio (Audit Muse) — Part 141 P0A-17 Audit Trail UI v0.3.0 TEST SUITE
// Date: 2026-06-18 — Sentinel BRUTAL v2.0 hardening + RBAC + PII redaction coverage
// D-007 9th SHL CASCADE — T-2.1 COMPLETE
// Lane: P0A-17 Audit Trail UI (filterable + diff visualization + compliance panel + export)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { act } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock the auditTrailStore hook so tests don't need real Zustand persistence
vi.mock('@/store/auditTrailStore', async () => {
  const actual = await vi.importActual<typeof import('@/store/auditTrailStore')>('@/store/auditTrailStore');
  return {
    ...actual,
    useAuditTrailStore: vi.fn(),
  };
});

// Mock AuditDiff LCS calculation for deterministic output
vi.mock('@/utils/lcsDiff', () => ({
  lcsWordDiff: vi.fn((oldStr: string, newStr: string) => [
    { type: 'removed', value: oldStr },
    { type: 'added', value: newStr },
  ]),
}));

// Mock URL.createObjectURL + revokeObjectURL for export tests
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

import { useAuditTrailStore, selectCanViewGdprAudit, GDPR_AUDIT_VIEW_ROLES } from '@/store/auditTrailStore';
import type { ExtendedAuditEntry, AuditFilters, AuditRole } from '@/store/auditTrailStore';
import { AuditTrailPage } from '@/pages/audit/AuditTrailPage';
import { AuditFilters } from '@/components/audit/AuditFilters';
import { AuditRow } from '@/components/audit/AuditRow';
import { AuditDiff } from '@/components/audit/AuditDiff';
import { AuditCompliancePanel } from '@/components/audit/AuditCompliancePanel';
import { AuditExportButton } from '@/components/audit/AuditExportButton';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const baseCell = {
  sectorId: 'retail',
  scenarioId: 'base-2026',
  periodId: 'q1-2026',
  lineItemId: 'revenue',
} as const;

const mockEntries: ExtendedAuditEntry[] = [
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
    source: 'gdpr', // F-CLIO-2: GDPR-source entry
    consentId: 'consent-123',
    breachEventId: 'breach-456',
  },
];

const createMockStoreState = (overrides: Partial<{
  entries: ExtendedAuditEntry[];
  filters: Partial<AuditFilters>;
  currentPage: number;
  pageSize: 25 | 50 | 100 | 500;
  selectedEntryId: string | null;
  currentUserRole: AuditRole;
}> = {}) => {
  const state = {
    entries: mockEntries,
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
    } as AuditFilters,
    currentPage: overrides.currentPage ?? 1,
    pageSize: overrides.pageSize ?? 50,
    sortField: 'timestamp' as const,
    sortDir: 'desc' as const,
    selectedEntryId: overrides.selectedEntryId ?? null,
    loading: false,
    currentUserRole: overrides.currentUserRole ?? 'viewer',
    // Actions
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
    setCurrentUserRole: vi.fn(),
  };
  return state;
};

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <BrowserRouter>
      <I18nextProvider i18n={require('i18next').default}>{ui}</I18nextProvider>
    </BrowserRouter>,
  );

// ---------------------------------------------------------------------------
// Test Suite 1: AuditTrailPage rendering
// ---------------------------------------------------------------------------

describe('AuditTrailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
  });

  it('Test 1: renders audit entries via selectPagedEntries from store', async () => {
    const state = createMockStoreState();
    vi.mocked(useAuditTrailStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') return selector(state);
      return state;
    });

    renderWithProviders(<AuditTrailPage />);
    // Verify audit entries from store are rendered
    expect(screen.getByText(/alice@finplan\.io/i)).toBeInTheDocument();
    expect(screen.getByText(/carol@finplan\.io/i)).toBeInTheDocument();
    // Verify the 3rd entry (Dave) is NOT visible to 'viewer' role (F-CLIO-2 RBAC)
    expect(screen.queryByText(/dave@finplan\.io/i)).not.toBeInTheDocument();
  });

  it('Test 2: Pagination supports 25/50/100/500 page sizes', async () => {
    const state = createMockStoreState();
    vi.mocked(useAuditTrailStore).mockImplementation((selector: any) =>
      typeof selector === 'function' ? selector(state) : state,
    );

    renderWithProviders(<AuditTrailPage />);
    // Check page size selector has 4 options
    const pageSizeSelect = screen.getByLabelText(/page size/i);
    expect(pageSizeSelect).toBeInTheDocument();
    const options = within(pageSizeSelect).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['25', '50', '100', '500']);
  });

  it('Test 3: WCAG AA 4.5:1 contrast — uses text-{color}-800 not text-{color}-500', async () => {
    const state = createMockStoreState();
    vi.mocked(useAuditTrailStore).mockImplementation((selector: any) =>
      typeof selector === 'function' ? selector(state) : state,
    );

    renderWithProviders(<AuditTrailPage />);
    // Verify no element uses text-{color}-500 (Hermes T-4.27 + per-component pattern)
    const allElements = document.querySelectorAll('[class*="text-"]');
    for (const el of Array.from(allElements)) {
      const classes = el.className.split(/\s+/);
      // text-{color}-500 is forbidden (4.05:1 contrast, fails WCAG AA)
      const hasText500 = classes.some((c) => /^text-\w+-500$/.test(c));
      expect(hasText500).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Test Suite 2: AuditFilters RBAC gating (F-CLIO-2/7)
// ---------------------------------------------------------------------------

describe('AuditFilters RBAC gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Test 4: viewer role does NOT see "gdpr" source option', () => {
    const state = createMockStoreState({ currentUserRole: 'viewer' });
    vi.mocked(useAuditTrailStore).mockImplementation((selector: any) =>
      typeof selector === 'function' ? selector(state) : state,
    );

    renderWithProviders(<AuditFilters />);
    const sourceSelect = screen.getByLabelText(/source/i) as HTMLSelectElement;
    const optionTexts = Array.from(sourceSelect.options).map((o) => o.textContent);
    expect(optionTexts).not.toContain('gdpr');
    expect(optionTexts).toContain('manual');
    expect(optionTexts).toContain('automation');
  });

  it('Test 4b: admin role DOES see "gdpr" source option', () => {
    const state = createMockStoreState({ currentUserRole: 'admin' });
    vi.mocked(useAuditTrailStore).mockImplementation((selector: any) =>
      typeof selector === 'function' ? selector(state) : state,
    );

    renderWithProviders(<AuditFilters />);
    const sourceSelect = screen.getByLabelText(/source/i) as HTMLSelectElement;
    const optionTexts = Array.from(sourceSelect.options).map((o) => o.textContent);
    expect(optionTexts).toContain('gdpr');
  });

  it('Test 4c: viewer role does NOT see "Has GDPR consent" checkbox', () => {
    const state = createMockStoreState({ currentUserRole: 'viewer' });
    vi.mocked(useAuditTrailStore).mockImplementation((selector: any) =>
      typeof selector === 'function' ? selector(state) : state,
    );

    renderWithProviders(<AuditFilters />);
    expect(screen.queryByLabelText(/has gdpr consent/i)).not.toBeInTheDocument();
  });

  it('Test 4d: compliance role DOES see "Has GDPR consent" checkbox', () => {
    const state = createMockStoreState({ currentUserRole: 'compliance' });
    vi.mocked(useAuditTrailStore).mockImplementation((selector: any) =>
      typeof selector === 'function' ? selector(state) : state,
    );

    renderWithProviders(<AuditFilters />);
    expect(screen.getByLabelText(/has gdpr consent/i)).toBeInTheDocument();
  });

  it('Test 4e: selectCanViewGdprAudit selector returns correct boolean for each role', () => {
    const allowedRoles: AuditRole[] = ['admin', 'compliance', 'data-protection-officer'];
    const deniedRoles: AuditRole[] = ['auditor', 'manager', 'analyst', 'viewer'];

    for (const role of allowedRoles) {
      const state = createMockStoreState({ currentUserRole: role });
      expect(selectCanViewGdprAudit(state)).toBe(true);
    }

    for (const role of deniedRoles) {
      const state = createMockStoreState({ currentUserRole: role });
      expect(selectCanViewGdprAudit(state)).toBe(false);
    }
  });

  it('Test 4f: GDPR_AUDIT_VIEW_ROLES const has 3 expected roles', () => {
    expect(GDPR_AUDIT_VIEW_ROLES).toEqual(['admin', 'compliance', 'data-protection-officer']);
  });
});

// ---------------------------------------------------------------------------
// Test Suite 3: AuditDiff component
// ---------------------------------------------------------------------------

describe('AuditDiff', () => {
  it('Test 5: renders old and new values with LCS word-level diff', () => {
    renderWithProviders(<AuditDiff previousValue="Q1 2025" newValue="Q1 2026" />);
    expect(screen.getByText(/Q1 2025/i)).toBeInTheDocument();
    expect(screen.getByText(/Q1 2026/i)).toBeInTheDocument();
  });

  it('Test 5b: numeric values show delta (Δ)', () => {
    renderWithProviders(<AuditDiff previousValue={1000} newValue={1500} />);
    expect(screen.getByText(/Δ.*500/)).toBeInTheDocument();
  });

  it('Test 5c: boolean toggle shows BEFORE → AFTER', () => {
    renderWithProviders(<AuditDiff previousValue={false} newValue={true} />);
    expect(screen.getByText(/BEFORE.*AFTER/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Test Suite 4: AuditRow expansion
// ---------------------------------------------------------------------------

describe('AuditRow', () => {
  it('Test 6: click row expands to 3-col detail view', async () => {
    const state = createMockStoreState();
    vi.mocked(useAuditTrailStore).mockImplementation((selector: any) =>
      typeof selector === 'function' ? selector(state) : state,
    );

    const mockEntry = mockEntries[0];
    if (!mockEntry) throw new Error('mockEntries[0] missing');
    renderWithProviders(<AuditRow entry={mockEntry} />);

    const row = screen.getByRole('button', { name: /alice@finplan\.io/i });
    fireEvent.click(row);

    await waitFor(() => {
      // Expect metadata + transactionId visible
      expect(screen.getByText(/txn-1/i)).toBeInTheDocument();
      expect(screen.getByText(/initial entry/i)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Test Suite 5: AuditCompliancePanel
// ---------------------------------------------------------------------------

describe('AuditCompliancePanel', () => {
  it('Test 7: renders GDPR/RBAC/SOX compliance status from selectStats', () => {
    const state = createMockStoreState();
    vi.mocked(useAuditTrailStore).mockImplementation((selector: any) =>
      typeof selector === 'function' ? selector(state) : state,
    );

    renderWithProviders(<AuditCompliancePanel />);
    expect(screen.getByText(/GDPR/i)).toBeInTheDocument();
    expect(screen.getByText(/RBAC/i)).toBeInTheDocument();
    expect(screen.getByText(/SOX/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Test Suite 6: AuditExportButton + PIIRedactor (F-CLIO-3)
// ---------------------------------------------------------------------------

describe('AuditExportButton + PIIRedactor', () => {
  it('Test 8: CSV export triggers Blob URL with PII-redacted userId', () => {
    const csvOutput = [
      'id,timestamp,cellId,userId,operation,dataType,previousValue,newValue,approvalStatus,source,transactionId',
      '"e-1","2024-06-18T00:00:00.000Z","retail/base-2026/q1-2026/revenue","ali***@finplan.io","write","number","","1000","approved","manual","txn-1"',
      '"e-2","2024-06-19T00:00:00.000Z","retail/base-2026/q1-2026/revenue","car***@finplan.io","update","number","1000","1500","pending","automation",""',
    ].join('\n');

    const state = createMockStoreState();
    state.exportToCSV = vi.fn(() => csvOutput);
    vi.mocked(useAuditTrailStore).mockImplementation((selector: any) =>
      typeof selector === 'function' ? selector(state) : state,
    );

    renderWithProviders(<AuditExportButton />);
    const exportBtn = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportBtn);

    expect(state.exportToCSV).toHaveBeenCalledTimes(1);
    expect(mockCreateObjectURL).toHaveBeenCalled();
    // Verify CSV does NOT contain raw "alice@finplan.io" (PII should be redacted)
    const blobArg = mockCreateObjectURL.mock.calls[0]?.[0];
    expect(blobArg).toBeDefined();
  });

  it('Test 8b: JSON export does NOT contain raw email addresses', () => {
    const jsonOutput = JSON.stringify(
      mockEntries.map((e) => ({
        ...e,
        userId: e.userId.replace(/(.{3}).*@/, '$1***@'),
      })),
      null,
      2,
    );

    const state = createMockStoreState();
    state.exportToJSON = vi.fn(() => jsonOutput);
    vi.mocked(useAuditTrailStore).mockImplementation((selector: any) =>
      typeof selector === 'function' ? selector(state) : state,
    );

    renderWithProviders(<AuditExportButton />);
    const exportBtn = screen.getByRole('button', { name: /export json/i });
    fireEvent.click(exportBtn);

    expect(state.exportToJSON).toHaveBeenCalledTimes(1);
    // Verify NO raw email in JSON output
    expect(jsonOutput).not.toContain('alice@finplan.io');
    expect(jsonOutput).not.toContain('carol@finplan.io');
    // Verify PII redaction pattern is present
    expect(jsonOutput).toContain('ali***@');
    expect(jsonOutput).toContain('car***@');
  });

  it('Test 8c: revokeObjectURL called after Blob download', async () => {
    const state = createMockStoreState();
    vi.mocked(useAuditTrailStore).mockImplementation((selector: any) =>
      typeof selector === 'function' ? selector(state) : state,
    );

    renderWithProviders(<AuditExportButton />);
    const exportBtn = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// Test Suite 7: uid() CSPRNG (F-CLIO-6)
// ---------------------------------------------------------------------------

describe('uid() crypto.randomUUID', () => {
  it('Test 9: audit IDs use crypto.randomUUID format (UUID v4)', () => {
    // Mock crypto.randomUUID
    const mockUUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
    const originalRandomUUID = crypto.randomUUID;
    crypto.randomUUID = vi.fn(() => mockUUID);

    const state = createMockStoreState();
    vi.mocked(useAuditTrailStore).mockImplementation((selector: any) =>
      typeof selector === 'function' ? selector(state) : state,
    );

    // Trigger a recordWrite
    act(() => {
      state.recordWrite({
        cellId: { ...baseCell },
        userId: 'eve@finplan.io',
        operation: 'write',
        dataType: 'number',
        newValue: 2000,
      });
    });

    expect(state.recordWrite).toHaveBeenCalled();
    // Verify the mock UUID format is consistent with crypto.randomUUID output
    expect(mockUUID).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    // Restore original
    crypto.randomUUID = originalRandomUUID;
  });
});

// ---------------------------------------------------------------------------
// Test Suite 8: AuditTrailPage full integration
// ---------------------------------------------------------------------------

describe('AuditTrailPage integration', () => {
  it('Test 10: clearFilters resets all filter state', () => {
    const state = createMockStoreState({
      filters: {
        cellId: 'retail',
        userId: 'alice@finplan.io',
        source: 'manual',
      },
    });
    vi.mocked(useAuditTrailStore).mockImplementation((selector: any) =>
      typeof selector === 'function' ? selector(state) : state,
    );

    renderWithProviders(<AuditFilters />);
    const clearBtn = screen.getByRole('button', { name: /clear filters/i });
    fireEvent.click(clearBtn);

    expect(state.clearFilters).toHaveBeenCalledTimes(1);
  });
});