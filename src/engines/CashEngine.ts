export interface WeeklyCashFlow {
  week: string;
  openingBalance: number;
  inflows: number;
  outflows: number;
  netCashFlow: number;
  closingBalance: number;
  isBelowTarget: boolean;
}

export class CashEngine {
  static forecast13Week(
    startingBalance: number,
    inflows: { week: string; amount: number }[],
    outflows: { week: string; amount: number }[],
    minimumTarget: number = 0
  ): WeeklyCashFlow[] {
    const weeks = Array.from(
      new Set([...inflows.map((i) => i.week), ...outflows.map((o) => o.week)])
    ).sort();
    const forecast: WeeklyCashFlow[] = [];
    let balance = startingBalance;

    weeks.forEach((week) => {
      const openingBalance = balance;
      const weeklyInflows = inflows
        .filter((i) => i.week === week)
        .reduce((acc, i) => acc + i.amount, 0);
      const weeklyOutflows = outflows
        .filter((o) => o.week === week)
        .reduce((acc, o) => acc + o.amount, 0);
      const netCashFlow = weeklyInflows - weeklyOutflows;
      balance += netCashFlow;

      forecast.push({
        week,
        openingBalance,
        inflows: weeklyInflows,
        outflows: weeklyOutflows,
        netCashFlow,
        closingBalance: balance,
        isBelowTarget: balance < minimumTarget,
      });
    });

    return forecast;
  }

  static calculateDSO(receivables: number, revenue: number, days: number): number {
    if (revenue <= 0) return 0;
    return (receivables / revenue) * days;
  }

  static calculateDPO(payables: number, cogs: number, days: number): number {
    if (cogs <= 0) return 0;
    return (payables / cogs) * days;
  }

  static calculateDIO(inventory: number, cogs: number, days: number): number {
    if (cogs <= 0) return 0;
    return (inventory / cogs) * days;
  }

  static calculateCCC(dso: number, dio: number, dpo: number): number {
    return dso + dio - dpo;
  }
}
