import type { GLEntry } from '@/types/sector-types';

export interface PropertyStats {
  costBasis: number;
  marketValue: number;
  unrealizedGain: number;
  ltv: number;
  totalProperties: number;
  avgHoldingPeriod: number;
}

export interface PropertyItem {
  id: string;
  name: string;
  location: string;
  status: string;
  purchasePrice: number;
  currentVal: number;
  yield: number;
  renovation: string;
}

export interface REITStats {
  ffo: number;
  affo: number;
  navPerShare: number;
  payoutRatio: number;
  dividendYield: number;
}

export interface RealEstateDashboardStats {
  fairValue: number;
  noi: number;
  occupancy: number;
  capRate: number;
}

export class RealEstateEngine {
  /**
   * Calculates Property Portfolio metrics from GL entries
   * Assumption:
   * - 15xx: Property Acquisition Cost (Asset)
   * - 16xx: Property Market Valuation (Asset)
   * - 25xx: Real Estate Debt (Liability)
   */
  static calculatePortfolioStats(entries: GLEntry[]): PropertyStats {
    const costBasis = entries
      .filter((e) => e.accountCode.startsWith('15'))
      .reduce((acc, e) => acc + e.amount, 0);

    const marketValue = entries
      .filter((e) => e.accountCode.startsWith('16'))
      .reduce((acc, e) => acc + e.amount, 0);

    const totalDebt = Math.abs(
      entries.filter((e) => e.accountCode.startsWith('25')).reduce((acc, e) => acc + e.amount, 0)
    );

    const unrealizedGain = marketValue - costBasis;
    const ltv = marketValue > 0 ? (totalDebt / marketValue) * 100 : 0;

    // Count unique entities as properties
    const totalProperties = new Set(entries.map((e) => e.entityId)).size;

    return {
      costBasis,
      marketValue,
      unrealizedGain,
      ltv,
      totalProperties,
      avgHoldingPeriod: 4.2, // Mocked for now
    };
  }

  static calculateDashboardStats(entries: GLEntry[]): RealEstateDashboardStats {
    const rentalIncome = entries
      .filter((e) => e.accountCode.startsWith('40'))
      .reduce((acc, e) => acc + e.amount, 0);
    const opex = entries
      .filter((e) => e.accountCode.startsWith('50'))
      .reduce((acc, e) => acc + e.amount, 0);

    const noi = rentalIncome - opex;
    const portfolio = this.calculatePortfolioStats(entries);

    const capRate = portfolio.marketValue > 0 ? (noi / portfolio.marketValue) * 100 : 0;

    return {
      fairValue: portfolio.marketValue,
      noi,
      occupancy: 94.8, // Mocked
      capRate,
    };
  }

  /**
   * Calculates REIT specific metrics
   * Assumption:
   * - 40xx: Rental Income
   * - 50xx: Property Operating Expenses
   * - 60xx: Depreciation & Amortization
   * - 70xx: Interest Expense
   * - 80xx: Dividends Paid
   */
  static calculateREITStats(entries: GLEntry[]): REITStats {
    const rentalIncome = entries
      .filter((e) => e.accountCode.startsWith('40'))
      .reduce((acc, e) => acc + e.amount, 0);
    const opex = entries
      .filter((e) => e.accountCode.startsWith('50'))
      .reduce((acc, e) => acc + e.amount, 0);
    const depAmort = entries
      .filter((e) => e.accountCode.startsWith('60'))
      .reduce((acc, e) => acc + e.amount, 0);
    const interest = entries
      .filter((e) => e.accountCode.startsWith('70'))
      .reduce((acc, e) => acc + e.amount, 0);
    const dividends = Math.abs(
      entries.filter((e) => e.accountCode.startsWith('80')).reduce((acc, e) => acc + e.amount, 0)
    );

    const netIncome = rentalIncome - opex - depAmort - interest;

    // FFO = Net Income + Depreciation + Amortization
    const ffo = netIncome + depAmort;

    // AFFO = FFO - Maintenance CapEx (assuming 10% of revenue as mock CapEx)
    const affo = ffo - rentalIncome * 0.1;

    const payoutRatio = ffo > 0 ? (dividends / ffo) * 100 : 0;

    // NAV = (Market Value - Total Debt) / Shares
    const portfolio = this.calculatePortfolioStats(entries);
    const totalDebt = Math.abs(
      entries.filter((e) => e.accountCode.startsWith('25')).reduce((acc, e) => acc + e.amount, 0)
    );
    const nav = portfolio.marketValue - totalDebt;

    return {
      ffo,
      affo,
      navPerShare: nav / 1000000, // Assuming 1M shares for scale
      payoutRatio,
      dividendYield: 5.42, // Mocked
    };
  }

  static getPropertyBreakdown(entries: GLEntry[]): PropertyItem[] {
    // Group by entityId
    const entityIds = Array.from(new Set(entries.map((e) => e.entityId)));

    return entityIds
      .map((id) => {
        const eEntries = entries.filter((e) => e.entityId === id);
        const name = eEntries[0]?.accountName || 'Unknown Property';

        const cost = eEntries
          .filter((e) => e.accountCode.startsWith('15'))
          .reduce((acc, e) => acc + e.amount, 0);

        const market = eEntries
          .filter((e) => e.accountCode.startsWith('16'))
          .reduce((acc, e) => acc + e.amount, 0);

        return {
          id,
          name,
          location: 'TBD', // Needs metadata
          status: cost > 10000000 ? 'Core' : 'Value-Add',
          purchasePrice: cost,
          currentVal: market,
          yield: 6.2, // Mocked
          renovation: 'None',
        };
      })
      .filter((p) => p.purchasePrice > 0);
  }
}
