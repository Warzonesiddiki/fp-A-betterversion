import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Notification, NotificationState } from '../types';
import { masterStorage } from '../utils/masterStorage';
import { enforce, Permissions } from '../utils/rbacEnforcer';

export const useNotificationStore = create<NotificationState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        notifications: [],
        unreadCount: 0,
        error: null,

        setError: (error) => set({ error }),

        clearError: () => set({ error: null }),

        setNotifications: enforce(
          Permissions.NOTIFICATION_UPDATE,
          'setNotifications',
          (notifications) =>
            set({
              notifications,
              unreadCount: notifications.filter((n) => !n.isRead).length,
            })
        ),

        markAsRead: enforce(Permissions.NOTIFICATION_UPDATE, 'markAsRead', (id) =>
          set((state) => {
            const notifications = state.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true } : n
            );
            return {
              notifications,
              unreadCount: notifications.filter((n) => !n.isRead).length,
            };
          })
        ),

        markAllAsRead: enforce(Permissions.NOTIFICATION_UPDATE, 'markAllAsRead', () =>
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
          }))
        ),

        addNotification: enforce(
          Permissions.NOTIFICATION_CREATE,
          'addNotification',
          (notification) =>
            set((state) => {
              const newNotification: Notification = {
                ...notification,
                id: `notif-${Date.now()}`,
                createdAt: new Date().toISOString(),
                isRead: false,
              };
              const notifications = [newNotification, ...state.notifications];
              return {
                notifications,
                unreadCount: notifications.filter((n) => !n.isRead).length,
              };
            })
        ),

        clearNotifications: enforce(Permissions.NOTIFICATION_DELETE, 'clearNotifications', () =>
          set({ notifications: [], unreadCount: 0 })
        ),
      })),
      {
        name: 'notification-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
