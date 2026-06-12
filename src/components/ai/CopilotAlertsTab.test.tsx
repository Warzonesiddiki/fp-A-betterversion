/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsTab } from './CopilotAlertsTab';
import type { CopilotAlert } from './CopilotTypes';

describe('CopilotAlertsTab', () => {
  const mockAlerts: CopilotAlert[] = [
    {
      id: '1',
      type: 'info',
      severity: 'high',
      message: 'High Alert Message',
      detail: 'High Alert Detail',
    },
    {
      id: '2',
      type: 'budget',
      severity: 'medium',
      message: 'Medium Alert Message',
      detail: 'Medium Alert Detail',
    },
    {
      id: '3',
      type: 'variance',
      severity: 'low',
      message: 'Low Alert Message',
      detail: 'Low Alert Detail',
    },
  ];

  it('renders alerts correctly', () => {
    render(<AlertsTab alerts={mockAlerts} highAlertCount={1} />);

    expect(screen.getByText('High Alert Message')).toBeInTheDocument();
    expect(screen.getByText('Medium Alert Message')).toBeInTheDocument();
    expect(screen.getByText('Low Alert Message')).toBeInTheDocument();
    expect(screen.getByText('High Alert Detail')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // High alerts count
  });

  it('renders QuickStats with empty data when gl and budget are missing', () => {
    render(<AlertsTab alerts={[]} highAlertCount={0} />);

    // Revenue, Expenses, Budgets should be '—'
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);

    // High Alerts count should be '0'
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('calculates and renders revenue and expenses from gl state', () => {
    const glState: any = {
      entries: [
        { credit: 50000, debit: 0 },
        { credit: 0, debit: 20000 },
      ],
    };

    render(<AlertsTab alerts={[]} gl={glState} highAlertCount={0} />);

    // Revenue should be $50K, Expenses should be $20K
    expect(screen.getByText('$50K')).toBeInTheDocument();
    expect(screen.getByText('$20K')).toBeInTheDocument();
  });

  it('renders budgets count from budget state', () => {
    const budgetState: any = {
      budgets: [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }],
    };

    render(<AlertsTab alerts={[]} budget={budgetState} highAlertCount={0} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
