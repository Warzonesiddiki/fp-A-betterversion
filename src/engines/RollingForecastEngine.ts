// =============================================================================
// ROLLING FORECAST ENGINE — Auto-extending rolling forecasts
// Blends actuals with forecast model, maintains rolling windows
// Pure TypeScript, deterministic, testable
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RollingWindow = 12 | 18 | 24 | 36;
export type BlendMethod = 'weighted' | 'full-replace' | 'trend';

export interface ForecastPeriod {
  period: string; // e.g., '2026-01'
  isActual: boolean;
  value: number;
  confidence?: number; // 0-1 for forecast periods
}

export interface RollingForecastConfig {
  windowMonths: RollingWindow;
  blendMethod: BlendMethod;
  recentWeight: number; // Weight for recent actuals (0-1)
  forecastWeight: number; // Weight for forecast model (0-1)
  autoExtend: boolean;
  extendMonths: number;
}

export interface RollingState {
  forecastId: string;
  lastRollDate: string | null;
  actualizedPeriods: string[];
  pendingRollPeriods: string[];
  currentWindowStart: string;
  currentWindowEnd: string;
}

export interface RollResult {
  forecastId: string;
  previousWindow: ForecastPeriod[];
  newWindow: ForecastPeriod[];
  actualizedCount: number;
  extendedCount: number;
  blendWeights: Record<string, number>;
  duration: number;
}

export interface BlendConfig {
  method: BlendMethod;
  recentWeight: number;
  forecastWeight: number;
  trendSmoothing: number; // For trend method: 0-1, higher = more smoothing
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsePeriod(period: string): { year: number; month: number } {
  const [year, month] = period.split('-').map(Number);
  return { year: year!, month: month! };
}

function addMonths(period: string, months: number): string {
  const { year, month } = parsePeriod(period);
  const totalMonths = year * 12 + month - 1 + months;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
}

function periodDiff(p1: string, p2: string): number {
  const d1 = parsePeriod(p1);
  const d2 = parsePeriod(p2);
  return (d2.year - d1.year) * 12 + (d2.month - d1.month);
}

function generatePeriodRange(start: string, end: string): string[] {
  const periods: string[] = [];
  let current = start;
  while (current <= end) {
    periods.push(current);
    current = addMonths(current, 1);
  }
  return periods;
}

// ---------------------------------------------------------------------------
// ENGINE
// ---------------------------------------------------------------------------

export class RollingForecastEngine {
  private configs = new Map<string, RollingForecastConfig>();
  private states = new Map<string, RollingState>();

  // --- Configuration ---

  configure(
    forecastId: string,
    config: Partial<RollingForecastConfig> = {}
  ): RollingForecastConfig {
    const fullConfig: RollingForecastConfig = {
      windowMonths: 12,
      blendMethod: 'weighted',
      recentWeight: 0.7,
      forecastWeight: 0.3,
      autoExtend: true,
      extendMonths: 1,
      ...config,
    };
    this.configs.set(forecastId, fullConfig);

    if (!this.states.has(forecastId)) {
      this.states.set(forecastId, {
        forecastId,
        lastRollDate: null,
        actualizedPeriods: [],
        pendingRollPeriods: [],
        currentWindowStart: '',
        currentWindowEnd: '',
      });
    }

    return fullConfig;
  }

  getConfig(forecastId: string): RollingForecastConfig | undefined {
    return this.configs.get(forecastId);
  }

  getState(forecastId: string): RollingState | undefined {
    return this.states.get(forecastId);
  }

  // --- Rolling Logic ---

  rollForward(
    forecastId: string,
    actuals: Map<string, number>, // period -> actual value
    forecastModel: (period: string) => number, // forecast model function
    currentPeriods: ForecastPeriod[]
  ): RollResult {
    const start = performance.now();
    const config = this.configs.get(forecastId);
    if (!config) throw new Error(`Forecast "${forecastId}" not configured`);

    const state = this.states.get(forecastId)!;
    const previousWindow = [...currentPeriods];

    // 1. Identify actualized periods (periods where we now have actuals)
    const actualizedPeriods: string[] = [];
    for (const period of currentPeriods) {
      if (actuals.has(period.period) && !period.isActual) {
        actualizedPeriods.push(period.period);
      }
    }

    // 2. Update periods with actuals (replace forecast values with actuals)
    const blendWeights: Record<string, number> = {};
    const updatedPeriods = currentPeriods.map((p) => {
      if (p.isActual) return p;

      const actualValue = actuals.get(p.period);
      if (actualValue === undefined) return p;

      // For transition periods, apply blend method
      if (config.blendMethod === 'weighted' && p.value !== 0) {
        const blended = actualValue * config.recentWeight + p.value * config.forecastWeight;
        blendWeights[p.period] = config.recentWeight;
        return {
          ...p,
          value: Math.round(blended * 100) / 100,
          isActual: true,
          confidence: undefined,
        };
      }

      // Default: full replace
      blendWeights[p.period] = 1;
      return { ...p, isActual: true, value: actualValue, confidence: undefined };
    });

    // 3. Extend the window if needed
    const lastPeriod = updatedPeriods[updatedPeriods.length - 1]?.period ?? '';
    const newPeriods: ForecastPeriod[] = [];

    if (config.autoExtend && lastPeriod) {
      const extendTo = addMonths(lastPeriod, config.extendMonths);
      const extensionRange = generatePeriodRange(addMonths(lastPeriod, 1), extendTo);

      for (const period of extensionRange) {
        if (actuals.has(period)) {
          newPeriods.push({
            period,
            isActual: true,
            value: actuals.get(period)!,
          });
        } else {
          const forecastValue = forecastModel(period);
          newPeriods.push({
            period,
            isActual: false,
            value: forecastValue,
            confidence: this.calculateConfidence(period, lastPeriod, config.windowMonths),
          });
        }
      }
    }

    const blendedPeriods = [...updatedPeriods, ...newPeriods];

    // 5. Trim to window size
    const windowStart = addMonths(
      blendedPeriods[blendedPeriods.length - 1]?.period ?? '',
      -(config.windowMonths - 1)
    );
    const windowedPeriods = blendedPeriods.filter((p) => p.period >= windowStart);

    // 6. Update state
    state.lastRollDate = new Date().toISOString();
    state.actualizedPeriods = [...state.actualizedPeriods, ...actualizedPeriods];
    state.pendingRollPeriods = windowedPeriods.filter((p) => !p.isActual).map((p) => p.period);
    state.currentWindowStart = windowedPeriods[0]?.period ?? '';
    state.currentWindowEnd = windowedPeriods[windowedPeriods.length - 1]?.period ?? '';

    const duration = performance.now() - start;

    return {
      forecastId,
      previousWindow,
      newWindow: windowedPeriods,
      actualizedCount: actualizedPeriods.length,
      extendedCount: newPeriods.length,
      blendWeights,
      duration,
    };
  }

  private blendPeriods(
    periods: ForecastPeriod[],
    actuals: Map<string, number>,
    config: RollingForecastConfig,
    blendWeights: Record<string, number>
  ): ForecastPeriod[] {
    return periods.map((p) => {
      if (p.isActual) return p;

      const actualValue = actuals.get(p.period);
      if (actualValue === undefined) return p;

      switch (config.blendMethod) {
        case 'weighted': {
          const blended = actualValue * config.recentWeight + p.value * config.forecastWeight;
          blendWeights[p.period] = config.recentWeight;
          return { ...p, value: Math.round(blended * 100) / 100 };
        }

        case 'full-replace': {
          blendWeights[p.period] = 1;
          return { ...p, isActual: true, value: actualValue, confidence: undefined };
        }

        case 'trend': {
          // Use trend from recent actuals to adjust forecast
          const trend = this.calculateTrend(actuals, p.period);
          const adjusted = p.value * (1 + trend);
          blendWeights[p.period] = config.recentWeight;
          return { ...p, value: Math.round(adjusted * 100) / 100 };
        }

        default:
          return p;
      }
    });
  }

  private calculateTrend(actuals: Map<string, number>, _currentPeriod: string): number {
    const sortedActuals = Array.from(actuals.entries()).sort(([a], [b]) => a.localeCompare(b));

    if (sortedActuals.length < 2) return 0;

    // Calculate average growth rate from last 3 periods
    const recent = sortedActuals.slice(-3);
    let totalGrowth = 0;
    let count = 0;

    for (let i = 1; i < recent.length; i++) {
      const prev = recent![i - 1]![1];
      const curr = recent[i]![1];
      if (prev !== 0) {
        totalGrowth += (curr - prev) / Math.abs(prev);
        count++;
      }
    }

    return count > 0 ? totalGrowth / count : 0;
  }

  private calculateConfidence(
    period: string,
    lastActualPeriod: string,
    windowMonths: RollingWindow
  ): number {
    const distance = periodDiff(lastActualPeriod, period);
    // Confidence decreases linearly with distance from last actual
    const maxDistance = windowMonths;
    return Math.max(0, 1 - distance / maxDistance);
  }

  // --- Auto-Extension ---

  shouldRoll(forecastId: string, currentPeriod: string): boolean {
    const state = this.states.get(forecastId);
    if (!state || !state.lastRollDate) return true;

    const config = this.configs.get(forecastId);
    if (!config || !config.autoExtend) return false;

    // Roll if we're within 2 periods of the end of the window
    const endDistance = periodDiff(currentPeriod, state.currentWindowEnd);
    return endDistance <= 2;
  }

  getActualizedBoundary(forecastId: string): {
    lastActual: string | null;
    firstForecast: string | null;
  } {
    const state = this.states.get(forecastId);
    if (!state) return { lastActual: null, firstForecast: null };

    const lastActual: string | null =
      state.actualizedPeriods.length > 0
        ? (state.actualizedPeriods[state.actualizedPeriods.length - 1] ?? null)
        : null;

    const firstForecast: string | null =
      state.pendingRollPeriods.length > 0 ? (state.pendingRollPeriods[0] ?? null) : null;

    return { lastActual, firstForecast };
  }

  // --- Forecast Generation ---

  generateForecastFromDrivers(
    drivers: Map<string, number>, // driverName -> value
    baseValues: Map<string, number>, // account -> base value
    cascadeRules: Array<{ driverName: string; account: string; weight: number }>
  ): Map<string, number> {
    const results = new Map<string, number>();

    for (const [account, base] of baseValues) {
      let adjusted = base;

      for (const rule of cascadeRules) {
        if (rule.account === account) {
          const driverValue = drivers.get(rule.driverName) ?? 0;
          adjusted *= 1 + (driverValue / 100) * rule.weight;
        }
      }

      results.set(account, Math.round(adjusted * 100) / 100);
    }

    return results;
  }

  // --- Export/Import ---

  exportState(): {
    configs: Array<[string, RollingForecastConfig]>;
    states: Array<[string, RollingState]>;
  } {
    return {
      configs: Array.from(this.configs.entries()),
      states: Array.from(this.states.entries()),
    };
  }

  importState(state: {
    configs: Array<[string, RollingForecastConfig]>;
    states: Array<[string, RollingState]>;
  }): void {
    this.configs = new Map(state.configs);
    this.states = new Map(state.states);
  }

  reset(): void {
    this.configs.clear();
    this.states.clear();
  }
}
