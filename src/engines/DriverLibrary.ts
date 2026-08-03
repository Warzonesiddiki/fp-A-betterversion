/**
 * Driver Library — Pre-built financial drivers for driver-based planning
 *
 * MONEY MIGRATION (2026-08-03, GAP-1 F-0006): cascadeChange scaling on
 * linkedLineItems (currency units e.g. revenue/cost) now uses the canonical
 * money primitive (src/utils/money.ts). Raw * eliminated. roundTo for results.
 */
import { multiplyMoney, roundTo } from '../utils/money';

export interface Driver {
  id: string;
  name: string;
  unit: 'percent' | 'currency' | 'count' | 'ratio' | 'index';
  defaultValue: number;
  range: { min: number; max: number };
  description: string;
  category: 'revenue' | 'cost' | 'rate' | 'macro' | 'operational';
  linkedLineItems: string[];
}

export interface DriverChange {
  driverId: string;
  oldValue: number;
  newValue: number;
  changedBy: string;
  changedAt: string;
  reason: string;
}

export class DriverLibrary {
  private static drivers = new Map<string, Driver>();
  private static changes: DriverChange[] = [];

  static initialize(): void {
    this.drivers.clear();
    this.changes = [];
    const defaults: Driver[] = [
      {
        id: 'headcount',
        name: 'Headcount',
        unit: 'count',
        defaultValue: 100,
        range: { min: 1, max: 10000 },
        description: 'Total employee count',
        category: 'operational',
        linkedLineItems: ['salaries', 'benefits', 'payroll_tax'],
      },
      {
        id: 'revenue-growth',
        name: 'Revenue Growth Rate',
        unit: 'percent',
        defaultValue: 5,
        range: { min: -50, max: 100 },
        description: 'Year-over-year revenue growth',
        category: 'revenue',
        linkedLineItems: ['revenue'],
      },
      {
        id: 'inflation',
        name: 'Inflation Rate',
        unit: 'percent',
        defaultValue: 3,
        range: { min: -5, max: 20 },
        description: 'General price inflation',
        category: 'macro',
        linkedLineItems: ['cogs', 'opex', 'rent', 'utilities'],
      },
      {
        id: 'fx-rate',
        name: 'Exchange Rate',
        unit: 'ratio',
        defaultValue: 1,
        range: { min: 0.01, max: 100 },
        description: 'Foreign exchange rate',
        category: 'macro',
        linkedLineItems: ['foreign_revenue', 'foreign_expenses'],
      },
      {
        id: 'price-increase',
        name: 'Price Increase',
        unit: 'percent',
        defaultValue: 2,
        range: { min: -20, max: 50 },
        description: 'Product/service price increase',
        category: 'revenue',
        linkedLineItems: ['revenue'],
      },
      {
        id: 'volume-growth',
        name: 'Volume Growth',
        unit: 'percent',
        defaultValue: 3,
        range: { min: -50, max: 100 },
        description: 'Sales volume growth',
        category: 'revenue',
        linkedLineItems: ['revenue', 'cogs'],
      },
      {
        id: 'utilization',
        name: 'Utilization Rate',
        unit: 'percent',
        defaultValue: 80,
        range: { min: 0, max: 100 },
        description: 'Resource utilization',
        category: 'operational',
        linkedLineItems: ['revenue', 'direct_labor'],
      },
      {
        id: 'churn-rate',
        name: 'Churn Rate',
        unit: 'percent',
        defaultValue: 5,
        range: { min: 0, max: 100 },
        description: 'Customer churn rate',
        category: 'revenue',
        linkedLineItems: ['revenue', 'customers'],
      },
    ];
    for (const d of defaults) this.drivers.set(d.id, d);
  }

  static getDriver(id: string): Driver | undefined {
    return this.drivers.get(id);
  }
  static getAllDrivers(): Driver[] {
    return Array.from(this.drivers.values());
  }
  static getByCategory(category: string): Driver[] {
    return Array.from(this.drivers.values()).filter((d) => d.category === category);
  }

  static updateDriver(id: string, value: number, userId: string, reason: string): void {
    const driver = this.drivers.get(id);
    if (!driver) return;
    if (value < driver.range.min || value > driver.range.max) return;
    const old = driver.defaultValue;
    driver.defaultValue = value;
    this.changes.push({
      driverId: id,
      oldValue: old,
      newValue: value,
      changedBy: userId,
      changedAt: new Date().toISOString(),
      reason,
    });
  }

  static getChanges(driverId?: string): DriverChange[] {
    return driverId ? this.changes.filter((c) => c.driverId === driverId) : this.changes;
  }

  static cascadeChange(
    driverId: string,
    lineItems: Record<string, number>
  ): Record<string, number> {
    const driver = this.drivers.get(driverId);
    if (!driver) return lineItems;
    const result = { ...lineItems };
    for (const item of driver.linkedLineItems) {
      if (result[item] !== undefined) {
        // Money migration: use multiplyMoney + roundTo for currency scaling
        result[item] = roundTo(multiplyMoney(result[item], 1 + driver.defaultValue / 100));
      }
    }
    return result;
  }
}
