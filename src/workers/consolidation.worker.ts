/// <reference lib="webworker" />
// =============================================================================
// CONSOLIDATION WEB WORKER
// Runs multi-entity consolidation off the main thread.
// ASC 810 compliant: eliminations, minority interest, FX translation.
//
// MONEY MIGRATION (2026-08-04): every currency-bearing computation — FX
// translation (amount × rate), intercompany elimination sums, minority
// interest, adjustment nets, category totals, and the balance check — uses
// the canonical money primitive (`src/utils/money.ts`, F-0006). Entry
// amounts are cent-rounded (`roundTo`, declared half-up) at the output
// boundary; progress percentages and record counts are not currency.
// =============================================================================

import {
  addMoney,
  compareMoney,
  multiplyMoney,
  percentOf,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '@/utils/money';
import type {
  WorkerMessage,
  WorkerResponse,
  ConsolidationRequest,
  ConsolidationResponse,
  ConsolidationEntityData,
  ConsolidationGLEntry,
  ConsolidationOwnership,
  ConsolidationICPair,
  ConsolidationFXRate,
  ConsolidationAdjustment,
} from './types';

// --- Account category mapping ---

type AccountCategory = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

const CATEGORY_MAP: Record<string, AccountCategory> = {
  '1': 'asset',
  '2': 'liability',
  '3': 'equity',
  '4': 'revenue',
  '5': 'expense',
  '6': 'expense',
  '7': 'expense',
  '8': 'revenue',
  '9': 'revenue',
};

function getAccountCategory(accountCode: string): AccountCategory {
  return CATEGORY_MAP[accountCode.charAt(0)] ?? 'expense';
}

// --- FX Translation (ASC 830) ---

function translateForeignEntities(
  entities: ConsolidationEntityData[],
  fxRates: ConsolidationFXRate[]
): ConsolidationEntityData[] {
  if (fxRates.length === 0) return entities;

  const rateMap = new Map<string, ConsolidationFXRate>();
  for (const rate of fxRates) {
    rateMap.set(`${rate.fromCurrency}:${rate.toCurrency}:${rate.rateType}`, rate);
  }

  return entities.map((entity) => {
    if (!entity.isForeign || entity.currency === 'USD') return entity;

    const closingRate = rateMap.get(`${entity.currency}:USD:spot`);
    const averageRate = rateMap.get(`${entity.currency}:USD:average`);
    const historicalRate = rateMap.get(`${entity.currency}:USD:historical`);

    if (!closingRate && !averageRate && !historicalRate) return entity;

    const translatedEntries = entity.entries.map((entry) => {
      const category = getAccountCategory(entry.accountCode);
      let rate: number;

      switch (category) {
        case 'asset':
        case 'liability':
          rate = closingRate?.rate ?? 1;
          break;
        case 'revenue':
        case 'expense':
          rate = averageRate?.rate ?? 1;
          break;
        case 'equity':
          rate = historicalRate?.rate ?? 1;
          break;
        default:
          rate = closingRate?.rate ?? 1;
      }

      // Currency × FX rate is an exact decimal product, cent-rounded.
      return { ...entry, amount: roundTo(multiplyMoney(entry.amount, rate)), currency: 'USD' };
    });

    return { ...entity, entries: translatedEntries, currency: 'USD', isForeign: false };
  });
}

// --- Intercompany elimination ---

/**
 * One resolved IC elimination: a matched magnitude per currency plus the
 * signed per-leg adjustments that remove exactly that amount.
 */
interface ResolvedElimination {
  readonly fromEntityId: string;
  readonly fromAccountCode: string;
  readonly toEntityId: string;
  readonly toAccountCode: string;
  readonly currency: string;
  /** Matched magnitude min(|legA|, |legB|); always > 0. */
  readonly amount: number;
  /** Signed adjustment applied to the from-leg entry amount. */
  readonly fromDelta: number;
  /** Signed adjustment applied to the to-leg entry amount. */
  readonly toDelta: number;
}

const ELIMINATION_EPS = '0.001';

/**
 * Resolves every applicable intercompany elimination into one concrete list:
 * explicit icPairs first (declaration order), then auto-detected matches
 * between accounts whose code starts with '9'. Matching happens per currency;
 * each match eliminates only min(|legA|, |legB|), leaving any unmatched
 * residual gross and visible. Leg remainders are consumed as pairs resolve,
 * so no balance is ever eliminated twice — explicit/auto overlap included
 * (this replaces the old processedPairs key dedup).
 */
function resolveEliminations(
  allEntries: ConsolidationGLEntry[],
  icPairs: ConsolidationICPair[]
): ResolvedElimination[] {
  type Remainder = ReturnType<typeof toDecimal>;
  const zero = () => toDecimal(0);
  const bucketKey = (entityId: string, accountCode: string, currency: string): string =>
    `${entityId}:${accountCode}:${currency}`;

  // Remaining (not yet eliminated) balance per entity/account/currency,
  // plus the currencies seen per entity/account bucket for explicit pairs.
  const remainders = new Map<string, Remainder>();
  const currenciesOfBucket = new Map<string, Set<string>>();
  // Auto-detect groups: 9-prefix accounts keyed by account:currency, in
  // first-seen entity order.
  const autoGroups = new Map<
    string,
    { entityId: string; accountCode: string; currency: string }[]
  >();

  for (const entry of allEntries) {
    const key = bucketKey(entry.entityId, entry.accountCode, entry.currency);
    remainders.set(key, (remainders.get(key) ?? zero()).plus(entry.amount));
    const bucketKeyNoCur = `${entry.entityId}:${entry.accountCode}`;
    const currencies = currenciesOfBucket.get(bucketKeyNoCur) ?? new Set<string>();
    currencies.add(entry.currency);
    currenciesOfBucket.set(bucketKeyNoCur, currencies);

    if (entry.accountCode.startsWith('9')) {
      const groupKey = `${entry.accountCode}:${entry.currency}`;
      const members = autoGroups.get(groupKey) ?? [];
      if (!members.some((m) => m.entityId === entry.entityId)) {
        members.push({
          entityId: entry.entityId,
          accountCode: entry.accountCode,
          currency: entry.currency,
        });
      }
      autoGroups.set(groupKey, members);
    }
  }

  const resolved: ResolvedElimination[] = [];

  // Emits one match of min(|from|, |to|) in `currency`, consuming both
  // remainders toward zero by exactly that magnitude.
  const tryMatch = (
    fromEntityId: string,
    fromAccountCode: string,
    toEntityId: string,
    toAccountCode: string,
    currency: string
  ): void => {
    const fromKey = bucketKey(fromEntityId, fromAccountCode, currency);
    const toKey = bucketKey(toEntityId, toAccountCode, currency);
    const from = remainders.get(fromKey) ?? zero();
    const to = remainders.get(toKey) ?? zero();
    const fromAbs = from.abs();
    const toAbs = to.abs();
    if (fromAbs.lte(ELIMINATION_EPS) || toAbs.lte(ELIMINATION_EPS)) return;

    const matched = compareMoney(fromAbs, toAbs) <= 0 ? fromAbs : toAbs;
    // Reduce each leg toward zero by the matched magnitude only; any excess
    // stays visible as a residual.
    const fromDelta = compareMoney(from, zero()) < 0 ? matched : matched.negated();
    const toDelta = compareMoney(to, zero()) < 0 ? matched : matched.negated();
    remainders.set(fromKey, from.plus(fromDelta));
    remainders.set(toKey, to.plus(toDelta));
    resolved.push({
      fromEntityId,
      fromAccountCode,
      toEntityId,
      toAccountCode,
      currency,
      amount: roundTo(matched),
      fromDelta: roundTo(fromDelta),
      toDelta: roundTo(toDelta),
    });
  };

  // Phase 1: explicit pairs — match each declared pair per shared currency.
  for (const pair of icPairs) {
    const toAccountCode = pair.toAccountCode ?? pair.accountCode;
    const currencies = new Set([
      ...(currenciesOfBucket.get(`${pair.fromEntityId}:${pair.accountCode}`) ?? []),
      ...(currenciesOfBucket.get(`${pair.toEntityId}:${toAccountCode}`) ?? []),
    ]);
    for (const currency of currencies) {
      tryMatch(pair.fromEntityId, pair.accountCode, pair.toEntityId, toAccountCode, currency);
    }
  }

  // Phase 2: auto-detect — pairwise matches between entities holding the
  // same 9-prefix account in the same currency, on what remains.
  for (const members of autoGroups.values()) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        tryMatch(
          members[i]!.entityId,
          members[i]!.accountCode,
          members[j]!.entityId,
          members[j]!.accountCode,
          members[i]!.currency
        );
      }
    }
  }

  return resolved;
}

// --- Minority interest calculation ---

function calculateMinorityInterest(
  entities: ConsolidationEntityData[],
  ownerships: ConsolidationOwnership[]
): ReturnType<typeof toDecimal> {
  let totalMI = toDecimal(0);

  for (const ownership of ownerships) {
    if (ownership.method !== 'full') continue;

    const minorityPct = (100 - ownership.ownershipPct) / 100;
    if (minorityPct <= 0) continue;

    const subsidiary = entities.find((e) => e.entityId === ownership.childId);
    if (!subsidiary) continue;

    const revenue = sumMoney(
      subsidiary.entries
        .filter((e) => getAccountCategory(e.accountCode) === 'revenue')
        .map((e) => e.amount)
    );

    const expenses = sumMoney(
      subsidiary.entries
        .filter((e) => getAccountCategory(e.accountCode) === 'expense')
        .map((e) => e.amount)
    );

    const netIncome = addMoney(revenue, expenses);
    // Minority share = netIncome × (100 − ownershipPct) / 100 (exact decimal).
    totalMI = totalMI.plus(percentOf(netIncome, 100 - ownership.ownershipPct));
  }

  return totalMI;
}

// --- Apply eliminations and adjustments ---

function applyEliminationsAndAdjustments(
  allEntries: ConsolidationGLEntry[],
  eliminations: readonly ResolvedElimination[],
  adjustments: ConsolidationAdjustment[]
): ConsolidationGLEntry[] {
  // Elimination deltas are keyed WITH currency, so a matched amount only
  // ever touches entries denominated in the matched currency. Manual
  // adjustments keep their legacy currency-less keying.
  const elimMap = new Map<string, ReturnType<typeof toDecimal>>();

  for (const elim of eliminations) {
    const keyFrom = `${elim.fromEntityId}:${elim.fromAccountCode}:${elim.currency}`;
    elimMap.set(keyFrom, (elimMap.get(keyFrom) ?? toDecimal(0)).plus(elim.fromDelta));

    const keyTo = `${elim.toEntityId}:${elim.toAccountCode}:${elim.currency}`;
    elimMap.set(keyTo, (elimMap.get(keyTo) ?? toDecimal(0)).plus(elim.toDelta));
  }

  const adjustmentMap = new Map<string, ReturnType<typeof toDecimal>>();

  // Process manual adjustments
  for (const adj of adjustments) {
    const key = `${adj.entityId}:${adj.accountCode}`;
    const net = subtractMoney(adj.debitAmount, adj.creditAmount);
    adjustmentMap.set(key, (adjustmentMap.get(key) ?? toDecimal(0)).plus(net));
  }

  // Apply adjustments to entries
  const result: ConsolidationGLEntry[] = [];
  const processedKeys = new Set<string>();

  for (const entry of allEntries) {
    const manualKey = `${entry.entityId}:${entry.accountCode}`;
    const adj = addMoney(
      elimMap.get(`${manualKey}:${entry.currency}`) ?? toDecimal(0),
      adjustmentMap.get(manualKey) ?? toDecimal(0)
    );
    const newAmount = addMoney(entry.amount, adj);

    if (newAmount.abs().gt('0.001')) {
      result.push({ ...entry, amount: roundTo(newAmount) });
    }
    processedKeys.add(manualKey);
  }

  // Add adjustment-only entries (e.g., goodwill)
  for (const adj of adjustments) {
    const key = `${adj.entityId}:${adj.accountCode}`;
    if (!processedKeys.has(key) && (adj.debitAmount > 0 || adj.creditAmount > 0)) {
      result.push({
        id: `adj-${adj.accountCode}-${adj.entityId}`,
        accountCode: adj.accountCode,
        accountName: adj.accountName,
        amount: roundTo(subtractMoney(adj.debitAmount, adj.creditAmount)),
        currency: 'USD',
        date: new Date().toISOString().split('T')[0]!,
        entityId: adj.entityId,
      });
    }
  }

  return result;
}

// --- Sum by category ---

function sumByCategory(
  entries: ConsolidationGLEntry[],
  category: AccountCategory
): ReturnType<typeof sumMoney> {
  return sumMoney(
    entries.filter((e) => getAccountCategory(e.accountCode) === category).map((e) => e.amount)
  );
}

// --- Core consolidation ---

function runConsolidation(request: ConsolidationRequest): ConsolidationResponse {
  const { entities, ownerships, icPairs = [], fxRates = [], adjustments = [] } = request;

  if (entities.length === 0) {
    return {
      consolidatedEntries: [],
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      isBalanced: true,
      imbalanceAmount: 0,
      eliminationCount: 0,
      minorityInterest: 0,
    };
  }

  // Report progress: FX translation
  postProgress(1, 5);

  // Step 1: Translate foreign subsidiaries
  const translatedEntities = translateForeignEntities(entities, fxRates);

  // Step 2: Combine all entries
  const allEntries: ConsolidationGLEntry[] = [];
  for (const entity of translatedEntities) {
    allEntries.push(...entity.entries);
  }

  postProgress(2, 5);

  // Step 3: Resolve intercompany eliminations (explicit pairs + auto-detected
  // 9-prefix matches). This same list is applied in step 5, so counted
  // eliminations and applied eliminations can never diverge.
  const eliminations = resolveEliminations(allEntries, icPairs);

  postProgress(3, 5);

  // Step 4: Calculate minority interest
  const minorityInterest = calculateMinorityInterest(translatedEntities, ownerships);

  postProgress(4, 5);

  // Step 5: Apply the resolved eliminations and manual adjustments
  const consolidatedEntries = applyEliminationsAndAdjustments(
    allEntries,
    eliminations,
    adjustments
  );

  // Calculate totals at full decimal precision; cent-round at the boundary.
  const totalAssetsDec = sumByCategory(consolidatedEntries, 'asset');
  const totalLiabilitiesDec = sumByCategory(consolidatedEntries, 'liability');
  const totalEquityDec = sumByCategory(consolidatedEntries, 'equity');
  const totalRevenueDec = sumByCategory(consolidatedEntries, 'revenue');
  const totalExpensesDec = sumByCategory(consolidatedEntries, 'expense');
  const netIncomeDec = addMoney(totalRevenueDec, totalExpensesDec);

  const balanceCheck = sumMoney([
    totalAssetsDec,
    totalLiabilitiesDec,
    totalEquityDec,
    minorityInterest,
  ]);
  const isBalanced = balanceCheck.abs().lt('0.01');

  postProgress(5, 5);

  return {
    consolidatedEntries,
    totalAssets: roundTo(totalAssetsDec),
    totalLiabilities: roundTo(totalLiabilitiesDec),
    totalEquity: roundTo(totalEquityDec),
    totalRevenue: roundTo(totalRevenueDec),
    totalExpenses: roundTo(totalExpensesDec),
    netIncome: roundTo(netIncomeDec),
    isBalanced,
    imbalanceAmount: roundTo(balanceCheck),
    eliminationCount: eliminations.length,
    minorityInterest: roundTo(minorityInterest),
  };
}

function postProgress(processed: number, total: number): void {
  const response: WorkerResponse = {
    id: 'consolidation',
    type: 'progress',
    progress: {
      processed,
      total,
      percent: Math.round((processed / total) * 100),
    },
  };
  self.postMessage(response);
}

// --- Worker message handler ---

self.onmessage = (e: MessageEvent<WorkerMessage<ConsolidationRequest>>) => {
  const { id, payload } = e.data;

  try {
    const result = runConsolidation(payload);
    const response: WorkerResponse<ConsolidationResponse> = {
      id,
      type: 'result',
      payload: result,
    };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error in consolidation worker',
    };
    self.postMessage(response);
  }
};
