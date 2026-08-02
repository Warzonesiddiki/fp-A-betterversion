import type { GLEntry } from '@/types';
import { MissingFXRateError } from './FXEngine';
import { toCents, formatMoney } from '@/utils/money';

// =============================================================================
// CONSOLIDATION ENGINE — ASC 810 Compliant
// Pure TypeScript, deterministic, testable
// =============================================================================

// --- Type Definitions ---

export type ConsolidationMethod = 'full' | 'equity' | 'cost';
export type AccountCategory = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface EntityData {
  entityId: string;
  entityName: string;
  currency: string;
  entries: GLEntry[];
  isVIE?: boolean;
  isForeign?: boolean;
  functionalCurrency?: string;
}

export interface OwnershipStructure {
  parentId: string;
  childId: string;
  ownershipPct: number;
  method: ConsolidationMethod;
  acquisitionDate?: string;
  acquisitionCost?: number;
  bookValueAtAcquisition?: number;
}

export interface ICPair {
  fromEntityId: string;
  toEntityId: string;
  accountCode: string;
  toAccountCode?: string; // Account code on the TO entity (defaults to accountCode if omitted)
  amount: number;
  type: 'receivable' | 'payable' | 'revenue' | 'expense' | 'investment' | 'dividend' | 'loan';
}

export interface EliminationEntry {
  fromEntityId: string;
  toEntityId: string;
  accountCode: string;
  accountName: string;
  eliminatedAmount: number;
  debitAmount: number;
  creditAmount: number;
  description: string;
  type:
    | 'ic_receivable'
    | 'ic_payable'
    | 'ic_revenue'
    | 'ic_expense'
    | 'ic_investment'
    | 'ic_dividend'
    | 'ic_loan'
    | 'auto';
}

export interface ConsolidationAdjustment {
  accountCode: string;
  accountName: string;
  entityId: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
  type: 'goodwill' | 'fair_value' | 'amortization' | 'push_down' | 'other';
}

export interface GoodwillCalculation {
  acquisitionCost: number;
  bookValueAtAcquisition: number;
  fairValueAdjustments: number;
  minorityInterestAtAcquisition: number;
  goodwill: number;
  amortizationPerYear: number;
  accumulatedAmortization: number;
  netGoodwill: number;
}

export interface MinorityInterestDetail {
  entityId: string;
  entityName: string;
  ownershipPct: number;
  minorityPct: number;
  beginningBalance: number;
  netIncome: number;
  dividends: number;
  otherAdjustments: number;
  endingBalance: number;
}

export interface ConsolidationWorksheet {
  parentEntries: GLEntry[];
  subsidiaryEntries: GLEntry[];
  combinedEntries: GLEntry[];
  eliminations: EliminationEntry[];
  adjustments: ConsolidationAdjustment[];
  consolidatedEntries: GLEntry[];
  minorityInterest: MinorityInterestDetail[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  isBalanced: boolean;
  imbalanceAmount: number;
}

/** A single blocking consolidation failure, surfaced to the user (F-0003). */
export interface ConsolidationFailure {
  stage: string;
  message: string;
  entityId?: string;
  cause?: string;
}

export interface ConsolidatedResult {
  consolidatedEntries: GLEntry[];
  eliminations: EliminationEntry[];
  adjustments: ConsolidationAdjustment[];
  minorityInterest: number;
  minorityInterestDetails: MinorityInterestDetail[];
  totalEquity: number;
  totalAssets: number;
  totalLiabilities: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  goodwill: number;
  isBalanced: boolean;
  imbalanceAmount: number;
  worksheet: ConsolidationWorksheet;
  /**
   * F-0003: 'failed' means one or more stages threw. A failed result NEVER
   * claims isBalanced. UI must render a blocking failure state, not a clean
   * zero report.
   */
  status: 'success' | 'failed';
  errors: ConsolidationFailure[];
  /**
   * F-0009: balance tolerance applied, in cents of the reporting currency.
   * Default 0 = cent-exact. Disclosed here so reports can print it.
   */
  balanceToleranceCents: number;
}

/**
 * Thrown by consolidateOrThrow when any consolidation stage fails.
 * Carries stage/entity/cause context (F-0003).
 */
export class ConsolidationFailedError extends Error {
  readonly failures: ConsolidationFailure[];

  constructor(failures: ConsolidationFailure[]) {
    super(
      `Consolidation failed (${failures.length} blocking issue(s)): ` +
        failures.map((f) => `[${f.stage}] ${f.message}`).join('; ')
    );
    this.name = 'ConsolidationFailedError';
    this.failures = failures;
  }
}

export interface FXRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateType: 'spot' | 'average' | 'historical';
  date: string;
}

export interface VIENotification {
  entityId: string;
  isPrimaryBeneficiary: boolean;
  variableInterests: string[];
  power: string;
  economics: string;
}

export interface EffectiveOwnership {
  entityId: string;
  effectivePct: number;
}

export interface EntityHierarchyNode {
  entityId: string;
  entityName: string;
  ownershipPct: number;
  effectivePct: number;
  method: ConsolidationMethod;
  children: EntityHierarchyNode[];
}

// --- Account Category Mapping ---

const ACCOUNT_CATEGORY_MAP: Record<string, AccountCategory> = {
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
  const prefix = accountCode.charAt(0);
  return ACCOUNT_CATEGORY_MAP[prefix] ?? 'expense';
}

// =============================================================================
// CONSOLIDATION ENGINE
// =============================================================================

export class ConsolidationEngine {
  /**
   * Main consolidation entry point — ASC 810 compliant
   */
  static consolidate(
    entities: EntityData[],
    ownerships: OwnershipStructure[],
    icPairs: ICPair[] = [],
    fxRates: FXRate[] = [],
    adjustments: ConsolidationAdjustment[] = [],
    vieNotifications: VIENotification[] = [],
    options: { balanceToleranceCents?: number } = {}
  ): ConsolidatedResult {
    // F-0009: default is cent-exact (0 cents tolerance). Callers needing a
    // tolerance must pass it explicitly; it is disclosed on the result.
    const balanceToleranceCents = options.balanceToleranceCents ?? 0;
    // Input validation
    if (!Array.isArray(entities)) {
      throw new Error('entities must be an array');
    }
    if (!Array.isArray(ownerships)) {
      throw new Error('ownerships must be an array');
    }
    if (entities.length === 0) {
      // F-0003: a neutral empty result must not claim to be balanced.
      return this.failedResult(
        [{ stage: 'validation', message: 'No entities provided for consolidation' }],
        balanceToleranceCents
      );
    }
    for (const entity of entities) {
      if (!entity.entityId || typeof entity.entityId !== 'string') {
        throw new Error('Each entity must have a non-empty entityId');
      }
      if (!entity.entityName || typeof entity.entityName !== 'string') {
        throw new Error(`Entity "${entity.entityId}" must have a non-empty entityName`);
      }
      if (!entity.currency || !/^[A-Z]{3}$/.test(entity.currency)) {
        throw new Error(`Entity "${entity.entityId}" must have a valid 3-letter currency code`);
      }
      if (!Array.isArray(entity.entries)) {
        throw new Error(`Entity "${entity.entityId}" must have an entries array`);
      }
    }
    for (const ownership of ownerships) {
      if (!ownership.parentId || !ownership.childId) {
        throw new Error('Ownership must have parentId and childId');
      }
      if (ownership.parentId === ownership.childId) {
        throw new Error(
          `Ownership: parentId and childId cannot be the same (${ownership.parentId})`
        );
      }
      if (
        typeof ownership.ownershipPct !== 'number' ||
        ownership.ownershipPct < 0 ||
        ownership.ownershipPct > 100
      ) {
        throw new Error(
          `Ownership percentage must be between 0 and 100, got ${ownership.ownershipPct}`
        );
      }
      const validMethods = ['full', 'equity', 'cost'];
      if (!validMethods.includes(ownership.method)) {
        throw new Error(
          `Ownership method must be one of: ${validMethods.join(', ')}, got "${ownership.method}"`
        );
      }
    }

    try {
      // Step 0: Calculate effective ownership percentages for the hierarchy
      const parentId = entities[0]!.entityId;
      const effectiveOwnershipMap = this.calculateEffectiveOwnership(parentId, ownerships);

      // Step 1: Translate foreign subsidiaries to reporting currency
      const translatedEntities = this.translateForeignSubsidiaries(entities, fxRates);

      // Step 2: Build entity maps
      const entityMap = new Map<string, EntityData>();
      for (const entity of translatedEntities) {
        entityMap.set(entity.entityId, entity);
      }

      // Step 3: Separate parent and subsidiary entries
      const parentEntity = translatedEntities[0]; // First entity is parent
      const subsidiaryEntities = translatedEntities.slice(1);

      // Step 4: Combine all entries
      const allEntries: GLEntry[] = [];
      for (const entity of translatedEntities) {
        allEntries.push(...entity.entries);
      }

      // Step 5: Eliminate intercompany transactions
      const eliminations = this.eliminateIntercompany(allEntries, icPairs, ownerships, entityMap);

      // Step 6: Calculate minority interest for each subsidiary
      const minorityInterestDetails = this.calculateMinorityInterestDetails(
        subsidiaryEntities,
        ownerships,
        entityMap,
        effectiveOwnershipMap
      );

      // Step 7: Calculate goodwill for acquisitions
      const goodwillCalculations = this.calculateGoodwill(ownerships, entityMap);

      // Step 8: Process VIE consolidations
      const vieEliminations = this.processVIEConsolidation(
        translatedEntities,
        ownerships,
        vieNotifications,
        entityMap
      );
      eliminations.push(...vieEliminations);

      // Step 9: Build consolidation adjustments
      const allAdjustments = [
        ...adjustments,
        ...this.buildGoodwillAdjustments(goodwillCalculations, ownerships),
      ];

      // Step 10: Apply eliminations and adjustments to entries
      const consolidatedEntries = this.applyEliminationsAndAdjustments(
        allEntries,
        eliminations,
        allAdjustments
      );

      // Step 11: Calculate totals
      const totalAssets = this.sumByCategory(consolidatedEntries, 'asset');
      const totalLiabilities = this.sumByCategory(consolidatedEntries, 'liability');
      const totalEquity = this.sumByCategory(consolidatedEntries, 'equity');
      const totalRevenue = this.sumByCategory(consolidatedEntries, 'revenue');
      const totalExpenses = this.sumByCategory(consolidatedEntries, 'expense');
      const netIncome = totalRevenue + totalExpenses; // expenses are negative

      // Step 12: Add minority interest to equity
      const totalMinorityInterest = minorityInterestDetails.reduce(
        (sum, mi) => sum + mi.endingBalance,
        0
      );

      // Step 13: Verify balance (Assets + Liabilities + Equity + Minority Interest = 0)
      // Liabilities and equity are stored as negative (credit) balances.
      // F-0009: cent-exact by default (no hardcoded hidden $0.01 slack);
      // imbalance is rounded to cents before comparing to the tolerance.
      const balanceCheck = totalAssets + totalLiabilities + totalEquity + totalMinorityInterest;
      // Exact cents via the canonical money primitive (F-0006/F-0009).
      const imbalanceCents = toCents(balanceCheck);
      const isBalanced = Math.abs(imbalanceCents) <= balanceToleranceCents;
      const imbalanceAmount = balanceCheck;

      // Step 14: Calculate total goodwill
      const totalGoodwill = goodwillCalculations.reduce((sum, gw) => sum + gw.netGoodwill, 0);

      // Step 15: Build worksheet
      const worksheet = this.buildWorksheet(
        parentEntity,
        subsidiaryEntities,
        allEntries,
        eliminations,
        allAdjustments,
        consolidatedEntries,
        minorityInterestDetails,
        totalAssets,
        totalLiabilities,
        totalEquity + totalMinorityInterest,
        totalRevenue,
        totalExpenses,
        netIncome,
        isBalanced,
        imbalanceAmount
      );

      return {
        consolidatedEntries,
        eliminations,
        adjustments: allAdjustments,
        minorityInterest: totalMinorityInterest,
        minorityInterestDetails,
        totalEquity: totalEquity + totalMinorityInterest,
        totalAssets,
        totalLiabilities,
        totalRevenue,
        totalExpenses,
        netIncome,
        goodwill: totalGoodwill,
        isBalanced,
        imbalanceAmount,
        worksheet,
        status: 'success',
        errors: [],
        balanceToleranceCents,
      };
    } catch (error) {
      // F-0003: NEVER return a balanced zero result after an exception.
      // Aggregate a blocking, user-visible failure list instead.
      const stage =
        error instanceof MissingFXRateError
          ? 'fx-translation'
          : error instanceof Error && error.name === 'InvalidFinancialInputError'
            ? 'validation'
            : 'consolidation';
      const failure: ConsolidationFailure = {
        stage,
        message: error instanceof Error ? error.message : String(error),
        cause: error instanceof Error ? error.name : typeof error,
      };
      return this.failedResult([failure], balanceToleranceCents);
    }
  }

  /**
   * Strict variant: consolidates and throws ConsolidationFailedError when
   * any stage failed or the result does not balance within the configured
   * tolerance. For callers that must not continue with a failed result.
   */
  static consolidateOrThrow(
    ...args: Parameters<typeof ConsolidationEngine.consolidate>
  ): ConsolidatedResult {
    const result = ConsolidationEngine.consolidate(...args);
    if (result.status === 'failed') {
      throw new ConsolidationFailedError(result.errors);
    }
    if (!result.isBalanced) {
      throw new ConsolidationFailedError([
        {
          stage: 'balance-check',
          message: `Consolidated statements do not balance. Imbalance: ${formatMoney(result.imbalanceAmount)}`,
        },
      ]);
    }
    return result;
  }

  /**
   * Calculate effective ownership across a recursive hierarchy
   * A -> B (80%), B -> C (50%) => A -> C (40%)
   */
  static calculateEffectiveOwnership(
    rootParentId: string,
    ownerships: OwnershipStructure[]
  ): Map<string, number> {
    const effectiveOwnerships = new Map<string, number>();
    effectiveOwnerships.set(rootParentId, 100);

    const queue: { entityId: string; currentPct: number }[] = [
      { entityId: rootParentId, currentPct: 100 },
    ];

    const visited = new Set<string>();

    while (queue.length > 0) {
      const item = queue.shift()!;
      // Cycle guard: a cyclic ownership graph must not loop forever.
      if (visited.has(item.entityId)) continue;
      visited.add(item.entityId);
      const { entityId, currentPct } = item;

      // Find direct children
      const directOwnerships = ownerships.filter((o) => o.parentId === entityId);

      for (const ownership of directOwnerships) {
        const childId = ownership.childId;
        const effectivePct = (currentPct * ownership.ownershipPct) / 100;

        const currentEffective = effectiveOwnerships.get(childId) ?? 0;
        effectiveOwnerships.set(childId, currentEffective + effectivePct);

        // Continue traversal
        queue.push({ entityId: childId, currentPct: effectivePct });
      }
    }

    return effectiveOwnerships;
  }

  /**
   * Build a recursive hierarchy tree
   */
  static getHierarchyTree(
    rootParentId: string,
    ownerships: OwnershipStructure[],
    entities: EntityData[],
    effectiveMap?: Map<string, number>
  ): EntityHierarchyNode {
    const effectiveOwnerships =
      effectiveMap ?? this.calculateEffectiveOwnership(rootParentId, ownerships);
    const entityLookup = new Map(entities.map((e) => [e.entityId, e]));

    const buildNode = (entityId: string, ownershipPct: number): EntityHierarchyNode => {
      const entity = entityLookup.get(entityId);
      const children = ownerships
        .filter((o) => o.parentId === entityId)
        .map((o) => buildNode(o.childId, o.ownershipPct));

      return {
        entityId,
        entityName: entity?.entityName ?? entityId,
        ownershipPct,
        effectivePct: effectiveOwnerships.get(entityId) ?? 0,
        method: ownerships.find((o) => o.childId === entityId)?.method ?? 'full',
        children,
      };
    };

    return buildNode(rootParentId, 100);
  }

  /**
   * Eliminate intercompany transactions — ASC 810 requires full elimination
   */
  static eliminateIntercompany(
    entries: GLEntry[],
    icPairs: ICPair[],
    _ownerships: OwnershipStructure[] = [],
    entityMap: Map<string, EntityData> = new Map()
  ): EliminationEntry[] {
    const eliminations: EliminationEntry[] = [];
    const processedPairs = new Set<string>();

    // Process manual IC pairs
    for (const pair of icPairs) {
      const pairKey = `${pair.fromEntityId}:${pair.toEntityId}:${pair.accountCode}`;
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const elimination = this.createEliminationEntry(pair, entries, entityMap);
      if (elimination) {
        eliminations.push(elimination);
      }
    }

    // Auto-detect IC accounts (prefix '9')
    const icAccounts = new Set(
      entries.filter((e) => e.accountCode.startsWith('9')).map((e) => e.accountCode)
    );

    for (const accountCode of icAccounts) {
      const accountEntries = entries.filter((e) => e.accountCode === accountCode);
      const entityBalances = new Map<string, number>();

      for (const entry of accountEntries) {
        const entityId = entry.entityId ?? 'unknown';
        entityBalances.set(entityId, (entityBalances.get(entityId) ?? 0) + entry.amount);
      }

      // Eliminate across entities
      const entityIds = Array.from(entityBalances.keys());
      for (let i = 0; i < entityIds.length; i++) {
        for (let j = i + 1; j < entityIds.length; j++) {
          const fromId = entityIds[i]!;
          const toId = entityIds[j]!;
          const fromBalance = entityBalances.get(fromId) ?? 0;
          const toBalance = entityBalances.get(toId) ?? 0;

          if (fromBalance !== 0 && toBalance !== 0) {
            const matchedAmount = Math.min(Math.abs(fromBalance), Math.abs(toBalance));
            const direction = fromBalance > 0 ? -1 : 1;
            const eliminate = matchedAmount * direction;

            if (eliminate !== 0) {
              const autoPairKey = `${fromId}:${toId}:${accountCode}`;
              if (!processedPairs.has(autoPairKey)) {
                processedPairs.add(autoPairKey);
                eliminations.push({
                  fromEntityId: fromId,
                  toEntityId: toId,
                  accountCode,
                  accountName: this.getAccountName(entries, accountCode),
                  eliminatedAmount: eliminate,
                  debitAmount: eliminate > 0 ? eliminate : 0,
                  creditAmount: eliminate < 0 ? Math.abs(eliminate) : 0,
                  description: `Auto-elimination of IC account ${accountCode}`,
                  type: 'auto',
                });
              }
            }
          }
        }
      }
    }

    return eliminations;
  }

  /**
   * Calculate minority interest details for each subsidiary — ASC 810 net income method
   * Updated to support recursive hierarchies using effective ownership
   */
  static calculateMinorityInterestDetails(
    subsidiaries: EntityData[],
    ownerships: OwnershipStructure[],
    _entityMap: Map<string, EntityData>,
    effectiveOwnershipMap?: Map<string, number>
  ): MinorityInterestDetail[] {
    const details: MinorityInterestDetail[] = [];

    // Use effective ownership map if provided, otherwise default to direct ownership for simple cases
    const effMap = effectiveOwnershipMap ?? new Map();

    for (const subsidiary of subsidiaries) {
      const entityId = subsidiary.entityId;

      // Find the method for this subsidiary
      const directOwnership = ownerships.find((o) => o.childId === entityId);
      if (!directOwnership || directOwnership.method !== 'full') continue;

      // Effective ownership by the root parent
      const effectivePct = effMap.get(entityId) ?? directOwnership.ownershipPct;
      const minorityPct = 100 - effectivePct;

      if (minorityPct <= 0) continue;

      // Calculate net income from subsidiary entries
      const revenue = subsidiary.entries
        .filter((e) => getAccountCategory(e.accountCode) === 'revenue')
        .reduce((sum, e) => sum + e.amount, 0);

      const expenses = subsidiary.entries
        .filter((e) => getAccountCategory(e.accountCode) === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);

      const netIncome = revenue + expenses; // expenses are negative

      // Calculate dividends
      const dividends = subsidiary.entries
        .filter(
          (e) =>
            e.accountCode.startsWith('3') &&
            e.amount < 0 &&
            (e.accountName?.toLowerCase().includes('dividend') ?? false)
        )
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);

      // Minority interest = minority % × (net income - dividends)
      const minorityShare = (minorityPct / 100) * (netIncome - dividends);

      details.push({
        entityId: entityId,
        entityName: subsidiary.entityName,
        ownershipPct: effectivePct,
        minorityPct,
        beginningBalance: 0,
        netIncome: (minorityPct / 100) * netIncome,
        dividends: (minorityPct / 100) * dividends,
        otherAdjustments: 0,
        endingBalance: minorityShare,
      });
    }

    return details;
  }

  /**
   * Calculate minority interest (simple version for backward compatibility)
   */
  static calculateMinorityInterest(netIncome: number, ownershipPct: number): number {
    const pct = Math.min(100, Math.max(0, ownershipPct));
    return netIncome * (1 - pct / 100);
  }

  /**
   * Calculate goodwill for acquisitions — ASC 805
   */
  static calculateGoodwill(
    ownerships: OwnershipStructure[],
    entityMap: Map<string, EntityData>
  ): GoodwillCalculation[] {
    const calculations: GoodwillCalculation[] = [];

    for (const ownership of ownerships) {
      if (!ownership.acquisitionCost || !ownership.bookValueAtAcquisition) continue;

      const subsidiary = entityMap.get(ownership.childId);
      if (!subsidiary) continue;

      const minorityPct = (100 - ownership.ownershipPct) / 100;
      const fairValueAdjustments = 0; // Would need fair value data

      // Goodwill = Acquisition Cost - (Book Value × Ownership %) - Fair Value Adjustments
      const goodwill =
        ownership.acquisitionCost -
        ownership.bookValueAtAcquisition * (ownership.ownershipPct / 100) -
        fairValueAdjustments;

      // Amortize over 10 years (simplified — goodwill is actually not amortized under ASC 350,
      // but we provide the calculation for impairment testing)
      const amortizationPerYear = goodwill > 0 ? goodwill / 10 : 0;
      const accumulatedAmortization = 0; // Would need acquisition date

      calculations.push({
        acquisitionCost: ownership.acquisitionCost,
        bookValueAtAcquisition: ownership.bookValueAtAcquisition,
        fairValueAdjustments,
        minorityInterestAtAcquisition: ownership.bookValueAtAcquisition * minorityPct,
        goodwill,
        amortizationPerYear,
        accumulatedAmortization,
        netGoodwill: goodwill - accumulatedAmortization,
      });
    }

    return calculations;
  }

  /**
   * Process VIE consolidation — ASC 810-10
   */
  static processVIEConsolidation(
    entities: EntityData[],
    _ownerships: OwnershipStructure[],
    vieNotifications: VIENotification[],
    entityMap: Map<string, EntityData>
  ): EliminationEntry[] {
    const eliminations: EliminationEntry[] = [];

    for (const vie of vieNotifications) {
      if (!vie.isPrimaryBeneficiary) continue;

      const vieEntity = entityMap.get(vie.entityId);
      if (!vieEntity) continue;

      // VIE entities are fully consolidated by the primary beneficiary
      // The elimination entries are similar to full consolidation
      // but ownership percentage may not apply

      // Create investment elimination
      const investmentEntries = entities[0]?.entries.filter(
        (e) =>
          e.accountCode.startsWith('1') &&
          (e.accountName?.toLowerCase().includes('investment') ?? false) &&
          e.amount > 0
      );

      if (investmentEntries && investmentEntries.length > 0) {
        const totalInvestment = investmentEntries.reduce((sum, e) => sum + e.amount, 0);
        eliminations.push({
          fromEntityId: entities[0]!.entityId,
          toEntityId: vie.entityId,
          accountCode: investmentEntries[0]!.accountCode,
          accountName: 'Investment in VIE',
          eliminatedAmount: -totalInvestment,
          debitAmount: 0,
          creditAmount: totalInvestment,
          description: `Elimination of investment in VIE ${vie.entityId}`,
          type: 'ic_investment',
        });
      }
    }

    return eliminations;
  }

  /**
   * Translate foreign subsidiaries — ASC 830
   */
  /**
   * Translate foreign subsidiaries — ASC 830.
   * F-0001/F-0003: a missing rate NEVER falls back to 1 (silent misstatement)
   * and foreign entities are NEVER silently left untranslated. Missing rates
   * throw MissingFXRateError with entity/account context; callers aggregate
   * them into the blocking failure list on the result.
   */
  static translateForeignSubsidiaries(entities: EntityData[], fxRates: FXRate[]): EntityData[] {
    const foreignEntities = entities.filter((e) => e.isForeign && e.currency !== 'USD');
    if (fxRates.length === 0) {
      if (foreignEntities.length > 0) {
        throw new MissingFXRateError(
          foreignEntities[0]!.currency,
          'USD',
          undefined,
          `fx-translation: no FX rates loaded but ${foreignEntities.length} foreign ` +
            `entity(ies) require translation (${foreignEntities.map((e) => e.entityId).join(', ')})`
        );
      }
      return entities;
    }

    const rateMap = new Map<string, FXRate>();
    for (const rate of fxRates) {
      const key = `${rate.fromCurrency}:${rate.toCurrency}:${rate.rateType}`;
      rateMap.set(key, rate);
    }

    return entities.map((entity) => {
      if (!entity.isForeign || entity.currency === 'USD') return entity;

      // Assets and liabilities: closing rate
      // Revenue and expenses: average rate
      // Equity: historical rate
      const closingRate = rateMap.get(`${entity.currency}:USD:spot`);
      const averageRate = rateMap.get(`${entity.currency}:USD:average`);
      const historicalRate = rateMap.get(`${entity.currency}:USD:historical`);

      if (!closingRate && !averageRate && !historicalRate) {
        throw new MissingFXRateError(
          entity.currency,
          'USD',
          undefined,
          `fx-translation: entity ${entity.entityId} has no spot/average/historical rates`
        );
      }

      const translatedEntries = entity.entries.map((entry) => {
        const category = getAccountCategory(entry.accountCode);
        let rateEntry: FXRate | undefined;
        let requiredType: 'spot' | 'average' | 'historical';

        switch (category) {
          case 'asset':
          case 'liability':
            requiredType = 'spot';
            rateEntry = closingRate;
            break;
          case 'revenue':
          case 'expense':
            requiredType = 'average';
            rateEntry = averageRate;
            break;
          case 'equity':
            requiredType = 'historical';
            rateEntry = historicalRate;
            break;
          default:
            requiredType = 'spot';
            rateEntry = closingRate;
        }
        if (!rateEntry || !Number.isFinite(rateEntry.rate)) {
          throw new MissingFXRateError(
            entity.currency,
            'USD',
            undefined,
            `fx-translation: entity ${entity.entityId} account ${entry.accountCode} ` +
              `requires ${requiredType} rate`
          );
        }
        const rate = rateEntry.rate;

        return {
          ...entry,
          amount: entry.amount * rate,
          currency: 'USD',
        };
      });

      return {
        ...entity,
        entries: translatedEntries,
        currency: 'USD',
        isForeign: false, // Already translated
      };
    });
  }

  /**
   * Build consolidation worksheet — full transparency
   */
  static buildWorksheet(
    parent: EntityData | undefined,
    subsidiaries: EntityData[],
    allEntries: GLEntry[],
    eliminations: EliminationEntry[],
    adjustments: ConsolidationAdjustment[],
    consolidatedEntries: GLEntry[],
    minorityInterest: MinorityInterestDetail[],
    totalAssets: number,
    totalLiabilities: number,
    totalEquity: number,
    totalRevenue: number,
    totalExpenses: number,
    netIncome: number,
    isBalanced: boolean,
    imbalanceAmount: number
  ): ConsolidationWorksheet {
    return {
      parentEntries: parent?.entries ?? [],
      subsidiaryEntries: subsidiaries.flatMap((s) => s.entries),
      combinedEntries: allEntries,
      eliminations,
      adjustments,
      consolidatedEntries,
      minorityInterest,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      netIncome,
      isBalanced,
      imbalanceAmount,
    };
  }

  /**
   * Get intercompany balance between two entities
   */
  static getICBalance(
    entries: GLEntry[],
    fromEntityId: string,
    toEntityId: string,
    accountCode: string
  ): { fromBalance: number; toBalance: number; netBalance: number } {
    const fromEntries = entries.filter(
      (e) => e.entityId === fromEntityId && e.accountCode === accountCode
    );
    const toEntries = entries.filter(
      (e) => e.entityId === toEntityId && e.accountCode === accountCode
    );

    const fromBalance = fromEntries.reduce((sum, e) => sum + e.amount, 0);
    const toBalance = toEntries.reduce((sum, e) => sum + e.amount, 0);

    return {
      fromBalance,
      toBalance,
      netBalance: fromBalance + toBalance,
    };
  }

  /**
   * Validate consolidation — check all rules are met
   */
  static validate(result: ConsolidatedResult): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // F-0003: a failed consolidation is never valid, regardless of numbers.
    if (result.status === 'failed') {
      for (const failure of result.errors) {
        errors.push(`Consolidation failed at ${failure.stage}: ${failure.message}`);
      }
      return { valid: false, errors };
    }

    // Check balance
    if (!result.isBalanced) {
      errors.push(
        `Consolidation does not balance. Imbalance: ${formatMoney(result.imbalanceAmount)}`
      );
    }

    // Check all eliminations are complete
    for (const elimination of result.eliminations) {
      if (elimination.debitAmount !== 0 && elimination.creditAmount !== 0) {
        // Each elimination should be either a debit or credit, not both
        if (elimination.debitAmount > 0 && elimination.creditAmount > 0) {
          errors.push(
            `Elimination for ${elimination.accountCode} has both debit and credit amounts`
          );
        }
      }
    }

    // Check minority interest calculation
    for (const mi of result.minorityInterestDetails) {
      if (mi.minorityPct < 0 || mi.minorityPct > 100) {
        errors.push(`Invalid minority percentage for ${mi.entityId}: ${mi.minorityPct}%`);
      }
      // Simplified check — the minority interest should be non-zero for non-100% ownership
      if (mi.ownershipPct < 100 && mi.endingBalance === 0) {
        errors.push(
          `Minority interest for ${mi.entityId} is zero despite ${mi.minorityPct}% minority ownership`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // --- Private Helpers ---

  /**
   * F-0003: the ONLY neutral result this engine produces is a FAILED result.
   * It never reports isBalanced: true on zeros. Callers/UI must render the
   * blocking failure list, not a clean empty report.
   */
  private static failedResult(
    failures: ConsolidationFailure[],
    balanceToleranceCents = 0
  ): ConsolidatedResult {
    return {
      consolidatedEntries: [],
      eliminations: [],
      adjustments: [],
      minorityInterest: 0,
      minorityInterestDetails: [],
      totalEquity: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      goodwill: 0,
      isBalanced: false,
      imbalanceAmount: 0,
      worksheet: {
        parentEntries: [],
        subsidiaryEntries: [],
        combinedEntries: [],
        eliminations: [],
        adjustments: [],
        consolidatedEntries: [],
        minorityInterest: [],
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        isBalanced: false,
        imbalanceAmount: 0,
      },
      status: 'failed',
      errors: failures,
      balanceToleranceCents,
    };
  }

  private static createEliminationEntry(
    pair: ICPair,
    entries: GLEntry[],
    _entityMap: Map<string, EntityData>
  ): EliminationEntry | null {
    const fromEntries = entries.filter(
      (e) => e.entityId === pair.fromEntityId && e.accountCode === pair.accountCode
    );
    const fromAmount = fromEntries.reduce((sum, e) => sum + e.amount, 0);

    // Investment/dividend eliminations: eliminate parent's balance entirely against sub's equity
    if (pair.type === 'investment' || pair.type === 'dividend') {
      if (fromAmount === 0) return null;
      const eliminate = -fromAmount; // Negate to zero out the parent's account

      return {
        fromEntityId: pair.fromEntityId,
        toEntityId: pair.toEntityId,
        accountCode: pair.accountCode,
        accountName: this.getAccountName(entries, pair.accountCode),
        eliminatedAmount: eliminate,
        debitAmount: eliminate > 0 ? eliminate : 0,
        creditAmount: eliminate < 0 ? Math.abs(eliminate) : 0,
        description: `Elimination of IC ${pair.type} between ${pair.fromEntityId} and ${pair.toEntityId}`,
        type: this.getEliminationType(pair.type),
      };
    }

    // Standard elimination: match by account code
    const toAccountCode = pair.toAccountCode ?? pair.accountCode;
    const toEntries = entries.filter(
      (e) => e.entityId === pair.toEntityId && e.accountCode === toAccountCode
    );
    const toAmount = toEntries.reduce((sum, e) => sum + e.amount, 0);

    if (fromAmount === 0 && toAmount === 0) return null;

    const matchedAmount = Math.min(Math.abs(fromAmount), Math.abs(toAmount));
    const direction = fromAmount > 0 ? -1 : 1;
    const eliminate = matchedAmount * direction;

    if (eliminate === 0) return null;

    const eliminationType = this.getEliminationType(pair.type);

    return {
      fromEntityId: pair.fromEntityId,
      toEntityId: pair.toEntityId,
      accountCode: pair.accountCode,
      accountName: this.getAccountName(entries, pair.accountCode),
      eliminatedAmount: eliminate,
      debitAmount: eliminate > 0 ? eliminate : 0,
      creditAmount: eliminate < 0 ? Math.abs(eliminate) : 0,
      description: `Elimination of IC ${pair.type} between ${pair.fromEntityId} and ${pair.toEntityId}`,
      type: eliminationType,
    };
  }

  private static getEliminationType(pairType: ICPair['type']): EliminationEntry['type'] {
    switch (pairType) {
      case 'receivable':
        return 'ic_receivable';
      case 'payable':
        return 'ic_payable';
      case 'revenue':
        return 'ic_revenue';
      case 'expense':
        return 'ic_expense';
      case 'investment':
        return 'ic_investment';
      case 'dividend':
        return 'ic_dividend';
      case 'loan':
        return 'ic_loan';
      default:
        return 'auto';
    }
  }

  private static getAccountName(entries: GLEntry[], accountCode: string): string {
    const entry = entries.find((e) => e.accountCode === accountCode);
    return entry?.accountName ?? accountCode;
  }

  private static buildGoodwillAdjustments(
    goodwillCalculations: GoodwillCalculation[],
    ownerships: OwnershipStructure[]
  ): ConsolidationAdjustment[] {
    const adjustments: ConsolidationAdjustment[] = [];

    for (let i = 0; i < goodwillCalculations.length; i++) {
      const gw = goodwillCalculations[i];
      const ownership = ownerships[i];

      if (gw!.goodwill <= 0) continue;

      // Add goodwill as an asset
      adjustments.push({
        accountCode: '1800',
        accountName: 'Goodwill',
        entityId: ownership!.parentId,
        debitAmount: gw!.goodwill,
        creditAmount: 0,
        description: `Goodwill from acquisition of ${ownership!.childId}`,
        type: 'goodwill',
      });

      // Offset to investment elimination (already handled)
    }

    return adjustments;
  }

  private static applyEliminationsAndAdjustments(
    allEntries: GLEntry[],
    eliminations: EliminationEntry[],
    adjustments: ConsolidationAdjustment[]
  ): GLEntry[] {
    // Build adjustment map
    const adjustmentMap = new Map<string, number>();

    for (const elimination of eliminations) {
      const keyFrom = `${elimination.fromEntityId}:${elimination.accountCode}`;
      const keyTo = `${elimination.toEntityId}:${elimination.accountCode}`;
      adjustmentMap.set(keyFrom, (adjustmentMap.get(keyFrom) ?? 0) + elimination.eliminatedAmount);
      adjustmentMap.set(keyTo, (adjustmentMap.get(keyTo) ?? 0) - elimination.eliminatedAmount);
    }

    for (const adjustment of adjustments) {
      const key = `${adjustment.entityId}:${adjustment.accountCode}`;
      const netAdjustment = adjustment.debitAmount - adjustment.creditAmount;
      adjustmentMap.set(key, (adjustmentMap.get(key) ?? 0) + netAdjustment);
    }

    // Apply adjustments
    const result: GLEntry[] = [];
    const processedKeys = new Set<string>();

    for (const entry of allEntries) {
      const key = `${entry.entityId}:${entry.accountCode}`;
      const adjustment = adjustmentMap.get(key) ?? 0;
      const newAmount = entry.amount + adjustment;

      if (Math.abs(newAmount) > 0.001) {
        result.push({
          ...entry,
          amount: newAmount,
        });
      }

      processedKeys.add(key);
    }

    // Add adjustment-only entries (e.g., goodwill)
    for (const adjustment of adjustments) {
      const key = `${adjustment.entityId}:${adjustment.accountCode}`;
      if (!processedKeys.has(key) && (adjustment.debitAmount > 0 || adjustment.creditAmount > 0)) {
        result.push({
          id: `adj-${adjustment.accountCode}-${adjustment.entityId}`,
          accountId: adjustment.accountCode,
          accountCode: adjustment.accountCode,
          accountName: adjustment.accountName,
          period: '',
          periodName: '',
          debit: adjustment.debitAmount,
          credit: adjustment.creditAmount,
          netChange: adjustment.debitAmount - adjustment.creditAmount,
          date: new Date().toISOString().split('T')[0] ?? '',
          amount: adjustment.debitAmount - adjustment.creditAmount,
          description: '',
          reference: '',
          entityId: adjustment.entityId,
          currency: 'USD',
        });
      }
    }

    return result;
  }

  private static sumByCategory(entries: GLEntry[], category: AccountCategory): number {
    return entries
      .filter((e) => getAccountCategory(e.accountCode) === category)
      .reduce((sum, e) => sum + e.amount, 0);
  }
}
