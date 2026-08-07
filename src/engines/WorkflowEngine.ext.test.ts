/**
 * WorkflowEngine.ext.test.ts — approval workflows: conditions, parallel
 * steps, delegation, escalation, change requests, stats (MISSION D wave 2,
 * 2026-08-07).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowEngine, type WorkflowDefinition } from './WorkflowEngine';

const NOW = new Date('2026-08-07T10:00:00Z');

function makeWorkflow(over: Partial<WorkflowDefinition> = {}): WorkflowDefinition {
  return {
    id: 'wf-1',
    name: 'Budget Approval',
    description: '',
    steps: [
      {
        id: 's1',
        name: 'Manager Review',
        type: 'sequential',
        approvers: ['mgr'],
        timeoutHours: 24,
      },
      {
        id: 's2',
        name: 'CFO Approval',
        type: 'sequential',
        approvers: ['cfo'],
        timeoutHours: 48,
      },
    ],
    createdAt: '2026-01-01',
    ...over,
  } as WorkflowDefinition;
}

describe('WorkflowEngine — submit & sequential approval', () => {
  let e: WorkflowEngine;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    e = new WorkflowEngine();
  });
  afterEach(() => vi.useRealTimers());

  it('createWorkflow / get / list / delete', () => {
    const wf = e.createWorkflow({ name: 'W', description: '', steps: makeWorkflow().steps });
    expect(wf.id).toMatch(/^wf-/);
    expect(e.getWorkflow(wf.id)).toBe(wf);
    expect(e.listWorkflows()).toHaveLength(1);
    expect(e.deleteWorkflow(wf.id)).toBe(true);
    expect(e.deleteWorkflow(wf.id)).toBe(false);
  });

  it('submitRequest validates and walks sequential steps', () => {
    const wf = e.createWorkflow({ name: 'W', description: '', steps: makeWorkflow().steps });
    expect(e.submitRequest('', 't', 'd', 'u')).toBeNull();
    expect(e.submitRequest('nope', 't', 'd', 'u')).toBeNull();

    const req = e.submitRequest(wf.id, 'Q3 Budget', 'd', 'analyst', 50000, 'ACME', 'Q3')!;
    expect(req.state).toBe('submitted');
    expect(req.currentStepIndex).toBe(0);
    expect(req.entity).toBe('ACME');
    expect(req.amount).toBe(50000);

    // unauthorized approver → null
    expect(e.approve(req.id, 'bob')).toBeNull();
    // manager approves → advances to CFO
    const afterMgr = e.approve(req.id, 'mgr', 'ok');
    expect(afterMgr!.currentStepIndex).toBe(1);
    expect(afterMgr!.state).toBe('submitted');
    // CFO approves → approved
    const afterCfo = e.approve(req.id, 'cfo');
    expect(afterCfo!.state).toBe('approved');
    // terminal: further approvals rejected
    expect(e.approve(req.id, 'cfo')).toBeNull();
  });

  it('auto-approves when the first step condition is not met', () => {
    const wf = e.createWorkflow({
      name: 'W',
      description: '',
      steps: [
        {
          id: 's1',
          name: 'Review',
          type: 'sequential',
          approvers: ['mgr'],
          condition: { operator: 'gt', value: 10000 },
        },
      ],
    });
    const req = e.submitRequest(wf.id, 'Small', 'd', 'analyst', 1000)!;
    expect(req.state).toBe('approved');
    expect(req.history.some((h) => h.comment?.includes('Auto-approved'))).toBe(true);
    // amount above threshold → stays submitted
    const req2 = e.submitRequest(wf.id, 'Big', 'd', 'analyst', 50000)!;
    expect(req2.state).toBe('submitted');
  });

  it('parallel steps require every approver', () => {
    const wf = e.createWorkflow({
      name: 'W',
      description: '',
      steps: [
        {
          id: 's1',
          name: 'Dual',
          type: 'parallel',
          approvers: ['mgr', 'cfo'],
        },
        { id: 's2', name: 'Final', type: 'sequential', approvers: ['ceo'] },
      ],
    });
    const req = e.submitRequest(wf.id, 'Dual approval', 'd', 'analyst')!;
    const afterFirst = e.approve(req.id, 'mgr')!;
    expect(afterFirst.state).toBe('in_review'); // still waiting for cfo
    expect(afterFirst.currentStepIndex).toBe(0);
    const afterSecond = e.approve(req.id, 'cfo')!;
    expect(afterSecond.currentStepIndex).toBe(1); // moved to final step
    const done = e.approve(req.id, 'ceo')!;
    expect(done.state).toBe('approved');
  });

  it('reject and lock', () => {
    const wf = e.createWorkflow({ name: 'W', description: '', steps: makeWorkflow().steps });
    const req = e.submitRequest(wf.id, 'R', 'd', 'u')!;
    const rejected = e.reject(req.id, 'mgr', 'no')!;
    expect(rejected.state).toBe('rejected');
    expect(rejected.history.at(-1)!.action).toBe('reject');
    expect(e.reject(req.id, 'mgr')).toBeNull(); // terminal
    expect(e.lock(req.id, 'admin')).toBeNull(); // not approved

    const req2 = e.submitRequest(wf.id, 'R2', 'd', 'u')!;
    e.approve(req2.id, 'mgr');
    e.approve(req2.id, 'cfo');
    const locked = e.lock(req2.id, 'admin')!;
    expect(locked.state).toBe('locked');
    expect(e.lock(req2.id, 'admin')).toBeNull();
  });
});

describe('WorkflowEngine — delegation, escalation, change requests', () => {
  let e: WorkflowEngine;
  let wfId: string;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    e = new WorkflowEngine();
    wfId = e.createWorkflow({ name: 'W', description: '', steps: makeWorkflow().steps }).id;
  });
  afterEach(() => vi.useRealTimers());

  it('delegate records an audit event; step delegateTo authorizes the delegate', () => {
    const req = e.submitRequest(wfId, 'D', 'd', 'u')!;
    const d = e.delegate(req.id, 'mgr', 'mgr2', 'on vacation')!;
    expect(d.history.at(-1)!.action).toBe('delegate');
    expect(d.history.at(-1)!.delegatedTo).toBe('mgr2');
    // authority still requires the step's approvers/delegateTo — mgr2 not
    // configured on this workflow → not authorized
    expect(e.approve(req.id, 'mgr2')).toBeNull();

    // a workflow with delegateTo configured authorizes the delegate
    const wf2 = e.createWorkflow({
      name: 'W2',
      description: '',
      steps: [
        { id: 's1', name: 'Review', type: 'sequential', approvers: ['mgr'], delegateTo: ['mgr2'] },
      ],
    });
    const req2 = e.submitRequest(wf2.id, 'D2', 'd', 'u')!;
    expect(e.approve(req2.id, 'mgr2')).not.toBeNull();
  });

  it('checkEscalations auto-advances timed-out steps', () => {
    const req = e.submitRequest(wfId, 'E', 'd', 'u')!;
    // advance 25h > 24h timeout on step 1
    vi.setSystemTime(new Date('2026-08-08T11:00:00Z'));
    const escalated = e.checkEscalations();
    expect(escalated).toEqual([req.id]);
    expect(e.getRequest(req.id)!.currentStepIndex).toBe(1);
    expect(e.getRequest(req.id)!.state).toBe('submitted');
    expect(e.getRequest(req.id)!.history.at(-1)!.action).toBe('escalate');
    // second run: step 2 timeout is 48h — not yet breached
    expect(e.checkEscalations()).toEqual([]);
  });

  it('submitChangeRequest / resolveChangeRequest', () => {
    const req = e.submitRequest(wfId, 'C', 'd', 'u')!;
    expect(e.submitChangeRequest('nope', 'u', 'x')).toBeNull();
    const cr = e.submitChangeRequest(req.id, 'analyst', 'amount wrong')!;
    expect(cr.status).toBe('pending');
    expect(e.resolveChangeRequest(req.id, cr.id, 'cfo', true)).toBe(true);
    expect(e.getRequest(req.id)!.state).toBe('draft');
    expect(e.resolveChangeRequest(req.id, cr.id, 'cfo', true)).toBe(false); // already resolved
    expect(e.resolveChangeRequest('nope', cr.id, 'cfo', true)).toBe(false);
    // rejection keeps state
    const cr2 = e.submitChangeRequest(req.id, 'analyst', 'minor')!;
    e.resolveChangeRequest(req.id, cr2.id, 'cfo', false);
    expect(e.getRequest(req.id)!.state).toBe('draft'); // unchanged by rejection
  });
});

describe('WorkflowEngine — queries, stats, persistence', () => {
  let e: WorkflowEngine;
  let wfId: string;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    e = new WorkflowEngine();
    wfId = e.createWorkflow({ name: 'W', description: '', steps: makeWorkflow().steps }).id;
  });
  afterEach(() => vi.useRealTimers());

  it('getRequestsByState / getRequestsByRequester / getPendingForApprover', () => {
    const req = e.submitRequest(wfId, 'P', 'd', 'alice')!;
    expect(e.getRequestsByState('submitted').map((r) => r.id)).toEqual([req.id]);
    expect(e.getRequestsByRequester('alice')).toHaveLength(1);
    expect(e.getRequestsByRequester('nobody')).toHaveLength(0);
    expect(e.getPendingForApprover('mgr')).toHaveLength(1);
    expect(e.getPendingForApprover('cfo')).toHaveLength(0);
  });

  it('getStats computes counts, SLA breaches, bottlenecks, avg time', () => {
    const req = e.submitRequest(wfId, 'S', 'd', 'alice', 1000)!;
    vi.setSystemTime(new Date('2026-08-08T11:00:00Z')); // +25h → step 1 SLA breached
    const stats = e.getStats();
    expect(stats.pending).toBe(1);
    expect(stats.slaBreaches).toHaveLength(1);
    expect(stats.bottlenecks).toEqual({ mgr: 1 });

    // complete one request → avg approval time (submit at 10:00, approve at 11:00/12:00)
    vi.setSystemTime(new Date('2026-08-07T10:00:00Z'));
    const req2 = e.submitRequest(wfId, 'S2', 'd', 'alice')!;
    vi.setSystemTime(new Date('2026-08-07T11:00:00Z')); // +1h
    e.approve(req2.id, 'mgr');
    vi.setSystemTime(new Date('2026-08-07T12:00:00Z')); // +2h total
    e.approve(req2.id, 'cfo');
    const stats2 = e.getStats();
    expect(stats2.approved).toBe(1);
    expect(stats2.avgApprovalTimeHours).toBeCloseTo(2, 6);
  });

  it('delegations CRUD and effective-approver mapping', () => {
    const now = new Date().toISOString();
    const later = new Date(Date.now() + 86400000).toISOString();
    e.addDelegation({ fromUser: 'mgr', toUser: 'mgr2', startDate: now, endDate: later });
    expect(e.getDelegations()).toHaveLength(1);
    // step approves 'mgr2'; acting as 'mgr' maps to effective 'mgr2' → authorized
    const wf2 = e.createWorkflow({
      name: 'W2',
      description: '',
      steps: [{ id: 's1', name: 'Review', type: 'sequential', approvers: ['mgr2'] }],
    });
    const req = e.submitRequest(wf2.id, 'D2', 'd', 'u')!;
    expect(e.approve(req.id, 'mgr')).not.toBeNull();
    e.removeDelegation('mgr');
    expect(e.getDelegations()).toHaveLength(0);
  });

  it('serialize / deserialize round-trips and handles bad json', () => {
    const req = e.submitRequest(wfId, 'P', 'd', 'u')!;
    const json = e.serialize();
    const e2 = new WorkflowEngine();
    expect(e2.deserialize(json)).toBe(true);
    expect(e2.getRequest(req.id)?.title).toBe('P');
    expect(e2.getWorkflow(wfId)).toBeDefined();
    expect(e2.deserialize('garbage')).toBe(false);
  });
});
