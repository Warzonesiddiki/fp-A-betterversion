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

function eliminateIntercompany(
  allEntries: ConsolidationGLEntry[],
  icPairs: ConsolidationICPair[],
  _ownerships: ConsolidationOwnership[]
): { eliminatedAmount: number; count: number } {
  let totalEliminated = toDecimal(0);
  let count = 0;
  const processedPairs = new Set<string>();

  for (const pair of icPairs) {
    const pairKey = `${pair.fromEntityId}:${pair.toEntityId}:${pair.accountCode}`;
    if (processedPairs.has(pairKey)) continue;
    processedPairs.add(pairKey);

    const fromEntries = allEntries.filter(
      (e) => e.entityId === pair.fromEntityId && e.accountCode === pair.accountCode
    );
    const fromAmount = sumMoney(fromEntries.map((e) => e.amount));

    const toAccountCode = pair.toAccountCode ?? pair.accountCode;
    const toEntries = allEntries.filter(
      (e) => e.entityId === pair.toEntityId && e.accountCode === toAccountCode
    );
    const toAmount = sumMoney(toEntries.map((e) => e.amount));

    if (!fromAmount.isZero() || !toAmount.isZero()) {
      const matchedAmount =
        compareMoney(fromAmount.abs(), toAmount.abs()) <= 0 ? fromAmount.abs() : toAmount.abs();
      totalEliminated = totalEliminated.plus(matchedAmount);
      count++;
    }
  }

  // Auto-detect IC accounts (prefix '9')
  const icAccounts = new Set(
    allEntries.filter((e) => e.accountCode.startsWith('9')).map((e) => e.accountCode)
  );

  for (const accountCode of icAccounts) {
    const accountEntries = allEntries.filter((e) => e.accountCode === accountCode);
    const entityBalances = new Map<string, ReturnType<typeof toDecimal>>();

    for (const entry of accountEntries) {
      entityBalances.set(
        entry.entityId,
        (entityBalances.get(entry.entityId) ?? toDecimal(0)).plus(entry.amount)
      );
    }

    const entityIds = Array.from(entityBalances.keys());
    for (let i = 0; i < entityIds.length; i++) {
      for (let j = i + 1; j < entityIds.length; j++) {
        const fromBalance = entityBalances.get(entityIds[i]!) ?? toDecimal(0);
        const toBalance = entityBalances.get(entityIds[j]!) ?? toDecimal(0);

        if (!fromBalance.isZero() && !toBalance.isZero()) {
          const autoKey = `${entityIds[i]}:${entityIds[j]}:${accountCode}`;
          if (!processedPairs.has(autoKey)) {
            processedPairs.add(autoKey);
            totalEliminated = totalEliminated.plus(
              compareMoney(fromBalance.abs(), toBalance.abs()) <= 0
                ? fromBalance.abs()
                : toBalance.abs()
            );
            count++;
          }
        }
      }
    }
  }

  return { eliminatedAmount: roundTo(totalEliminated), count };
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
  icPairs: ConsolidationICPair[],
  adjustments: ConsolidationAdjustment[]
): ConsolidationGLEntry[] {
  const adjustmentMap = new Map<string, ReturnType<typeof toDecimal>>();

  // Process IC pairs into adjustments
  for (const pair of icPairs) {
    const fromEntries = allEntries.filter(
      (e) => e.entityId === pair.fromEntityId && e.accountCode === pair.accountCode
    );
    const fromAmount = sumMoney(fromEntries.map((e) => e.amount));

    if (!fromAmount.isZero()) {
      const keyFrom = `${pair.fromEntityId}:${pair.accountCode}`;
      adjustmentMap.set(keyFrom, (adjustmentMap.get(keyFrom) ?? toDecimal(0)).minus(fromAmount));
    }

    const toAccountCode = pair.toAccountCode ?? pair.accountCode;
    const toEntries = allEntries.filter(
      (e) => e.entityId === pair.toEntityId && e.accountCode === toAccountCode
    );
    const toAmount = sumMoney(toEntries.map((e) => e.amount));

    if (!toAmount.isZero()) {
      const keyTo = `${pair.toEntityId}:${toAccountCode}`;
      adjustmentMap.set(keyTo, (adjustmentMap.get(keyTo) ?? toDecimal(0)).minus(toAmount));
    }
  }

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
    const key = `${entry.entityId}:${entry.accountCode}`;
    const adj = adjustmentMap.get(key) ?? toDecimal(0);
    const newAmount = addMoney(entry.amount, adj);

    if (newAmount.abs().gt('0.001')) {
      result.push({ ...entry, amount: roundTo(newAmount) });
    }
    processedKeys.add(key);
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

  // Step 3: Eliminate intercompany
  const eliminationResult = eliminateIntercompany(allEntries, icPairs, ownerships);

  postProgress(3, 5);

  // Step 4: Calculate minority interest
  const minorityInterest = calculateMinorityInterest(translatedEntities, ownerships);

  postProgress(4, 5);

  // Step 5: Apply eliminations and adjustments
  const consolidatedEntries = applyEliminationsAndAdjustments(allEntries, icPairs, adjustments);

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
    eliminationCount: eliminationResult.count,
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
