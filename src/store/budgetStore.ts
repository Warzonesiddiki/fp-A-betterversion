import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Budget, BudgetState } from '../types';
import { masterStorage } from '../utils/masterStorage';
import { useUIStore } from './uiStore';

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

        setBudgets: (budgets) => {
          set((state) => {
            state.budgets = budgets as typeof state.budgets;
          });
        },

        setActiveBudget: (id) => {
          const budget = get().budgets.find((b) => b.id === id);
          if (!budget) return;
          set((state) => {
            state.activeBudgetId = id;
          });
        },

        setLineItems: (items) => {
          set((state) => {
            state.lineItems = items;
          });
        },

        updateLineItem: (id, updates) => {
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
          set((state) => {
            const idx = state.lineItems.findIndex((i) => i.id === id);
            if (idx !== -1) {
              const oldItem = state.lineItems[idx];
              Object.assign(state.lineItems[idx]!, updates);
              state.lastChange = {
                cellId: id,
                oldValue: oldItem!.amount,
                newValue: updates.amount ?? oldItem!.amount,
                timestamp: new Date().toISOString(),
              };
            }
          });
        },

        createBudget: (budget) => {
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
              id: `bgt-${Date.now()}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: 'usr-001',
            };
            set((state) => {
              state.budgets.push(newBudget as any);
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
        },

        deleteBudget: (id) => {
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
        },

        duplicateBudget: (id) => {
          const budget = get().budgets.find((b) => b.id === id);
          if (budget) {
            const newId = `bgt-${Date.now()}`;
            const newBudget: Budget = {
              ...budget,
              id: newId,
              name: `${budget.name} (Copy)`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            set((state) => {
              state.budgets.push(newBudget as any);
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
        },

        submitBudget: async (id) => {
          try {
            set((state) => {
              state.isSubmitting = true;
            });
            await new Promise((r) => setTimeout(r, 1000));
            set((state) => {
              const budget = state.budgets.find((b) => b.id === id);
              if (budget) {
                budget.status = 'InReview';
                useUIStore.getState().addToast({
                  type: 'success',
                  title: 'Budget Submitted',
                  message: `Successfully submitted ${budget.name} for review`,
                });
              }
              state.isSubmitting = false;
            });
          } catch (error) {
            set((state) => {
              state.isSubmitting = false;
            });
            useUIStore.getState().addToast({
              type: 'error',
              title: 'Submission Failed',
              message: 'Failed to submit budget for review',
            });
          }
        },

        approveBudget: (id) => {
          set((state) => {
            const budget = state.budgets.find((b) => b.id === id);
            if (budget) {
              budget.status = 'Approved';
              useUIStore.getState().addToast({
                type: 'success',
                title: 'Budget Approved',
                message: `Successfully approved budget: ${budget.name}`,
              });
            }
          });
        },

        rejectBudget: (id) => {
          set((state) => {
            const budget = state.budgets.find((b) => b.id === id);
            if (budget) {
              budget.status = 'Draft';
              useUIStore.getState().addToast({
                type: 'info',
                title: 'Budget Rejected',
                message: `Budget ${budget.name} has been rejected and returned to draft`,
              });
            }
          });
        },

        updateBudget: (id: string, updates: Partial<Budget>) => {
          set((state) => {
            const budget = state.budgets.find((b) => b.id === id);
            if (budget) {
              Object.assign(budget, updates);
              budget.updatedAt = new Date().toISOString();
            }
          });
        },

        undo: () => {
          const { historyIndex, history } = get();
          if (historyIndex > 0) {
            set((state) => {
              state.lineItems = history[historyIndex - 1]!;
              state.historyIndex = historyIndex - 1;
            });
          }
        },

        redo: () => {
          const { historyIndex, history } = get();
          if (historyIndex < history.length - 1) {
            set((state) => {
              state.lineItems = history[historyIndex + 1]!;
              state.historyIndex = historyIndex + 1;
            });
          }
        },

        setSelectedCell: (id) => {
          set((state) => {
            state.selectedCellId = id;
          });
        },
      })),
      {
        name: 'budget-store',
        storage: masterStorage,
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
