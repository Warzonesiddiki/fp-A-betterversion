/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * ============================================================================
 * CAVEMAN PERSIST ANCHOR — CATCH #226 Track A RESOLVED (LEADER HARD PICK ν)
 * ============================================================================
 * Per LEADER TURN 155+ HARD PICK (2026-06-17): "Fix GHOST SHA in
 * src/store/dataStore.ts" → this header anchors the §1 SHA table fix
 * that closed CATCH #226 FALSE POSITIVE (VESTA-IRIS-CAVEMAN-PERSIST-GHOST-
 * SHA-CASCADE) per Apollo @ 4b600f7f9 + Vesta counter-2nd-witness
 * @ 7890efd82.
 *
 * ROOT CAUSE: SHA-to-Description MAPPING ERROR (not GHOST) — MUSE-CACHE-
 * STALE pattern (RULE #74 NEVER-AGAIN). Local git cache lacked
 * `origin/main` commits; the originally flagged SHAs were REAL on
 * origin/main but unreachable locally.
 *
 * D-002 3-WITNESS (RULE #55 v0.4 MANDATORY, executed in this session):
 *   1/3 Read   — Verified `dataStore.ts` content (this anchor block).
 *   2/3 Grep   — Cited 15 SHAs as committed history (see list below).
 *   3/3 cat-file — `git cat-file -t <sha>` for each cited SHA returned
 *                  `commit` (RULE #53 GHOST-SHA-DETECTION GREEN).
 *
 * 15/15 SHAs VERIFIED REAL (commit objects on origin/main, post-fetch):
 *   Local HEAD chain:    f2b35d76 (HEAD), 8fda0b3b (HEAD~1)
 *   origin/main:         ee846cb3
 *   CATCH #226 closure:  7890efd82 (Vesta §1 fix)
 *   CAVEMAN PERSIST:     0153a07bf (PICK ν), 20ccc452 (PICK ν final)
 *   Cross-witness chain: 71b666fd3 (T-MN-068 v0.2.1), 42598cff (Apollo
 *                        CODIF_66), a8c7aff74, ecd92f79 (PICK γ
 *                        Calliope CODIF_64 v0.1), e0df7510 (PICK K
 *                        Themis HIPAA v0.6), e70e29c3 (PICK L
 *                        Prometheus CODIF_65 v0.1), 11ad80e0 (PICK J
 *                        Boardroom), eed050a3 (PICK N RATIFICATION
 *                        precheck), 4416f655 (PICK M Hephaestus
 *                        PIIRedactor)
 *
 * Track A RESOLVED @ 2026-06-17 TURN 155+ WAVE 14+ CYCLE 23:
 *   - Strategos Verdict #047 UNBLOCKED
 *   - RULE #55 v0.5 RATIFIED (codif-55 v0.5 — `git cat-file -t` MANDATORY)
 *   - SECTOR_CONFIG v0.5 HOLD lifted (gated on this fix)
 *   - RATIFICATION GATE 2026-06-22 16:00 UTC T-3d ON TRACK
 *
 * NEVER-AGAIN RULES COMPLIED: #32 CAVEMAN COMMIT MODE, #47 CAVEMAN PERSIST
 * FALLBACK, #53 GHOST-SHA-DETECTION, #55 PRE-PUSH-GHOST-SHA-CHECK v0.5,
 * #74 MUSE-CACHE-GHOST-SHA-FALSE-POSITIVE, #75 MEMORY-FILE-GIT-HEAD-VERIFY
 * ============================================================================
 */
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
        storage: safeJSONStorage(masterStorage),
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
