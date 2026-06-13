/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GLAccount, ImportJob, DataState } from '../types';
import { masterStorage } from '../utils/masterStorage';
import { safeJSONStorage } from '../utils/storage/safeJSONStorage';

export const useDataStore = create<DataState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        accounts: [],
        importJobs: [],
        selectedAccountId: null,
        lastImportDate: null,

        setAccounts: (accounts) => set({ accounts }),

        addAccount: (account) =>
          set((state) => ({
            accounts: [...state.accounts, { ...account, id: `acct-${Date.now()}`, children: [] }],
          })),

        updateAccount: (id, updates) =>
          set((state) => {
            const updateRecursive = (list: GLAccount[]): GLAccount[] =>
              list.map((a) => {
                if (a.id === id) return { ...a, ...updates };
                if (a.children) return { ...a, children: updateRecursive(a.children) };
                return a;
              });
            return { accounts: updateRecursive(state.accounts) };
          }),

        deleteAccount: (id) => {
          set((state) => {
            const removeRecursive = (list: GLAccount[]): GLAccount[] =>
              list
                .filter((a) => a.id !== id)
                .map((a) => ({
                  ...a,
                  children: a.children ? removeRecursive(a.children) : [],
                }));
            return {
              accounts: removeRecursive(state.accounts),
              selectedAccountId: state.selectedAccountId === id ? null : state.selectedAccountId,
            };
          });
        },

        toggleAccountActive: (id) => {
          set((state) => {
            const toggleRecursive = (list: GLAccount[]): GLAccount[] =>
              list.map((a) => {
                if (a.id === id) return { ...a, isActive: !a.isActive };
                if (a.children) return { ...a, children: toggleRecursive(a.children) };
                return a;
              });
            return { accounts: toggleRecursive(state.accounts) };
          });
        },

        addImportJob: (job) => {
          const id = `import-${Date.now()}`;
          const now = new Date().toISOString();
          set((state) => ({
            importJobs: [
              { ...job, id, status: 'Pending', startedAt: now } as ImportJob,
              ...state.importJobs,
            ],
          }));
          return id;
        },

        updateImportStatus: (id, status, error) => {
          set((state) => {
            const isCompleted = status === 'Completed';
            const newJobs = state.importJobs.map((j) => {
              if (j.id === id) {
                return {
                  ...j,
                  status,
                  ...(isCompleted ? { completedAt: new Date().toISOString() } : {}),
                  ...(error ? { error } : {}),
                };
              }
              return j;
            });
            return {
              importJobs: newJobs,
              ...(isCompleted ? { lastImportDate: new Date().toISOString() } : {}),
            };
          });
        },

        setSelectedAccount: (id) => set({ selectedAccountId: id }),
      })),
      {
        name: 'data-store',
        storage: safeJSONStorage<DataState>(masterStorage),
      }
    )
  )
);
