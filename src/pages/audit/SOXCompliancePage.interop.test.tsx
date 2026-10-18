/**
 * @vitest-environment jsdom
 *
 * SOX page → engine interop.
 *
 * `SOXCompliancePage.test.tsx` mocks `SOXComplianceEngine` wholesale, so it can
 * never see what the page hands the engine. That is exactly where the defect
 * lived: the page sliced the ledger to its first 20 rows before the
 * double-entry check and the first 10 before the closed-period check, so a
 * balanced ledger could "fail" and an unbalanced one could "pass" on a sample.
 *
 * These tests drive the real `glStore` and a recording engine stub.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import SOXCompliancePage from './SOXCompliancePage';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

const generateReport = vi.fn(() => ({
  overallScore: 100,
  overallStatus: 'pass',
  generatedAt: '2026-10-17T00:00:00.000Z',
  summary: { passed: 0, failed: 0, warnings: 0, total: 0 },
  checks: [],
  byCategory: {},
  criticalFindings: [],
  recommendations: [],
}));

vi.mock('@/engines/SOXComplianceEngine', () => ({
  SOXComplianceEngine: class {
    generateReport = generateReport;
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

function entry(index: number, debit: number, credit: number): GLEntry {
  return {
    id: `entry-${index}`,
    accountId: 'acc-1000',
    accountCode: '1000',
    accountName: 'Cash',
    period: '2026-03',
    periodName: 'Mar 2026',
    debit,
    credit,
    netChange: debit - credit,
    date: `2026-03-${String((index % 28) + 1).padStart(2, '0')}`,
    amount: debit - credit,
    description: `entry ${index}`,
    reference: `REF-${index}`,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/audit/sox']}>
      <SOXCompliancePage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  generateReport.mockClear();
  useGLStore.setState({ entries: [], trialBalance: [] });
});

type ReportOptions = {
  ledgerEntries?: Array<{ debit: number; credit: number }>;
  recentEntries?: Array<{ period: string; timestamp: string; action: string }>;
};

function reportOptions(): ReportOptions {
  const last = generateReport.mock.calls.at(-1)?.[0] as ReportOptions | undefined;
  expect(last).toBeDefined();
  return last as ReportOptions;
}

describe('SOXCompliancePage → engine interop', () => {
  it('hands the double-entry check every ledger row, not the first twenty', () => {
    const entries = Array.from({ length: 25 }, (_, i) => entry(i, 100, 100));
    useGLStore.setState({ entries, trialBalance: [] });
    renderPage();

    const { ledgerEntries } = reportOptions();
    expect(ledgerEntries).toHaveLength(25);
    const totalDebit = (ledgerEntries ?? []).reduce((sum, e) => sum + e.debit, 0);
    expect(totalDebit).toBe(2500);
  });

  it('hands the closed-period check every entry with its real posting date', () => {
    const entries = Array.from({ length: 15 }, (_, i) => entry(i, 10, 10));
    useGLStore.setState({ entries, trialBalance: [] });
    renderPage();

    const { recentEntries } = reportOptions();
    expect(recentEntries).toHaveLength(15);
    // Row 11 only exists if the 10-row window is gone; its date is the real
    // posting date, never `new Date()` at render time.
    expect(recentEntries?.[10]).toEqual({
      period: '2026-03',
      timestamp: '2026-03-11',
      action: 'create',
    });
  });

  it('renders the report the engine returned for the full ledger', () => {
    useGLStore.setState({ entries: [entry(0, 100, 100)], trialBalance: [] });
    renderPage();
    expect(screen.getByText(/SOX Compliance/i)).toBeInTheDocument();
  });
});
