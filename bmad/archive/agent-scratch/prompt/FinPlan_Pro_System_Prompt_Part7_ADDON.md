# FINPLAN PRO — AI FLEET SYSTEM PROMPT
## Part 7 of 10 (ADDON): AI/ML Integration & Intelligent Features
## Version 5.0.0 | Generated 2026-05-18 | VERIFIED FROM ACTUAL CODEBASE

---

## 0. PURPOSE OF THIS PART

This part defines HOW FinPlan Pro uses AI/ML to create "magic moments"
that no competitor can match — while staying true to the offline-first,
AI-DEPENDENT-PROOF architecture.

CORE PRINCIPLE:
  AI ENHANCES the product. It is NEVER required.
  If every ONNX model is deleted, the app works at 100% capability.
  AI = "smart suggestions." Core = "always works."

EXISTING AI INFRASTRUCTURE (VERIFIED):
  - AIEngine.ts (90 lines) — @huggingface/transformers, lazy-loaded ONNX
  - AnomalyDetectionEngine.ts — Z-score, modified Z-score, IQR, trend-break, seasonal
  - MonteCarloEngine.ts — Full probabilistic simulation with 7 distribution types
  - RollingForecastEngine.ts — Auto-extending forecasts with blend methods
  - ETLPipelineEngine.ts — Auto-detect field mappings
  - ICMatchingEngine.ts — Fuzzy intercompany transaction matching

---

## 1. ON-DEVICE AI ARCHITECTURE

### 1.1 Current State (Verified from AIEngine.ts)

```typescript
// AIEngine.ts is LAZY-LOADED (not in initial bundle)
// This avoids 23.5MB ONNX WASM hit on startup
// Only loaded when user visits /ai page

// Current models:
// 1. Text Classification: Xenova/distilbert-base-uncased-finetuned-sst-2-english
// 2. Feature Extraction: onnx-community/all-MiniLM-L6-v2-ONNX

// Device fallback chain: WebGPU → WASM/CPU
// Browser cache enabled: models download once, cached locally
```

### 1.2 Model Selection for Financial Tasks

```
┌────────────────────────────┬────────────────────────────────┬────────┬──────────┐
│ Task                       │ Model                          │ Size   │ Latency  │
├────────────────────────────┼────────────────────────────────┼────────┼──────────┤
│ Transaction Classification │ distilbert-sst-2 (existing)    │ ~65MB  │ <50ms    │
│ Account Name Similarity    │ all-MiniLM-L6-v2 (existing)    │ ~23MB  │ <30ms    │
│ Anomaly Detection          │ Pure TypeScript (no model)     │ 0MB    │ <5ms     │
│ Time Series Forecasting    │ Pure TypeScript (ARIMA-lite)   │ 0MB    │ <100ms   │
│ Formula Autocomplete       │ Trie + frequency table         │ <1MB   │ <5ms     │
│ Smart Column Mapping       │ Embedding similarity           │ ~23MB  │ <50ms    │
│ Natural Language Formulas  │ Rule engine + fuzzy match      │ <1MB   │ <10ms    │
│ Data Quality Scoring       │ Pure TypeScript (rules)        │ 0MB    │ <10ms    │
└────────────────────────────┴────────────────────────────────┴────────┴──────────┘

RULE: If a task can be done with pure TypeScript (no ML model),
      USE PURE TYPESCRIPT. ML models are ONLY for tasks where
      rule-based approaches produce poor results.
```

### 1.3 Inference Pipeline Pattern

```typescript
// ALL AI inference follows this pattern:

import { AIEngine } from '@/engines/AIEngine';

export class SmartFeature {
  private static ready = false;

  // Step 1: Lazy init (only when feature is first used)
  static async ensureReady() {
    if (this.ready) return;
    await AIEngine.init((progress) => {
      // Show progress bar to user
      console.log(`Loading AI model: ${progress}%`);
    });
    this.ready = true;
  }

  // Step 2: Run inference with timeout
  static async predict(input: string): Promise<PredictionResult> {
    await this.ensureReady();

    // Timeout after 500ms — don't block the UI
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI inference timeout')), 500)
    );

    try {
      const result = await Promise.race([
        AIEngine.classifyTransaction(input),
        timeout,
      ]);
      return { confidence: result.score, label: result.label, source: 'ai' };
    } catch {
      // Fallback: return low-confidence result, never crash
      return { confidence: 0, label: 'unknown', source: 'fallback' };
    }
  }

  // Step 3: Always provide non-AI fallback
  static predictOffline(input: string): PredictionResult {
    // Rule-based fallback when AI is unavailable
    const keywords = this.loadKeywordMap();
    const match = keywords.find(k => input.toLowerCase().includes(k.keyword));
    return match
      ? { confidence: 0.7, label: match.category, source: 'rule' }
      : { confidence: 0, label: 'unknown', source: 'none' };
  }
}
```

### 1.4 Memory Budget

```
ONNX Models:
  - distilbert-sst-2: ~65MB loaded (text classification)
  - all-MiniLM-L6-v2: ~23MB loaded (embeddings)
  - MAXIMUM total: 100MB for all AI models combined

Non-ML Intelligence:
  - AnomalyDetectionEngine: ~50KB (pure TypeScript)
  - Formula autocomplete trie: ~500KB
  - Keyword maps: ~200KB
  - TOTAL non-ML: <1MB

LAZY LOADING RULE:
  Models load ONLY when the feature is first used.
  User sees a progress bar: "Loading smart features..."
  If user cancels or model fails → feature works without AI.
```

---

## 2. ANOMALY DETECTION — DEEP INTEGRATION

### 2.1 Current AnomalyDetectionEngine (Verified)

```typescript
// AnomalyDetectionEngine.ts already implements:
// - Z-score detection (standard deviation based)
// - Modified Z-score (MAD-based, robust to outliers)
// - IQR detection (interquartile range)
// - Trend break detection (linear regression)
// - Seasonal detection (period-over-period)
// - Combined method (weighted ensemble)

// Integration points:
// 1. Budget variance page → auto-flag unusual variances
// 2. GL entry import → flag anomalous transactions
// 3. Forecast accuracy → detect when forecasts drift
// 4. Dashboard → anomaly indicator on KPI cards
```

### 2.2 Auto-Variance Flagging Pattern

```typescript
// When variance report is generated, auto-detect anomalies:

import { AnomalyDetectionEngine } from '@/engines/AnomalyDetectionEngine';

export function flagUnusualVariances(
  variances: VarianceLine[]
): FlaggedVariance[] {
  const values = variances.map(v => v.variancePercent);

  const result = AnomalyDetectionEngine.detect(values, {
    method: 'combined',
    threshold: 2.5, // 2.5 sigma = 99% confidence
    seasonalPeriod: 12, // Monthly data
  });

  return variances.map((v, i) => ({
    ...v,
    isAnomalous: result.anomalies.some(a => a.dataPoint.index === i),
    anomalyScore: result.anomalies.find(a => a.dataPoint.index === i)?.score ?? 0,
    anomalyReason: result.anomalies.find(a => a.dataPoint.index === i)?.reason ?? '',
  }));
}

// UI: Anomalous rows get a red/orange badge
// Tooltip: "This variance is 3.2σ from the mean — unusual for this account"
// Action: "Review" button opens detail modal
```

### 2.3 Transaction Anomaly Detection

```typescript
// When GL entries are imported, scan for anomalies:

export function scanImportedTransactions(entries: GLEntry[]): ScanResult {
  // Group by account
  const byAccount = groupBy(entries, 'accountCode');

  const anomalies: TransactionAnomaly[] = [];

  for (const [accountCode, accountEntries] of Object.entries(byAccount)) {
    const amounts = accountEntries.map(e => Math.abs(e.amount));

    // Z-score on amounts
    const amountAnomalies = AnomalyDetectionEngine.detect(amounts, {
      method: 'modified-zscore', // Robust to existing outliers
      threshold: 3.0,
    });

    // Trend break on running total
    const runningTotal = accumulate(amounts);
    const trendAnomalies = AnomalyDetectionEngine.detectTrendBreak(runningTotal);

    // Date clustering (unusual timing)
    const dates = accountEntries.map(e => new Date(e.date).getTime());
    const dateAnomalies = AnomalyDetectionEngine.detect(dates, {
      method: 'iqr',
      threshold: 1.5,
    });

    // Combine findings
    for (const anomaly of [...amountAnomalies.anomalies, ...trendAnomalies]) {
      anomalies.push({
        entry: accountEntries[anomaly.dataPoint.index],
        severity: anomaly.severity,
        reason: anomaly.reason,
        suggestedAction: suggestAction(anomaly, accountCode),
      });
    }
  }

  return {
    totalScanned: entries.length,
    anomalyCount: anomalies.length,
    anomalies: anomalies.sort((a, b) => b.severity.localeCompare(a.severity)),
  };
}
```

---

## 3. SMART FORECASTING

### 3.1 RollingForecastEngine Integration (Verified)

```typescript
// RollingForecastEngine.ts already implements:
// - Auto-extending rolling windows (12/18/24/36 months)
// - Blend methods: weighted, full-replace, trend
// - Actuals/forecast blending with configurable weights
// - Trend smoothing for volatile data

// Enhancement: Add ARIMA-lite for statistical forecasting
```

### 3.2 ARIMA-Lite Implementation (Pure TypeScript)

```typescript
// Lightweight ARIMA(1,1,1) — no ML model needed
// Runs in <100ms for 1000 data points

export interface ARIMAConfig {
  p: number; // AR order (autoregressive)
  d: number; // Differencing order
  q: number; // MA order (moving average)
  seasonal?: { P: number; D: number; Q: number; period: number };
}

export interface ForecastResult {
  values: number[];
  confidence: { lower: number[]; upper: number[] };
  metrics: { mape: number; rmse: number; mae: number };
}

export class ARIMAEngine {
  static forecast(
    history: number[],
    periods: number,
    config: ARIMAConfig = { p: 1, d: 1, q: 1 }
  ): ForecastResult {
    // Step 1: Difference the series (d times)
    let series = [...history];
    for (let i = 0; i < config.d; i++) {
      series = difference(series);
    }

    // Step 2: Fit AR(p) coefficients via Yule-Walker
    const arCoeffs = fitAR(series, config.p);

    // Step 3: Fit MA(q) residuals
    const residuals = computeResiduals(series, arCoeffs);
    const maCoeffs = fitMA(residuals, config.q);

    // Step 4: Forecast iteratively
    const forecasts: number[] = [];
    const extendedSeries = [...series];

    for (let t = 0; t < periods; t++) {
      let pred = 0;
      // AR component
      for (let i = 0; i < config.p; i++) {
        pred += arCoeffs[i] * extendedSeries[extendedSeries.length - 1 - i];
      }
      // MA component
      for (let i = 0; i < config.q; i++) {
        pred += maCoeffs[i] * residuals[residuals.length - 1 - i];
      }
      forecasts.push(pred);
      extendedSeries.push(pred);
      residuals.push(0); // Expected residual is 0
    }

    // Step 5: Undifference
    const result = undifference(history, forecasts, config.d);

    // Step 6: Confidence intervals (widening with horizon)
    const sigma = std(residuals);
    const confidence = {
      lower: result.map((v, i) => v - 1.96 * sigma * Math.sqrt(i + 1)),
      upper: result.map((v, i) => v + 1.96 * sigma * Math.sqrt(i + 1)),
    };

    return { values: result, confidence, metrics: computeMetrics(history, result) };
  }
}
```

### 3.3 Ensemble Forecasting

```typescript
// Combine multiple methods for better accuracy:

export class EnsembleForecastEngine {
  static forecast(history: number[], periods: number): ForecastResult {
    // Run all methods in parallel
    const arima = ARIMAEngine.forecast(history, periods, { p: 1, d: 1, q: 1 });
    const naive = naiveForecast(history, periods); // Last value repeated
    const trend = linearTrendForecast(history, periods);
    const seasonal = seasonalNaiveForecast(history, periods, 12);

    // Weight by historical accuracy (backtest)
    const weights = backtestWeights(history, [arima, naive, trend, seasonal]);

    // Weighted average
    const ensemble = periods.map((_, i) =>
      arima.values[i] * weights[0] +
      naive.values[i] * weights[1] +
      trend.values[i] * weights[2] +
      seasonal.values[i] * weights[3]
    );

    // Confidence: widest interval from any method
    const confidence = {
      lower: ensemble.map((v, i) => Math.min(
        arima.confidence.lower[i], naive.confidence.lower[i],
        trend.confidence.lower[i], seasonal.confidence.lower[i]
      )),
      upper: ensemble.map((v, i) => Math.max(
        arima.confidence.upper[i], naive.confidence.upper[i],
        trend.confidence.upper[i], seasonal.confidence.upper[i]
      )),
    };

    return { values: ensemble, confidence, metrics: computeMetrics(history, ensemble) };
  }
}
```

---

## 4. NATURAL LANGUAGE FORMULA INPUT

### 4.1 Rule-Based Formula Parser (No AI Needed)

```typescript
// Convert plain English to FinPlan Pro formulas
// 100% offline, no ML model, <10ms latency

interface FormulaTemplate {
  patterns: RegExp[];
  formula: (match: RegExpMatchArray, context: FormulaContext) => string;
  description: string;
}

const FORMULA_TEMPLATES: FormulaTemplate[] = [
  {
    patterns: [
      /(?:total|sum|add)\s+(?:of\s+)?(.+)/i,
      /(?:what(?:'s| is) (?:the )?)?(?:total|sum)\s+(?:of\s+)?(.+)/i,
    ],
    formula: (m) => `=SUM(${resolveAccount(m[1])})`,
    description: 'Sum of accounts',
  },
  {
    patterns: [
      /(.+?)\s+(?:vs|versus|compared?\s+to)\s+(.+)/i,
    ],
    formula: (m) => `=${resolveAccount(m[1])}-${resolveAccount(m[2])}`,
    description: 'Variance between two items',
  },
  {
    patterns: [
      /(.+?)\s+(?:as\s+)?(?:a\s+)?(?:%|percent|percentage)\s+of\s+(.+)/i,
    ],
    formula: (m) => `=${resolveAccount(m[1])}/${resolveAccount(m[2])}*100`,
    description: 'Percentage calculation',
  },
  {
    patterns: [
      /(?:growth|change)\s+(?:rate\s+)?(?:of\s+)?(.+)/i,
      /(?:how\s+much\s+did\s+)?(.+?)\s+(?:grow|change|increase|decrease)/i,
    ],
    formula: (m) => `=(${resolveAccount(m[1])}-SPLY(${resolveAccount(m[1])}))/SPLY(${resolveAccount(m[1])})*100`,
    description: 'Growth rate calculation',
  },
  {
    patterns: [
      /(?:gross\s+)?margin(?:\s+of)?\s+(.+)/i,
      /(.+?)\s+margin/i,
    ],
    formula: (m) => `=(${resolveAccount('Revenue')}-${resolveAccount('COGS')})/${resolveAccount('Revenue')}*100`,
    description: 'Gross margin calculation',
  },
  {
    patterns: [
      /(?:revenue|sales)\s+(?:per|divided\s+by)\s+(?:head|employee|fte)/i,
    ],
    formula: () => `=${resolveAccount('Revenue')}/${resolveAccount('Headcount')}`,
    description: 'Revenue per employee',
  },
  {
    patterns: [
      /(?:ebitda|operating\s+income)\s*(?:\+|plus)\s*(?:d&a|depreciation|amortization)/i,
    ],
    formula: () => `=${resolveAccount('OperatingIncome')}+${resolveAccount('Depreciation')}+${resolveAccount('Amortization')}`,
    description: 'EBITDA calculation',
  },
];

// Usage:
export function parseNaturalLanguage(input: string): FormulaSuggestion[] {
  const suggestions: FormulaSuggestion[] = [];

  for (const template of FORMULA_TEMPLATES) {
    for (const pattern of template.patterns) {
      const match = input.match(pattern);
      if (match) {
        suggestions.push({
          formula: template.formula(match, getContext()),
          description: template.description,
          confidence: 0.9,
          source: 'rule',
        });
      }
    }
  }

  // If no rule matched, try fuzzy account matching
  if (suggestions.length === 0) {
    const accounts = fuzzyFindAccounts(input);
    if (accounts.length > 0) {
      suggestions.push({
        formula: `=${accounts[0].code}`,
        description: `Reference to ${accounts[0].name}`,
        confidence: 0.5,
        source: 'fuzzy',
      });
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
```

### 4.2 Autocomplete with Financial Vocabulary

```typescript
// Trie-based autocomplete for formula bar
// Loads instantly, no AI model needed

const FINANCIAL_VOCABULARY = [
  // Functions
  'SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'IF', 'IFS', 'VLOOKUP', 'XLOOKUP',
  'INDEX', 'MATCH', 'SUMIF', 'COUNTIF', 'AVERAGEIF', 'NPV', 'IRR', 'XNPV',
  'XIRR', 'PMT', 'PV', 'FV', 'DATE', 'YEAR', 'MONTH', 'DAY', 'TODAY', 'NOW',

  // Time intelligence
  'YTD', 'QTD', 'MTD', 'SPLY', 'SPY', 'ROLLING12', 'ROLLING3',
  'PRIOR_PERIOD', 'SAME_PERIOD_LAST_YEAR',

  // Financial terms
  'Revenue', 'COGS', 'GrossProfit', 'OperatingExpenses', 'EBITDA',
  'NetIncome', 'TotalAssets', 'TotalLiabilities', 'Equity',
  'CashFlow', 'OperatingCF', 'InvestingCF', 'FinancingCF',
  'CapEx', 'Depreciation', 'Amortization', 'WorkingCapital',

  // SaaS metrics
  'MRR', 'ARR', 'NRR', 'GRR', 'Churn', 'LTV', 'CAC', 'ARPU',
  'NetNewARR', 'ExpansionARR', 'ContractionARR',

  // Ratios
  'GrossMargin', 'OperatingMargin', 'NetMargin', 'ROE', 'ROA', 'ROIC',
  'CurrentRatio', 'QuickRatio', 'DebtToEquity', 'InterestCoverage',
];

// Build trie on app load (<1ms)
const vocabTrie = buildTrie(FINANCIAL_VOCABULARY);

export function autocompleteFormula(partial: string): AutocompleteResult[] {
  const prefix = partial.split(/[^a-zA-Z]/).pop() || '';
  if (prefix.length < 2) return [];

  const matches = vocabTrie.search(prefix);

  return matches.map(m => ({
    text: m,
    type: getCompletionType(m), // 'function' | 'account' | 'metric'
    description: getDescription(m),
    insertText: getInsertText(m), // Include括号 for functions
  }));
}
```

---

## 5. SMART DATA MAPPING

### 5.1 Column Auto-Detection (ETLPipelineEngine Enhancement)

```typescript
// ETLPipelineEngine already has autoDetectMappings()
// Enhancement: Use embeddings for semantic matching

import { AIEngine } from '@/engines/AIEngine';

export async function smartColumnMapping(
  sourceHeaders: string[],
  targetSchema: TargetField[]
): Promise<FieldMapping[]> {
  const mappings: FieldMapping[] = [];

  for (const header of sourceHeaders) {
    // Step 1: Exact match (case-insensitive)
    const exactMatch = targetSchema.find(
      f => f.name.toLowerCase() === header.toLowerCase()
    );
    if (exactMatch) {
      mappings.push({ sourceField: header, targetField: exactMatch.name, confidence: 1.0, method: 'exact' });
      continue;
    }

    // Step 2: Common aliases
    const aliasMatch = COMMON_ALIASES[header.toLowerCase()];
    if (aliasMatch) {
      mappings.push({ sourceField: header, targetField: aliasMatch, confidence: 0.95, method: 'alias' });
      continue;
    }

    // Step 3: Fuzzy string matching (Levenshtein)
    const fuzzyMatch = targetSchema
      .map(f => ({ field: f, score: levenshteinSimilarity(header, f.name) }))
      .sort((a, b) => b.score - a.score)[0];

    if (fuzzyMatch.score > 0.7) {
      mappings.push({ sourceField: header, targetField: fuzzyMatch.field.name, confidence: fuzzyMatch.score, method: 'fuzzy' });
      continue;
    }

    // Step 4: Embedding similarity (if AI is loaded)
    try {
      const headerEmbedding = await AIEngine.getEmbeddings(header);
      let bestScore = 0;
      let bestField = targetSchema[0];

      for (const field of targetSchema) {
        const fieldEmbedding = await AIEngine.getEmbeddings(field.name);
        const similarity = cosineSimilarity(headerEmbedding, fieldEmbedding);
        if (similarity > bestScore) {
          bestScore = similarity;
          bestField = field;
        }
      }

      if (bestScore > 0.6) {
        mappings.push({ sourceField: header, targetField: bestField.name, confidence: bestScore, method: 'embedding' });
        continue;
      }
    } catch {
      // AI not available — skip embedding matching
    }

    // Step 5: No match found — ask user
    mappings.push({ sourceField: header, targetField: '', confidence: 0, method: 'manual' });
  }

  return mappings;
}

// Common column name aliases
const COMMON_ALIASES: Record<string, string> = {
  'acct': 'accountCode',
  'account': 'accountCode',
  'acct name': 'accountName',
  'account name': 'accountName',
  'desc': 'description',
  'debit': 'debitAmount',
  'credit': 'creditAmount',
  'amt': 'amount',
  'period': 'periodId',
  'fy': 'fiscalYear',
  'dept': 'departmentCode',
  'entity': 'entityId',
  'cost center': 'costCenterCode',
  'cc': 'costCenterCode',
  'gl': 'accountCode',
  'journal': 'journalEntryId',
  'je': 'journalEntryId',
};

// Levenshtein similarity (0-1)
function levenshteinSimilarity(a: string, b: string): number {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la === lb) return 1;
  const maxLen = Math.max(la.length, lb.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(la, lb);
  return 1 - dist / maxLen;
}
```

### 5.2 Learn from Past Imports

```typescript
// Remember user's mapping decisions for future imports

interface MappingMemory {
  sourcePattern: string;   // Regex or exact header
  targetField: string;
  confidence: number;
  lastUsed: string;
  useCount: number;
}

export class MappingMemoryEngine {
  private static STORAGE_KEY = 'finplan-mapping-memory';

  static remember(sourceHeader: string, targetField: string): void {
    const memory = this.load();
    const existing = memory.find(m => m.sourcePattern === sourceHeader);

    if (existing) {
      existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
      existing.lastUsed = new Date().toISOString();
      existing.useCount++;
    } else {
      memory.push({
        sourcePattern: sourceHeader,
        targetField,
        confidence: 0.8,
        lastUsed: new Date().toISOString(),
        useCount: 1,
      });
    }

    this.save(memory);
  }

  static recall(sourceHeader: string): MappingMemory | null {
    const memory = this.load();

    // Exact match
    const exact = memory.find(m => m.sourcePattern === sourceHeader);
    if (exact) return exact;

    // Fuzzy match
    const fuzzy = memory
      .map(m => ({ ...m, score: levenshteinSimilarity(sourceHeader, m.sourcePattern) }))
      .filter(m => m.score > 0.8)
      .sort((a, b) => b.score - a.score)[0];

    return fuzzy || null;
  }

  private static load(): MappingMemory[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private static save(memory: MappingMemory[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memory));
  }
}
```

---

## 6. INTELLIGENT ERROR DETECTION

### 6.1 Model Health Checker

```typescript
// Proactively detect issues in financial models

export interface HealthCheckResult {
  score: number; // 0-100
  issues: HealthIssue[];
  suggestions: string[];
}

export interface HealthIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'balance' | 'formula' | 'data' | 'consistency' | 'performance';
  message: string;
  location?: string; // Cell reference or section
  fix?: string; // Suggested fix
}

export class ModelHealthEngine {
  static check(model: FinancialModel): HealthCheckResult {
    const issues: HealthIssue[] = [];

    // Check 1: Balance sheet balances
    const assets = sumLineItems(model.balanceSheet.assets);
    const liabEquity = sumLineItems(model.balanceSheet.liabilities) +
                       sumLineItems(model.balanceSheet.equity);
    if (Math.abs(assets - liabEquity) > 0.01) {
      issues.push({
        severity: 'critical',
        category: 'balance',
        message: `Balance sheet out of balance by ${formatCurrency(assets - liabEquity)}`,
        fix: 'Check that all journal entries are complete and balanced',
      });
    }

    // Check 2: Circular references
    const cycles = detectCircularReferences(model.formulas);
    for (const cycle of cycles) {
      issues.push({
        severity: 'critical',
        category: 'formula',
        message: `Circular reference detected: ${cycle.join(' → ')}`,
        location: cycle[0],
        fix: 'Break the circular reference or enable iterative calculation',
      });
    }

    // Check 3: Formula errors
    const errors = findFormulaErrors(model.formulas);
    for (const error of errors) {
      issues.push({
        severity: 'warning',
        category: 'formula',
        message: `Formula error: ${error.type} in ${error.cell}`,
        location: error.cell,
        fix: error.suggestion,
      });
    }

    // Check 4: Data completeness
    const completeness = checkDataCompleteness(model);
    if (completeness.score < 0.8) {
      issues.push({
        severity: 'warning',
        category: 'data',
        message: `Data is only ${Math.round(completeness.score * 100)}% complete`,
        fix: `Fill in missing values for: ${completeness.missingAccounts.join(', ')}`,
      });
    }

    // Check 5: Revenue/expense reasonableness
    const margins = checkMarginReasonableness(model);
    for (const margin of margins) {
      if (margin.value < -0.5 || margin.value > 0.95) {
        issues.push({
          severity: 'info',
          category: 'consistency',
          message: `${margin.name} is ${formatPercent(margin.value)} — unusual for this industry`,
          location: margin.section,
        });
      }
    }

    // Calculate score
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const score = Math.max(0, 100 - criticalCount * 30 - warningCount * 10);

    return {
      score,
      issues: issues.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity)),
      suggestions: generateSuggestions(issues, model),
    };
  }
}
```

### 6.2 Auto-Fix Suggestions

```typescript
// When an error is detected, suggest specific fixes

export class AutoFixEngine {
  static suggestFix(issue: HealthIssue, model: FinancialModel): AutoFix | null {
    switch (issue.category) {
      case 'balance':
        return this.fixBalanceIssue(issue, model);
      case 'formula':
        return this.fixFormulaIssue(issue, model);
      case 'data':
        return this.fixDataIssue(issue, model);
      default:
        return null;
    }
  }

  private static fixBalanceIssue(issue: HealthIssue, model: FinancialModel): AutoFix {
    // Find the account that's causing the imbalance
    const imbalance = calculateImbalance(model);

    // Common fixes:
    // 1. Missing elimination entry
    // 2. FX translation not applied
    // 3. Rounding difference

    if (Math.abs(imbalance) < 1) {
      return {
        type: 'adjustment',
        description: 'Post rounding adjustment',
        action: () => postRoundingEntry(model, imbalance),
        risk: 'low',
      };
    }

    if (isFXRelated(model, imbalance)) {
      return {
        type: 'recalculate',
        description: 'Recalculate FX translation',
        action: () => recalculateFX(model),
        risk: 'low',
      };
    }

    return {
      type: 'manual',
      description: 'Manual review needed — imbalance exceeds auto-fix threshold',
      action: null,
      risk: 'high',
    };
  }
}
```

---

## 7. AI ETHICS & PRIVACY

### 7.1 Privacy-First AI Principles

```
RULE 1: ALL INFERENCE HAPPENS ON-DEVICE
  - No data is ever sent to any server for AI processing
  - Models are cached locally after first download
  - Network is only used for model download (one-time, user-initiated)

RULE 2: TRANSPARENCY OVER BLACK BOX
  - Every AI suggestion shows its confidence score (0-100%)
  - Every AI suggestion shows its source (rule-based / ML / hybrid)
  - User can always see WHY a suggestion was made
  - "Show reasoning" button on every AI-powered feature

RULE 3: USER OVERRIDE IS ALWAYS AVAILABLE
  - AI suggestions are NEVER auto-applied
  - Every suggestion has an "Ignore" button
  - User can disable AI entirely in settings
  - Disabled AI = zero impact on functionality

RULE 4: NO HALLUCINATION
  - If the AI is unsure (< 50% confidence), it says "I'm not sure"
  - It NEVER guesses or makes up answers
  - It ALWAYS provides the rule-based alternative
  - "AI not available" is a valid and respected state

RULE 5: DATA STAYS ON DEVICE
  - Model downloads are the ONLY network requests
  - User data is NEVER included in any request
  - Models are generic (trained on public data, not user data)
  - No telemetry from AI features (unless user opts in)
```

### 7.2 AI Settings UI

```typescript
// Settings page for AI features

interface AISettings {
  enabled: boolean;                    // Master switch
  anomalyDetection: boolean;           // Auto-flag unusual variances
  smartForecasting: boolean;           // ARIMA/ensemble forecasting
  formulaAutocomplete: boolean;        // Smart formula suggestions
  columnMapping: boolean;              // Auto-detect import columns
  transactionClassification: boolean;  // Auto-categorize transactions
  modelHealthCheck: boolean;           // Proactive error detection

  // Privacy settings
  allowModelDownload: boolean;         // Allow downloading ONNX models
  cacheModels: boolean;                // Keep models after download
  showConfidenceScores: boolean;       // Display AI confidence in UI
}

// Default: everything ON, privacy-respecting
const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: true,
  anomalyDetection: true,
  smartForecasting: true,
  formulaAutocomplete: true,
  columnMapping: true,
  transactionClassification: true,
  modelHealthCheck: true,
  allowModelDownload: true,
  cacheModels: true,
  showConfidenceScores: true,
};
```

### 7.3 Graceful Degradation

```
WHEN AI IS UNAVAILABLE (no internet for model download):
  ✅ All core features work at 100%
  ✅ Anomaly detection uses statistical methods (no ML needed)
  ✅ Formula autocomplete uses keyword trie (no ML needed)
  ✅ Column mapping uses fuzzy string matching (no ML needed)
  ✅ Forecasting uses ARIMA-lite (no ML needed)
  ✅ Error detection uses rule-based checks (no ML needed)

  🟡 Transaction classification uses keyword rules (less accurate)
  🟡 Account similarity uses Levenshtein (less accurate)
  🟡 Smart suggestions have lower confidence scores

  ❌ No features are disabled or broken
  ❌ No error messages about AI being unavailable
  ❌ No prompts to connect to the internet
```

---

## 8. PERFORMANCE TARGETS

```
┌──────────────────────────────┬──────────┬───────────────────────────────┐
│ AI Feature                   │ Target   │ Fallback if Exceeded          │
├──────────────────────────────┼──────────┼───────────────────────────────┤
│ Anomaly detection (1K rows)  │ <10ms    │ Use IQR only (skip Z-score)   │
│ Anomaly detection (100K rows)│ <500ms   │ Run in Web Worker             │
│ ARIMA forecast (1K points)   │ <100ms   │ Use naive forecast            │
│ ARIMA forecast (10K points)  │ <1s      │ Run in Web Worker             │
│ Formula autocomplete         │ <5ms     │ Disable live autocomplete     │
│ Column mapping (50 columns)  │ <100ms   │ Skip embedding, use fuzzy     │
│ Transaction classification   │ <50ms    │ Use keyword rules             │
│ Model health check           │ <200ms   │ Run async, show when ready    │
│ Embedding generation         │ <30ms    │ Use Levenshtein instead       │
│ ONNX model load (first time) │ <5s      │ Show progress bar             │
│ ONNX model load (cached)     │ <500ms   │ Show spinner                  │
└──────────────────────────────┴──────────┴───────────────────────────────┘

RULE: AI features must NEVER block the UI.
  - All inference runs async with timeout
  - Timeout triggers graceful fallback
  - User never waits for AI
```

---

╔══════════════════════════════════════════════════════════════════════════════╗
║  END OF PART 7 (ADDON)                                                       ║
║                                                                              ║
║  This part defines the AI/ML integration layer: on-device inference,         ║
║  anomaly detection, smart forecasting, natural language formulas,            ║
║  intelligent error detection, and privacy-first AI principles.               ║
║                                                                              ║
║  Key principle: AI ENHANCES, never DEPENDS.                                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
