export interface FiscalPeriodInput {
  year: number;
  periodNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  periodType: 'Monthly' | 'Quarterly' | 'Annual' | 'Adjusting';
  isAdjustingPeriod: boolean;
}

export interface FiscalYearConfig {
  year: number;
  startMonth: number;
  calendarType: 'Standard' | '4-4-5' | '4-5-4' | '13-Period';
  adjustPeriod: boolean;
}

export class FiscalCalendar {
  static generatePeriods(config: FiscalYearConfig): FiscalPeriodInput[] {
    const year = config.year || new Date().getFullYear();
    const startMonth = config.startMonth < 1 || config.startMonth > 12 ? 1 : config.startMonth;
    const periods: FiscalPeriodInput[] = [];

    const formatDate = (date: Date): string => date.toISOString().split('T')[0]!;

    if (config.calendarType === 'Standard') {
      for (let i = 0; i < 12; i++) {
        const startDate = new Date(year, startMonth - 1 + i, 1);
        const endDate = new Date(year, startMonth + i, 0);
        periods.push({
          year,
          periodNumber: i + 1,
          name: `P${i + 1}`,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          periodType: 'Monthly',
          isAdjustingPeriod: false,
        });
      }
    } else if (config.calendarType === '4-4-5' || config.calendarType === '4-5-4') {
      const pattern = config.calendarType === '4-4-5' ? [4, 4, 5] : [4, 5, 4];
      let currentDate = new Date(year, startMonth - 1, 1);
      const fiscalYearStart = new Date(year, startMonth - 1, 1);

      for (let q = 0; q < 4; q++) {
        for (let p = 0; p < 3; p++) {
          const weeks = pattern[p];
          const startDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + weeks! * 7 - 1);
          const endDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 1);

          periods.push({
            year,
            periodNumber: q * 3 + p + 1,
            name: `Q${q + 1} P${p + 1}`,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            periodType: 'Monthly',
            isAdjustingPeriod: false,
          });
        }
      }

      currentDate = new Date(fiscalYearStart);
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    } else if (config.calendarType === '13-Period') {
      const currentDate = new Date(year, startMonth - 1, 1);
      for (let i = 0; i < 13; i++) {
        const startDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 28 - 1);
        const endDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);

        periods.push({
          year,
          periodNumber: i + 1,
          name: `P${i + 1}`,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          periodType: 'Monthly',
          isAdjustingPeriod: false,
        });
      }
    }

    if (config.adjustPeriod) {
      const lastPeriod = periods[periods.length - 1];
      periods.push({
        year,
        periodNumber: periods.length + 1,
        name: 'ADJ',
        startDate: lastPeriod!.endDate,
        endDate: lastPeriod!.endDate,
        periodType: 'Adjusting',
        isAdjustingPeriod: true,
      });
    }

    return periods;
  }

  static getPeriodForDate(date: Date, periods: FiscalPeriodInput[]): FiscalPeriodInput | null {
    const dateStr = date.toISOString().split('T')[0];
    return periods.find((p) => dateStr! >= p.startDate && dateStr! <= p.endDate) || null;
  }

  static getYearToDate(throughMonth: number, periods: FiscalPeriodInput[]): FiscalPeriodInput[] {
    if (throughMonth < 1) return [];
    return periods
      .slice(0, Math.min(throughMonth, periods.length))
      .filter((p) => p.periodType === 'Monthly');
  }

  static getQuarterPeriods(quarter: number, periods: FiscalPeriodInput[]): FiscalPeriodInput[] {
    if (quarter < 1 || quarter > 4) return [];
    const monthlyPeriods = periods.filter((p) => p.periodType === 'Monthly');
    const periodsPerQuarter = Math.floor(monthlyPeriods.length / 4);
    const start = (quarter - 1) * periodsPerQuarter;
    const end = quarter * periodsPerQuarter;
    return monthlyPeriods.slice(start, end);
  }
}
