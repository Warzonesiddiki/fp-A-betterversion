import React, { useMemo } from 'react';
import { cn } from '@/utils/cn';

export interface HeatmapCell {
  row: string;
  col: string;
  value: number;
}

export interface HeatmapProps {
  data: HeatmapCell[];
  width?: number | string;
  height?: number | string;
  colorScheme?: 'green' | 'blue' | 'red';
  title?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  onClick?: (cell: HeatmapCell) => void;
}

export const Heatmap: React.FC<HeatmapProps> = React.memo(({
  data,
  width = '100%',
  height = 400,
  colorScheme = 'blue',
  title,
  className,
  loading = false,
  error,
  onClick,
}) => {
  if (loading) {
    return (
      <div
        className={cn(
          'w-full flex flex-col p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
          className
        )}
      >
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'w-full flex flex-col p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
          className
        )}
      >
        <div className="flex items-center justify-center h-48 text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          'w-full flex flex-col p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
          className
        )}
      >
        <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-300">
          No data
        </div>
      </div>
    );
  }

  const { rows, cols, min, max, grid } = useMemo(() => {
    const rowSet = new Set<string>();
    const colSet = new Set<string>();
    let minVal = Infinity;
    let maxVal = -Infinity;

    data.forEach((cell) => {
      rowSet.add(cell.row);
      colSet.add(cell.col);
      if (cell.value < minVal) minVal = cell.value;
      if (cell.value > maxVal) maxVal = cell.value;
    });

    const uniqueRows = Array.from(rowSet).sort();
    const uniqueCols = Array.from(colSet).sort();

    const gridMap: Record<string, Record<string, number>> = {};
    data.forEach((cell) => {
      if (!gridMap[cell.row]) gridMap[cell.row] = {};
      gridMap[cell.row][cell.col] = cell.value;
    });

    return {
      rows: uniqueRows,
      cols: uniqueCols,
      min: minVal,
      max: maxVal,
      grid: gridMap,
    };
  }, [data]);

  const getColor = (value: number) => {
    if (value === undefined) return 'transparent';

    const ratio = (value - min) / (max - min || 1);
    const opacity = 0.1 + ratio * 0.9;

    const colors = {
      blue: `rgba(37, 99, 235, ${opacity})`,
      green: `rgba(22, 163, 74, ${opacity})`,
      red: `rgba(220, 38, 38, ${opacity})`,
    };

    return colors[colorScheme];
  };

  return (
    <div
      className={cn(
        'w-full flex flex-col p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
        className
      )}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-60">
            {title}
          </h3>
        </div>
      )}

      <div style={{ width, height, overflow: 'auto' }} className="relative custom-scrollbar">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `minmax(100px, auto) repeat(${cols.length}, 1fr)`,
            gap: '2px',
          }}
        >
          {/* Header Corner */}
          <div className="bg-transparent" />

          {/* Column Headers */}
          {cols.map((col) => (
            <div
              key={col}
              className="text-[10px] font-black text-[var(--text-secondary)] uppercase text-center p-2 truncate"
            >
              {col}
            </div>
          ))}

          {/* Rows */}
          {rows.map((row) => (
            <React.Fragment key={row}>
              {/* Row Header */}
              <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase text-right pr-4 flex items-center justify-end">
                {row}
              </div>

              {/* Cells */}
              {cols.map((col) => {
                const val = grid[row]?.[col];
                return (
                  <div
                    key={`${row}-${col}`}
                    className="aspect-square min-w-[30px] rounded-[2px] transition-all hover:scale-110 hover:z-10 hover:shadow-lg cursor-pointer group relative"
                    style={{ backgroundColor: getColor(val) }}
                    onClick={
                      onClick && val !== undefined
                        ? () => onClick({ row, col, value: Number(val) })
                        : undefined
                    }
                    role={onClick ? 'button' : undefined}
                    tabIndex={onClick && val !== undefined ? 0 : undefined}
                    onKeyDown={
                      onClick && val !== undefined
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ')
                              onClick({ row, col, value: Number(val) });
                          }
                        : undefined
                    }
                    aria-label={val !== undefined ? `${row} ${col}: ${String(val)}` : undefined}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap z-20">
                        {val?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end space-x-4">
        <span className="text-[10px] font-bold text-[var(--text-secondary)] opacity-40 uppercase">
          Intensity Scale
        </span>
        <div className="flex items-center space-x-1">
          <span className="text-[9px] font-bold text-[var(--text-secondary)]">
            {min.toLocaleString()}
          </span>
          <div
            className="w-32 h-2 rounded-full"
            style={{
              background: `linear-gradient(to right, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 1))`,
            }}
          />
          <span className="text-[9px] font-bold text-[var(--text-secondary)]">
            {max.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
});
