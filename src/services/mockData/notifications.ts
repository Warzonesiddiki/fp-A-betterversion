import type { Notification } from '@/types';

export const notifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'approval',
    title: 'Budget Approval Required',
    message: 'FY2024 Annual Operating Budget has been submitted for review by Sarah Chen.',
    isRead: false,
    actionUrl: '/budgets/bgt-001',
    createdAt: '2024-12-02T09:30:00Z',
  },
  {
    id: 'notif-002',
    type: 'success',
    title: 'Forecast Published',
    message: 'Q4 2024 Rolling Forecast has been published and is now available for review.',
    isRead: false,
    actionUrl: '/forecasts/fcst-001',
    createdAt: '2024-12-02T08:00:00Z',
  },
  {
    id: 'notif-003',
    type: 'warning',
    title: 'Variance Threshold Breach',
    message: 'Marketing budget is 15% over threshold for November. Review required.',
    isRead: true,
    actionUrl: '/variance',
    createdAt: '2024-12-01T16:45:00Z',
  },
  {
    id: 'notif-004',
    type: 'info',
    title: 'Data Import Complete',
    message: 'October actuals import completed with 2 minor warnings.',
    isRead: true,
    actionUrl: '/data/import',
    createdAt: '2024-12-01T12:00:00Z',
  },
  {
    id: 'notif-005',
    type: 'mention',
    title: 'Mention in Commentary',
    message: 'David Kim mentioned you in the variance commentary for Cloud Infrastructure.',
    isRead: false,
    actionUrl: '/variance/acct-5100',
    createdAt: '2024-12-02T10:15:00Z',
  },
  {
    id: 'notif-006',
    type: 'deadline',
    title: 'Budget Submission Deadline',
    message: 'Department budgets for FY2025 are due in 5 business days.',
    isRead: true,
    actionUrl: '/budgets',
    createdAt: '2024-12-01T09:00:00Z',
  },
  {
    id: 'notif-007',
    type: 'error',
    title: 'ERP Sync Failure',
    message: 'SAP connection timed out during scheduled sync. Retry in progress.',
    isRead: false,
    actionUrl: '/data/import',
    createdAt: '2024-12-02T11:30:00Z',
  },
  {
    id: 'notif-008',
    type: 'info',
    title: 'Scenario Updated',
    message: 'Cost Cutting scenario metrics have been recalculated based on new assumptions.',
    isRead: true,
    actionUrl: '/scenarios/scn-004',
    createdAt: '2024-11-30T14:00:00Z',
  },
];

export function getUnreadCount(): number {
  return notifications.filter((n) => !n.isRead).length;
}
