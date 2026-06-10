import type { VarianceAnalysis, MonthlyVariance } from '@/types';

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function makeMonthly(budget: number[], actual: number[]): MonthlyVariance[] {
  return budget.map((b, i) => ({
    month: i + 1,
    monthName: monthNames[i]!,
    budget: b,
    actual: actual[i]!,
    variance: actual![i]! - b,
    percent: b !== 0 ? ((actual![i]! - b) / Math.abs(b)) * 100 : 0,
  }));
}

export const variancesData: VarianceAnalysis[] = [
  {
    id: 'var-001',
    accountId: 'acct-4100',
    accountName: 'Subscription Revenue',
    accountCode: '4100',
    accountType: 'Revenue',
    budgetAmount: 28_800_000,
    actualAmount: 30_240_000,
    forecastAmount: 29_800_000,
    dollarVariance: 1_440_000,
    percentVariance: 5.0,
    varianceStatus: 'Favorable',
    thresholdStatus: 'Within',
    commentary: 'Strong Q4 renewals and 3 new enterprise deals closed ahead of schedule.',
    commentaryStatus: 'Reviewed',
    monthlyBreakdown: makeMonthly(
      [
        2_200_000, 2_200_000, 2_300_000, 2_300_000, 2_400_000, 2_400_000, 2_400_000, 2_500_000,
        2_500_000, 2_500_000, 2_600_000, 2_600_000,
      ],
      [
        2_150_000, 2_180_000, 2_350_000, 2_410_000, 2_480_000, 2_520_000, 2_550_000, 2_680_000,
        2_720_000, 2_800_000, 2_850_000, 2_880_000,
      ]
    ),
    rateVariance: 120_000,
    volumeVariance: 1_320_000,
  },
  {
    id: 'var-002',
    accountId: 'acct-4200',
    accountName: 'Professional Services',
    accountCode: '4200',
    accountType: 'Revenue',
    budgetAmount: 10_800_000,
    actualAmount: 9_720_000,
    forecastAmount: 10_200_000,
    dollarVariance: -1_080_000,
    percentVariance: -10.0,
    varianceStatus: 'Unfavorable',
    thresholdStatus: 'Significant',
    commentary: 'Consulting ramp delayed due to longer-than-expected onboarding for new hires.',
    commentaryStatus: 'Submitted',
    monthlyBreakdown: makeMonthly(
      [
        850_000, 850_000, 900_000, 900_000, 900_000, 900_000, 900_000, 900_000, 900_000, 900_000,
        900_000, 900_000,
      ],
      [
        820_000, 790_000, 810_000, 800_000, 780_000, 810_000, 800_000, 810_000, 820_000, 830_000,
        840_000, 810_000,
      ]
    ),
    rateVariance: -30_000,
    volumeVariance: -1_050_000,
  },
  {
    id: 'var-003',
    accountId: 'acct-5100',
    accountName: 'Cloud Infrastructure',
    accountCode: '5100',
    accountType: 'COGS',
    budgetAmount: 5_400_000,
    actualAmount: 5_832_000,
    forecastAmount: 5_600_000,
    dollarVariance: -432_000,
    percentVariance: -8.0,
    varianceStatus: 'Unfavorable',
    thresholdStatus: 'Watch',
    commentary:
      'Higher-than-expected usage due to new product launch. Reserved instances being evaluated.',
    commentaryStatus: 'Draft',
    monthlyBreakdown: makeMonthly(
      [
        430_000, 430_000, 440_000, 440_000, 450_000, 450_000, 450_000, 460_000, 460_000, 460_000,
        460_000, 470_000,
      ],
      [
        440_000, 445_000, 460_000, 470_000, 480_000, 490_000, 495_000, 500_000, 510_000, 505_000,
        515_000, 522_000,
      ]
    ),
    rateVariance: 0,
    volumeVariance: -432_000,
  },
  {
    id: 'var-004',
    accountId: 'acct-7100',
    accountName: 'Salaries & Wages',
    accountCode: '7100',
    accountType: 'OpEx',
    budgetAmount: 22_000_000,
    actualAmount: 21_340_000,
    forecastAmount: 21_800_000,
    dollarVariance: 660_000,
    percentVariance: 3.0,
    varianceStatus: 'Favorable',
    thresholdStatus: 'Within',
    commentary:
      'Several roles filled later than planned. Merit increases effective Q2 instead of Q1.',
    commentaryStatus: 'NotStarted',
    monthlyBreakdown: makeMonthly(
      [
        1_800_000, 1_800_000, 1_820_000, 1_830_000, 1_830_000, 1_840_000, 1_840_000, 1_850_000,
        1_850_000, 1_850_000, 1_850_000, 1_850_000,
      ],
      [
        1_750_000, 1_740_000, 1_760_000, 1_770_000, 1_770_000, 1_780_000, 1_780_000, 1_790_000,
        1_790_000, 1_800_000, 1_800_000, 1_810_000,
      ]
    ),
    rateVariance: 300_000,
    volumeVariance: 360_000,
  },
  {
    id: 'var-005',
    accountId: 'acct-7300',
    accountName: 'Marketing & Advertising',
    accountCode: '7300',
    accountType: 'OpEx',
    budgetAmount: 8_100_000,
    actualAmount: 8_586_000,
    forecastAmount: 8_300_000,
    dollarVariance: -486_000,
    percentVariance: -6.0,
    varianceStatus: 'Unfavorable',
    thresholdStatus: 'Significant',
    commentary: null,
    commentaryStatus: 'NotStarted',
    monthlyBreakdown: makeMonthly(
      [
        600_000, 650_000, 700_000, 650_000, 650_000, 700_000, 650_000, 700_000, 700_000, 700_000,
        700_000, 700_000,
      ],
      [
        620_000, 680_000, 740_000, 690_000, 690_000, 740_000, 700_000, 750_000, 740_000, 750_000,
        760_000, 726_000,
      ]
    ),
    rateVariance: 0,
    volumeVariance: -486_000,
  },
  {
    id: 'var-006',
    accountId: 'acct-7400',
    accountName: 'Travel & Entertainment',
    accountCode: '7400',
    accountType: 'OpEx',
    budgetAmount: 1_800_000,
    actualAmount: 1_512_000,
    forecastAmount: 1_600_000,
    dollarVariance: 288_000,
    percentVariance: 16.0,
    varianceStatus: 'Favorable',
    thresholdStatus: 'Watch',
    commentary:
      'Travel restrictions and virtual client meetings reduced travel spend significantly.',
    commentaryStatus: 'Reviewed',
    monthlyBreakdown: makeMonthly(
      [
        150_000, 150_000, 150_000, 150_000, 150_000, 150_000, 150_000, 150_000, 150_000, 150_000,
        150_000, 150_000,
      ],
      [
        120_000, 115_000, 125_000, 130_000, 125_000, 130_000, 125_000, 130_000, 125_000, 130_000,
        120_000, 127_000,
      ]
    ),
    rateVariance: 0,
    volumeVariance: 288_000,
  },
  {
    id: 'var-007',
    accountId: 'acct-7500',
    accountName: 'Software & Tools',
    accountCode: '7500',
    accountType: 'OpEx',
    budgetAmount: 3_600_000,
    actualAmount: 3_780_000,
    forecastAmount: 3_700_000,
    dollarVariance: -180_000,
    percentVariance: -5.0,
    varianceStatus: 'Unfavorable',
    thresholdStatus: 'Within',
    commentary:
      'New AI tools and data platform licenses added mid-year. Cost savings from legacy tool decommissioning expected in Q1 2025.',
    commentaryStatus: 'Submitted',
    monthlyBreakdown: makeMonthly(
      [
        290_000, 290_000, 300_000, 300_000, 300_000, 300_000, 300_000, 300_000, 300_000, 300_000,
        310_000, 310_000,
      ],
      [
        295_000, 300_000, 310_000, 315_000, 310_000, 320_000, 315_000, 320_000, 325_000, 320_000,
        325_000, 325_000,
      ]
    ),
    rateVariance: 0,
    volumeVariance: -180_000,
  },
];

export function getVarianceByAccountId(accountId: string): VarianceAnalysis | undefined {
  return variancesData.find((v) => v.accountId === accountId);
}

export function getVariancesByStatus(
  status: VarianceAnalysis['varianceStatus']
): VarianceAnalysis[] {
  return variancesData.filter((v) => v.varianceStatus === status);
}

export function getVariancesByThreshold(
  status: VarianceAnalysis['thresholdStatus']
): VarianceAnalysis[] {
  return variancesData.filter((v) => v.thresholdStatus === status);
}
