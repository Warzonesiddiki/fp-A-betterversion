import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Notification, NotificationState } from '../types';
import { masterStorage } from '../utils/masterStorage';

export const useNotificationStore = create<NotificationState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        notifications: [],
        unreadCount: 0,
        error: null,

        setError: (error) => set({ error }),

        clearError: () => set({ error: null }),

        setNotifications: (notifications) =>
          set({
            notifications,
            unreadCount: notifications.filter((n) => !n.isRead).length,
          }),

        markAsRead: (id) =>
          set((state) => {
            const notifications = state.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true } : n
            );
            return {
              notifications,
              unreadCount: notifications.filter((n) => !n.isRead).length,
            };
          }),

        markAllAsRead: () =>
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
          })),

        addNotification: (notification) =>
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
          }),

        clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
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
