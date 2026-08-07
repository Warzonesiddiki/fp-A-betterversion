/**
 * SegmentReportingEngine — Segment reporting for SEC compliance
 * Supports geographic, product, customer, business unit segments
 *
 * MONEY MIGRATION (2026-08-03): segment revenue, expenses, net income and
 * margins are money figures reported to SEC disclosures, so all arithmetic
 * flows through the canonical money primitive (src/utils/money.ts, decimal.js,
 * ROUND_HALF_UP). Amounts round to cents; margins to 10 places. No raw
 * + - * / on currency values remains.
 */

import { randomId } from '@/utils/cryptoId';
import { divideMoney, roundTo, subtractMoney, sumMoney } from '../utils/money';

const CURRENCY_PLACES = 2;
const RATIO_PLACES = 10;

export type SegmentType = 'geographic' | 'product' | 'customer' | 'business_unit';

export interface Segment {
  id: string;
  name: string;
  type: SegmentType;
  parentId?: string;
  metadata?: Record<string, unknown>;
}

export interface SegmentData {
  segmentId: string;
  revenue: number;
  expenses: number;
  assets: number;
  liabilities: number;
  period: string;
}

export class SegmentReportingEngine {
  private static segments: Segment[] = [];
  private static data: SegmentData[] = [];

  static defineSegment(segment: Omit<Segment, 'id'>): Segment {
    const id = `seg_${randomId()}`;
    const full: Segment = { ...segment, id };
    this.segments.push(full);
    return full;
  }

  static getSegments(type?: SegmentType): Segment[] {
    if (type) return this.segments.filter((s) => s.type === type);
    return [...this.segments];
  }

  static reportSegmentData(data: Omit<SegmentData, 'period'> & { period: string }): void {
    this.data.push(data as SegmentData);
  }

  static getSegmentReport(period: string): Array<{
    segment: Segment;
    revenue: number;
    expenses: number;
    netIncome: number;
    margin: number;
  }> {
    const results: Array<{
      segment: Segment;
      revenue: number;
      expenses: number;
      netIncome: number;
      margin: number;
    }> = [];
    for (const segment of this.segments) {
      const segData = this.data.filter((d) => d.segmentId === segment.id && d.period === period);
      const revenueDec = sumMoney(segData.map((d) => d.revenue));
      const expensesDec = sumMoney(segData.map((d) => d.expenses));
      const netIncomeDec = subtractMoney(revenueDec, expensesDec);
      const revenue = roundTo(revenueDec, CURRENCY_PLACES);
      const expenses = roundTo(expensesDec, CURRENCY_PLACES);
      const netIncome = roundTo(netIncomeDec, CURRENCY_PLACES);
      results.push({
        segment,
        revenue,
        expenses,
        netIncome,
        margin: revenueDec.greaterThan(0)
          ? roundTo(divideMoney(netIncomeDec, revenueDec), RATIO_PLACES)
          : 0,
      });
    }
    return results;
  }

  static reset(): void {
    this.segments = [];
    this.data = [];
  }
}
