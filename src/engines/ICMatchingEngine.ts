/* eslint-disable @typescript-eslint/no-unused-vars */
import type { GLEntry } from '@/types';
import type { ICPair, EliminationEntry } from './ConsolidationEngine';

// =============================================================================
// INTERCOMPANY MATCHING ENGINE
// Auto-detect, match, and reconcile IC transactions across entities
// =============================================================================

// --- Type Definitions ---

export type MatchStatus = 'matched' | 'partial' | 'unmatched';

export type MatchMethod = 'exact' | 'fuzzy_amount' | 'fuzzy_date' | 'manual';

export interface ICTransaction {
  id: string;
  entityId: string;
  entityName: string;
  accountCode: string;
  accountName: string;
  counterpartyEntityId: string;
  amount: number;
  currency: string;
  date: string;
  description?: string;
  reference?: string;
}

export interface MatchPair {
  id: string;
  source: ICTransaction;
  target: ICTransaction;
  status: MatchStatus;
  method: MatchMethod;
  amountDifference: number;
  percentageDifference: number;
  dateDifferenceDays: number;
  confidence: number; // 0-1
  matchedAt: string;
  matchedBy: 'auto' | 'manual';
}

export interface ToleranceSettings {
  amountTolerance: number; // absolute amount difference
  percentageTolerance: number; // 0-100 percentage
  dateToleranceDays: number;
}

export interface MatchSummary {
  totalTransactions: number;
  matchedCount: number;
  partiallyMatchedCount: number;
  unmatchedCount: number;
  matchedAmount: number;
  partiallyMatchedAmount: number;
  unmatchedAmount: number;
  matchRate: number; // 0-100
}

export interface ReconciliationLine {
  entityA: string;
  entityB: string;
  accountCode: string;
  accountName: string;
  balanceA: number;
  balanceB: number;
  difference: number;
  percentageDifference: number;
  withinTolerance: boolean;
  matchStatus: MatchStatus;
}

export interface ReconciliationReport {
  entityPairs: ReconciliationLine[];
  generatedAt: string;
  period: string;
  totalDifferences: number;
  withinToleranceCount: number;
  outsideToleranceCount: number;
}

// --- Default Tolerance ---

const DEFAULT_TOLERANCE: ToleranceSettings = {
  amountTolerance: 100,
  percentageTolerance: 5,
  dateToleranceDays: 5,
};

// =============================================================================
// IC MATCHING ENGINE
// =============================================================================

export class ICMatchingEngine {
  private tolerance: ToleranceSettings;
  private matches: MatchPair[] = [];

  constructor(tolerance: Partial<ToleranceSettings> = {}) {
    this.tolerance = { ...DEFAULT_TOLERANCE, ...tolerance };
  }

  // ---------------------------------------------------------------------------
  // Auto-detect IC pairs from GL entries
  // ---------------------------------------------------------------------------
  static detectICTransactions(
    entries: GLEntry[],
    entityNames: Record<string, string>,
    tolerance: ToleranceSettings = DEFAULT_TOLERANCE
  ): ICTransaction[] {
    const transactions: ICTransaction[] = [];
    const byAccount = new Map<string, GLEntry[]>();

    // Group by account code
    for (const entry of entries) {
      const key = entry.accountCode;
      if (!byAccount.has(key)) byAccount.set(key, []);
      byAccount.get(key)!.push(entry);
    }

    // Find entries that reference other entities
    for (const entry of entries) {
      if (!entry.entityId) continue;

      // Look for counterpart entries in other entities with same account
      const accountEntries = byAccount.get(entry.accountCode) ?? [];
      for (const other of accountEntries) {
        if (!other.entityId || other.entityId === entry.entityId) continue;

        // Check if amounts are roughly opposite (IC pattern)
        const amount = entry.amount ?? entry.netChange ?? 0;
        const otherAmount = other.amount ?? other.netChange ?? 0;
        const isOpposite = Math.sign(amount) !== Math.sign(otherAmount);

        if (
          isOpposite &&
          Math.abs(Math.abs(amount) - Math.abs(otherAmount)) <= tolerance.amountTolerance
        ) {
          transactions.push({
            id: `ic-${entry.id}`,
            entityId: entry.entityId,
            entityName: entityNames[entry.entityId] ?? entry.entityId,
            accountCode: entry.accountCode,
            accountName: entry.accountName,
            counterpartyEntityId: other.entityId,
            amount,
            currency: entry.currency ?? 'USD',
            date: entry.date,
            description: entry.description,
            reference: entry.reference,
          });
        }
      }
    }

    // Deduplicate by entity+account+counterparty
    const seen = new Set<string>();
    return transactions.filter((t) => {
      const key = `${t.entityId}:${t.accountCode}:${t.counterpartyEntityId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ---------------------------------------------------------------------------
  // Auto-match transactions across entities
  // ---------------------------------------------------------------------------
  autoMatch(sourceTransactions: ICTransaction[], targetTransactions: ICTransaction[]): MatchPair[] {
    const matches: MatchPair[] = [];
    const usedTargets = new Set<string>();

    for (const source of sourceTransactions) {
      let bestMatch: { target: ICTransaction; score: number; method: MatchMethod } | null = null;

      for (const target of targetTransactions) {
        if (usedTargets.has(target.id)) continue;
        if (source.entityId === target.entityId) continue;

        // Must be same account code
        if (source.accountCode !== target.accountCode) continue;

        // Check if amounts are opposite
        const isOpposite = Math.sign(source.amount) !== Math.sign(target.amount);
        if (!isOpposite) continue;

        const absSource = Math.abs(source.amount);
        const absTarget = Math.abs(target.amount);
        const amountDiff = Math.abs(absSource - absTarget);
        const pctDiff = absSource > 0 ? (amountDiff / absSource) * 100 : 0;
        const dateDiff = Math.abs(
          Math.floor((new Date(source.date).getTime() - new Date(target.date).getTime()) / 86400000)
        );

        // Exact match
        if (
          amountDiff <= this.tolerance.amountTolerance &&
          pctDiff <= this.tolerance.percentageTolerance &&
          dateDiff <= this.tolerance.dateToleranceDays
        ) {
          const score = 1 - amountDiff / (absSource || 1) - dateDiff * 0.01;
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { target, score: Math.max(0, score), method: 'exact' };
          }
        }
        // Fuzzy amount match
        else if (amountDiff <= this.tolerance.amountTolerance * 2) {
          const score = 0.5 - (amountDiff / (absSource || 1)) * 0.5;
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { target, score: Math.max(0, score), method: 'fuzzy_amount' };
          }
        }
      }

      if (bestMatch) {
        const absSource = Math.abs(source.amount);
        const absTarget = Math.abs(bestMatch.target.amount);
        const amountDiff = Math.abs(absSource - absTarget);
        const pctDiff = absSource > 0 ? (amountDiff / absSource) * 100 : 0;

        const status: MatchStatus = amountDiff === 0 ? 'matched' : 'partial';

        matches.push({
          id: `match-${source.id}-${bestMatch.target.id}`,
          source,
          target: bestMatch.target,
          status,
          method: bestMatch.method,
          amountDifference: amountDiff,
          percentageDifference: pctDiff,
          dateDifferenceDays: Math.abs(
            Math.floor(
              (new Date(source.date).getTime() - new Date(bestMatch.target.date).getTime()) /
                86400000
            )
          ),
          confidence: bestMatch.score,
          matchedAt: new Date().toISOString(),
          matchedBy: 'auto',
        });

        usedTargets.add(bestMatch.target.id);
      }
    }

    this.matches = matches;
    return matches;
  }

  // ---------------------------------------------------------------------------
  // Manual match two transactions
  // ---------------------------------------------------------------------------
  manualMatch(source: ICTransaction, target: ICTransaction): MatchPair {
    const absSource = Math.abs(source.amount);
    const absTarget = Math.abs(target.amount);
    const amountDiff = Math.abs(absSource - absTarget);
    const pctDiff = absSource > 0 ? (amountDiff / absSource) * 100 : 0;
    const dateDiff = Math.abs(
      Math.floor((new Date(source.date).getTime() - new Date(target.date).getTime()) / 86400000)
    );

    const pair: MatchPair = {
      id: `match-manual-${source.id}-${target.id}`,
      source,
      target,
      status: amountDiff === 0 ? 'matched' : 'partial',
      method: 'manual',
      amountDifference: amountDiff,
      percentageDifference: pctDiff,
      dateDifferenceDays: dateDiff,
      confidence: 1,
      matchedAt: new Date().toISOString(),
      matchedBy: 'manual',
    };

    this.matches.push(pair);
    return pair;
  }

  // ---------------------------------------------------------------------------
  // Unmatch a pair
  // ---------------------------------------------------------------------------
  unmatch(matchId: string): boolean {
    const idx = this.matches.findIndex((m) => m.id === matchId);
    if (idx === -1) return false;
    this.matches.splice(idx, 1);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Get match summary statistics
  // ---------------------------------------------------------------------------
  getSummary(
    sourceTransactions: ICTransaction[],
    targetTransactions: ICTransaction[]
  ): MatchSummary {
    const matched = this.matches.filter((m) => m.status === 'matched');
    const partial = this.matches.filter((m) => m.status === 'partial');
    const total = sourceTransactions.length + targetTransactions.length;
    const matchedIds = new Set(this.matches.flatMap((m) => [m.source.id, m.target.id]));
    const unmatchedCount = total - matchedIds.size;

    return {
      totalTransactions: total,
      matchedCount: matched.length,
      partiallyMatchedCount: partial.length,
      unmatchedCount,
      matchedAmount: matched.reduce((s, m) => s + Math.abs(m.source.amount), 0),
      partiallyMatchedAmount: partial.reduce((s, m) => s + Math.abs(m.source.amount), 0),
      unmatchedAmount: 0, // computed from unmatched transactions
      matchRate: total > 0 ? (matchedIds.size / total) * 100 : 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Get unmatched transactions
  // ---------------------------------------------------------------------------
  getUnmatched(allTransactions: ICTransaction[]): ICTransaction[] {
    const matchedIds = new Set(this.matches.flatMap((m) => [m.source.id, m.target.id]));
    return allTransactions.filter((t) => !matchedIds.has(t.id));
  }

  // ---------------------------------------------------------------------------
  // Generate reconciliation report
  // ---------------------------------------------------------------------------
  generateReconciliation(
    entities: { entityId: string; entityName: string; entries: GLEntry[] }[],
    period: string
  ): ReconciliationReport {
    const lines: ReconciliationLine[] = [];
    const entityPairs = this.getEntityPairs(entities);

    for (const { entityA, entityB, accountCode, accountName } of entityPairs) {
      const entriesA = entities
        .find((e) => e.entityId === entityA)!
        .entries.filter((e) => e.accountCode === accountCode && e.entityId === entityA);
      const entriesB = entities
        .find((e) => e.entityId === entityB)!
        .entries.filter((e) => e.accountCode === accountCode && e.entityId === entityB);

      const balanceA = entriesA.reduce((s, e) => s + (e.amount ?? e.netChange ?? 0), 0);
      const balanceB = entriesB.reduce((s, e) => s + (e.amount ?? e.netChange ?? 0), 0);
      const diff = Math.abs(balanceA + balanceB); // IC should net to 0
      const pctDiff = Math.abs(balanceA) > 0 ? (diff / Math.abs(balanceA)) * 100 : 0;
      const withinTolerance =
        diff <= this.tolerance.amountTolerance && pctDiff <= this.tolerance.percentageTolerance;

      lines.push({
        entityA,
        entityB,
        accountCode,
        accountName,
        balanceA,
        balanceB,
        difference: diff,
        percentageDifference: pctDiff,
        withinTolerance,
        matchStatus: withinTolerance ? 'matched' : diff > 0 ? 'partial' : 'unmatched',
      });
    }

    return {
      entityPairs: lines,
      generatedAt: new Date().toISOString(),
      period,
      totalDifferences: lines.filter((l) => l.difference > 0).length,
      withinToleranceCount: lines.filter((l) => l.withinTolerance).length,
      outsideToleranceCount: lines.filter((l) => !l.withinTolerance && l.difference > 0).length,
    };
  }

  // ---------------------------------------------------------------------------
  // Generate elimination journal entries from matches
  // ---------------------------------------------------------------------------
  generateEliminations(
    matches: MatchPair[],
    accountNames: Record<string, string>
  ): EliminationEntry[] {
    const eliminations: EliminationEntry[] = [];

    for (const match of matches) {
      if (match.status === 'unmatched') continue;

      const sourceAmount = match.source.amount;
      const elimAmount = Math.min(Math.abs(sourceAmount), Math.abs(match.target.amount));

      // Eliminate the receivable/payable
      eliminations.push({
        fromEntityId: match.source.entityId,
        toEntityId: match.target.entityId,
        accountCode: match.source.accountCode,
        accountName: accountNames[match.source.accountCode] ?? match.source.accountName,
        eliminatedAmount: elimAmount,
        debitAmount: sourceAmount > 0 ? elimAmount : 0,
        creditAmount: sourceAmount < 0 ? elimAmount : 0,
        description: `IC elimination: ${match.source.entityName} ↔ ${match.target.entityName}`,
        type: 'auto',
      });
    }

    return eliminations;
  }

  // ---------------------------------------------------------------------------
  // Get current matches
  // ---------------------------------------------------------------------------
  getMatches(): MatchPair[] {
    return [...this.matches];
  }

  // ---------------------------------------------------------------------------
  // Update tolerance
  // ---------------------------------------------------------------------------
  setTolerance(tolerance: Partial<ToleranceSettings>): void {
    this.tolerance = { ...this.tolerance, ...tolerance };
  }

  getTolerance(): ToleranceSettings {
    return { ...this.tolerance };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  private getEntityPairs(
    entities: { entityId: string }[]
  ): { entityA: string; entityB: string; accountCode: string; accountName: string }[] {
    const pairs: {
      entityA: string;
      entityB: string;
      accountCode: string;
      accountName: string;
    }[] = [];
    const seen = new Set<string>();

    for (const match of this.matches) {
      const key = [match.source.entityId, match.target.entityId].sort().join(':');
      const acctKey = `${key}:${match.source.accountCode}`;
      if (seen.has(acctKey)) continue;
      seen.add(acctKey);
      pairs.push({
        entityA: match.source.entityId,
        entityB: match.target.entityId,
        accountCode: match.source.accountCode,
        accountName: match.source.accountName,
      });
    }

    return pairs;
  }
}
