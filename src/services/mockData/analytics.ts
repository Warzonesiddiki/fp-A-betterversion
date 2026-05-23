export interface ChartDataPoint {
  month: string;
  value: number;
  category?: string;
}

export interface MarginDataPoint {
  month: string;
  grossMargin: number;
  ebitdaMargin: number;
  netMargin: number;
}

export interface BudgetVsActualPoint {
  month: string;
  budget: number;
  actual: number;
}

export interface BenchmarkItem {
  label: string;
  company: number;
  industry: number;
  peer25th: number;
  peer75th: number;
}

export interface AnalyticsChartData {
  revenueTrend: ChartDataPoint[];
  expenseBreakdown: { category: string; value: number }[];
  marginTrend: MarginDataPoint[];
  budgetVsActual: BudgetVsActualPoint[];
  industryBenchmarks: Record<string, BenchmarkItem[]>;
}

export const analyticsChartData: AnalyticsChartData = {
  revenueTrend: [
    { month: '2023-01', value: 2_850_000 },
    { month: '2023-02', value: 2_820_000 },
    { month: '2023-03', value: 2_950_000 },
    { month: '2023-04', value: 3_010_000 },
    { month: '2023-05', value: 3_080_000 },
    { month: '2023-06', value: 3_120_000 },
    { month: '2023-07', value: 3_150_000 },
    { month: '2023-08', value: 3_200_000 },
    { month: '2023-09', value: 3_280_000 },
    { month: '2023-10', value: 3_350_000 },
    { month: '2023-11', value: 3_420_000 },
    { month: '2023-12', value: 3_500_000 },
    { month: '2024-01', value: 2_970_000 },
    { month: '2024-02', value: 2_920_000 },
    { month: '2024-03', value: 3_160_000 },
    { month: '2024-04', value: 3_210_000 },
    { month: '2024-05', value: 3_260_000 },
    { month: '2024-06', value: 3_330_000 },
    { month: '2024-07', value: 3_350_000 },
    { month: '2024-08', value: 3_490_000 },
    { month: '2024-09', value: 3_540_000 },
    { month: '2024-10', value: 3_630_000 },
    { month: '2024-11', value: 3_690_000 },
    { month: '2024-12', value: 3_700_000 },
  ],
  expenseBreakdown: [
    { category: 'Salaries & Benefits', value: 21_340_000 },
    { category: 'Cloud Infrastructure', value: 5_832_000 },
    { category: 'Marketing & Advertising', value: 8_586_000 },
    { category: 'Software & Tools', value: 3_780_000 },
    { category: 'Rent & Facilities', value: 2_400_000 },
    { category: 'Professional Services', value: 1_850_000 },
    { category: 'Travel & Entertainment', value: 1_512_000 },
    { category: 'Depreciation & Amortization', value: 1_920_000 },
    { category: 'Other Operating Expenses', value: 2_340_000 },
  ],
  marginTrend: [
    { month: 'Jan', grossMargin: 71.2, ebitdaMargin: 24.1, netMargin: 17.1 },
    { month: 'Feb', grossMargin: 70.8, ebitdaMargin: 23.8, netMargin: 16.9 },
    { month: 'Mar', grossMargin: 71.5, ebitdaMargin: 24.5, netMargin: 17.3 },
    { month: 'Apr', grossMargin: 72.1, ebitdaMargin: 25.0, netMargin: 17.8 },
    { month: 'May', grossMargin: 72.4, ebitdaMargin: 25.3, netMargin: 18.0 },
    { month: 'Jun', grossMargin: 72.8, ebitdaMargin: 25.7, netMargin: 18.2 },
    { month: 'Jul', grossMargin: 73.0, ebitdaMargin: 26.0, netMargin: 18.5 },
    { month: 'Aug', grossMargin: 73.5, ebitdaMargin: 26.4, netMargin: 18.8 },
    { month: 'Sep', grossMargin: 73.8, ebitdaMargin: 26.8, netMargin: 19.1 },
    { month: 'Oct', grossMargin: 74.0, ebitdaMargin: 27.1, netMargin: 19.3 },
    { month: 'Nov', grossMargin: 74.2, ebitdaMargin: 27.3, netMargin: 19.5 },
    { month: 'Dec', grossMargin: 74.2, ebitdaMargin: 26.7, netMargin: 19.0 },
  ],
  budgetVsActual: [
    { month: 'Jan', budget: 3_900_000, actual: 3_790_000 },
    { month: 'Feb', budget: 3_950_000, actual: 3_820_000 },
    { month: 'Mar', budget: 4_100_000, actual: 4_050_000 },
    { month: 'Apr', budget: 4_050_000, actual: 4_070_000 },
    { month: 'May', budget: 4_100_000, actual: 4_120_000 },
    { month: 'Jun', budget: 4_150_000, actual: 4_200_000 },
    { month: 'Jul', budget: 4_100_000, actual: 4_150_000 },
    { month: 'Aug', budget: 4_200_000, actual: 4_310_000 },
    { month: 'Sep', budget: 4_250_000, actual: 4_340_000 },
    { month: 'Oct', budget: 4_300_000, actual: 4_400_000 },
    { month: 'Nov', budget: 4_350_000, actual: 4_430_000 },
    { month: 'Dec', budget: 4_350_000, actual: 4_420_000 },
  ],
  industryBenchmarks: {
    revenueGrowth: [
      { label: 'Revenue Growth', company: 18.5, industry: 14.2, peer25th: 8.5, peer75th: 22.0 },
    ],
    grossMargin: [
      { label: 'Gross Margin', company: 74.2, industry: 70.5, peer25th: 62.0, peer75th: 78.0 },
    ],
    ebitdaMargin: [
      { label: 'EBITDA Margin', company: 26.7, industry: 22.0, peer25th: 15.0, peer75th: 30.0 },
    ],
    burnMultiple: [
      { label: 'Burn Multiple', company: 1.2, industry: 1.8, peer25th: 0.8, peer75th: 2.5 },
    ],
    headcountPerRevenue: [
      {
        label: 'Revenue per FTE',
        company: 289_000,
        industry: 245_000,
        peer25th: 190_000,
        peer75th: 350_000,
      },
    ],
  },
};
