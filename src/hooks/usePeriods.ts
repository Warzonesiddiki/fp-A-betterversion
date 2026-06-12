/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo } from 'react';
import { useGLStore } from '@/store/glStore';
import type { FiscalPeriod } from '@/types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Derives FiscalPeriod[] from GL store entries.
 * Extracts unique periods from entry dates, sorts chronologically,
 * and returns properly typed FiscalPeriod objects.
 */
export function usePeriods(): FiscalPeriod[] {
  const entries = useGLStore((s) => s.entries);

  return useMemo(() => {
    if (entries.length === 0) return [];

    const periodMap = new Map<
      string,
      { year: number; month: number; startDate: string; endDate: string }
    >();

    for (const entry of entries) {
      if (!entry.date) continue;
      const d = new Date(entry.date);
      if (isNaN(d.getTime())) continue;

      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;

      if (!periodMap.has(key)) {
        const lastDay = new Date(year, month, 0).getDate();
        periodMap.set(key, {
          year,
          month,
          startDate: `${key}-01`,
          endDate: `${key}-${String(lastDay).padStart(2, '0')}`,
        });
      }
    }

    const periods: FiscalPeriod[] = Array.from(periodMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { year, month, startDate, endDate }], index) => ({
        id: `P${String(index + 1).padStart(2, '0')}`,
        name: MONTH_NAMES[month - 1]!,
        year,
        periodNumber: month,
        startDate,
        endDate,
        periodType: 'Monthly' as const,
        isAdjustingPeriod: false,
        isClosed: false,
        closedAt: null,
        closedBy: null,
      }));

    return periods;
  }, [entries]);
}
