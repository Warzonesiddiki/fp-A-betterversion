import React from 'react';
import { cn } from '@/utils/cn';

export interface GanttTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress?: number;
  color?: string;
  dependencies?: string[];
}

export interface GanttChartProps {
  tasks: GanttTask[];
  className?: string;
  loading?: boolean;
  error?: string;
  onClick?: (task: GanttTask) => void;
}

export const GanttChart: React.FC<GanttChartProps> = React.memo(({
  tasks,
  className,
  loading = false,
  error,
  onClick,
}) => {
  if (loading) {
    return (
      <div className={cn('w-full overflow-x-auto', className)}>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('w-full overflow-x-auto', className)}>
        <div className="flex items-center justify-center h-48 text-red-500 text-sm">{error}</div>
      </div>
    );
  }
  if (!tasks || tasks.length === 0)
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-300">
        No data
      </div>
    );

  const allDates = tasks.flatMap((t) => [new Date(t.startDate), new Date(t.endDate)]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const totalDays = Math.max(
    1,
    Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const getBarStyle = (task: GanttTask) => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const left = ((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
    const width = ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="flex border-b pb-2 mb-2">
          <div className="w-48 shrink-0 font-medium text-sm">Task</div>
          <div className="flex-1 relative h-6">
            {/* Month markers */}
            {Array.from({ length: Math.ceil(totalDays / 30) }, (_, i) => {
              const date = new Date(minDate);
              date.setDate(date.getDate() + i * 30);
              const left = ((i * 30) / totalDays) * 100;
              return (
                <div
                  key={i}
                  className="absolute text-xs text-[var(--text-muted)]"
                  style={{ left: `${left}%` }}
                >
                  {date.toLocaleString('default', { month: 'short' })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasks */}
        {tasks.map((task, i) => {
          const barStyle = getBarStyle(task);
          const color = task.color ?? defaultColors[i % defaultColors.length];

          return (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              className="flex items-center h-8 mb-1 cursor-pointer"
              onClick={onClick ? () => onClick(task) : undefined}
              onKeyDown={
                onClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') onClick(task);
                    }
                  : undefined
              }
            >
              <div className="w-48 shrink-0 text-sm truncate pr-2">{task.name}</div>
              <div className="flex-1 relative h-full bg-gray-100 dark:bg-gray-800 rounded">
                <div
                  className="absolute h-full rounded opacity-80"
                  style={{ ...barStyle, backgroundColor: color }}
                />
                {task.progress !== undefined && (
                  <div
                    className="absolute h-full rounded"
                    style={{
                      ...barStyle,
                      width: `${(parseFloat(barStyle.width) * task.progress) / 100}%`,
                      backgroundColor: color,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
