import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildFiscalPeriods } from './fiscalPeriods';

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: {
    getState: vi.fn(() => ({
      organization: {
        fiscalYear: 2026,
        fiscalYearStart: '2026-04-01',
        calendarType: 'Standard',
      },
    })),
  },
}));

import { useSettingsStore } from '@/store/settingsStore';

describe('buildFiscalPeriods', () => {
  beforeEach(() => {
    vi.mocked(useSettingsStore.getState).mockClear();
  });

  it('generates 12 real calendar periods from the organization config', () => {
    const periods = buildFiscalPeriods();
    expect(periods).toHaveLength(12);
    expect(periods[0]).toMatchObject({
      id: 'P01',
      year: 2026,
      periodNumber: 1,
      name: 'April', // fiscal year starts in April per the config
      periodType: 'Monthly',
      isClosed: false,
    });
    expect(periods[11]?.name).toBe('March');
    expect(periods[11]?.periodNumber).toBe(12);
  });

  it('falls back to defaults when the store is mocked without getState', () => {
    // smoke tests mock the store as vi.fn() with no getState
    vi.mocked(useSettingsStore.getState).mockImplementationOnce(undefined as never);
    const periods = buildFiscalPeriods();
    expect(periods).toHaveLength(12);
    expect(periods[0]?.year).toBeGreaterThanOrEqual(2026);
  });

  it('produces valid start/end date ranges', () => {
    const periods = buildFiscalPeriods();
    for (const p of periods) {
      expect(new Date(p.startDate).getTime()).toBeLessThanOrEqual(new Date(p.endDate).getTime());
    }
  });
});
