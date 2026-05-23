/**
 * ConsolidationAdjustmentsEngine — Consolidation adjustments
 * Handles goodwill, NCI, eliminations, and consolidation entries
 */

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
      amount,
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
    const goodwill = purchasePrice - fairValueOfNetAssets;
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
    const nciAmount = subsidiaryEquity * nciPercentage;
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
      amount,
      entityId,
      period,
      status: 'pending',
    });
  }

  static getConsolidationSummary(period: string): ConsolidationResult {
    const periodEntries = this.entries.filter((e) => e.period === period);
    return {
      totalEliminations: periodEntries
        .filter((e) => e.type === 'elimination')
        .reduce((s, e) => s + e.amount, 0),
      totalGoodwill: periodEntries
        .filter((e) => e.type === 'goodwill')
        .reduce((s, e) => s + e.amount, 0),
      totalNCI: periodEntries.filter((e) => e.type === 'nci').reduce((s, e) => s + e.amount, 0),
      totalAdjustments: periodEntries
        .filter((e) => e.type === 'adjustment')
        .reduce((s, e) => s + e.amount, 0),
      netEffect: periodEntries.reduce(
        (s, e) => s + (e.type === 'elimination' ? -e.amount : e.amount),
        0
      ),
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
