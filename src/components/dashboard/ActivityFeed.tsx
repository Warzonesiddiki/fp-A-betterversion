import { useMemo, memo } from 'react';

interface ActivityItem {
  id?: string;
  type?: string;
  userName?: string;
  action?: string;
  resourceName?: string;
  timestamp?: string;
}

export interface ActivityFeedProps {
  maxItems?: number;
}

export const ActivityFeed = memo(function ActivityFeed({ maxItems = 10 }: ActivityFeedProps) {
  const activities = useMemo(() => {
    try {
      const stored = localStorage.getItem('finplan-activity-log');
      return stored ? JSON.parse(stored).slice(0, maxItems) : [];
    } catch {
      return [];
    }
  }, [maxItems]);

  if (activities.length === 0) {
    return (
      <p className="text-[var(--text-muted)] text-center py-6 text-sm">
        No recent activity. Activity appears as you import data, edit budgets, and generate reports.
      </p>
    );
  }

  return (
    <div className="space-y-0" role="region" aria-label="ActivityFeed">
      {activities.map((item: ActivityItem, i: number) => (
        <div
          key={item.id || i}
          className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0"
        >
          <div
            className={
              'w-2 h-2 rounded-full mt-1.5 shrink-0 ' +
              (item.type === 'import'
                ? 'bg-blue-500'
                : item.type === 'edit'
                  ? 'bg-yellow-500'
                  : item.type === 'approve'
                    ? 'bg-green-500'
                    : 'bg-[var(--text-muted)]')
            }
          />
          <div className="text-sm flex-1 min-w-0">
            <span className="font-medium text-[var(--text-primary)]">{item.userName || 'System'}</span>
            <span className="text-[var(--text-muted)]"> {item.action || 'performed'} </span>
            <span className="font-medium text-[var(--text-primary)]">{item.resourceName || 'an action'}</span>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
              {item.timestamp ? formatRelativeTime(item.timestamp) : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  if (days < 7) return days + 'd ago';
  return new Date(timestamp).toLocaleDateString();
}
