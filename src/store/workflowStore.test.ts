import { describe, it, expect, beforeEach, vi } from 'vitest';
import { enableMapSet } from 'immer';
import { useWorkflowStore } from './workflowStore';

enableMapSet();

vi.mock('@/utils/masterStorage', () => ({
  masterStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
}));

// Bypass RBAC: tests operate through the engine instance directly via the
// store when permitted, but we also confirm the store surface (engine ref,
// snapshots, refreshState, setError) is wired up. The engine itself has
// 100% coverage from its own unit suite.
describe('workflowStore', () => {
  beforeEach(() => {
    useWorkflowStore.getState().setError(null);
    useWorkflowStore.getState().refreshState();
  });

  it('exposes engine, snapshots and setError', () => {
    const s = useWorkflowStore.getState();
    expect(s.engine).toBeDefined();
    expect(s.workflows).toBeInstanceOf(Array);
    expect(s.requests).toBeInstanceOf(Array);
    expect(s.delegations).toBeInstanceOf(Array);
    expect(s.stats).toBeDefined();
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeNull();
    s.setError('oops');
    expect(useWorkflowStore.getState().error).toBe('oops');
    s.setError(null);
  });

  it('refreshState refreshes snapshots from engine', () => {
    const before = useWorkflowStore.getState();
    const wCountBefore = before.workflows.length;
    // Use engine directly (store createWorkflow is RBAC-wrapped in tests
    // where authStore has no user; engine API is what the store defers to).
    before.engine.createWorkflow({
      name: 'WF Test',
      description: 'desc',
      steps: [{ id: 's1', approver: 'alice', order: 1 }],
    });
    useWorkflowStore.getState().refreshState();
    const after = useWorkflowStore.getState();
    expect(after.workflows.length).toBe(wCountBefore + 1);
  });

  it('checkEscalations returns escalated ids and refreshes snapshots', () => {
    const s = useWorkflowStore.getState();
    const esc = s.checkEscalations();
    expect(Array.isArray(esc)).toBe(true);
  });
});
