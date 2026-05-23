import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    Lock: makeIcon(),
    Unlock: makeIcon(),
    Download: makeIcon(),
    AlertTriangle: makeIcon(),
    Shield: makeIcon(),
  };
});

vi.mock('./Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={className}>{children}</h3>
  ),
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

vi.mock('./Modal', () => ({
  Modal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
    isOpen ? <div data-testid="modal">{children}</div> : null,
}));

import { ScenarioLocking } from '@/components/ui/ScenarioLocking';

const mockMetrics = {
  revenue: 1000000,
  ebitda: 200000,
  netIncome: 150000,
  cashFlow: 180000,
  headcount: 50,
  burnRate: 80000,
  runway: 24,
  grossMargin: 60,
  ebitdaMargin: 20,
};

describe('ScenarioLocking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when unlocked', () => {
    const { container } = render(
      <ScenarioLocking
        scenarioId="s1"
        scenarioName="Test Scenario"
        isLocked={false}
        metrics={mockMetrics}
        onLockToggle={() => {}}
      />
    );
    expect(container).toBeTruthy();
  });

  it('renders without crashing when locked', () => {
    const { container } = render(
      <ScenarioLocking
        scenarioId="s1"
        scenarioName="Test Scenario"
        isLocked={true}
        metrics={mockMetrics}
        onLockToggle={() => {}}
      />
    );
    expect(container).toBeTruthy();
  });

  it('displays scenario name', () => {
    render(
      <ScenarioLocking
        scenarioId="s1"
        scenarioName="My Scenario"
        isLocked={false}
        metrics={mockMetrics}
        onLockToggle={() => {}}
      />
    );
    expect(screen.getByText('My Scenario')).toBeInTheDocument();
  });

  it('shows Lock Scenario button when unlocked', () => {
    render(
      <ScenarioLocking
        scenarioId="s1"
        scenarioName="Test"
        isLocked={false}
        metrics={mockMetrics}
        onLockToggle={() => {}}
      />
    );
    expect(screen.getByText('Lock Scenario')).toBeInTheDocument();
  });

  it('shows Unlock button when locked', () => {
    render(
      <ScenarioLocking
        scenarioId="s1"
        scenarioName="Test"
        isLocked={true}
        metrics={mockMetrics}
        onLockToggle={() => {}}
      />
    );
    expect(screen.getByText('Unlock')).toBeInTheDocument();
  });

  it('shows Locked indicator when locked', () => {
    render(
      <ScenarioLocking
        scenarioId="s1"
        scenarioName="Test"
        isLocked={true}
        metrics={mockMetrics}
        onLockToggle={() => {}}
      />
    );
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });
});
