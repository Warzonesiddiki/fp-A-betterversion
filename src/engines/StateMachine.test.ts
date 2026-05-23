import { describe, it, expect } from 'vitest';
import {
  StateMachine,
  budgetStateMachine,
  periodStateMachine,
  forecastStateMachine,
} from './StateMachine';

const makeContext = (overrides?: Record<string, unknown>) => ({
  userId: 'user-1',
  userRoles: ['analyst'],
  entity: {},
  timestamp: new Date().toISOString(),
  ...overrides,
});

describe('StateMachine', () => {
  it('should allow valid transitions', async () => {
    const sm = new StateMachine('test', [{ from: 'draft', to: 'active' }]);

    const result = await sm.transition('draft', 'active', makeContext());
    expect(result.success).toBe(true);
    expect(result.from).toBe('draft');
    expect(result.to).toBe('active');
  });

  it('should reject invalid transitions', async () => {
    const sm = new StateMachine('test', [{ from: 'draft', to: 'active' }]);

    const result = await sm.transition('draft', 'archived', makeContext());
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid transition');
  });

  it('should enforce role requirements', async () => {
    const sm = new StateMachine('test', [{ from: 'draft', to: 'active', requiresRole: ['admin'] }]);

    const result = await sm.transition('draft', 'active', makeContext({ userRoles: ['viewer'] }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('Requires role');
  });

  it('should enforce guards', async () => {
    const sm = new StateMachine('test', [
      {
        from: 'draft',
        to: 'active',
        guard: (ctx) => {
          if (!ctx.entity.name) return 'Name is required';
          return true;
        },
      },
    ]);

    const failResult = await sm.transition('draft', 'active', makeContext({ entity: {} }));
    expect(failResult.success).toBe(false);
    expect(failResult.error).toBe('Name is required');

    const okResult = await sm.transition(
      'draft',
      'active',
      makeContext({ entity: { name: 'Test' } })
    );
    expect(okResult.success).toBe(true);
  });

  it('should execute side effects', async () => {
    let sideEffectRan = false;
    const sm = new StateMachine('test', [
      {
        from: 'draft',
        to: 'active',
        sideEffect: async () => {
          sideEffectRan = true;
        },
      },
    ]);

    await sm.transition('draft', 'active', makeContext());
    expect(sideEffectRan).toBe(true);
  });

  it('should return available transitions', () => {
    const sm = new StateMachine('test', [
      { from: 'draft', to: 'active' },
      { from: 'draft', to: 'archived', requiresRole: ['admin'] },
    ]);

    const available = sm.getAvailableTransitions('draft', makeContext({ userRoles: ['viewer'] }));
    expect(available).toHaveLength(1);
    expect(available[0].to).toBe('active');
  });

  it('should return target states', () => {
    const sm = new StateMachine('test', [
      { from: 'draft', to: 'active' },
      { from: 'draft', to: 'archived' },
    ]);

    const targets = sm.getTargetStates('draft');
    expect(targets).toContain('active');
    expect(targets).toContain('archived');
  });
});

describe('budgetStateMachine', () => {
  it('should allow analyst to submit draft budget', async () => {
    const result = await budgetStateMachine.transition(
      'draft',
      'submitted',
      makeContext({
        userRoles: ['analyst'],
        entity: { lineItems: [{ id: '1' }], totalAmount: 1000 },
      })
    );
    expect(result.success).toBe(true);
  });

  it('should reject submitting empty budget', async () => {
    const result = await budgetStateMachine.transition(
      'draft',
      'submitted',
      makeContext({
        userRoles: ['analyst'],
        entity: { lineItems: [], totalAmount: 0 },
      })
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('empty budget');
  });

  it('should prevent self-approval', async () => {
    const result = await budgetStateMachine.transition(
      'submitted',
      'approved',
      makeContext({
        userId: 'user-1',
        userRoles: ['cfo'],
        entity: { createdBy: 'user-1' },
      })
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot approve your own');
  });

  it('should require comment for rejection', async () => {
    const result = await budgetStateMachine.transition(
      'submitted',
      'rejected',
      makeContext({
        userRoles: ['cfo'],
        entity: {},
      })
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('comment');
  });
});

describe('periodStateMachine', () => {
  it('should reject soft close with unposted journals', async () => {
    const result = await periodStateMachine.transition(
      'open',
      'soft_close',
      makeContext({
        userRoles: ['controller'],
        entity: { unpostedJournals: 5 },
      })
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('unposted journals');
  });

  it('should allow soft close when all journals posted', async () => {
    const result = await periodStateMachine.transition(
      'open',
      'soft_close',
      makeContext({
        userRoles: ['controller'],
        entity: { unpostedJournals: 0 },
      })
    );
    expect(result.success).toBe(true);
  });
});

describe('forecastStateMachine', () => {
  it('should require assumptions before publishing', async () => {
    const result = await forecastStateMachine.transition(
      'draft',
      'published',
      makeContext({
        userRoles: ['analyst'],
        entity: { assumptions: [] },
      })
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('assumptions');
  });
});
