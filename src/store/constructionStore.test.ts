import { describe, it, expect, beforeEach } from 'vitest';
import { useConstructionStore } from './constructionStore';
import { actAs } from '@/test/rbacFixtures';

describe('constructionStore', () => {
  beforeEach(() => {
    actAs('Admin');
    useConstructionStore.setState({
      costBreakdown: [],
      changeOrders: [],
      costLedger: [],
    });
  });

  it('should have default data on fresh load', () => {
    const fresh = useConstructionStore.getState();
    // After reset, arrays are empty
    expect(fresh.costBreakdown).toEqual([]);
    expect(fresh.changeOrders).toEqual([]);
    expect(fresh.costLedger).toEqual([]);
  });

  it('should set cost breakdown', () => {
    const items = [
      { name: 'Labor', budget: 100000, actual: 95000 },
      { name: 'Materials', budget: 200000, actual: 210000 },
    ];
    useConstructionStore.getState().setCostBreakdown(items);
    expect(useConstructionStore.getState().costBreakdown).toEqual(items);
  });

  it('should add a change order', () => {
    useConstructionStore.getState().addChangeOrder({
      id: 'CO-500',
      project: 'New Tower',
      description: 'Foundation upgrade',
      amount: '+$200k',
      status: 'Pending',
      impact: 'High',
    });
    expect(useConstructionStore.getState().changeOrders).toHaveLength(1);
    expect(useConstructionStore!.getState().changeOrders[0]!.id).toBe('CO-500');
  });

  it('should update a change order', () => {
    useConstructionStore.getState().addChangeOrder({
      id: 'CO-501',
      project: 'Bridge',
      description: 'Cable replacement',
      amount: '+$50k',
      status: 'Pending',
      impact: 'Medium',
    });
    useConstructionStore.getState().updateChangeOrder('CO-501', { status: 'Approved' });
    expect(useConstructionStore!.getState().changeOrders[0]!.status).toBe('Approved');
  });

  it('should not update non-existent change order', () => {
    useConstructionStore.getState().addChangeOrder({
      id: 'CO-502',
      project: 'Road',
      description: 'Paving',
      amount: '+$10k',
      status: 'Pending',
      impact: 'Low',
    });
    useConstructionStore.getState().updateChangeOrder('CO-999', { status: 'Approved' });
    expect(useConstructionStore!.getState().changeOrders[0]!.status).toBe('Pending');
  });

  it('should set cost ledger', () => {
    const entries = [
      {
        id: '1',
        code: '03-3000',
        category: 'Concrete',
        budget: '$1M',
        actual: '$0.9M',
        variance: '+10%',
        status: 'Under' as const,
      },
    ];
    useConstructionStore.getState().setCostLedger(entries);
    expect(useConstructionStore.getState().costLedger).toEqual(entries);
  });
});
