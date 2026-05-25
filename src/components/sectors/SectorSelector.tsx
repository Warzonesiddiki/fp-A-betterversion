import { useMemo } from 'react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import type { SectorConfig } from '@/config/sectors';

/** Map sector IDs to icon glyphs for visual identification. */
const SECTOR_ICONS: Record<string, string> = {
  agriculture: '\uD83C\uDF3E',
  banking: '\uD83C\uDFE6',
  construction: '\uD83C\uDFD7\uFE0F',
  education: '\uD83C\uDF93',
  energy: '\u26A1',
  government: '\uD83C\uDFDB\uFE0F',
  healthcare: '\uD83C\uDFE5',
  hospitality: '\uD83C\uDFE8',
  insurance: '\uD83D\uDEE1\uFE0F',
  logistics: '\uD83D\uDE9A',
  manufacturing: '\uD83C\uDFED',
  realestate: '\uD83C\uDFE0',
  retail: '\uD83D\uDED2',
  technology: '\uD83D\uDCBB',
  telecom: '\uD83D\uDCF6',
};

export interface SectorSelectorProps {
  /** All available sector configs. */
  sectors: SectorConfig[];
  /** Currently selected sector ID. */
  value: string;
  /** Callback when sector is selected. */
  onChange: (sectorId: string) => void;
  /** Optional extra class names. */
  className?: string;
}

/**
 * SectorSelector — grid-based sector picker.
 *
 * Renders all 16 sectors as clickable cards in a responsive grid.
 * The active sector is highlighted with a blue ring.
 */
export function SectorSelector({ sectors, value, onChange, className }: SectorSelectorProps) {
  const sorted = useMemo(
    () => [...sectors].sort((a, b) => a.name.localeCompare(b.name)),
    [sectors]
  );

  return (
    <div
      className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3', className)}
      role="radiogroup"
      aria-label="Select industry sector"
    >
      {sorted.map((sector) => {
        const isActive = sector.id === value;
        const icon = SECTOR_ICONS[sector.id] ?? '\uD83D\uDCCA';
        return (
          <button
            key={sector.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(sector.id)}
            className={cn(
              'flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all',
              'hover:border-blue-400 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
              isActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md ring-1 ring-blue-500'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'
            )}
          >
            <span className="text-2xl" aria-hidden="true">
              {icon}
            </span>
            <span className="text-sm font-semibold leading-tight text-[var(--text-primary)]">
              {sector.name}
            </span>
            <span className="text-xs text-slate-400 line-clamp-2">{sector.description}</span>
            <Badge variant={isActive ? 'default' : 'secondary'} className="mt-auto">
              {sector.defaultKPIs.length} KPIs
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
