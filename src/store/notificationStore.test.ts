import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from './notificationStore';

describe('notificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
    });
  });

  it('should have correct initial state', () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
  });

  it('should add a notification', () => {
    useNotificationStore.getState().addNotification({
      title: 'Test',
      message: 'Test message',
      type: 'info',
    } as any);
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.unreadCount).toBe(1);
    expect(state.notifications[0].title).toBe('Test');
    expect(state.notifications[0].isRead).toBe(false);
  });

  it('should mark notification as read', () => {
    useNotificationStore.getState().addNotification({
      title: 'Test',
      message: 'Test',
      type: 'info',
    } as any);
    const id = useNotificationStore.getState().notifications[0].id;
    useNotificationStore.getState().markAsRead(id);
    expect(useNotificationStore.getState().notifications[0].isRead).toBe(true);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('should mark all as read', () => {
    useNotificationStore
      .getState()
      .addNotification({ title: 'N1', message: 'M1', type: 'info' } as any);
    useNotificationStore
      .getState()
      .addNotification({ title: 'N2', message: 'M2', type: 'warning' } as any);
    useNotificationStore.getState().markAllAsRead();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useNotificationStore.getState().notifications.every((n) => n.isRead)).toBe(true);
  });

  it('should clear notifications', () => {
    useNotificationStore
      .getState()
      .addNotification({ title: 'N1', message: 'M1', type: 'info' } as any);
    useNotificationStore.getState().clearNotifications();
    expect(useNotificationStore.getState().notifications).toEqual([]);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('should set notifications and count unread', () => {
    const notifications = [
      { id: 'n1', isRead: false },
      { id: 'n2', isRead: true },
      { id: 'n3', isRead: false },
    ] as any;
    useNotificationStore.getState().setNotifications(notifications);
    expect(useNotificationStore.getState().notifications).toHaveLength(3);
    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });
});
