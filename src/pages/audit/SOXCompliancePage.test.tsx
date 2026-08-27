import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
// Mock engines before importing the page
const mockGenerateReport = vi.fn(() => ({
  overallScore: 85,
  overallStatus: 'pass',
  generatedAt: new Date().toISOString(),
  summary: { passed: 10, failed: 1, warnings: 2, total: 13 },
  checks: [
    {
      id: 'check-1',
      controlId: 'SOX-001',
      category: 'audit_trail',
      name: 'Audit Trail Exists',
      status: 'pass',
      severity: 'high',
      description: 'Verify audit trail',
      details: 'All entries logged',
      evidence: ['Log entry 1'],
      remediation: null,
    },
  ],
  byCategory: {
    approval_workflow: { passed: 2, failed: 0, total: 2 },
    segregation_of_duties: { passed: 2, failed: 0, total: 2 },
    audit_trail: { passed: 2, failed: 0, total: 2 },
    data_integrity: { passed: 2, failed: 0, total: 2 },
    access_control: { passed: 1, failed: 1, total: 2 },
    financial_reporting: { passed: 1, failed: 0, total: 1 },
  },
  criticalFindings: [],
  recommendations: ['Enable two-factor authentication'],
}));

vi.mock('@/engines/SOXComplianceEngine', () => ({
  SOXComplianceEngine: class {
    generateReport() {
      return mockGenerateReport();
    }
  },
}));

vi.mock('@/engines/AuditLogEngine', () => ({
  AuditLogEngine: class {
    log() {}
    getLogs() {
      return [];
    }
  },
}));

vi.mock('@/engines/WorkflowEngine', () => ({
  WorkflowEngine: class {
    createWorkflow() {
      return { id: 'wf-1' };
    }
    submitRequest() {}
  },
}));

vi.mock('@/engines/RBACEngine', () => ({
  RBACEngine: class {
    assignRole() {}
  },
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    Shield: makeIcon(),
    Download: makeIcon(),
    RefreshCw: makeIcon(),
    AlertTriangle: makeIcon(),
    CheckCircle: makeIcon(),
    XCircle: makeIcon(),
    Info: makeIcon(),
    Lock: makeIcon(),
    Users: makeIcon(),
    FileText: makeIcon(),
    BarChart3: makeIcon(),
    CalendarCheck: makeIcon(),
    // E-09-F: icons used by the ui/EmptyState component rendered by the
    // connect-GL empty state.
    Inbox: makeIcon(),
    Search: makeIcon(),
    FileX: makeIcon(),
    AlertCircle: makeIcon(),
  };
});

import SOXCompliancePage from '@/pages/audit/SOXCompliancePage';
import { useGLStore } from '@/store/glStore';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/audit/sox']}>
      <Routes>
        <Route path="/audit/sox" element={<SOXCompliancePage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SOXCompliancePage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays the SOX Compliance heading', () => {
    renderPage();
    expect(screen.getByText(/SOX Compliance/i)).toBeInTheDocument();
  });

  // E-09-F: the fabricated fallback balance sheet is GONE. With no GL data the
  // page must show a connect-GL empty state — never a score derived from
  // invented figures.
  it('renders the connect-GL empty state (no fabricated score) when no GL data exists', () => {
    renderPage();
    expect(screen.getByText('No general-ledger data yet')).toBeInTheDocument();
    expect(screen.queryByText('85')).toBeNull();
  });

  it('renders the report from real GL data when the store is populated', () => {
    useGLStore.setState({
      trialBalance: [
        {
          accountId: '1000',
          accountCode: '1000',
          accountName: 'Cash — Operating',
          accountType: 'Asset',
          beginningBalance: 0,
          debit: 1200,
          credit: 200,
          endingBalance: 1000,
        },
        {
          accountId: '2000',
          accountCode: '2000',
          accountName: 'Accounts Payable',
          accountType: 'Liability',
          beginningBalance: 0,
          debit: 0,
          credit: 1000,
          endingBalance: -1000,
        },
      ],
      entries: [],
    });
    renderPage();
    expect(screen.getByText('85')).toBeInTheDocument();
    // Real data → no sample-data banner.
    expect(screen.queryByTestId('sox-sample-data-notice')).toBeNull();
    useGLStore.setState({ trialBalance: [], entries: [] });
  });

  it('displays the refresh button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
  });

  it('displays the export CSV button', () => {
    renderPage();
    expect(
      screen.getByRole('button', { name: /Export compliance report as CSV/i })
    ).toBeInTheDocument();
  });

  it('bridges to the period close workflow (F-01 CTA)', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /Close period/i })).toHaveAttribute(
      'href',
      '/periods/close'
    );
  });
});
