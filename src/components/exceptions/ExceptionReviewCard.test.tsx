import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExceptionReviewCard, type ExceptionReviewCandidate } from './ExceptionReviewCard';
import { useExceptionDispositionStore } from '@/store/exceptionDispositionStore';

describe('ExceptionReviewCard', () => {
  const sampleCandidate: ExceptionReviewCandidate = {
    id: 'EXC-D365-2026-001',
    ruleId: 'RULE-D365-SUSPICIOUS-ROUND@v1',
    ruleName: 'Round Amount Anomaly Rule',
    version: '1.0',
    severity: 'high',
    evidence: {
      description:
        'Transaction amount exactly matches round integer $50,000.00 above typical variance limit.',
      formula: 'amount % 10000 === 0 && amount >= 50000',
      metric: 'Threshold Deviation',
      actualValue: '$50,000.00',
      expectedValue: '< $10,000.00',
      sourceRowId: 'ROW-9842',
    },
    recommendedAction: 'Request supporting documentation from GL originator.',
  };

  beforeEach(() => {
    useExceptionDispositionStore.getState().reset();
  });

  it('renders as a review candidate without confirmed error label per Rule 7', () => {
    render(<ExceptionReviewCard candidate={sampleCandidate} />);

    // Rule 7 check: Must render as Review Candidate, not confirmed error
    expect(screen.getByTestId('exception-status-badge')).toHaveTextContent(
      /Review Candidate \(Pending\)/i
    );
    expect(screen.getByTestId('rule-7-banner')).toBeInTheDocument();
    expect(screen.getByTestId('rule-7-banner')).toHaveTextContent(/Rule 7 Review Candidate/i);
    expect(screen.getByTestId('rule-7-banner')).toHaveTextContent(
      /No flag is labeled a confirmed error without formal human disposition/i
    );
  });

  it('renders versioned rule ID, finding key, and evidence details per FR-008', () => {
    render(<ExceptionReviewCard candidate={sampleCandidate} />);

    expect(screen.getByTestId('exception-rule-id')).toHaveTextContent(
      'RULE-D365-SUSPICIOUS-ROUND@v1 (v1.0)'
    );
    expect(screen.getByTestId('exception-finding-key')).toHaveTextContent('ID: EXC-D365-2026-001');
    expect(screen.getByTestId('exception-severity-badge')).toHaveTextContent('High Severity');
    expect(screen.getByTestId('exception-description')).toHaveTextContent(
      /Transaction amount exactly matches round integer/i
    );
    expect(screen.getByText(/Formula:/i)).toBeInTheDocument();
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
    expect(screen.getByText('< $10,000.00')).toBeInTheDocument();
  });

  it('validates rationale input before applying disposition per FR-009', async () => {
    const user = userEvent.setup();
    render(<ExceptionReviewCard candidate={sampleCandidate} />);

    // Clicking disposition without rationale shows validation warning
    const acceptBtn = screen.getByTestId('btn-disposition-accept');
    await user.click(acceptBtn);

    expect(screen.getByTestId('rationale-error')).toHaveTextContent(
      /Please provide a review rationale note/i
    );
  });

  it('records review disposition and rationale to store per FR-009', async () => {
    const user = userEvent.setup();
    const onDispositionChange = vi.fn();

    render(
      <ExceptionReviewCard
        candidate={sampleCandidate}
        currentUserId="lead-auditor-1"
        onDispositionChange={onDispositionChange}
      />
    );

    const rationaleInput = screen.getByTestId('disposition-rationale-input');
    await user.type(
      rationaleInput,
      'Verified invoice #10291, confirmed abnormal manual adjustment.'
    );

    const acceptBtn = screen.getByTestId('btn-disposition-accept');
    await user.click(acceptBtn);

    // Should update store
    const store = useExceptionDispositionStore.getState();
    const stored = store.getDisposition(sampleCandidate.id);
    expect(stored).toBeDefined();
    expect(stored?.disposition).toBe('ACCEPT');
    expect(stored?.rationale).toBe(
      'Verified invoice #10291, confirmed abnormal manual adjustment.'
    );
    expect(stored?.recordedBy).toBe('lead-auditor-1');

    // Callback invoked
    expect(onDispositionChange).toHaveBeenCalledWith(
      'ACCEPT',
      'Verified invoice #10291, confirmed abnormal manual adjustment.'
    );

    // UI updates status badge to Confirmed Exception
    expect(screen.getByTestId('exception-status-badge')).toHaveTextContent(/Confirmed Exception/i);
  });

  it('tracks audit trail and history across disposition updates per FR-009', async () => {
    const user = userEvent.setup();

    render(<ExceptionReviewCard candidate={sampleCandidate} currentUserId="reviewer-1" />);

    const rationaleInput = screen.getByTestId('disposition-rationale-input');

    // First disposition: REVIEW
    await user.type(rationaleInput, 'Initial review needed by senior accountant.');
    await user.click(screen.getByTestId('btn-disposition-review'));

    expect(screen.getByTestId('exception-status-badge')).toHaveTextContent(/Under Active Review/i);

    // Second disposition: REJECT (dismissed as benign)
    await user.type(
      rationaleInput,
      'Accountant confirmed seasonal prepayment entry, marked benign.'
    );
    await user.click(screen.getByTestId('btn-disposition-reject'));

    expect(screen.getByTestId('exception-status-badge')).toHaveTextContent(/Dismissed \(Benign\)/i);

    // Toggle audit history log
    const toggleHistory = screen.getByTestId('toggle-audit-history');
    await user.click(toggleHistory);

    const historyEntries = screen.getAllByTestId('audit-history-entry');
    expect(historyEntries).toHaveLength(2);
    expect(historyEntries[0]).toHaveTextContent(/#1 - REVIEW/i);
    expect(historyEntries[1]).toHaveTextContent(/#2 - REJECT \(was REVIEW\)/i);
  });
});
