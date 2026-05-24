import { AlertTriangle, BarChart3, Check, DollarSign, TrendingUp } from 'lucide-react';
import type { CopilotAlert } from './CopilotTypes';
import type { GLState, BudgetState } from '@/types';

function AlertCard({ alert }: { alert: CopilotAlert }) {
  const severityColors = {
    high: 'border-red-500/40 bg-red-500/10',
    medium: 'border-amber-500/40 bg-amber-500/10',
    low: 'border-emerald-500/40 bg-emerald-500/10',
  };
  const severityIcon = {
    high: <AlertTriangle className="w-4 h-4 text-red-400" />,
    medium: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    low: <Check className="w-4 h-4 text-emerald-400" />,
  };

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${severityColors[alert.severity]}`}
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex-shrink-0">{severityIcon[alert.severity]}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            {alert.message}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {alert.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-lg border p-2.5"
      style={{
        borderColor: highlight ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)',
        background: highlight ? 'rgba(239,68,68,0.05)' : 'var(--bg-elevated)',
      }}
    >
      <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <p
        className="mt-1 text-sm font-bold tabular-nums"
        style={{ color: highlight ? '#EF4444' : 'var(--text-primary)' }}
      >
        {value}
      </p>
    </div>
  );
}

export function AlertsTab({
  alerts,
  gl,
  budget,
  highAlertCount,
}: {
  alerts: CopilotAlert[];
  gl?: GLState;
  budget?: BudgetState;
  highAlertCount: number;
}) {
  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      <div className="space-y-2.5">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <QuickStat
          icon={<DollarSign className="h-3.5 w-3.5" />}
          label="Revenue"
          value={
            gl?.entries
              ? `$${(gl.entries.reduce((s, e) => s + e.credit, 0) / 1000).toFixed(0)}K`
              : '—'
          }
        />
        <QuickStat
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          label="Expenses"
          value={
            gl?.entries
              ? `$${(gl.entries.reduce((s, e) => s + e.debit, 0) / 1000).toFixed(0)}K`
              : '—'
          }
        />
        <QuickStat
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Budgets"
          value={budget?.budgets?.length?.toString() ?? '—'}
        />
        <QuickStat
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          label="High Alerts"
          value={highAlertCount.toString()}
          highlight={highAlertCount > 0}
        />
      </div>
    </div>
  );
}
