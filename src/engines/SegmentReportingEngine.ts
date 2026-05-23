/**
 * SegmentReportingEngine — Segment reporting for SEC compliance
 * Supports geographic, product, customer, business unit segments
 */

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
    const id = 'seg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
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
      const revenue = segData.reduce((sum, d) => sum + d.revenue, 0);
      const expenses = segData.reduce((sum, d) => sum + d.expenses, 0);
      const netIncome = revenue - expenses;
      results.push({
        segment,
        revenue,
        expenses,
        netIncome,
        margin: revenue > 0 ? netIncome / revenue : 0,
      });
    }
    return results;
  }

  static reset(): void {
    this.segments = [];
    this.data = [];
  }
}
