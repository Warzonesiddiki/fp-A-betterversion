/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import type {
  ApprovalState,
  WorkflowDefinition,
  ApprovalRequest,
  Delegation,
  WorkflowStats,
} from '@/engines/WorkflowEngine';
import { WorkflowEngine } from '@/engines/WorkflowEngine';

interface WorkflowStoreState {
  readonly engine: WorkflowEngine;
  readonly workflows: WorkflowDefinition[];
  readonly requests: ApprovalRequest[];
  readonly delegations: Delegation[];
  readonly stats: WorkflowStats;
  readonly isLoading: boolean;
  readonly error: string | null;

  // Actions
  createWorkflow: (def: Omit<WorkflowDefinition, 'id' | 'createdAt'>) => void;
  deleteWorkflow: (id: string) => void;
  submitRequest: (
    workflowId: string,
    title: string,
    description: string,
    requester: string,
    amount?: number,
    entity?: string,
    period?: string
  ) => void;
  approveRequest: (requestId: string, approver: string, comment?: string) => void;
  rejectRequest: (requestId: string, approver: string, comment?: string) => void;
  delegateRequest: (requestId: string, fromUser: string, toUser: string, comment?: string) => void;
  lockRequest: (requestId: string, actor: string) => void;
  bulkApprove: (requestIds: string[], approver: string) => void;
  addDelegation: (d: Delegation) => void;
  removeDelegation: (fromUser: string) => void;
  checkEscalations: () => string[];
  refreshState: () => void;
  setError: (error: string | null) => void;
}

const engine = new WorkflowEngine();

function snapshot(e: WorkflowEngine) {
  return {
    workflows: e.listWorkflows(),
    requests: [
      ...e.getRequestsByState('draft'),
      ...e.getRequestsByState('submitted'),
      ...e.getRequestsByState('in_review'),
      ...e.getRequestsByState('approved'),
      ...e.getRequestsByState('rejected'),
      ...e.getRequestsByState('locked'),
    ],
    delegations: e.getDelegations(),
    stats: e.getStats(),
  };
}

export const useWorkflowStore = create<WorkflowStoreState>()(
  subscribeWithSelector(
    persist(
      immer((set, _get) => ({
        engine,
        ...snapshot(engine),
        isLoading: false,
        error: null,

        createWorkflow: (def) => {
          set((state) => {
            engine.createWorkflow(def);
            const snap = snapshot(engine);
            state.workflows = snap.workflows;
            state.stats = snap.stats;
          });
        },

        deleteWorkflow: (id) => {
          set((state) => {
            engine.deleteWorkflow(id);
            const snap = snapshot(engine);
            state.workflows = snap.workflows;
            state.stats = snap.stats;
          });
        },

        submitRequest: (workflowId, title, description, requester, amount, entity, period) => {
          set((state) => {
            engine.submitRequest(workflowId, title, description, requester, amount, entity, period);
            const snap = snapshot(engine);
            state.requests = snap.requests;
            state.stats = snap.stats;
          });
        },

        approveRequest: (requestId, approver, comment) => {
          set((state) => {
            engine.approve(requestId, approver, comment);
            const snap = snapshot(engine);
            state.requests = snap.requests;
            state.stats = snap.stats;
          });
        },

        rejectRequest: (requestId, approver, comment) => {
          set((state) => {
            engine.reject(requestId, approver, comment);
            const snap = snapshot(engine);
            state.requests = snap.requests;
            state.stats = snap.stats;
          });
        },

        delegateRequest: (requestId, fromUser, toUser, comment) => {
          set((state) => {
            engine.delegate(requestId, fromUser, toUser, comment);
            const snap = snapshot(engine);
            state.requests = snap.requests;
          });
        },

        lockRequest: (requestId, actor) => {
          set((state) => {
            engine.lock(requestId, actor);
            const snap = snapshot(engine);
            state.requests = snap.requests;
            state.stats = snap.stats;
          });
        },

        bulkApprove: (requestIds, approver) => {
          set((state) => {
            for (const id of requestIds) {
              engine.approve(id, approver, 'Bulk approved');
            }
            const snap = snapshot(engine);
            state.requests = snap.requests;
            state.stats = snap.stats;
          });
        },

        addDelegation: (d) => {
          set((state) => {
            engine.addDelegation(d);
            state.delegations = engine.getDelegations();
          });
        },

        removeDelegation: (fromUser) => {
          set((state) => {
            engine.removeDelegation(fromUser);
            state.delegations = engine.getDelegations();
          });
        },

        checkEscalations: () => {
          let escalated: string[] = [];
          set((state) => {
            escalated = engine.checkEscalations();
            if (escalated.length > 0) {
              const snap = snapshot(engine);
              state.requests = snap.requests;
              state.stats = snap.stats;
            }
          });
          return escalated;
        },

        refreshState: () => {
          set((state) => {
            const snap = snapshot(engine);
            state.workflows = snap.workflows;
            state.requests = snap.requests;
            state.delegations = snap.delegations;
            state.stats = snap.stats;
          });
        },

        setError: (error) => set({ error }),
      })),
      {
        name: 'workflow-store',
        storage: masterStorage,
      }
    )
  )
);
