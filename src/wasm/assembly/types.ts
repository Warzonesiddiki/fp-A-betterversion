// =============================================================================
// WASM ASSEMBLY TYPES
// Shared type definitions for WebAssembly modules
// =============================================================================

// Distribution types
export enum DistributionType {
  Uniform = 0,
  Normal = 1,
  Triangular = 2,
  LogNormal = 3,
  Beta = 4,
  Exponential = 5,
  Poisson = 6,
}

// Distribution configuration
export class DistributionConfig {
  name: string = '';
  type: DistributionType = DistributionType.Uniform;
  mean: f64 = 0.0;
  stdDev: f64 = 1.0;
  min: f64 = 0.0;
  max: f64 = 1.0;
  mode: f64 = 0.5;
  alpha: f64 = 2.0;
  betaParam: f64 = 5.0;
  lambda: f64 = 1.0;
}

// Monte Carlo request
export class MonteCarloRequest {
  assumptions: DistributionConfig[] = [];
  iterations: i32 = 10000;
  seed: i32 = 0;
  useSeed: bool = false;
}

// Monte Carlo result item
export class MonteCarloResultItem {
  iteration: i32 = 0;
  values: Map<string, f64> = new Map<string, f64>();
  output: f64 = 0.0;
}

// Statistics result
export class StatisticsResult {
  mean: f64 = 0.0;
  stdDev: f64 = 0.0;
  min: f64 = 0.0;
  max: f64 = 0.0;
  p5: f64 = 0.0;
  p25: f64 = 0.0;
  p50: f64 = 0.0;
  p75: f64 = 0.0;
  p95: f64 = 0.0;
  variance: f64 = 0.0;
  skewness: f64 = 0.0;
  kurtosis: f64 = 0.0;
}

// Monte Carlo response
export class MonteCarloResponse {
  results: MonteCarloResultItem[] = [];
  statistics: StatisticsResult = new StatisticsResult();
}

// Formula evaluation request
export class FormulaEvalRequest {
  formula: string = '';
  variables: Map<string, f64> = new Map<string, f64>();
}

// Formula evaluation response
export class FormulaEvalResponse {
  result: f64 = 0.0;
  error: string = '';
}

// Batch calculation request
export class BatchCalcRequest {
  formulas: Map<string, string> = new Map<string, string>();
  values: Map<string, f64> = new Map<string, f64>();
  dependencies: Map<string, string[]> = new Map<string, string[]>();
  cells: string[] = [];
  maxIterations: i32 = 100;
  convergenceThreshold: f64 = 1e-10;
}

// Batch calculation response
export class BatchCalcResponse {
  updatedValues: Map<string, f64> = new Map<string, f64>();
  dirtyCells: string[] = [];
  affectedCells: string[] = [];
  iterationCount: i32 = 0;
  converged: bool = false;
}

// Consolidation request (simplified for WASM)
export class ConsolidationRequest {
  entities: Map<string, Map<string, f64>> = new Map<string, Map<string, f64>>();
  ownerships: Map<string, f64> = new Map<string, f64>();
  icPairs: string[] = [];
  fxRates: Map<string, f64> = new Map<string, f64>();
  adjustments: Map<string, f64> = new Map<string, f64>();
}

// Consolidation response
export class ConsolidationResponse {
  totalAssets: f64 = 0.0;
  totalLiabilities: f64 = 0.0;
  totalEquity: f64 = 0.0;
  totalRevenue: f64 = 0.0;
  totalExpenses: f64 = 0.0;
  netIncome: f64 = 0.0;
  isBalanced: bool = true;
  imbalanceAmount: f64 = 0.0;
  eliminationCount: i32 = 0;
  minorityInterest: f64 = 0.0;
}

// Progress callback type
export type ProgressCallback = (processed: i32, total: i32, percent: i32) => void;
