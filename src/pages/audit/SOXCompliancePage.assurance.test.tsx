/**
 * @vitest-environment jsdom
 *
 * SOX page — assurance honesty (NFR-002: no fabricated financial claims).
 *
 * `SOXCompliancePage.test.tsx` mocks the engine, and so does
 * `SOXCompliancePage.interop.test.tsx` (to record what the page hands it).
 * Neither can see the verdict the page publishes, which is where the defect
 * lived: the page seeded a demo `AuditLogEngine` (3 entries), demo RBAC roles
 * (4 users) and a demo workflow with a submitted request, and the engine turned
 * that invented data into `pass` verdicts for the approval-workflow,
 * segregation-of-duties, audit-trail and access-control families — a
 * "compliant / 100" posture computed from events that never happened.
 *
 * This suite renders the REAL page with the REAL engine and a real `glStore`
 * ledger, and asserts what an auditor would read on screen:
 *   1. control families with no authoritative source are reported as not
 *      evaluated, with the reason — never as passed;
 *   2. no compliance score and no "compliant" verdict is published while any
 *      family is unevaluated; the gauge shows the unavailable marker;
 *   3. the audit-trail checks report zero recorded entries, i.e. the demo log
 *      is gone (the strongest direct evidence: it used to read "2 entries");
 *   4. the GL-derived data-integrity checks still run on every real ledger row
 *      — the fix must not blind them.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import SOXCompliancePage from './SOXCompliancePage';
import { useGLStore } from '@/store/glStore';
import { actAs } from '@/test/rbacFixtures';
import { setClock, resetClock } from '@/utils/clock';
import type { GLEntry } from '@/types';

const PINNED = '2026-03-31T12:00:00.000Z';

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

/**
 * Seed `rows` ledger rows, alternating debit/credit of 100. An even row count
 * balances; an odd one leaves a single 100.00 debit unmatched, which is what
 * the "sees every row" case needs.
 */
function seedLedger(rows: number) {
  const entries: GLEntry[] = [];
  for (let i = 0; i < rows; i++) {
    entries.push(entry(i, i % 2 === 0 ? 100 : 0, i % 2 === 0 ? 0 : 100));
  }
  useGLStore.setState({ entries, accounts: [], trialBalance: [], importHistory: [] });
  useGLStore.getState().generateTrialBalance();
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/audit/sox-compliance']}>
      <SOXCompliancePage />
    </MemoryRouter>
  );
}

/** Open one check row and return its container, so its details can be read. */
function expandCheck(name: string): HTMLElement {
  const label = screen.getByText(name);
  const button = label.closest('button') as HTMLButtonElement;
  const row = button.parentElement as HTMLElement;
  fireEvent.click(button);
  return row;
}

describe('SOXCompliancePage — no assurance without a source (NFR-002)', () => {
  beforeEach(() => {
    actAs('Admin');
    setClock(PINNED);
    seedLedger(24); // balanced: 12 × 100.00 each side
  });

  afterEach(() => {
    resetClock();
    useGLStore.setState({ entries: [], accounts: [], trialBalance: [], importHistory: [] });
  });

  it('reports the control families that have no source as not evaluated, never as passed', () => {
    renderPage();

    // Approval workflow (1) + segregation of duties (1) + audit trail (4
    // resources) + access control (1) = 7 checks with no authoritative source.
    expect(screen.getAllByText('not applicable')).toHaveLength(7);

    // The GL-derived families are evaluated, so pass badges exist too — from
    // the real ledger only (balance-sheet equation, closed-period integrity).
    expect(screen.getByText('Double-Entry Verification')).toBeTruthy();
    expect(screen.getAllByText('pass').length).toBeGreaterThan(0);

    // The KPI block must state how many checks were not evaluated.
    expect(screen.getByText('Not evaluated')).toBeTruthy();
    expect(screen.getByTestId('sox-not-evaluated-count').textContent).toBe('7');
  });

  it('publishes no compliance score and no compliant verdict while a family is unevaluated', () => {
    renderPage();

    expect(screen.getByTestId('sox-score-unavailable').textContent).toBe('—');
    expect(screen.getByText('insufficient data')).toBeTruthy();
    expect(screen.queryByText('compliant')).toBeNull();
    // A score of 100 computed from three GL checks while four control families
    // ran on invented events is the fabricated claim this page used to make.
    expect(screen.queryByText('100')).toBeNull();
    expect(screen.queryByText('Compliance Score')).toBeNull();
  });

  it('reports zero recorded audit entries — the demo audit log is gone', () => {
    renderPage();

    // Used to read "2 entries, 0 missing fields, tamper: false" from two
    // hard-coded demo log lines, and the check passed on them.
    const journalRow = expandCheck('Audit Trail: journal_entry');
    expect(within(journalRow).getByText(/no audit entries recorded/i)).toBeTruthy();
    expect(within(journalRow).queryByText(/2 entries/)).toBeNull();

    const budgetRow = expandCheck('Audit Trail: budget');
    expect(within(budgetRow).getByText(/no audit entries recorded/i)).toBeTruthy();
  });

  it('states why the families are unevaluated instead of disclosing sample events', () => {
    renderPage();

    // The old note told the user the checks "partly derive from built-in sample
    // workflow/audit events". Nothing is sampled now; the note must say what is
    // missing and what that means for the verdict.
    expect(screen.queryByText(/built-in sample workflow\/audit events/i)).toBeNull();
    const note = screen.getByTestId('sox-unevaluated-note');
    expect(note.textContent).toMatch(/no authoritative source/i);
    expect(note.textContent).toMatch(/no compliance score or verdict/i);
  });

  it('keeps the GL-derived checks running on every ledger row', () => {
    // 25 rows: 13 debits of 100 against 12 credits. A 20-row window would see
    // 10 × 100 each side and report a balanced book; the check must see row 25.
    seedLedger(25);
    renderPage();

    const deRow = expandCheck('Double-Entry Verification');
    expect(within(deRow).getByText('fail')).toBeTruthy();
  });
});
