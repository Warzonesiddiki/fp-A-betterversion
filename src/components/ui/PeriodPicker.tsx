import React, { useMemo } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '@/utils/cn';
import type { FiscalPeriod } from '@/types';

export interface PeriodPickerProps {
  value: string;
  onChange: (periodId: string) => void;
  periods: FiscalPeriod[];
}

export const PeriodPicker: React.FC<PeriodPickerProps> = ({ value, onChange, periods }) => {
  const selectedPeriod = useMemo(() => periods.find((p) => p.id === value), [periods, value]);

  const groupedPeriods = useMemo(() => {
    const groups: Record<string, FiscalPeriod[]> = {};
    periods.forEach((p) => {
      const q = `Q${Math.ceil(p.periodNumber / 3)} ${p.year}`;
      if (!groups[q]) groups[q] = [];
      groups[q].push(p);
    });
    return groups;
  }, [periods]);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="flex items-center space-x-3 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md hover:bg-[var(--bg-surface)] transition-all outline-none focus:ring-2 focus:ring-blue-500 shadow-sm min-w-[180px]">
          <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
          <div className="flex-1 text-left overflow-hidden">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] leading-none mb-1">
              Fiscal Period
            </div>
            <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {selectedPeriod
                ? `${selectedPeriod.name} ${selectedPeriod.year}`
                : 'Select Period...'}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-[var(--text-secondary)] opacity-50" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-[80] w-64 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95"
          align="start"
          sideOffset={4}
        >
          <div className="p-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] px-2">
              Select Period
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto p-1 scrollbar-thin">
            {Object.entries(groupedPeriods).map(([quarter, quarterPeriods]) => (
              <div key={quarter} className="mb-2 last:mb-0">
                <div className="px-3 py-1.5 text-[9px] font-bold text-blue-600 uppercase tracking-tighter bg-blue-50/50 rounded-sm mb-1">
                  {quarter}
                </div>
                <div className="space-y-0.5">
                  {quarterPeriods.map((period) => (
                    <button
                      key={period.id}
                      onClick={() => onChange(period.id)}
                      className={cn(
                        'flex w-full items-center justify-between px-3 py-2 rounded-md text-left text-sm transition-colors',
                        value === period.id
                          ? 'bg-blue-600 text-white font-bold'
                          : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                      )}
                    >
                      <span>{period.name}</span>
                      {value === period.id && <Check className="h-4 w-4" />}
                      {period.isClosed && value !== period.id && (
                        <span className="text-[8px] font-bold uppercase text-[var(--text-secondary)] opacity-50 border border-[var(--border-subtle)] px-1 rounded">
                          Closed
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
