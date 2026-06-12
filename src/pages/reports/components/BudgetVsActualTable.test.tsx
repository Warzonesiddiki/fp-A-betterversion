/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BudgetVsActualTable, type VarianceDataRow } from './BudgetVsActualTable';

describe('BudgetVsActualTable', () => {
  const sampleData: VarianceDataRow[] = [
    {
      account: 'Revenue',
      budget: '$500,000',
      actual: '$520,000',
      variance: '$20,000',
      percentVar: '4.0%',
      isFavorable: true,
    },
    {
      account: 'COGS',
      budget: '$200,000',
      actual: '$195,000',
      variance: '($5,000)',
      percentVar: '(2.5%)',
      isFavorable: true,
    },
    {
      account: 'Marketing',
      budget: '$80,000',
      actual: '$92,000',
      variance: '$12,000',
      percentVar: '15.0%',
      isFavorable: false,
    },
  ];

  it('renders table with correct headers', () => {
    render(<BudgetVsActualTable data={sampleData} />);
    expect(screen.getByText('Account')).toBeDefined();
    expect(screen.getByText('Budget')).toBeDefined();
    expect(screen.getByText('Actual')).toBeDefined();
    expect(screen.getByText('Variance')).toBeDefined();
    expect(screen.getByText('% Var')).toBeDefined();
  });

  it('renders all data rows', () => {
    render(<BudgetVsActualTable data={sampleData} />);
    expect(screen.getByText('Revenue')).toBeDefined();
    expect(screen.getByText('COGS')).toBeDefined();
    expect(screen.getByText('Marketing')).toBeDefined();
  });

  it('renders correct values', () => {
    render(<BudgetVsActualTable data={sampleData} />);
    expect(screen.getByText('$500,000')).toBeDefined();
    expect(screen.getByText('$520,000')).toBeDefined();
    expect(screen.getByText('$20,000')).toBeDefined();
  });

  it('renders empty table with no data', () => {
    const { container } = render(<BudgetVsActualTable data={[]} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(0);
  });

  it('has correct ARIA attributes', () => {
    render(<BudgetVsActualTable data={sampleData} />);
    const table = screen.getByRole('grid');
    expect(table.getAttribute('aria-label')).toBe('Budget vs Actual Variance Analysis data');
  });

  it('renders favorable variance with green color', () => {
    const { container } = render(<BudgetVsActualTable data={sampleData} />);
    const favorableCell = container.querySelector('.text-green-600');
    expect(favorableCell).toBeDefined();
  });
});
