/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { FinancialContextBar } from './FinancialContextBar';
import { useFinancialContextStore } from '@/store/financialContextStore';
import { DEFAULT_FINANCIAL_CONTEXT } from '@/types/financialContext';

expect.extend(toHaveNoViolations);

const ENTITIES = [
  { id: 'ent-1', label: 'US Parent', currency: 'USD' },
  { id: 'ent-2', label: 'UK Subsidiary', currency: 'GBP' },
];

describe('FinancialContextBar', () => {
  beforeEach(() => {
    useFinancialContextStore.setState({ context: DEFAULT_FINANCIAL_CONTEXT });
  });

  it('renders the context region with all five dimensions', () => {
    render(<FinancialContextBar entities={ENTITIES} />);
    const region = screen.getByRole('region', { name: 'Financial context' });
    expect(region).toBeTruthy();
    expect(screen.getByLabelText('Entity scope')).toBeTruthy();
    expect(screen.getByLabelText('Fiscal period')).toBeTruthy();
    expect(screen.getByLabelText('Scenario or version')).toBeTruthy();
    expect(screen.getByLabelText('Reporting currency')).toBeTruthy();
    expect(screen.getByText('Freshness unknown')).toBeTruthy();
  });

  it('shows the local-workspace truth state by default', () => {
    render(<FinancialContextBar entities={ENTITIES} />);
    expect(screen.getByText('Draft')).toBeTruthy();
    expect(screen.getByText('Local workspace data')).toBeTruthy();
  });

  it('updates the store when the entity scope changes', () => {
    render(<FinancialContextBar entities={ENTITIES} />);
    fireEvent.change(screen.getByLabelText('Entity scope'), { target: { value: 'ent-2' } });
    const { context } = useFinancialContextStore.getState();
    expect(context.scope).toEqual({ entityIds: ['ent-2'], label: 'UK Subsidiary' });
  });

  it('updates the store when period, version, or currency change', () => {
    render(
      <FinancialContextBar entities={ENTITIES} versions={[{ id: 'v1', label: '2026 Plan' }]} />
    );
    fireEvent.change(screen.getByLabelText('Fiscal period'), {
      target: { value: '2026-04..2026-06' },
    });
    fireEvent.change(screen.getByLabelText('Scenario or version'), { target: { value: 'v1' } });
    fireEvent.change(screen.getByLabelText('Reporting currency'), { target: { value: 'INR' } });
    const { context } = useFinancialContextStore.getState();
    expect(context.period).toEqual({ start: '2026-04', end: '2026-06', calendar: 'fiscal' });
    expect(context.version).toEqual({ id: 'v1', label: '2026 Plan', lifecycle: 'draft' });
    expect(context.currency).toEqual({ code: 'INR' });
  });

  it('clears the version back to null when the empty option is chosen', () => {
    useFinancialContextStore
      .getState()
      .setContext({ version: { id: 'v1', label: '2026 Plan', lifecycle: 'draft' } });
    render(
      <FinancialContextBar entities={ENTITIES} versions={[{ id: 'v1', label: '2026 Plan' }]} />
    );
    fireEvent.change(screen.getByLabelText('Scenario or version'), { target: { value: '' } });
    expect(useFinancialContextStore.getState().context.version).toBeNull();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<FinancialContextBar entities={ENTITIES} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
