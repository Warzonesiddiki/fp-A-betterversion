/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * IntercompanyMatchingEngine — Match and eliminate intercompany transactions
 * Critical for multi-entity consolidation (ASC 810)
 */

export interface ICTransaction {
  id: string;
  fromEntity: string;
  toEntity: string;
  amount: number;
  currency: string;
  accountCode: string;
  description: string;
  date: string;
  status: 'pending' | 'matched' | 'eliminated' | 'disputed';
}

export interface ICMatch {
  id: string;
  debitTransaction: ICTransaction;
  creditTransaction: ICTransaction;
  matchedAmount: number;
  variance: number;
  tolerance: number;
  status: 'auto_matched' | 'manual_matched' | 'unmatched' | 'disputed';
  matchedBy: string;
  matchedAt: string;
}

export interface ICElimination {
  id: string;
  matchId: string;
  eliminationAmount: number;
  debitAccount: string;
  creditAccount: string;
  entityPair: [string, string];
  period: string;
  createdBy: string;
  createdAt: string;
}

export class IntercompanyMatchingEngine {
  private static transactions: ICTransaction[] = [];
  private static matches: ICMatch[] = [];
  private static eliminations: ICElimination[] = [];

  /**
   * Add IC transactions for matching
   */
  static addTransactions(transactions: ICTransaction[]): void {
    this.transactions.push(...transactions);
  }

  /**
   * Auto-match transactions by entity pair, amount, and date
   */
  static autoMatch(tolerance: number = 0.01): ICMatch[] {
    const pending = this.transactions.filter((t) => t.status === 'pending');
    const newMatches: ICMatch[] = [];

    for (const debit of pending) {
      if (debit.status !== 'pending') continue;

      // Find matching credit transaction
      const credit = pending.find(
        (c) =>
          c.id !== debit.id &&
          c.fromEntity === debit.toEntity &&
          c.toEntity === debit.fromEntity &&
          c.accountCode === debit.accountCode &&
          Math.abs(Math.abs(c.amount) - Math.abs(debit.amount)) <=
            tolerance * Math.max(Math.abs(c.amount), Math.abs(debit.amount)) &&
          c.status === 'pending'
      );

      if (credit) {
        const match: ICMatch = {
          id: `icm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          debitTransaction: debit,
          creditTransaction: credit,
          matchedAmount: Math.min(debit.amount, credit.amount),
          variance: Math.abs(debit.amount - credit.amount),
          tolerance,
          status: 'auto_matched',
          matchedBy: 'system',
          matchedAt: new Date().toISOString(),
        };

        debit.status = 'matched';
        credit.status = 'matched';
        this.matches.push(match);
        newMatches.push(match);
      }
    }

    return newMatches;
  }

  /**
   * Manual match two transactions
   */
  static manualMatch(debitId: string, creditId: string, userId: string): ICMatch | null {
    const debit = this.transactions.find((t) => t.id === debitId);
    const credit = this.transactions.find((t) => t.id === creditId);

    if (!debit || !credit) return null;
    if (debit.status !== 'pending' || credit.status !== 'pending') return null;

    const match: ICMatch = {
      id: `icm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      debitTransaction: debit,
      creditTransaction: credit,
      matchedAmount: Math.min(debit.amount, credit.amount),
      variance: Math.abs(debit.amount - credit.amount),
      tolerance: 0,
      status: 'manual_matched',
      matchedBy: userId,
      matchedAt: new Date().toISOString(),
    };

    debit.status = 'matched';
    credit.status = 'matched';
    this.matches.push(match);
    return match;
  }

  /**
   * Create elimination entries for matched pairs
   */
  static createEliminations(period: string, userId: string): ICElimination[] {
    const matched = this.matches.filter(
      (m) => m.status === 'auto_matched' || m.status === 'manual_matched'
    );

    const newEliminations: ICElimination[] = [];

    for (const match of matched) {
      // Check if already eliminated
      if (this.eliminations.some((e) => e.matchId === match.id)) continue;

      const elimination: ICElimination = {
        id: `ice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        matchId: match.id,
        eliminationAmount: match.matchedAmount,
        debitAccount: match.creditTransaction.accountCode,
        creditAccount: match.debitTransaction.accountCode,
        entityPair: [match.debitTransaction.fromEntity, match.debitTransaction.toEntity],
        period,
        createdBy: userId,
        createdAt: new Date().toISOString(),
      };

      match.debitTransaction.status = 'eliminated';
      match.creditTransaction.status = 'eliminated';
      this.eliminations.push(elimination);
      newEliminations.push(elimination);
    }

    return newEliminations;
  }

  /**
   * Get unmatched transactions
   */
  static getUnmatched(): ICTransaction[] {
    return this.transactions.filter((t) => t.status === 'pending');
  }

  /**
   * Get all matches
   */
  static getMatches(): ICMatch[] {
    return [...this.matches];
  }

  /**
   * Get all eliminations
   */
  static getEliminations(): ICElimination[] {
    return [...this.eliminations];
  }

  /**
   * Get summary by entity pair
   */
  static getSummaryByPair(): Map<
    string,
    {
      totalDebits: number;
      totalCredits: number;
      matched: number;
      unmatched: number;
      eliminated: number;
    }
  > {
    const summary = new Map<
      string,
      ReturnType<typeof IntercompanyMatchingEngine.getSummaryByPair> extends Map<string, infer V>
        ? V
        : never
    >();

    for (const tx of this.transactions) {
      const key = [tx.fromEntity, tx.toEntity].sort().join('↔');
      const existing = summary.get(key) ?? {
        totalDebits: 0,
        totalCredits: 0,
        matched: 0,
        unmatched: 0,
        eliminated: 0,
      };

      if (tx.fromEntity < tx.toEntity) {
        existing.totalDebits += tx.amount;
      } else {
        existing.totalCredits += tx.amount;
      }

      if (tx.status === 'matched') existing.matched++;
      if (tx.status === 'pending') existing.unmatched++;
      if (tx.status === 'eliminated') existing.eliminated++;

      summary.set(key, existing);
    }

    return summary;
  }

  /**
   * Net intercompany balances between two entities
   * Returns net position: positive = entityA owes entityB, negative = entityB owes entityA
   */
  static netICBalances(
    entityA: string,
    entityB: string
  ): { netAmount: string; currency: string; transactions: ICTransaction[] } {
    const pairTransactions = this.transactions.filter(
      (t) =>
        (t.fromEntity === entityA && t.toEntity === entityB) ||
        (t.fromEntity === entityB && t.toEntity === entityA)
    );

    let netAmount = 0;
    for (const tx of pairTransactions) {
      if (tx.fromEntity === entityA) {
        netAmount += tx.amount;
      } else {
        netAmount -= tx.amount;
      }
    }

    return {
      netAmount: netAmount.toFixed(2),
      currency: pairTransactions[0]?.currency ?? 'USD',
      transactions: pairTransactions,
    };
  }

  /**
   * Calculate intercompany interest on outstanding balances
   */
  static calculateICInterest(
    entityA: string,
    entityB: string,
    annualRate: number,
    days: number
  ): { interestAmount: number; principal: number; rate: number; days: number } {
    const { netAmount } = this.netICBalances(entityA, entityB);
    const principal = Math.abs(parseFloat(netAmount));
    const interestAmount = principal * (annualRate / 365) * days;

    return {
      interestAmount: Math.round(interestAmount * 100) / 100,
      principal,
      rate: annualRate,
      days,
    };
  }

  /**
   * Eliminate intercompany profit on inventory/assets
   * Creates elimination entry for unrealized profit
   */
  static eliminateICProfit(
    sellerEntity: string,
    buyerEntity: string,
    profitAmount: number,
    accountCode: string,
    userId: string
  ): ICElimination {
    const elimination: ICElimination = {
      id: `ice-profit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      matchId: 'profit-elimination',
      eliminationAmount: profitAmount,
      debitAccount: 'Cost of Goods Sold',
      creditAccount: accountCode,
      entityPair: [sellerEntity, buyerEntity].sort() as [string, string],
      period: new Date().toISOString().slice(0, 7),
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    this.eliminations.push(elimination);
    return elimination;
  }

  /**
   * Allocate minority interest in subsidiary earnings
   */
  static allocateMinorityInterest(
    totalEarnings: number,
    ownershipPercentage: number,
    parentEntity: string,
    subsidiaryEntity: string
  ): { parentShare: number; minorityShare: number; ownershipPct: number } {
    const parentShare = totalEarnings * (ownershipPercentage / 100);
    const minorityShare = totalEarnings - parentShare;

    return {
      parentShare: Math.round(parentShare * 100) / 100,
      minorityShare: Math.round(minorityShare * 100) / 100,
      ownershipPct: ownershipPercentage,
    };
  }

  /**
   * Reconcile intercompany accounts across entities
   * Identifies discrepancies and generates reconciliation report
   */
  static reconcileICAccounts(
    accounts: Array<{ entityId: string; accountCode: string; balance: number }>
  ): {
    reconciled: boolean;
    discrepancies: Array<{
      accountCode: string;
      entityBalances: Record<string, number>;
      variance: number;
    }>;
  } {
    const grouped = new Map<string, Array<{ entityId: string; balance: number }>>();

    for (const acc of accounts) {
      const existing = grouped.get(acc.accountCode) ?? [];
      existing.push({ entityId: acc.entityId, balance: acc.balance });
      grouped.set(acc.accountCode, existing);
    }

    const discrepancies: Array<{
      accountCode: string;
      entityBalances: Record<string, number>;
      variance: number;
    }> = [];

    for (const [accountCode, entries] of grouped) {
      if (entries.length < 2) continue;

      const entityBalances: Record<string, number> = {};
      for (const e of entries) {
        entityBalances[e.entityId] = e.balance;
      }

      const netBalance = entries.reduce((sum, e) => sum + e.balance, 0);
      if (Math.abs(netBalance) > 0.01) {
        discrepancies.push({ accountCode, entityBalances, variance: netBalance });
      }
    }

    return { reconciled: discrepancies.length === 0, discrepancies };
  }

  /**
   * Generate intercompany transactions from templates
   */
  static generateICTransactions(
    entities: Array<{ id: string; name: string }>,
    template: { accountCode: string; description: string; baseAmount: number }
  ): ICTransaction[] {
    const transactions: ICTransaction[] = [];

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const tx: ICTransaction = {
          id: `ictx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          fromEntity: entities[i]!.id,
          toEntity: entities[j]!.id,
          amount: template.baseAmount,
          currency: 'USD',
          accountCode: template.accountCode,
          description: `${template.description} - ${entities[i]!.name} → ${entities[j]!.name}`,
          date: new Date().toISOString().slice(0, 10),
          status: 'pending',
        };
        transactions.push(tx);
        this.transactions.push(tx);
      }
    }

    return transactions;
  }

  /**
   * Match generated IC transactions with GL entries
   */
  static matchICTransactions(
    glEntries: Array<{ id: string; entityId: string; amount: number; accountCode: string }>
  ): Array<{ transaction: ICTransaction; glEntry: (typeof glEntries)[0]; confidence: number }> {
    const matches: Array<{
      transaction: ICTransaction;
      glEntry: (typeof glEntries)[0];
      confidence: number;
    }> = [];
    const pending = this.transactions.filter((t) => t.status === 'pending');

    for (const tx of pending) {
      for (const gl of glEntries) {
        if (gl.entityId !== tx.fromEntity && gl.entityId !== tx.toEntity) continue;

        const amountMatch = Math.abs(gl.amount - tx.amount) / Math.max(tx.amount, 1) < 0.01;
        const accountMatch = gl.accountCode === tx.accountCode;

        let confidence = 0;
        if (amountMatch) confidence += 0.5;
        if (accountMatch) confidence += 0.5;

        if (confidence >= 0.5) {
          matches.push({ transaction: tx, glEntry: gl, confidence });
        }
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Validate intercompany balance — must net to zero across all entities
   */
  static validateICBalance(): {
    valid: boolean;
    totalImbalance: number;
    imbalances: Array<{ entity: string; netAmount: number }>;
  } {
    const entityBalances = new Map<string, number>();

    for (const tx of this.transactions) {
      if (tx.status === 'eliminated') continue;

      const fromBal = entityBalances.get(tx.fromEntity) ?? 0;
      entityBalances.set(tx.fromEntity, fromBal - tx.amount);

      const toBal = entityBalances.get(tx.toEntity) ?? 0;
      entityBalances.set(tx.toEntity, toBal + tx.amount);
    }

    const imbalances: Array<{ entity: string; netAmount: number }> = [];
    let totalImbalance = 0;

    for (const [entity, netAmount] of entityBalances) {
      if (Math.abs(netAmount) > 0.01) {
        imbalances.push({ entity, netAmount });
        totalImbalance += Math.abs(netAmount);
      }
    }

    return {
      valid: imbalances.length === 0,
      totalImbalance: Math.round(totalImbalance * 100) / 100,
      imbalances,
    };
  }

  /**
   * Clear all data (for testing)
   */
  static clear(): void {
    this.transactions = [];
    this.matches = [];
    this.eliminations = [];
  }
}
