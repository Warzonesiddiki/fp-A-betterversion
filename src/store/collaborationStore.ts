import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';

import type { Comment, Task, ActivityLog, CollaborationState } from '../types';
import { masterStorage } from '../utils/masterStorage';
import { SyncEngine } from '../engines/SyncEngine';

export const useCollaborationStore = create<CollaborationState>()(
  subscribeWithSelector(
    persist(
      (set) => ({
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

        addComment: (comment) => {
          const id = `cmt-${Date.now()}`;
          set((state) => ({
            comments: [
              ...state.comments,
              {
                ...comment,
                id,
                createdAt: new Date().toISOString(),
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
        },

        setTasks: (tasks) => set({ tasks }),

        addTask: (task) => {
          const id = `tsk-${Date.now()}`;
          set((state) => ({
            tasks: [
              ...state.tasks,
              {
                ...task,
                id,
                createdAt: new Date().toISOString(),
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
        },

        updateTaskStatus: (id, status) =>
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
          })),

        setApprovals: (approvals) => set({ approvals }),

        updateApprovalStatus: (id, status, comment) =>
          set((state) => ({
            approvals: state.approvals.map((a) => {
              if (a.id === id) {
                return {
                  ...a,
                  status,
                  reviewedAt: new Date().toISOString(),
                  ...(comment ? { comments: comment } : {}),
                };
              }
              return a;
            }),
          })),

        setActivityLog: (log) => set({ activityLog: log }),

        addActivity: (activity) =>
          set((state) => ({
            activityLog: [
              {
                ...activity,
                id: `act-${Date.now()}`,
                timestamp: new Date().toISOString(),
              } as ActivityLog,
              ...state.activityLog,
            ],
          })),
      }),
      {
        name: 'collaboration-store',
        storage: masterStorage,
      }
    )
  )
);
