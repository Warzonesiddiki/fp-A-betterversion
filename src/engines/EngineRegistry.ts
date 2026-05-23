/**
 * Engine Registry — lazy-load 129 engines instead of static imports.
 * Only loads engines when needed. Preloads critical ones at startup.
 */

type EngineModule = Record<string, unknown>;

interface CacheEntry {
  module: EngineModule;
  loadedAt: number;
  lastAccessed: number;
}

class EngineRegistry {
  private cache = new Map<string, CacheEntry>();
  private preloaded = new Set<string>();
  private loading = new Map<string, Promise<EngineModule>>();

  private static CRITICAL_ENGINES = [
    'FormulaEngine',
    'ThreeStatementEngine',
    'CalculationGraph',
    'ConsolidationEngine',
    'ImportEngine',
  ];

  /**
   * Load an engine by name. Returns cached if already loaded.
   */
  async load(engineId: string): Promise<EngineModule> {
    const cached = this.cache.get(engineId);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.module;
    }

    // Deduplicate concurrent loads
    const pending = this.loading.get(engineId);
    if (pending) return pending;

    const promise = this.doLoad(engineId);
    this.loading.set(engineId, promise);

    try {
      const mod = await promise;
      return mod;
    } finally {
      this.loading.delete(engineId);
    }
  }

  private async doLoad(engineId: string): Promise<EngineModule> {
    // Dynamic import map for all engines
    const mod = await this.dynamicImport(engineId);
    this.cache.set(engineId, {
      module: mod,
      loadedAt: Date.now(),
      lastAccessed: Date.now(),
    });
    return mod;
  }

  private async dynamicImport(engineId: string): Promise<EngineModule> {
    // Vite-compatible dynamic imports
    switch (engineId) {
      case 'FormulaEngine':
        return import('./FormulaEngine');
      case 'FormulaFunctionRegistry':
        return import('./FormulaFunctionRegistry');
      case 'ThreeStatementEngine':
        return import('./ThreeStatementEngine');
      case 'CalculationGraph':
        return import('./CalculationGraph');
      case 'ConsolidationEngine':
        return import('./ConsolidationEngine');
      case 'ImportEngine':
        return import('./ImportEngine');
      case 'ExcelImportEngine':
        return import('./ExcelImportEngine');
      case 'ExportEngine':
        return import('./ExportEngine');
      case 'NLQEngine':
        return import('./NLQEngine');
      case 'AIEngine':
        return import('./AIEngine');
      case 'FXEngine':
        return import('./FXEngine');
      case 'ComplianceEngine':
        return import('./ComplianceEngine');
      case 'AuditEngine':
        return import('./AuditEngine');
      case 'MonteCarloEngine':
        return import('./MonteCarloEngine');
      case 'AnomalyDetectionEngine':
        return import('./AnomalyDetectionEngine');
      case 'DriverCascadeEngine':
        return import('./DriverCascadeEngine');
      case 'RollingForecastEngine':
        return import('./RollingForecastEngine');
      case 'WhatIfSandboxEngine':
        return import('./WhatIfSandboxEngine');
      case 'SensitivityEngine':
        return import('./SensitivityEngine');
      case 'ScenarioEngine':
        return import('./ScenarioEngine');
      case 'TemplateEngine':
        return import('./TemplateEngine');
      case 'ConnectorEngine':
        return import('./ConnectorEngine');
      case 'SpreadEngine':
        return import('./SpreadEngine');
      case 'SignConventionEngine':
        return import('./SignConventionEngine');
      case 'StateMachine':
        return import('./StateMachine');
      case 'ValidationEngine':
        return import('./ValidationEngine');
      case 'ReportBuilderEngine':
        return import('./ReportBuilderEngine');
      case 'ReportBookEngine':
        return import('./ReportBookEngine');
      case 'DashboardBuilderEngine':
        return import('./DashboardBuilderEngine');
      case 'WorkflowEngine':
        return import('./WorkflowEngine');
      case 'AllocationEngine':
        return import('./AllocationEngine');
      case 'AutoSaveEngine':
        return import('./AutoSaveEngine');
      case 'CrashRecoveryEngine':
        return import('./CrashRecoveryEngine');
      case 'RBACEngine':
        return import('./RBACEngine');
      case 'ESGEngine':
        return import('./ESGEngine');
      case 'BondPricingEngine':
        return import('./BondPricingEngine');
      case 'GoalSeekEngine':
        return import('./GoalSeekEngine');
      case 'PivotTableEngine':
        return import('./PivotTableEngine');
      case 'MDXEngine':
        return import('./MDXEngine');
      case 'CubeEngine':
        return import('./CubeEngine');
      default:
        throw new Error(`Unknown engine: ${engineId}`);
    }
  }

  /**
   * Preload an engine without blocking. Fire-and-forget.
   */
  preload(engineId: string): void {
    if (this.cache.has(engineId) || this.preloaded.has(engineId)) return;
    this.preloaded.add(engineId);
    this.load(engineId).catch(() => {
      this.preloaded.delete(engineId);
    });
  }

  /**
   * Preload critical engines at startup.
   */
  preloadCritical(): void {
    for (const id of EngineRegistry.CRITICAL_ENGINES) {
      this.preload(id);
    }
  }

  /**
   * Get a loaded engine synchronously. Returns null if not loaded.
   */
  get(engineId: string): EngineModule | null {
    const cached = this.cache.get(engineId);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.module;
    }
    return null;
  }

  /**
   * Check if an engine is loaded.
   */
  has(engineId: string): boolean {
    return this.cache.has(engineId);
  }

  /**
   * Evict cold engines not accessed within maxAge ms.
   */
  evictCold(maxAge: number = 15 * 60 * 1000): number {
    const now = Date.now();
    let evicted = 0;
    for (const [id, entry] of this.cache) {
      if (now - entry.lastAccessed > maxAge) {
        // Don't evict critical engines
        if (!EngineRegistry.CRITICAL_ENGINES.includes(id)) {
          this.cache.delete(id);
          evicted++;
        }
      }
    }
    return evicted;
  }

  /**
   * Get cache stats.
   */
  getStats(): { loaded: number; critical: string[]; cold: number } {
    const now = Date.now();
    let cold = 0;
    for (const entry of this.cache.values()) {
      if (now - entry.lastAccessed > 15 * 60 * 1000) cold++;
    }
    return {
      loaded: this.cache.size,
      critical: EngineRegistry.CRITICAL_ENGINES,
      cold,
    };
  }

  /**
   * Clear entire cache except critical engines.
   */
  clear(): void {
    for (const [id] of this.cache) {
      if (!EngineRegistry.CRITICAL_ENGINES.includes(id)) {
        this.cache.delete(id);
      }
    }
  }
}

export const engineRegistry = new EngineRegistry();

// Preload critical engines on module load
engineRegistry.preloadCritical();
