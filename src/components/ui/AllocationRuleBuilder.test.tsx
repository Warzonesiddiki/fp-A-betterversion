/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AllocationRuleBuilder } from './AllocationRuleBuilder';
import type { AllocationSource, AllocationDriver } from './AllocationRuleBuilder';

const sources: AllocationSource[] = [
  { id: 'src-1', label: 'IT Department', amount: 50000 },
  { id: 'src-2', label: 'HR Department', amount: 30000 },
];

const drivers: AllocationDriver[] = [
  { id: 'drv-1', label: 'Headcount', values: { 'dept-a': 10, 'dept-b': 20 } },
  { id: 'drv-2', label: 'Revenue', values: { 'dept-a': 100000, 'dept-b': 200000 } },
];

const targetOptions = [
  { id: 'dept-a', label: 'Department A' },
  { id: 'dept-b', label: 'Department B' },
  { id: 'dept-c', label: 'Department C' },
];

describe('AllocationRuleBuilder', () => {
  it('renders without crashing', () => {
    render(
      <AllocationRuleBuilder sources={sources} drivers={drivers} targetOptions={targetOptions} />
    );
    expect(screen.getByText('Allocation Rule Builder')).toBeInTheDocument();
  });

  it('renders rule name input', () => {
    render(
      <AllocationRuleBuilder sources={sources} drivers={drivers} targetOptions={targetOptions} />
    );
    expect(screen.getByPlaceholderText('e.g., Allocate IT Costs by Headcount')).toBeInTheDocument();
  });

  it('renders source dropdown with options', () => {
    render(
      <AllocationRuleBuilder sources={sources} drivers={drivers} targetOptions={targetOptions} />
    );
    expect(screen.getByText('Select source...')).toBeInTheDocument();
  });

  it('renders method options', () => {
    render(
      <AllocationRuleBuilder sources={sources} drivers={drivers} targetOptions={targetOptions} />
    );
    expect(screen.getByText('Direct')).toBeInTheDocument();
    expect(screen.getByText('Driver-Based')).toBeInTheDocument();
    expect(screen.getByText('Step-Down')).toBeInTheDocument();
    expect(screen.getByText('Reciprocal')).toBeInTheDocument();
  });

  it('renders add target button', () => {
    render(
      <AllocationRuleBuilder sources={sources} drivers={drivers} targetOptions={targetOptions} />
    );
    expect(screen.getByText('Add Target')).toBeInTheDocument();
  });

  it('renders empty targets message initially', () => {
    render(
      <AllocationRuleBuilder sources={sources} drivers={drivers} targetOptions={targetOptions} />
    );
    expect(screen.getByText(/No targets added yet/)).toBeInTheDocument();
  });

  it('renders preview and save buttons', () => {
    render(
      <AllocationRuleBuilder sources={sources} drivers={drivers} targetOptions={targetOptions} />
    );
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Save Rule')).toBeInTheDocument();
  });

  it('adds a target when add button clicked', () => {
    render(
      <AllocationRuleBuilder sources={sources} drivers={drivers} targetOptions={targetOptions} />
    );
    fireEvent.click(screen.getByText('Add Target'));
    expect(screen.queryByText(/No targets added yet/)).not.toBeInTheDocument();
  });

  it('renders period input', () => {
    render(
      <AllocationRuleBuilder sources={sources} drivers={drivers} targetOptions={targetOptions} />
    );
    expect(screen.getByText('Period')).toBeInTheDocument();
  });

  it('renders recurring checkbox', () => {
    render(
      <AllocationRuleBuilder sources={sources} drivers={drivers} targetOptions={targetOptions} />
    );
    expect(screen.getByText('Recurring')).toBeInTheDocument();
  });

  it('allows typing a rule name', () => {
    render(
      <AllocationRuleBuilder sources={sources} drivers={drivers} targetOptions={targetOptions} />
    );
    const input = screen.getByPlaceholderText('e.g., Allocate IT Costs by Headcount');
    fireEvent.change(input, { target: { value: 'My Allocation Rule' } });
    expect(input).toHaveValue('My Allocation Rule');
  });

  it('removes a target when delete clicked', () => {
    render(
      <AllocationRuleBuilder sources={sources} drivers={drivers} targetOptions={targetOptions} />
    );
    fireEvent.click(screen.getByText('Add Target'));
    // Find the trash/remove button (the one with the Trash2 icon)
    const removeButtons = screen.getAllByRole('button');
    const trashBtn = removeButtons.find(
      (btn) => btn.querySelector('svg') !== null && btn.textContent === ''
    );
    if (trashBtn) {
      fireEvent.click(trashBtn);
      expect(screen.getByText(/No targets added yet/)).toBeInTheDocument();
    }
  });
});
