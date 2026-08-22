/**
 * @fileoverview Inventory Engine — Inventory metrics calculation from GL entries (total value, turnover, days on hand, stockouts)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Inventory Analytics
 * @sector 9 (Manufacturing — inventory)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 32nd engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */
import type { GLEntry } from '@/types';
import { roundTo, sumMoney, multiplyMoney, divideMoney } from '../utils/money';

/**
 * Inventory valuation is a balance-sheet figure, so value arithmetic runs
 * through the canonical money primitive (decimal.js, ROUND_HALF_UP). Turnover
 * and days-on-hand are ratios rather than settleable money and keep more
 * precision, but are still derived from exact decimals.
 */
const CURRENCY_PLACES = 2;
const RATIO_PLACES = 10;

export interface InventoryStats {
  totalValue: number;
  turnover: number;
  daysOnHand: number;
  /**
   * Stockout incidents are warehouse events (shortages, unfilled issues); the
   * GL posts no account class that records them, so this engine cannot count
   * them. null means "not measurable from the ledger", never a mocked value.
   */
  stockouts: number | null;
}

export class InventoryEngine {
  /**
   * Calculates Inventory metrics from GL entries
   * Assumption:
   * - 121x: Inventory Assets
   * - 50xx: COGS
   */
  static calculateGLInventoryStats(entries: GLEntry[]): InventoryStats {
    const inventoryValue = sumMoney(
      entries.filter((e) => e.accountCode.startsWith('121')).map((e) => e.amount)
    );

    const cogs = sumMoney(
      entries.filter((e) => e.accountCode.startsWith('50')).map((e) => e.amount)
    ).abs();

    return {
      totalValue: roundTo(inventoryValue, CURRENCY_PLACES),
      // Annualized turnover.
      turnover: inventoryValue.lte(0)
        ? 0
        : roundTo(divideMoney(cogs.times(12), inventoryValue), RATIO_PLACES),
      // Days on hand on a monthly (30-day) basis.
      daysOnHand: cogs.lte(0)
        ? 0
        : roundTo(divideMoney(inventoryValue, divideMoney(cogs, 30)), RATIO_PLACES),
      // Null-with-contract: no GL account class records stockout events, so
      // this stays null instead of a mocked incident count.
      stockouts: null,
    };
  }

  static calculateTurnover(cogs: number, averageInventory: number): number {
    if (averageInventory <= 0) return 0;
    return roundTo(divideMoney(cogs, averageInventory), RATIO_PLACES);
  }

  static calculateDSI(averageInventory: number, cogs: number, days: number): number {
    if (cogs <= 0) return 0;
    return roundTo(divideMoney(averageInventory, cogs).times(days), RATIO_PLACES);
  }

  static calculateGMROI(grossMargin: number, averageInventoryCost: number): number {
    if (averageInventoryCost <= 0) return 0;
    return roundTo(divideMoney(grossMargin, averageInventoryCost), RATIO_PLACES);
  }

  static calculateEOQ(
    annualDemand: number,
    orderingCost: number,
    holdingCost: number,
    unitCost: number
  ): number {
    // Holding cost per unit: a rate applied to unit cost, falling back to a
    // flat per-unit cost when unitCost is 0.
    const perUnitHolding = multiplyMoney(holdingCost, unitCost);
    const h = perUnitHolding.isZero() ? multiplyMoney(holdingCost, 1) : perUnitHolding;
    if (h.lte(0)) return 0;
    // sqrt is irrational, so the ratio is computed exactly and only the final
    // square root falls back to floating point.
    return Math.sqrt(divideMoney(multiplyMoney(annualDemand, orderingCost).times(2), h).toNumber());
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
