import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import type { ApprovalRequest, WorkflowStats } from '@/engines/WorkflowEngine';

interface Props {
  stats: WorkflowStats;
  className?: string;
}

export function ApprovalDashboard({ stats, className }: Props) {
  const cards = [
    {
      label: 'Pending',
      value: stats.pending,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'Approved',
      value: stats.approved,
      color: 'fin-positive',
      bg: 'bg-green-50 dark:bg-green-950',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      color: 'fin-negative',
      bg: 'bg-red-50 dark:bg-red-950',
    },
    {
      label: 'Locked',
      value: stats.locked,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
  ];

  const bottleneckEntries = Object.entries(stats.bottlenecks).sort((a, b) => b[1] - a[1]);
  const topBottleneck = bottleneckEntries[0];

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Approval Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className={cn('rounded-lg p-4 text-center', card.bg)}>
              <p className={cn('text-3xl font-bold', card.color)}>{card.value}</p>
              <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Average Approval Time */}
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Average Approval Time</h3>
          <p className="text-2xl font-bold">
            {stats.avgApprovalTimeHours > 0
              ? stats.avgApprovalTimeHours < 1
                ? `${Math.round(stats.avgApprovalTimeHours * 60)}m`
                : `${stats.avgApprovalTimeHours.toFixed(1)}h`
              : 'N/A'}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {stats.approved > 0
              ? `Based on ${stats.approved} approved requests`
              : 'No approved requests yet'}
          </p>
        </div>

        {/* Bottlenecks */}
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Bottlenecks</h3>
          {bottleneckEntries.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No pending requests</p>
          ) : (
            <div className="space-y-2">
              {bottleneckEntries.slice(0, 5).map(([approver, count]) => (
                <div key={approver} className="flex items-center justify-between">
                  <span className="text-sm">{approver}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (count / (topBottleneck?.[1] ?? 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SLA Breaches */}
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            SLA Breaches
            {stats.slaBreaches.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {stats.slaBreaches.length}
              </span>
            )}
          </h3>
          {stats.slaBreaches.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No SLA breaches</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {stats.slaBreaches.map((req: ApprovalRequest) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between text-sm border-l-2 border-red-500 pl-2"
                >
                  <div>
                    <p className="font-medium">{req.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">by {req.requester}</p>
                  </div>
                  <span className="text-xs fin-negative">Overdue</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
