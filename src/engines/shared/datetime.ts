export function nowISO(): string {
  return new Date().toISOString();
}

export function parsePeriod(period: string): { year: number; month: number } {
  const [year, month] = period.split('-').map(Number);
  return { year: year!, month: month! };
}

export function formatPeriod(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function addMonths(period: string, months: number): string {
  const { year, month } = parsePeriod(period);
  const totalMonths = year * 12 + month - 1 + months;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return formatPeriod(newYear, newMonth);
}

export function periodDiff(p1: string, p2: string): number {
  const d1 = parsePeriod(p1);
  const d2 = parsePeriod(p2);
  return (d2.year - d1.year) * 12 + (d2.month - d1.month);
}

export function generatePeriodRange(start: string, end: string): string[] {
  const periods: string[] = [];
  let current = start;
  while (current <= end) {
    periods.push(current);
    current = addMonths(current, 1);
  }
  return periods;
}

export function isValidPeriod(period: string): boolean {
  const match = period.match(/^(\d{4})-(\d{2})$/);
  if (!match) return false;
  const month = parseInt(match[2]!, 10);
  return month >= 1 && month <= 12;
}

export function sortPeriods(periods: string[]): string[] {
  return [...periods].sort();
}

export function getPeriodsInRange(start: string, end: string): string[] {
  if (start > end) return [];
  return generatePeriodRange(start, end);
}
