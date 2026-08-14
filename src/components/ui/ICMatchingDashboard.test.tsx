import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@/engines/ICMatchingEngine', () => {
  class MockICMatchingEngine {
    getTolerance() {
      return { amountTolerance: 100, percentageTolerance: 5, dateToleranceDays: 5 };
    }
    getSummary() {
      return {
        matchedCount: 0,
        matchedAmount: 0,
        partiallyMatchedCount: 0,
        partiallyMatchedAmount: 0,
        unmatchedCount: 0,
        unmatchedAmount: 0,
        matchRate: 0,
      };
    }
    getUnmatched() {
      return [];
    }
    getMatches() {
      return [];
    }
    setTolerance() {}
    autoMatch() {
      return [];
    }
    manualMatch() {
      return {};
    }
    unmatch() {}
    generateEliminations() {}
  }
  return { ICMatchingEngine: MockICMatchingEngine };
});

vi.mock('./Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('./Button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('./Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('./Select', () => ({
  Select: ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('./Input', () => ({
  Input: ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

import { ICMatchingDashboard } from '@/components/ui/ICMatchingDashboard';

describe('ICMatchingDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <ICMatchingDashboard
        sourceTransactions={[]}
        targetTransactions={[]}
        allTransactions={[]}
        entityNames={{}}
      />
    );
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });

  it('displays summary cards', () => {
    render(
      <ICMatchingDashboard
        sourceTransactions={[]}
        targetTransactions={[]}
        allTransactions={[]}
        entityNames={{}}
      />
    );
    // "Matched" appears in summary card AND in Select options, so use getAllByText
    expect(screen.getAllByText('Matched').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Partial').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Unmatched').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Match Rate')).toBeInTheDocument();
  });

  it('displays matching controls', () => {
    render(
      <ICMatchingDashboard
        sourceTransactions={[]}
        targetTransactions={[]}
        allTransactions={[]}
        entityNames={{}}
      />
    );
    expect(screen.getByText('Matching Controls')).toBeInTheDocument();
    expect(screen.getByText('Auto-Match')).toBeInTheDocument();
  });
});
