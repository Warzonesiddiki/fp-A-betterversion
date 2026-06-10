import React from 'react';
import type {
  DataBarConfig,
  IconSetConfig,
  ColorScaleConfig,
  EvaluatedFormat,
} from '@/engines/ConditionalFormattingEngine';
import { cn } from '@/utils/cn';

// ── Data Bar Renderer ───────────────────────────────────────────────

export interface DataBarRendererProps {
  value: number | string;
  percentage: number;
  config: DataBarConfig;
  className?: string;
}

export function DataBarRenderer({ value, percentage, config, className }: DataBarRendererProps) {
  const clampedPct = Math.max(0, Math.min(100, percentage * 100));

  return (
    <div className={cn('relative flex items-center w-full h-full min-h-[20px]', className)}>
      {config.showAxis && (
        <div
          className="absolute h-full w-px"
          style={{ left: '50%', backgroundColor: config.axisColor ?? '#d1d5db' }}
        />
      )}
      <div
        className={cn(
          'absolute left-0 top-0 h-full rounded-sm opacity-40',
          config.style === 'gradient' && 'bg-gradient-to-r'
        )}
        style={{
          width: `${clampedPct}%`,
          backgroundColor: config.barColor,
        }}
      />
      {config.showValue && (
        <span className="relative z-10 ml-1 text-xs font-medium tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      )}
    </div>
  );
}

// ── Icon Set Renderer ───────────────────────────────────────────────

const ICON_SETS: Record<string, string[]> = {
  '3-arrows': ['↑', '→', '↓'],
  '3-traffic-lights': ['🟢', '🟡', '🔴'],
  '3-stars': ['★', '★', '☆'],
  '5-ratings': ['★★★★★', '★★★★', '★★★', '★★', '★'],
  '4-traffic-lights': ['🟢', '🟡', '🟠', '🔴'],
};

const ICON_COLORS: Record<string, string[]> = {
  '3-arrows': ['#16a34a', '#ca8a04', '#dc2626'],
  '3-traffic-lights': ['#16a34a', '#ca8a04', '#dc2626'],
  '3-stars': ['#eab308', '#eab308', '#d1d5db'],
  '5-ratings': ['#16a34a', '#65a30d', '#ca8a04', '#ea580c', '#dc2626'],
  '4-traffic-lights': ['#16a34a', '#ca8a04', '#ea580c', '#dc2626'],
};

export interface IconSetRendererProps {
  iconIndex: number;
  config: IconSetConfig;
  className?: string;
  value?: number | string;
}

export function IconSetRenderer({ iconIndex, config, className, value }: IconSetRendererProps) {
  const icons = ICON_SETS[config.type] ?? ICON_SETS['3-arrows'];
  const colors = ICON_COLORS[config.type] ?? ICON_COLORS['3-arrows'];
  const safeIdx = Math.max(0, Math.min(icons!.length - 1, iconIndex));

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span
        className="text-sm leading-none"
        style={{ color: colors![safeIdx] }}
        aria-label={`Rating: ${safeIdx + 1} of ${icons!.length}`}
      >
        {icons![safeIdx]}
      </span>
      {!config.showIconOnly && value !== undefined && (
        <span className="tabular-nums text-xs">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      )}
    </div>
  );
}

// ── Color Scale Renderer ────────────────────────────────────────────

export interface ColorScaleRendererProps {
  interpolatedColor: string;
  config: ColorScaleConfig;
  className?: string;
  value?: number | string;
}

export function ColorScaleRenderer({
  interpolatedColor,
  className,
  value,
}: ColorScaleRendererProps) {
  return (
    <div
      className={cn('flex items-center justify-end w-full h-full px-2 py-1 rounded-sm', className)}
      style={{ backgroundColor: interpolatedColor }}
    >
      {value !== undefined && (
        <span className="tabular-nums text-xs font-medium text-gray-800">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      )}
    </div>
  );
}

// ── Variance Highlighter ────────────────────────────────────────────

export type VarianceDirection = 'favorable' | 'unfavorable' | 'neutral';

export interface VarianceHighlighterProps {
  value: number | string;
  direction: VarianceDirection;
  className?: string;
}

const VARIANCE_STYLES: Record<VarianceDirection, string> = {
  favorable: 'bg-green-50 text-green-800 border-l-2 border-green-400',
  unfavorable: 'bg-red-50 text-red-800 border-l-2 border-red-400',
  neutral: 'bg-yellow-50 text-yellow-800 border-l-2 border-yellow-400',
};

export function VarianceHighlighter({ value, direction, className }: VarianceHighlighterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end w-full px-2 py-1 rounded-sm tabular-nums text-xs font-medium',
        VARIANCE_STYLES[direction]!,
        className
      )}
    >
      {typeof value === 'number' ? value.toLocaleString() : value}
    </div>
  );
}

// ── Composite Cell Renderer (integrates with AG Grid / DataGrid) ────

export interface ConditionalCellRendererProps {
  value: unknown;
  evaluated: EvaluatedFormat | null;
  className?: string;
}

export function ConditionalCellRenderer({
  value,
  evaluated,
  className,
}: ConditionalCellRendererProps) {
  if (!evaluated || !evaluated.matched) {
    return <span className={className}>{String(value ?? '')}</span>;
  }

  if (evaluated.dataBar) {
    return (
      <DataBarRenderer
        value={value as number | string}
        percentage={evaluated.dataBar.percentage}
        config={evaluated.dataBar}
        className={className}
      />
    );
  }

  if (evaluated.iconSet) {
    return (
      <IconSetRenderer
        iconIndex={evaluated.iconSet.iconIndex}
        config={evaluated.iconSet}
        className={className}
        value={value as number | string}
      />
    );
  }

  if (evaluated.colorScale) {
    return (
      <ColorScaleRenderer
        interpolatedColor={evaluated.colorScale.interpolatedColor}
        config={evaluated.colorScale}
        className={className}
        value={value as number | string}
      />
    );
  }

  // Background/text color applied via inline style
  const style: React.CSSProperties = {};
  if (evaluated.style?.backgroundColor) style.backgroundColor = evaluated.style.backgroundColor;
  if (evaluated.style?.textColor) style.color = evaluated.style.textColor;

  return (
    <span className={cn('px-1 rounded-sm', className)} style={style}>
      {String(value ?? '')}
    </span>
  );
}
