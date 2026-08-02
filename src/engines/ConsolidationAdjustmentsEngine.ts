/**
 * ConsolidationAdjustmentsEngine — Consolidation adjustments
 * Handles goodwill, NCI, eliminations, and consolidation entries
 *
 * MONEY MIGRATION (2026-08-02): All adjustment amounts now use src/utils/money.ts.
 * Results are cent-rounded. No raw + - * / on amounts.
 */
import { addMoney, multiplyMoney, roundTo, subtractMoney, toDecimal } from '../utils/money';

interface ConsolidationEntry {
  id: string;
  type: 'elimination' | 'goodwill' | 'nci' | 'adjustment' | 'reclassification';
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  entityId: string;
  period: string;
  status: 'pending' | 'posted' | 'reversed';
}

interface ConsolidationResult {
  totalEliminations: number;
  totalGoodwill: number;
  totalNCI: number;
  totalAdjustments: number;
  netEffect: number;
  entries: ConsolidationEntry[];
}

export class ConsolidationAdjustmentsEngine {
  private static entries: ConsolidationEntry[] = [];

  static eliminateIntercompany(
    debitAccount: string,
    creditAccount: string,
    amount: number,
    entityId: string,
    period: string
  ): ConsolidationEntry {
    return this.addEntry({
      type: 'elimination',
      description: 'Intercompany elimination',
      debitAccount,
      creditAccount,
      amount: roundTo(amount),
      entityId,
      period,
      status: 'pending',
    });
  }

  static recordGoodwill(
    purchasePrice: number,
    fairValueOfNetAssets: number,
    entityId: string,
    period: string
  ): ConsolidationEntry {
    const goodwill = roundTo(subtractMoney(purchasePrice, fairValueOfNetAssets));
    return this.addEntry({
      type: 'goodwill',
      description: 'Goodwill on acquisition',
      debitAccount: 'Goodwill',
      creditAccount: 'Investment in Subsidiary',
      amount: goodwill,
      entityId,
      period,
      status: 'pending',
    });
  }

  static calculateNCI(
    subsidiaryEquity: number,
    nciPercentage: number,
    entityId: string,
    period: string
  ): ConsolidationEntry {
    const nciAmount = roundTo(multiplyMoney(subsidiaryEquity, nciPercentage));
    return this.addEntry({
      type: 'nci',
      description: 'Non-controlling interest',
      debitAccount: 'Equity',
      creditAccount: 'NCI',
      amount: nciAmount,
      entityId,
      period,
      status: 'pending',
    });
  }

  static addAdjustment(
    description: string,
    debitAccount: string,
    creditAccount: string,
    amount: number,
    entityId: string,
    period: string
  ): ConsolidationEntry {
    return this.addEntry({
      type: 'adjustment',
      description,
      debitAccount,
      creditAccount,
      amount: roundTo(amount),
      entityId,
      period,
      status: 'pending',
    });
  }

  static getConsolidationSummary(period: string): ConsolidationResult {
    const periodEntries = this.entries.filter((e) => e.period === period);
    const totalEliminations = roundTo(
      periodEntries
        .filter((e) => e.type === 'elimination')
        .reduce((s, e) => addMoney(s, e.amount), toDecimal(0))
    );
    const totalGoodwill = roundTo(
      periodEntries
        .filter((e) => e.type === 'goodwill')
        .reduce((s, e) => addMoney(s, e.amount), toDecimal(0))
    );
    const totalNCI = roundTo(
      periodEntries
        .filter((e) => e.type === 'nci')
        .reduce((s, e) => addMoney(s, e.amount), toDecimal(0))
    );
    const totalAdjustments = roundTo(
      periodEntries
        .filter((e) => e.type === 'adjustment')
        .reduce((s, e) => addMoney(s, e.amount), toDecimal(0))
    );
    const netEffect = roundTo(
      periodEntries.reduce(
        (s, e) => addMoney(s, e.type === 'elimination' ? subtractMoney(0, e.amount) : e.amount),
        toDecimal(0)
      )
    );

    return {
      totalEliminations,
      totalGoodwill,
      totalNCI,
      totalAdjustments,
      netEffect,
      entries: periodEntries,
    };
  }

  static getEntries(period?: string): ConsolidationEntry[] {
    return period ? this.entries.filter((e) => e.period === period) : [...this.entries];
  }

  static reverseEntry(entryId: string): boolean {
    const entry = this.entries.find((e) => e.id === entryId);
    if (!entry || entry.status === 'reversed') return false;
    entry.status = 'reversed';
    return true;
  }

  static reset(): void {
    this.entries = [];
  }

  private static addEntry(params: Omit<ConsolidationEntry, 'id'>): ConsolidationEntry {
    const entry: ConsolidationEntry = {
      ...params,
      id: `adj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    this.entries.push(entry);
    return entry;
  }
}
