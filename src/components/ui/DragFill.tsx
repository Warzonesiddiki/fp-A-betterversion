import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

export type FillMode = 'copy' | 'series' | 'linear' | 'growth';

export interface DragFillProps {
  /** Starting value(s) for the fill */
  values: (number | string)[];
  /** Called when fill completes with generated values */
  onFill: (values: (number | string)[], count: number) => void;
  /** Number of cells to fill */
  fillCount?: number;
  /** Direction of fill */
  direction?: 'down' | 'right';
  /** Visual position of the handle */
  className?: string;
}

// interface FillSuggestion {
//   mode: FillMode;
//   label: string;
//   values: (number | string)[];
// }

function detectFillPattern(values: (number | string)[]): FillMode {
  if (values.length < 2) return 'copy';

  const nums = values.filter((v): v is number => typeof v === 'number');
  if (nums.length < 2) return 'copy';

  // Check for arithmetic series (constant difference)
  const diffs: number[] = [];
  for (let i = 1; i < nums.length; i++) {
    diffs.push(nums[i] - nums[i - 1]);
  }
  const allSameDiff = diffs.every((d) => Math.abs(d - diffs[0]) < 0.0001);
  if (allSameDiff && diffs[0] !== 0) return 'linear';

  // Check for geometric series (constant ratio)
  const ratios: number[] = [];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i - 1] !== 0) {
      ratios.push(nums[i] / nums[i - 1]);
    }
  }
  const allSameRatio = ratios.length > 0 && ratios.every((r) => Math.abs(r - ratios[0]) < 0.0001);
  if (allSameRatio && ratios[0] !== 1) return 'growth';

  return 'copy';
}

function generateFillValues(
  values: (number | string)[],
  mode: FillMode,
  count: number
): (number | string)[] {
  const result: (number | string)[] = [];

  if (mode === 'copy') {
    for (let i = 0; i < count; i++) {
      result.push(values[i % values.length]);
    }
  } else if (mode === 'linear' && values.length >= 2) {
    const nums = values.filter((v): v is number => typeof v === 'number');
    if (nums.length >= 2) {
      const diff = nums[nums.length - 1] - nums[nums.length - 2];
      const lastNum = nums[nums.length - 1];
      for (let i = 0; i < count; i++) {
        result.push(lastNum + diff * (i + 1));
      }
    }
  } else if (mode === 'growth' && values.length >= 2) {
    const nums = values.filter((v): v is number => typeof v === 'number');
    if (nums.length >= 2 && nums[nums.length - 2] !== 0) {
      const ratio = nums[nums.length - 1] / nums[nums.length - 2];
      const lastNum = nums[nums.length - 1];
      for (let i = 0; i < count; i++) {
        result.push(lastNum * Math.pow(ratio, i + 1));
      }
    }
  } else {
    // Fallback to copy
    for (let i = 0; i < count; i++) {
      result.push(values[i % values.length]);
    }
  }

  return result;
}

export function DragFill({
  values,
  onFill,
  fillCount = 10,
  direction = 'down',
  className,
}: DragFillProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);

  const pattern = detectFillPattern(values);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      // Quick drag = auto-fill with detected pattern
      const startX = e.clientX;
      const startY = e.clientY;

      const handleMouseMove = (moveE: MouseEvent) => {
        const distance =
          direction === 'down'
            ? Math.abs(moveE.clientY - startY)
            : Math.abs(moveE.clientX - startX);

        if (distance > 20) {
          // Threshold reached, auto-fill
          const generated = generateFillValues(values, pattern, fillCount);
          onFill(generated, fillCount);
          cleanup();
        }
      };

      const handleMouseUp = () => {
        // Short click = show mode menu
        setShowMenu(true);
        cleanup();
      };

      const cleanup = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [values, fillCount, direction, pattern, onFill]
  );

  const handleModeSelect = useCallback(
    (mode: FillMode) => {
      const generated = generateFillValues(values, mode, fillCount);
      onFill(generated, fillCount);
      setShowMenu(false);
    },
    [values, fillCount, onFill]
  );

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = () => setShowMenu(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showMenu]);

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Drag handle */}
      <div
        ref={handleRef}
        className={cn(
          'absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-crosshair shadow-md z-10',
          'hover:bg-blue-500 hover:scale-125 transition-all',
          isDragging && 'bg-blue-500 scale-125',
          direction === 'down' ? '-bottom-1.5 right-0' : '-right-1.5 bottom-0'
        )}
        onMouseDown={handleMouseDown}
        role="button"
        tabIndex={0}
        aria-label="Drag to fill cells"
        aria-haspopup="menu"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleMouseDown(e as unknown as React.MouseEvent);
        }}
      />

      {/* Fill mode menu */}
      {showMenu && (
        <div
          className="absolute z-50 bg-white dark:bg-gray-800 border border-[var(--border-subtle)] rounded-lg shadow-xl py-1.5 min-w-[160px] top-full right-0 mt-1"
          role="menu"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowMenu(false);
          }}
        >
          <div className="px-3 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Fill Options
          </div>
          <button
            className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-hover)] flex items-center gap-2"
            onClick={() => handleModeSelect('copy')}
          >
            <span className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[9px] font-mono">
              C
            </span>
            Copy Cells
          </button>
          {pattern === 'linear' && (
            <button
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-hover)] flex items-center gap-2"
              onClick={() => handleModeSelect('linear')}
            >
              <span className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center text-[9px] font-mono text-blue-600">
                L
              </span>
              Linear Trend
            </button>
          )}
          {pattern === 'growth' && (
            <button
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-hover)] flex items-center gap-2"
              onClick={() => handleModeSelect('growth')}
            >
              <span className="w-4 h-4 rounded bg-green-100 flex items-center justify-center text-[9px] font-mono fin-positive">
                G
              </span>
              Growth Trend
            </button>
          )}
          <button
            className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-hover)] flex items-center gap-2"
            onClick={() => handleModeSelect('series')}
          >
            <span className="w-4 h-4 rounded bg-amber-100 flex items-center justify-center text-[9px] font-mono text-amber-600">
              S
            </span>
            Fill Series
          </button>
        </div>
      )}
    </div>
  );
}
