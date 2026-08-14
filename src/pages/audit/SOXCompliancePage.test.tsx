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
  };
});

import SOXCompliancePage from '@/pages/audit/SOXCompliancePage';

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

  it('displays the compliance score', () => {
    renderPage();
    expect(screen.getByText('85')).toBeInTheDocument();
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
