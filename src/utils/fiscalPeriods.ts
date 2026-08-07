// =============================================================================
// REAL FISCAL PERIODS for sector dashboards
// -----------------------------------------------------------------------------
// Replaces the previously hardcoded `mockPeriods` arrays (Jan–Dec 2026 demo
// list) that every sector dashboard fed into its PeriodPicker. Periods are now
// derived from the REAL fiscal calendar engine (src/engines/FiscalCalendar)
// configured by the user's organization settings (fiscal year, fiscal year
// start month, calendar type) — the same source the rest of the product uses.
// =============================================================================

import { FiscalCalendar, type FiscalPeriodInput } from '@/engines/FiscalCalendar';
import { useSettingsStore } from '@/store/settingsStore';
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

/** Build the FiscalPeriod list from the organization's fiscal configuration. */
export function buildFiscalPeriods(): FiscalPeriod[] {
  // Defensive getState: page-smoke tests mock useSettingsStore as vi.fn() —
  // never assume the store is the real zustand instance.
  const state =
    typeof useSettingsStore.getState === 'function' ? useSettingsStore.getState() : undefined;
  const org = state?.organization;
  const year = org?.fiscalYear ?? new Date().getFullYear();
  const startMonth =
    org?.fiscalYearStart && /^\d{4}-(\d{2})/.test(org.fiscalYearStart)
      ? Number(org.fiscalYearStart.match(/^\d{4}-(\d{2})/)![1])
      : 1;
  const calendarType = org?.calendarType ?? 'Standard';

  const inputs: FiscalPeriodInput[] = FiscalCalendar.generatePeriods({
    year,
    startMonth,
    calendarType,
    adjustPeriod: false,
  });

  return inputs.map((p, i) => ({
    id: `P${String(i + 1).padStart(2, '0')}`,
    year: p.year,
    periodNumber: p.periodNumber,
    name: MONTH_NAMES[(startMonth - 1 + i) % 12] ?? `P${i + 1}`,
    startDate: p.startDate,
    endDate: p.endDate,
    periodType: p.periodType,
    isAdjustingPeriod: p.isAdjustingPeriod,
    isClosed: false,
    closedAt: null,
    closedBy: null,
  }));
}
