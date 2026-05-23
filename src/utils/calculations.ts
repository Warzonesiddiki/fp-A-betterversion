export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function calculateEBITDA(revenue: number, cogs: number, opex: number): number {
  return revenue - cogs - opex;
}

export function calculateGrossProfit(revenue: number, cogs: number): number {
  return revenue - cogs;
}

export function calculateNetIncome(
  revenue: number,
  cogs: number,
  opex: number,
  other: number,
  tax: number
): number {
  return revenue - cogs - opex + other - tax;
}

export function calculateGrossMargin(revenue: number, cogs: number): number {
  if (revenue === 0) return 0;
  return ((revenue - cogs) / revenue) * 100;
}

export function calculateEBITDAMargin(revenue: number, ebitda: number): number {
  if (revenue === 0) return 0;
  return (ebitda / revenue) * 100;
}

export function calculateNetMargin(revenue: number, netIncome: number): number {
  if (revenue === 0) return 0;
  return (netIncome / revenue) * 100;
}

export function calculateBurnRate(monthlyExpenses: number[]): number {
  if (monthlyExpenses.length === 0) return 0;
  return monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length;
}

export function calculateRunway(cashBalance: number, burnRate: number): number {
  if (burnRate <= 0) return 999;
  return cashBalance / burnRate;
}

export function applyGrowthRate(baseValue: number, growthRate: number, periods: number): number[] {
  const result: number[] = [];
  let current = baseValue;
  for (let i = 0; i < periods; i++) {
    current = current * (1 + growthRate / 100);
    result.push(Math.round(current));
  }
  return result;
}

export function distributeAnnualToMonths(
  annualAmount: number,
  weights: number[] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
): number[] {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => Math.round((annualAmount * w) / totalWeight));
}

export function calculateVariancePercentage(budget: number, actual: number): number {
  if (budget === 0) return actual !== 0 ? 100 : 0;
  return ((actual - budget) / Math.abs(budget)) * 100;
}

export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return sum(arr) / arr.length;
}
