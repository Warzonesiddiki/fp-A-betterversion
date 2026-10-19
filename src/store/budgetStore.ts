import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { WritableDraft } from 'immer';
import type { Budget, BudgetState, BudgetStatus } from '../types';
import { masterStorage } from '../utils/masterStorage';
import { useUIStore } from './uiStore';
import { useAuthStore } from './authStore';
import { enforce, Permissions } from '../utils/rbacEnforcer';
import { assertSnapshotReplayAllowed, assertUpdateAllowed } from './periodLockGuard';
import { now } from '@/utils/clock';

/**
 * Phase 7 — plan approval lifecycle (enforced here, not by page convention):
 *   Draft -> InReview -> Approved -> Locked; InReview -> Rejected -> InReview.
 * Illegal moves throw with the current status named. Workflow fields
 * (status, submittedAt, approvedAt, approvedBy, ...) can never be written
 * through the generic update path.
 */
const BUDGET_TRANSITIONS: Record<BudgetStatus, readonly BudgetStatus[]> = {
  Draft: ['InReview'],
  InReview: ['Approved', 'Rejected'],
  Rejected: ['InReview'],
  Approved: ['Locked'],
  Locked: ['Approved'],
};

function assertBudgetTransition(budget: Budget, to: BudgetStatus, action: string): void {
  if (!BUDGET_TRANSITIONS[budget.status].includes(to)) {
    throw new Error(
      `Cannot ${action} a budget in status ${budget.status}; it must be ` +
        `${BUDGET_TRANSITIONS[budget.status].join(' or ') || 'in a movable status'} first.`
    );
  }
}

const WORKFLOW_FIELDS = [
  'status',
  'submittedAt',
  'approvedAt',
  'approvedBy',
  'id',
  'createdAt',
  'createdBy',
  'version',
] as const;

export const useBudgetStore = create<BudgetState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        budgets: [],
        activeBudgetId: null,
        lineItems: [],
        isLoading: false,
        isSubmitting: false,
        lastChange: null,
        history: [[]],
        historyIndex: 0,
        selectedCellId: null,

        setBudgets: enforce(Permissions.BUDGET_UPDATE, 'setBudgets', (budgets) => {
          set((state) => {
            state.budgets = budgets as typeof state.budgets;
          });
        }),

        setActiveBudget: (id) => {
          const budget = get().budgets.find((b) => b.id === id);
          if (!budget) return;
          set((state) => {
            state.activeBudgetId = id;
          });
        },

        setLineItems: enforce(Permissions.BUDGET_UPDATE, 'setLineItems', (items) => {
          set((state) => {
            state.lineItems = items;
          });
        }),

        updateLineItem: enforce(Permissions.BUDGET_UPDATE, 'updateLineItem', (id, updates) => {
          // Input validation
          if (!id || typeof id !== 'string') {
            throw new Error('id must be a non-empty string');
          }
          if (!updates || typeof updates !== 'object') {
            throw new Error('updates must be an object');
          }
          if (
            updates.amount !== undefined &&
            (typeof updates.amount !== 'number' || !Number.isFinite(updates.amount))
          ) {
            throw new Error('amount must be a finite number');
          }
          // W6-P0-11: hard-locked periods are immutable — reject (typed
          // PeriodLockedError + error toast) before any state mutation.
          const existingItem = get().lineItems.find((i) => i.id === id);
          if (existingItem) {
            assertUpdateAllowed(existingItem, updates);
            // Phase 7 lifecycle: a plan under review or approved is
            // frozen at the line level too — editing substance requires
            // a rejection (back to Rejected) or a new version.
            const owner = get().budgets.find((b) => b.id === existingItem.budgetId);
            // The period-close freeze is a system action, not an edit:
            // propagateLock sets ONLY `isLocked: true`, and it must be
            // able to freeze an Approved budget's lines precisely
            // because that budget is final. Any other field change on
            // a non-Draft/Rejected budget remains an error.
            const updateKeys = Object.keys(updates);
            const isFreezeOnly =
              updateKeys.length > 0 &&
              updateKeys.every((k) => k === 'isLocked') &&
              updates.isLocked === true;
            if (owner && !isFreezeOnly && owner.status !== 'Draft' && owner.status !== 'Rejected') {
              throw new Error(
                `Cannot edit line items of a budget in status ${owner.status}; only Draft or Rejected budgets can be edited.`
              );
            }
          }
          set((state) => {
            const idx = state.lineItems.findIndex((i) => i.id === id);
            if (idx !== -1) {
              const oldItem = state.lineItems[idx];
              Object.assign(state.lineItems[idx]!, updates);
              state.lastChange = {
                cellId: id,
                oldValue: oldItem!.amount,
                newValue: updates.amount ?? oldItem!.amount,
                timestamp: now().toISOString(),
              };
            }
          });
        }),

        createBudget: enforce(Permissions.BUDGET_CREATE, 'createBudget', (budget) => {
          try {
            // Input validation
            if (!budget || typeof budget !== 'object') {
              throw new Error('budget must be an object');
            }
            if (
              !budget.name ||
              typeof budget.name !== 'string' ||
              budget.name.trim().length === 0
            ) {
              throw new Error('budget name must be a non-empty string');
            }
            if (budget.name.length > 200) {
              throw new Error('budget name must be 200 characters or less');
            }
            const newBudget: Budget = {
              ...budget,
              id: `bgt-${now().getTime()}`,
              createdAt: now().toISOString(),
              updatedAt: now().toISOString(),
              createdBy: 'usr-001',
            };
            set((state) => {
              state.budgets.push(newBudget as WritableDraft<Budget>);
            });
            useUIStore.getState().addToast({
              type: 'success',
              title: 'Budget Created',
              message: `Successfully created budget: ${newBudget.name}`,
            });
            return newBudget.id;
          } catch (error) {
            useUIStore.getState().addToast({
              type: 'error',
              title: 'Creation Failed',
              message: error instanceof Error ? error.message : 'Failed to create budget',
            });
            throw error;
          }
        }),

        deleteBudget: enforce(Permissions.BUDGET_DELETE, 'deleteBudget', (id) => {
          const budget = get().budgets.find((b) => b.id === id);
          set((state) => {
            const idx = state.budgets.findIndex((b) => b.id === id);
            if (idx !== -1) state.budgets.splice(idx, 1);
            if (state.activeBudgetId === id) state.activeBudgetId = null;
          });
          if (budget) {
            useUIStore.getState().addToast({
              type: 'success',
              title: 'Budget Deleted',
              message: `Successfully deleted budget: ${budget.name}`,
            });
          }
        }),

        duplicateBudget: enforce(Permissions.BUDGET_CREATE, 'duplicateBudget', (id) => {
          const budget = get().budgets.find((b) => b.id === id);
          if (budget) {
            const newId = `bgt-${now().getTime()}`;
            const newBudget: Budget = {
              ...budget,
              id: newId,
              name: `${budget.name} (Copy)`,
              createdAt: now().toISOString(),
              updatedAt: now().toISOString(),
            };
            set((state) => {
              state.budgets.push(newBudget as WritableDraft<Budget>);
            });
            useUIStore.getState().addToast({
              type: 'success',
              title: 'Budget Duplicated',
              message: `Successfully duplicated budget: ${budget.name}`,
            });
            return newId;
          }
          useUIStore.getState().addToast({
            type: 'error',
            title: 'Duplication Failed',
            message: 'Original budget not found',
          });
          return '';
        }),

        submitBudget: enforce(Permissions.BUDGET_UPDATE, 'submitBudget', async (id) => {
          const existing = get().budgets.find((b) => b.id === id);
          if (!existing) return;
          if (existing.status !== 'Draft' && existing.status !== 'Rejected') {
            throw new Error(
              `Cannot submit a budget in status ${existing.status}; only a Draft or Rejected budget can be submitted.`
            );
          }
          set((state) => {
            state.isSubmitting = true;
          });
          try {
            await Promise.resolve();
            set((state) => {
              const budget = state.budgets.find((b) => b.id === id);
              if (budget) {
                budget.status = 'InReview';
                budget.submittedAt = now().toISOString();
                budget.approvedAt = null;
                budget.approvedBy = null;
                budget.updatedAt = now().toISOString();
                useUIStore.getState().addToast({
                  type: 'success',
                  title: 'Budget Submitted',
                  message: `Successfully submitted ${budget.name} for review`,
                });
              }
              state.isSubmitting = false;
            });
          } catch (_error) {
            set((state) => {
              state.isSubmitting = false;
            });
            useUIStore.getState().addToast({
              type: 'error',
              title: 'Submission Failed',
              message: 'Failed to submit budget for review',
            });
          }
        }),

        approveBudget: enforce(Permissions.BUDGET_UPDATE, 'approveBudget', (id) => {
          const existing = get().budgets.find((b) => b.id === id);
          if (!existing) return;
          assertBudgetTransition(existing, 'Approved', 'approve');
          const actor = useAuthStore.getState().user?.id ?? 'unknown';
          set((state) => {
            const budget = state.budgets.find((b) => b.id === id);
            if (budget) {
              budget.status = 'Approved';
              budget.approvedAt = now().toISOString();
              budget.approvedBy = actor;
              budget.updatedAt = now().toISOString();
              useUIStore.getState().addToast({
                type: 'success',
                title: 'Budget Approved',
                message: `Successfully approved budget: ${budget.name}`,
              });
            }
          });
        }),

        rejectBudget: enforce(Permissions.BUDGET_UPDATE, 'rejectBudget', (id) => {
          const existing = get().budgets.find((b) => b.id === id);
          if (!existing) return;
          assertBudgetTransition(existing, 'Rejected', 'reject');
          set((state) => {
            const budget = state.budgets.find((b) => b.id === id);
            if (budget) {
              budget.status = 'Rejected';
              useUIStore.getState().addToast({
                type: 'info',
                title: 'Budget Rejected',
                message: `Budget ${budget.name} has been rejected; edit and resubmit when ready`,
              });
            }
          });
        }),

        lockBudget: enforce(Permissions.BUDGET_UPDATE, 'lockBudget', (id) => {
          const existing = get().budgets.find((b) => b.id === id);
          if (!existing) return;
          assertBudgetTransition(existing, 'Locked', 'lock');
          set((state) => {
            const budget = state.budgets.find((b) => b.id === id);
            if (budget) {
              budget.status = 'Locked';
              budget.updatedAt = now().toISOString();
            }
          });
        }),

        unlockBudget: enforce(Permissions.BUDGET_UPDATE, 'unlockBudget', (id) => {
          const existing = get().budgets.find((b) => b.id === id);
          if (!existing) return;
          assertBudgetTransition(existing, 'Approved', 'unlock');
          set((state) => {
            const budget = state.budgets.find((b) => b.id === id);
            if (budget) {
              budget.status = 'Approved';
              budget.updatedAt = now().toISOString();
            }
          });
        }),

        updateBudget: enforce(
          Permissions.BUDGET_UPDATE,
          'updateBudget',
          (id: string, updates: Partial<Budget>) => {
            for (const field of WORKFLOW_FIELDS) {
              if (field in updates) {
                throw new Error(
                  `updateBudget cannot change workflow field "${field}"; use the lifecycle actions (submit/approve/reject/lock) instead.`
                );
              }
            }
            const existing = get().budgets.find((b) => b.id === id);
            if (!existing) return;
            if (existing.status !== 'Draft' && existing.status !== 'Rejected') {
              throw new Error(
                `Cannot edit a budget in status ${existing.status}; only Draft or Rejected budgets can be edited.`
              );
            }
            set((state) => {
              const budget = state.budgets.find((b) => b.id === id);
              if (budget) {
                Object.assign(budget, updates);
                budget.updatedAt = now().toISOString();
              }
            });
          }
        ),

        undo: enforce(Permissions.BUDGET_UPDATE, 'undo', () => {
          const { historyIndex, history } = get();
          if (historyIndex > 0) {
            // W6-P0-11: replay must not resurrect changes in hard-locked periods.
            assertSnapshotReplayAllowed(get().lineItems, history[historyIndex - 1]!);
            set((state) => {
              state.lineItems = history[historyIndex - 1]!;
              state.historyIndex = historyIndex - 1;
            });
          }
        }),

        redo: enforce(Permissions.BUDGET_UPDATE, 'redo', () => {
          const { historyIndex, history } = get();
          if (historyIndex < history.length - 1) {
            // W6-P0-11: replay must not apply changes to hard-locked periods.
            assertSnapshotReplayAllowed(get().lineItems, history[historyIndex + 1]!);
            set((state) => {
              state.lineItems = history[historyIndex + 1]!;
              state.historyIndex = historyIndex + 1;
            });
          }
        }),

        setSelectedCell: enforce(Permissions.UI_UPDATE, 'setSelectedCell', (id) => {
          set((state) => {
            state.selectedCellId = id;
          });
        }),
      })),
      {
        name: 'budget-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);

// Memoized selectors to prevent unnecessary re-renders
export const budgetSelectors = {
  budgets: (state: BudgetState) => state.budgets,
  activeBudgetId: (state: BudgetState) => state.activeBudgetId,
  lineItems: (state: BudgetState) => state.lineItems,
  isLoading: (state: BudgetState) => state.isLoading,
  isSubmitting: (state: BudgetState) => state.isSubmitting,
  lastChange: (state: BudgetState) => state.lastChange,
  historyIndex: (state: BudgetState) => state.historyIndex,
  selectedCellId: (state: BudgetState) => state.selectedCellId,
  // Derived selectors
  activeBudget: (state: BudgetState) =>
    state.budgets.find((b) => b.id === state.activeBudgetId) ?? null,
  budgetCount: (state: BudgetState) => state.budgets.length,
  canUndo: (state: BudgetState) => state.historyIndex > 0,
  canRedo: (state: BudgetState) => state.historyIndex < state.history.length - 1,
  draftBudgets: (state: BudgetState) => state.budgets.filter((b) => b.status === 'Draft'),
  inReviewBudgets: (state: BudgetState) => state.budgets.filter((b) => b.status === 'InReview'),
  approvedBudgets: (state: BudgetState) => state.budgets.filter((b) => b.status === 'Approved'),
};
