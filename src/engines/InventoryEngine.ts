import type { GLEntry } from '@/types/sector-types';

export interface InventoryStats {
  totalValue: number;
  turnover: number;
  daysOnHand: number;
  stockouts: number;
}

export class InventoryEngine {
  /**
   * Calculates Inventory metrics from GL entries
   * Assumption:
   * - 121x: Inventory Assets
   * - 50xx: COGS
   */
  static calculateGLInventoryStats(entries: GLEntry[]): InventoryStats {
    const inventoryValue = entries
      .filter((e) => e.accountCode.startsWith('121'))
      .reduce((acc, e) => acc + e.amount, 0);

    const cogs = Math.abs(
      entries.filter((e) => e.accountCode.startsWith('50')).reduce((acc, e) => acc + e.amount, 0)
    );

    const turnover = inventoryValue > 0 ? (cogs * 12) / inventoryValue : 0; // Annualized
    const daysOnHand = cogs > 0 ? inventoryValue / (cogs / 30) : 0; // Monthly basis

    return {
      totalValue: inventoryValue,
      turnover,
      daysOnHand,
      stockouts: 4, // Mocked
    };
  }

  static calculateTurnover(cogs: number, averageInventory: number): number {
    if (averageInventory <= 0) return 0;
    return cogs / averageInventory;
  }

  static calculateDSI(averageInventory: number, cogs: number, days: number): number {
    if (cogs <= 0) return 0;
    return (averageInventory / cogs) * days;
  }

  static calculateGMROI(grossMargin: number, averageInventoryCost: number): number {
    if (averageInventoryCost <= 0) return 0;
    return grossMargin / averageInventoryCost;
  }

  static calculateEOQ(
    annualDemand: number,
    orderingCost: number,
    holdingCost: number,
    unitCost: number
  ): number {
    const h = holdingCost * unitCost || holdingCost;
    if (h <= 0) return 0;
    return Math.sqrt((2 * annualDemand * orderingCost) / h);
  }

  static calculateSafetyStock(
    leadTime: number,
    demandStdDev: number,
    serviceLevel: number
  ): number {
    // serviceLevel is Z-score placeholder (e.g. 1.65 for 95%)
    return serviceLevel * demandStdDev * Math.sqrt(leadTime);
  }
}
