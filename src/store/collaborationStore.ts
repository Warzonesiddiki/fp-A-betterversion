import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { Comment, Task, ActivityLog, CollaborationState } from '../types';
import { masterStorage } from '../utils/masterStorage';
import { SyncEngine } from '../engines/SyncEngine';
import { enforce, Permissions } from '../utils/rbacEnforcer';
import { nowISO, nowMs } from '@/utils/clock';

export const useCollaborationStore = create<CollaborationState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        comments: [],
        tasks: [],
        approvals: [],
        activityLog: [],
        isLoading: false,
        error: null,

        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),
        setLoading: (isLoading: boolean) => set({ isLoading }),

        setComments: (comments) => set({ comments }),

        addComment: enforce(Permissions.COLLAB_UPDATE, 'addComment', (comment) => {
          const id = `cmt-${nowMs()}`;
          set((state) => ({
            comments: [
              ...state.comments,
              {
                ...comment,
                id,
                createdAt: nowISO(),
                replies: [],
              } as Comment,
            ],
          }));
          SyncEngine.enqueue({
            entityType: 'comment',
            entityId: id,
            action: 'create',
            data: comment,
            userId: comment.authorId ?? 'unknown',
          });
        }),

        setTasks: (tasks) => set({ tasks }),

        addTask: enforce(Permissions.COLLAB_UPDATE, 'addTask', (task) => {
          const id = `tsk-${nowMs()}`;
          set((state) => ({
            tasks: [
              ...state.tasks,
              {
                ...task,
                id,
                createdAt: nowISO(),
              } as Task,
            ],
          }));
          SyncEngine.enqueue({
            entityType: 'task',
            entityId: id,
            action: 'create',
            data: task,
            userId: task.assigneeId ?? 'unknown',
          });
        }),

        updateTaskStatus: enforce(Permissions.COLLAB_UPDATE, 'updateTaskStatus', (id, status) => {
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
          }));
        }),

        setApprovals: (approvals) => set({ approvals }),

        updateApprovalStatus: enforce(
          Permissions.WORKFLOW_APPROVE,
          'updateApprovalStatus',
          (id, status, comment) => {
            set((state) => ({
              approvals: state.approvals.map((a) => {
                if (a.id === id) {
                  return {
                    ...a,
                    status,
                    reviewedAt: nowISO(),
                    ...(comment ? { comments: comment } : {}),
                  };
                }
                return a;
              }),
            }));
          }
        ),

        setActivityLog: (log) => set({ activityLog: log }),

        addActivity: enforce(Permissions.COLLAB_UPDATE, 'addActivity', (activity) => {
          set((state) => ({
            activityLog: [
              {
                ...activity,
                id: `act-${nowMs()}`,
                timestamp: nowISO(),
              } as ActivityLog,
              ...state.activityLog,
            ],
          }));
        }),
      })),
      {
        name: 'collaboration-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
