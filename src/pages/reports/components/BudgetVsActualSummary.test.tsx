/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BudgetVsActualSummary } from './BudgetVsActualSummary';

describe('BudgetVsActualSummary', () => {
  const defaultProps = {
    totalBudget: '$500,000',
    totalActual: '$480,000',
    netVariance: '($20,000)',
    utilizationPercentage: 96.0,
    isVarianceFavorable: true,
  };

  it('renders budget, actual, and variance values', () => {
    render(<BudgetVsActualSummary {...defaultProps} />);
    expect(screen.getByText('$500,000')).toBeDefined();
    expect(screen.getByText('$480,000')).toBeDefined();
    expect(screen.getByText('($20,000)')).toBeDefined();
  });

  it('displays utilization percentage', () => {
    render(<BudgetVsActualSummary {...defaultProps} />);
    expect(screen.getByText('96.0% of budget utilized')).toBeDefined();
  });

  it('applies green color for favorable variance', () => {
    const { container } = render(<BudgetVsActualSummary {...defaultProps} />);
    const varianceEl = container.querySelector('.text-green-600');
    expect(varianceEl).toBeDefined();
  });

  it('applies red color for unfavorable variance', () => {
    const { container } = render(
      <BudgetVsActualSummary {...defaultProps} isVarianceFavorable={false} />
    );
    const varianceEl = container.querySelector('.text-red-600');
    expect(varianceEl).toBeDefined();
  });

  it('renders progress bar with correct width', () => {
    const { container } = render(<BudgetVsActualSummary {...defaultProps} />);
    const bar = container.querySelector('.bg-blue-500');
    expect(bar).toBeDefined();
    expect(bar?.getAttribute('style')).toContain('width: 96%');
  });

  it('caps progress bar at 100%', () => {
    const { container } = render(
      <BudgetVsActualSummary {...defaultProps} utilizationPercentage={110} />
    );
    const bar = container.querySelector('.bg-blue-500');
    expect(bar?.getAttribute('style')).toContain('width: 100%');
  });
});
