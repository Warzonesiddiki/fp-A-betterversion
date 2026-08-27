// =============================================================================
// WEB WORKER MESSAGE TYPES
// Shared type definitions for worker communication
// =============================================================================

/** Base message envelope for all worker communication */
export interface WorkerMessage<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly payload: T;
}

/** Worker response envelope */
export interface WorkerResponse<T = unknown> {
  readonly id: string;
  readonly type: 'result' | 'error' | 'progress';
  readonly payload?: T;
  readonly error?: string;
  readonly progress?: WorkerProgress;
}

/** Progress reporting during long computations */
export interface WorkerProgress {
  readonly processed: number;
  readonly total: number;
  readonly percent: number;
}

// =============================================================================
// MONTE CARLO TYPES
// =============================================================================

export interface MonteCarloDistribution {
  readonly name: string;
  readonly type: 'normal' | 'uniform' | 'triangular';
  readonly mean?: number;
  readonly stdDev?: number;
  readonly min?: number;
  readonly max?: number;
  readonly mode?: number;
}

export interface MonteCarloRequest {
  readonly assumptions: MonteCarloDistribution[];
  readonly iterations: number;
  readonly seed?: number;
}

export interface MonteCarloResultItem {
  readonly iteration: number;
  readonly values: Record<string, number>;
  readonly output: number;
}

export interface MonteCarloResponse {
  readonly results: MonteCarloResultItem[];
  readonly statistics: {
    readonly mean: number;
    readonly stdDev: number;
    readonly min: number;
    readonly max: number;
    readonly p5: number;
    readonly p25: number;
    readonly p50: number;
    readonly p75: number;
    readonly p95: number;
  };
}

// =============================================================================
// CONSOLIDATION TYPES
// =============================================================================

export interface ConsolidationGLEntry {
  readonly id: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly amount: number;
  readonly currency: string;
  readonly date: string;
  readonly entityId: string;
  readonly debit?: number;
  readonly credit?: number;
}

export interface ConsolidationEntityData {
  readonly entityId: string;
  readonly entityName: string;
  readonly currency: string;
  readonly entries: ConsolidationGLEntry[];
  readonly isVIE?: boolean;
  readonly isForeign?: boolean;
  readonly functionalCurrency?: string;
}

export interface ConsolidationOwnership {
  readonly parentId: string;
  readonly childId: string;
  readonly ownershipPct: number;
  readonly method: 'full' | 'equity' | 'cost';
  readonly acquisitionDate?: string;
  readonly acquisitionCost?: number;
  readonly bookValueAtAcquisition?: number;
}

export interface ConsolidationICPair {
  readonly fromEntityId: string;
  readonly toEntityId: string;
  readonly accountCode: string;
  readonly toAccountCode?: string;
  readonly amount: number;
  readonly type:
    | 'receivable'
    | 'payable'
    | 'revenue'
    | 'expense'
    | 'investment'
    | 'dividend'
    | 'loan';
}

export interface ConsolidationFXRate {
  readonly fromCurrency: string;
  readonly toCurrency: string;
  readonly rate: number;
  readonly rateType: 'spot' | 'average' | 'historical';
  readonly date: string;
}

export interface ConsolidationAdjustment {
  readonly accountCode: string;
  readonly accountName: string;
  readonly entityId: string;
  readonly debitAmount: number;
  readonly creditAmount: number;
  readonly description: string;
  readonly type: 'goodwill' | 'fair_value' | 'amortization' | 'push_down' | 'other';
}

export interface ConsolidationRequest {
  readonly entities: ConsolidationEntityData[];
  readonly ownerships: ConsolidationOwnership[];
  readonly icPairs?: ConsolidationICPair[];
  readonly fxRates?: ConsolidationFXRate[];
  readonly adjustments?: ConsolidationAdjustment[];
}

export interface ConsolidationResponse {
  readonly consolidatedEntries: ConsolidationGLEntry[];
  readonly totalAssets: number;
  readonly totalLiabilities: number;
  readonly totalEquity: number;
  readonly totalRevenue: number;
  readonly totalExpenses: number;
  readonly netIncome: number;
  readonly isBalanced: boolean;
  readonly imbalanceAmount: number;
  readonly eliminationCount: number;
  readonly minorityInterest: number;
}

// =============================================================================
// BATCH CALCULATION TYPES
// =============================================================================

export interface BatchCellIdentifier {
  readonly sheet: string;
  readonly col: string;
  readonly row: number;
}

export interface BatchCalcDependency {
  readonly cell: BatchCellIdentifier;
  readonly dependsOn: BatchCellIdentifier[];
}

export interface BatchCalcRequest {
  readonly cells: BatchCellIdentifier[];
  readonly dependencies: BatchCalcDependency[];
  readonly formulas: Record<string, string>;
  readonly values: Record<string, number>;
  readonly maxIterations?: number;
  readonly convergenceThreshold?: number;
}

export interface BatchCalcResponse {
  readonly updatedValues: Record<string, number>;
  readonly dirtyCells: string[];
  readonly affectedCells: string[];
  readonly iterationCount: number;
  readonly converged: boolean;
  /** Cell keys whose formula failed to evaluate (W6-P0-01). Their prior value is preserved. */
  readonly errors?: string[];
}
