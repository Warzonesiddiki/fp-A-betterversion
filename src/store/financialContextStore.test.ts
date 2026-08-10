import { beforeEach, describe, expect, it } from 'vitest';
import { useFinancialContextStore } from './financialContextStore';
import { DEFAULT_FINANCIAL_CONTEXT } from '@/types/financialContext';

describe('financialContextStore', () => {
  beforeEach(() => {
    useFinancialContextStore.setState({ context: DEFAULT_FINANCIAL_CONTEXT });
  });

  it('starts with the default context', () => {
    expect(useFinancialContextStore.getState().context).toEqual(DEFAULT_FINANCIAL_CONTEXT);
  });

  it('applies a partial context patch', () => {
    useFinancialContextStore
      .getState()
      .setContext({ scope: { entityIds: ['ent-1'], label: 'US Parent' } });
    const { context } = useFinancialContextStore.getState();
    expect(context.scope).toEqual({ entityIds: ['ent-1'], label: 'US Parent' });
    expect(context.currency).toEqual(DEFAULT_FINANCIAL_CONTEXT.currency);
  });

  it('does not notify subscribers when the patch changes nothing', () => {
    let calls = 0;
    const unsubscribe = useFinancialContextStore.subscribe(() => {
      calls += 1;
    });
    useFinancialContextStore.getState().setContext({ currency: { code: 'USD' } });
    unsubscribe();
    expect(calls).toBe(0);
  });

  it('resets to defaults', () => {
    useFinancialContextStore.getState().setContext({ currency: { code: 'INR' } });
    useFinancialContextStore.getState().resetContext();
    expect(useFinancialContextStore.getState().context).toEqual(DEFAULT_FINANCIAL_CONTEXT);
  });
});
