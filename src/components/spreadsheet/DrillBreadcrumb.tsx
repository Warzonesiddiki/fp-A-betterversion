import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface DrillLevel {
  id: string;
  label: string;
  type: 'summary' | 'section' | 'line-item' | 'journal-entry';
  data?: Record<string, unknown>;
}

interface DrillBreadcrumbProps {
  levels: readonly DrillLevel[];
  onNavigate: (levelIndex: number) => void;
  className?: string;
}

const levelIcons: Record<DrillLevel['type'], string> = {
  summary: 'Overview',
  section: 'Section',
  'line-item': 'Line Item',
  'journal-entry': 'Journal Entry',
};

export function DrillBreadcrumb({ levels, onNavigate, className }: DrillBreadcrumbProps) {
  if (levels.length === 0) return null;

  return (
    <nav
      aria-label="Drill-through path"
      className={cn(
        'flex items-center gap-1 rounded-lg bg-[var(--surface-secondary)] px-3 py-2 text-sm',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onNavigate(0)}
        className="flex items-center gap-1 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        aria-label="Return to summary"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Summary</span>
      </button>

      {levels.map((level, index) => {
        const isLast = index === levels.length - 1;
        const isClickable = !isLast;

        return (
          <span key={level.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            {isClickable ? (
              <button
                type="button"
                onClick={() => onNavigate(index)}
                className={cn(
                  'rounded px-1.5 py-0.5 transition-colors',
                  'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                )}
                title={levelIcons[level.type]}
              >
                {level.label}
              </button>
            ) : (
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 font-medium',
                  'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                )}
                aria-current="page"
                title={levelIcons[level.type]}
              >
                {level.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
