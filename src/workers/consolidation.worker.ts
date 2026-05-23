/// <reference lib="webworker" />
// =============================================================================
// CONSOLIDATION WEB WORKER
// Runs multi-entity consolidation off the main thread.
// ASC 810 compliant: eliminations, minority interest, FX translation.
// =============================================================================

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

      return { ...entry, amount: entry.amount * rate, currency: 'USD' };
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
  let totalEliminated = 0;
  let count = 0;
  const processedPairs = new Set<string>();

  for (const pair of icPairs) {
    const pairKey = `${pair.fromEntityId}:${pair.toEntityId}:${pair.accountCode}`;
    if (processedPairs.has(pairKey)) continue;
    processedPairs.add(pairKey);

    const fromEntries = allEntries.filter(
      (e) => e.entityId === pair.fromEntityId && e.accountCode === pair.accountCode
    );
    const fromAmount = fromEntries.reduce((sum, e) => sum + e.amount, 0);

    const toAccountCode = pair.toAccountCode ?? pair.accountCode;
    const toEntries = allEntries.filter(
      (e) => e.entityId === pair.toEntityId && e.accountCode === toAccountCode
    );
    const toAmount = toEntries.reduce((sum, e) => sum + e.amount, 0);

    if (fromAmount !== 0 || toAmount !== 0) {
      const matchedAmount = Math.min(Math.abs(fromAmount), Math.abs(toAmount));
      totalEliminated += matchedAmount;
      count++;
    }
  }

  // Auto-detect IC accounts (prefix '9')
  const icAccounts = new Set(
    allEntries.filter((e) => e.accountCode.startsWith('9')).map((e) => e.accountCode)
  );

  for (const accountCode of icAccounts) {
    const accountEntries = allEntries.filter((e) => e.accountCode === accountCode);
    const entityBalances = new Map<string, number>();

    for (const entry of accountEntries) {
      entityBalances.set(entry.entityId, (entityBalances.get(entry.entityId) ?? 0) + entry.amount);
    }

    const entityIds = Array.from(entityBalances.keys());
    for (let i = 0; i < entityIds.length; i++) {
      for (let j = i + 1; j < entityIds.length; j++) {
        const fromBalance = entityBalances.get(entityIds[i]) ?? 0;
        const toBalance = entityBalances.get(entityIds[j]) ?? 0;

        if (fromBalance !== 0 && toBalance !== 0) {
          const autoKey = `${entityIds[i]}:${entityIds[j]}:${accountCode}`;
          if (!processedPairs.has(autoKey)) {
            processedPairs.add(autoKey);
            totalEliminated += Math.min(Math.abs(fromBalance), Math.abs(toBalance));
            count++;
          }
        }
      }
    }
  }

  return { eliminatedAmount: totalEliminated, count };
}

// --- Minority interest calculation ---

function calculateMinorityInterest(
  entities: ConsolidationEntityData[],
  ownerships: ConsolidationOwnership[]
): number {
  let totalMI = 0;

  for (const ownership of ownerships) {
    if (ownership.method !== 'full') continue;

    const minorityPct = (100 - ownership.ownershipPct) / 100;
    if (minorityPct <= 0) continue;

    const subsidiary = entities.find((e) => e.entityId === ownership.childId);
    if (!subsidiary) continue;

    const revenue = subsidiary.entries
      .filter((e) => getAccountCategory(e.accountCode) === 'revenue')
      .reduce((sum, e) => sum + e.amount, 0);

    const expenses = subsidiary.entries
      .filter((e) => getAccountCategory(e.accountCode) === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    const netIncome = revenue + expenses;
    totalMI += minorityPct * netIncome;
  }

  return totalMI;
}

// --- Apply eliminations and adjustments ---

function applyEliminationsAndAdjustments(
  allEntries: ConsolidationGLEntry[],
  icPairs: ConsolidationICPair[],
  adjustments: ConsolidationAdjustment[]
): ConsolidationGLEntry[] {
  const adjustmentMap = new Map<string, number>();

  // Process IC pairs into adjustments
  for (const pair of icPairs) {
    const fromEntries = allEntries.filter(
      (e) => e.entityId === pair.fromEntityId && e.accountCode === pair.accountCode
    );
    const fromAmount = fromEntries.reduce((sum, e) => sum + e.amount, 0);

    if (fromAmount !== 0) {
      const keyFrom = `${pair.fromEntityId}:${pair.accountCode}`;
      adjustmentMap.set(keyFrom, (adjustmentMap.get(keyFrom) ?? 0) - fromAmount);
    }

    const toAccountCode = pair.toAccountCode ?? pair.accountCode;
    const toEntries = allEntries.filter(
      (e) => e.entityId === pair.toEntityId && e.accountCode === toAccountCode
    );
    const toAmount = toEntries.reduce((sum, e) => sum + e.amount, 0);

    if (toAmount !== 0) {
      const keyTo = `${pair.toEntityId}:${toAccountCode}`;
      adjustmentMap.set(keyTo, (adjustmentMap.get(keyTo) ?? 0) - toAmount);
    }
  }

  // Process manual adjustments
  for (const adj of adjustments) {
    const key = `${adj.entityId}:${adj.accountCode}`;
    const net = adj.debitAmount - adj.creditAmount;
    adjustmentMap.set(key, (adjustmentMap.get(key) ?? 0) + net);
  }

  // Apply adjustments to entries
  const result: ConsolidationGLEntry[] = [];
  const processedKeys = new Set<string>();

  for (const entry of allEntries) {
    const key = `${entry.entityId}:${entry.accountCode}`;
    const adj = adjustmentMap.get(key) ?? 0;
    const newAmount = entry.amount + adj;

    if (Math.abs(newAmount) > 0.001) {
      result.push({ ...entry, amount: newAmount });
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
        amount: adj.debitAmount - adj.creditAmount,
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        entityId: adj.entityId,
      });
    }
  }

  return result;
}

// --- Sum by category ---

function sumByCategory(entries: ConsolidationGLEntry[], category: AccountCategory): number {
  return entries
    .filter((e) => getAccountCategory(e.accountCode) === category)
    .reduce((sum, e) => sum + e.amount, 0);
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

  // Calculate totals
  const totalAssets = sumByCategory(consolidatedEntries, 'asset');
  const totalLiabilities = sumByCategory(consolidatedEntries, 'liability');
  const totalEquity = sumByCategory(consolidatedEntries, 'equity');
  const totalRevenue = sumByCategory(consolidatedEntries, 'revenue');
  const totalExpenses = sumByCategory(consolidatedEntries, 'expense');
  const netIncome = totalRevenue + totalExpenses;

  const balanceCheck = totalAssets + totalLiabilities + totalEquity + minorityInterest;
  const isBalanced = Math.abs(balanceCheck) < 0.01;

  postProgress(5, 5);

  return {
    consolidatedEntries,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalRevenue,
    totalExpenses,
    netIncome,
    isBalanced,
    imbalanceAmount: balanceCheck,
    eliminationCount: eliminationResult.count,
    minorityInterest,
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
