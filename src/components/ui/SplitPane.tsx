import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultSplit?: number;
  minSize?: number;
}

export function SplitPane({ left, right, defaultSplit = 50, minSize = 200 }: SplitPaneProps) {
  const [split, setSplit] = useState(defaultSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newSplit = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      const minPercent = (minSize / containerRect.width) * 100;
      const clampedSplit = Math.max(minPercent, Math.min(100 - minPercent, newSplit));

      setSplit(clampedSplit);
    },
    [isDragging, minSize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={cn('flex flex-col md:flex-row w-full h-full overflow-hidden select-none')}
    >
      <div
        className="h-full w-full max-md:h-1/2 overflow-auto md:w-[calc(var(--split-width)*1%)]"
        style={{ '--split-width': split } as React.CSSProperties}
      >
        {left}
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-orientation="vertical"
        aria-valuenow={split}
        aria-valuemin={20}
        aria-valuemax={80}
        className={cn(
          'hidden md:flex relative items-center justify-center w-[4px] h-full cursor-col-resize transition-all z-20 hover:w-[8px] group bg-[var(--border-subtle)] hover:bg-[var(--accent-primary)]',
          isDragging && 'w-[8px] bg-[var(--accent-primary)]'
        )}
        onMouseDown={handleMouseDown}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            setSplit(Math.min(80, split + 5));
          }
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setSplit(Math.max(20, split - 5));
          }
        }}
      />

      <div className="h-full overflow-auto flex-1">{right}</div>
    </div>
  );
}
