import React from 'react';
import { cn } from '@/utils/cn';

export interface CalendarHeatmapProps {
  data: Array<{ date: string; value: number }>;
  startDate?: string;
  endDate?: string;
  colorScale?: string[];
  format?: (value: number) => string;
  className?: string;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  data,
  startDate,
  endDate,
  colorScale = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  format = (v) => v.toString(),
  className,
}) => {
  if (!data || data.length === 0)
    return <div className="flex items-center justify-center h-16 text-slate-400 dark:text-slate-300">No data</div>;

  const dataMap = new Map(data.map((d) => [d.date, d.value]));
  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal;

  const start = startDate ? new Date(startDate) : new Date(data[0]?.date ?? new Date());
  const end = endDate ? new Date(endDate) : new Date();

  const getColor = (value: number | undefined): string => {
    if (value === undefined || value === null) return colorScale[0];
    if (range === 0) return colorScale[Math.floor(colorScale.length / 2)];
    const normalized = (value - minVal) / range;
    const idx = Math.min(Math.floor(normalized * (colorScale.length - 1)), colorScale.length - 1);
    return colorScale[idx];
  };

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  const current = new Date(start);

  // Fill to start of week
  while (current.getDay() !== 0) {
    current.setDate(current.getDate() - 1);
  }

  while (current <= end) {
    currentWeek.push(new Date(current));
    if (current.getDay() === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    current.setDate(current.getDate() + 1);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {dayLabels.map((label, i) => (
            <div key={i} className="w-4 h-4 text-[10px] text-[var(--text-muted)] flex items-center">
              {label}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {Array.from({ length: 7 }, (_, di) => {
              const date = week.find((d) => d.getDay() === di);
              if (!date) return <div key={di} className="w-4 h-4" />;
              const dateStr = date.toISOString().split('T')[0];
              const value = dataMap.get(dateStr);

              return (
                <div
                  key={di}
                  className="w-4 h-4 rounded-sm cursor-pointer"
                  style={{ backgroundColor: getColor(value) }}
                  title={`${dateStr}: ${value !== undefined ? format(value) : 'No data'}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 text-xs text-[var(--text-muted)]">
        <span>Less</span>
        {colorScale.map((color, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};
