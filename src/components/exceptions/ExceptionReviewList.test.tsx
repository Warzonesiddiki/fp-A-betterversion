import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExceptionReviewList } from './ExceptionReviewList';
import type { ExceptionReviewCandidate } from './ExceptionReviewCard';
import { useExceptionDispositionStore } from '@/store/exceptionDispositionStore';

describe('ExceptionReviewList', () => {
  const mockCandidates: ExceptionReviewCandidate[] = [
    {
      id: 'EXC-001',
      ruleId: 'RULE-WEEKEND-POSTING@v1',
      ruleName: 'Weekend Posting Rule',
      severity: 'medium',
      evidence: {
        description: 'Journal entry posted on Saturday afternoon.',
      },
    },
    {
      id: 'EXC-002',
      ruleId: 'RULE-LARGE-VARIANCE@v1',
      ruleName: 'Large Variance Spike',
      severity: 'critical',
      evidence: {
        description: 'Account 4000 variance exceeds 250% of 12-month trailing mean.',
      },
    },
    {
      id: 'EXC-003',
      ruleId: 'RULE-DUPLICATE-AMOUNT@v1',
      ruleName: 'Duplicate Amount Anomaly',
      severity: 'low',
      evidence: {
        description: 'Two identical credit entries on consecutive vouchers.',
      },
    },
  ];

  beforeEach(() => {
    useExceptionDispositionStore.getState().reset();
  });

  it('renders summary statistics bar accurately', () => {
    render(<ExceptionReviewList candidates={mockCandidates} />);

    expect(screen.getByTestId('stat-total')).toHaveTextContent('3');
    expect(screen.getByTestId('stat-pending')).toHaveTextContent('3');
    expect(screen.getByTestId('stat-accepted')).toHaveTextContent('0');
    expect(screen.getByTestId('stat-rejected')).toHaveTextContent('0');
    expect(screen.getByTestId('stat-escalated')).toHaveTextContent('0');
  });

  it('filters candidates by severity', async () => {
    const user = userEvent.setup();
    render(<ExceptionReviewList candidates={mockCandidates} />);

    const severitySelect = screen.getByTestId('severity-filter-select');
    await user.selectOptions(severitySelect, 'critical');

    expect(screen.getByTestId('candidate-cards-container')).toHaveTextContent('EXC-002');
    expect(screen.getByTestId('candidate-cards-container')).not.toHaveTextContent('EXC-001');
    expect(screen.getByTestId('candidate-cards-container')).not.toHaveTextContent('EXC-003');
  });

  it('filters candidates by text search query', async () => {
    const user = userEvent.setup();
    render(<ExceptionReviewList candidates={mockCandidates} />);

    const searchInput = screen.getByTestId('exception-search-input');
    await user.type(searchInput, 'Weekend');

    expect(screen.getByTestId('candidate-cards-container')).toHaveTextContent('EXC-001');
    expect(screen.getByTestId('candidate-cards-container')).not.toHaveTextContent('EXC-002');
  });

  it('displays empty state when no candidates match filter', async () => {
    const user = userEvent.setup();
    render(<ExceptionReviewList candidates={mockCandidates} />);

    const searchInput = screen.getByTestId('exception-search-input');
    await user.type(searchInput, 'NonExistentString12345');

    expect(screen.getByTestId('empty-candidates-notice')).toBeInTheDocument();
  });
});
