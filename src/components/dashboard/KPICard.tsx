import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

function InlineSparkline({ data, color = '#3B82F6', height = 32 }: SparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = height;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface KPICardProps {
  title: string;
  value: number;
  format?: 'currency' | 'percent' | 'number';
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
  onClick?: () => void;
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  format = 'number',
  change,
  trend,
  sparklineData,
  onClick,
  loading,
}: KPICardProps) {
  if (loading) {
    return (
      <Card className="p-4">
        <Skeleton variant="text" width="60%" height="0.75rem" className="mb-2" />
        <Skeleton variant="text" width="80%" height="1.75rem" className="mb-1" />
        <Skeleton variant="text" width="40%" height="0.75rem" />
      </Card>
    );
  }

  const formatted =
    format === 'currency'
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      : format === 'percent'
        ? value.toFixed(1) + '%'
        : value.toLocaleString();

  const trendColor =
    trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';
  const trendArrow = trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2192';

  return (
    <Card
      className={'p-4' + (onClick ? ' cursor-pointer hover:border-blue-500/50 transition-all' : '')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => onClick && e.key === 'Enter' && onClick()}
    >
      <div className="text-xs text-slate-400 mb-1 truncate">{title}</div>
      <div className="text-2xl font-bold tabular-nums">{formatted}</div>
      {change !== undefined && (
        <div className={'flex items-center gap-1 text-xs mt-1 ' + trendColor}>
          <span>{trendArrow}</span>
          <span>
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}% vs prior
          </span>
        </div>
      )}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-2">
          <InlineSparkline
            data={sparklineData}
            color={trend === 'up' ? '#10B981' : trend === 'down' ? '#F43F5E' : '#94A3B8'}
          />
        </div>
      )}
    </Card>
  );
}
