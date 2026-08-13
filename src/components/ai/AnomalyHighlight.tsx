import { useMemo } from 'react';
import { reportingCurrency } from '@/store/financialContextStore';
import { currencyFormatter } from '@/utils/financialFormatting';
import { AlertTriangle, TrendingUp, TrendingDown, Info, ShieldAlert } from 'lucide-react';
import { cn } from '@/utils/cn';
import { AnomalyDetectionEngine } from '@/engines/AnomalyDetectionEngine';
import type {
  Anomaly,
  AnomalyDetectionResult,
  AnomalySeverity,
} from '@/engines/AnomalyDetectionEngine';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnomalyHighlightProps {
  /** Numeric values to scan for anomalies. */
  values: number[];
  /** Labels for each value (used in display). */
  labels?: string[];
  /** Z-score threshold (default: 3.0). */
  threshold?: number;
  /** Additional CSS classes. */
  className?: string;
  /** Max number of anomalies to display. */
  maxDisplay?: number;
  /** Callback when an anomaly is clicked. */
  onAnomalyClick?: (anomaly: Anomaly) => void;
}

// ─── Severity config ────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  AnomalySeverity,
  { color: string; bg: string; border: string; icon: typeof AlertTriangle }
> = {
  critical: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: ShieldAlert,
  },
  high: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: AlertTriangle,
  },
  medium: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: Info,
  },
  low: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Info },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatValue(v: number): string {
  return currencyFormatter(reportingCurrency(), { maxDecimals: 0 })(v);
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function AnomalyCard({
  anomaly,
  label,
  onClick,
}: {
  anomaly: Anomaly;
  label: string;
  onClick?: (a: Anomaly) => void;
}) {
  const config = SEVERITY_CONFIG[anomaly.severity];
  const Icon = config.icon;
  const isAbove = anomaly.dataPoint.value > anomaly.expectedRange[1];

  return (
    <button
      onClick={() => onClick?.(anomaly)}
      className={cn(
        'flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all w-full',
        'hover:brightness-110',
        config.bg,
        config.border
      )}
      aria-label={`${anomaly.severity} anomaly: ${label}`}
    >
      <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', config.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {label}
          </span>
          <span className={cn('text-[10px] font-semibold uppercase', config.color)}>
            {anomaly.severity}
          </span>
        </div>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {anomaly.reason}
        </p>
        <div
          className="flex items-center gap-3 mt-1 text-[10px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span className="flex items-center gap-1">
            {isAbove ? (
              <TrendingUp className="h-2.5 w-2.5 text-red-400" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5 text-red-400" />
            )}
            {formatValue(anomaly.dataPoint.value)}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            Expected: {formatValue(anomaly.expectedRange[0]!)} -{' '}
            {formatValue(anomaly.expectedRange[1]!)}
          </span>
        </div>
      </div>
    </button>
  );
}

function StatSummary({ result }: { result: AnomalyDetectionResult }) {
  const stats = result.statistics;
  return (
    <div
      className="grid grid-cols-4 gap-2 rounded-lg border p-2.5"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
    >
      <div className="text-center">
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Mean
        </p>
        <p className="text-xs font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
          {formatValue(stats.mean)}
        </p>
      </div>
      <div className="text-center">
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Std Dev
        </p>
        <p className="text-xs font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
          {formatValue(stats.stdDev)}
        </p>
      </div>
      <div className="text-center">
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Min
        </p>
        <p className="text-xs font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
          {formatValue(stats.min)}
        </p>
      </div>
      <div className="text-center">
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Max
        </p>
        <p className="text-xs font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
          {formatValue(stats.max)}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AnomalyHighlight({
  values,
  labels,
  threshold,
  className,
  maxDisplay = 5,
  onAnomalyClick,
}: AnomalyHighlightProps) {
  const result = useMemo(() => {
    if (values.length < 3) return null;
    const engine = new AnomalyDetectionEngine(
      threshold !== undefined ? { zScoreThreshold: threshold } : undefined
    );
    const dataPoints = AnomalyDetectionEngine.fromValues(values);
    return engine.detectAllAnomalies(dataPoints);
  }, [values, threshold]);

  if (!result || result.anomalyCount === 0) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border p-3',
          'bg-[var(--bg-surface)] border-[var(--border-subtle)]',
          className
        )}
      >
        <Info className="h-4 w-4 text-green-400" />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          No anomalies detected in {values.length} data points
        </span>
      </div>
    );
  }

  const displayed = result.anomalies.slice(0, maxDisplay);

  return (
    <div
      className={cn(
        'space-y-3 rounded-xl border p-4',
        'bg-[var(--bg-surface)] border-[var(--border-subtle)]',
        className
      )}
      role="region"
      aria-label="Anomaly Detection Results"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {result.anomalyCount} {result.anomalyCount === 1 ? 'Anomaly' : 'Anomalies'} Detected
          </span>
        </div>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {result.totalPoints} points analyzed
        </span>
      </div>

      {/* Stats */}
      <StatSummary result={result} />

      {/* Anomaly list */}
      <div className="space-y-2">
        {displayed.map((anomaly, i) => (
          <AnomalyCard
            key={`${anomaly.dataPoint.index}-${i}`}
            anomaly={anomaly}
            label={labels?.[anomaly.dataPoint.index] ?? `Point #${anomaly.dataPoint.index}`}
            onClick={onAnomalyClick}
          />
        ))}
      </div>

      {result.anomalyCount > maxDisplay && (
        <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
          +{result.anomalyCount - maxDisplay} more anomalies
        </p>
      )}
    </div>
  );
}
