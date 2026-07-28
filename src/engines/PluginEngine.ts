/* eslint-disable @typescript-eslint/no-unused-vars */
// =============================================================================
// PLUGIN ENGINE — Part 15 Plugin Architecture
// Manages plugin lifecycle: discovery, validation, loading, initialization
// =============================================================================

import type {
  PluginManifest,
  Plugin,
  PluginInstance,
  PluginAPI,
  PluginStatus,
  PluginType,
  FormulaSpec,
  ReportTemplate,
  ImportConnector,
  ExportFormat,
  DashboardWidget,
  WorkflowRule,
} from '@/types/plugin';
import { createLogger } from '@/utils/logger';

const pluginEngineLogger = createLogger('PluginEngine');

import { storageGet, storageSet, storageRemove, storageAdapter } from '@/utils/storageAdapter';

const CURRENT_VERSION = '1.0.0';
const MAX_PLUGIN_STORAGE_MB = 10;

// =============================================================================
// PLUGIN STORAGE (per-plugin, sandboxed)
// =============================================================================

class PluginStorage {
  private prefix: string;
  private data = new Map<string, unknown>();

  constructor(pluginId: string) {
    this.prefix = `plugin:${pluginId}:`;
  }

  async get<T>(key: string): Promise<T | null> {
    // PATCH 22 — Veridicus T-FIX-10: localStorage → storageAdapter
    const stored = storageGet(this.prefix + key);
    if (stored === null) return null;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const fullKey = this.prefix + key;
    const serialized = JSON.stringify(value);
    const sizeMb = new Blob([serialized]).size / (1024 * 1024);
    if (sizeMb > MAX_PLUGIN_STORAGE_MB) {
      throw new Error(
        `Plugin storage limit exceeded: ${sizeMb.toFixed(1)}MB > ${MAX_PLUGIN_STORAGE_MB}MB`
      );
    }
    storageSet(fullKey, serialized);
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    storageRemove(this.prefix + key);
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    // PATCH 22 — Veridicus T-FIX-10: use storageAdapter.keys() to find plugin-prefixed keys
    const pluginPrefix = this.prefix;
    const allKeys = storageAdapter.keys();
    const matchingKeys = allKeys.filter((k) => k.startsWith(pluginPrefix));
    matchingKeys.forEach((k) => storageRemove(k));
    this.data.clear();
  }
}

// =============================================================================
// PLUGIN EVENT BUS
// =============================================================================

class PluginEventBus {
  private handlers = new Map<string, Set<(...args: unknown[]) => void>>();

  on(event: string, handler: (...args: unknown[]) => void): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: (...args: unknown[]) => void): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, data: unknown): void {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        pluginEngineLogger.error(`Error in handler for "${event}"`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    });
  }

  removeAllListeners(_pluginId: string): void {
    // In production, track which handlers belong to which plugin
    // For now, this is handled by plugin.destroy()
  }
}

// =============================================================================
// PLUGIN ENGINE
// =============================================================================

export class PluginEngine {
  private plugins = new Map<string, PluginInstance>();
  private storage = new Map<string, PluginStorage>();
  private eventBus = new PluginEventBus();

  // Registries for plugin-provided functionality
  private formulaFunctions = new Map<string, { spec: FormulaSpec; pluginId: string }>();
  private reportTemplates = new Map<string, { template: ReportTemplate; pluginId: string }>();
  private importConnectors = new Map<string, { connector: ImportConnector; pluginId: string }>();
  private exportFormats = new Map<string, { format: ExportFormat; pluginId: string }>();
  private dashboardWidgets = new Map<string, { widget: DashboardWidget; pluginId: string }>();
  private workflowRules = new Map<string, { rule: WorkflowRule; pluginId: string }>();

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  async discover(_paths: string[]): Promise<PluginManifest[]> {
    const manifests: PluginManifest[] = [];
    // In Tauri, scan directories for manifest.json files
    // For now, return empty — plugins are registered manually
    return manifests;
  }

  async install(
    manifest: PluginManifest,
    pluginModule: { default: new () => Plugin }
  ): Promise<PluginInstance> {
    // Validate manifest
    const validationError = this.validateManifest(manifest);
    if (validationError) {
      throw new Error(`Plugin validation failed: ${validationError}`);
    }

    // Check for conflicts
    for (const conflictId of manifest.conflicts) {
      if (this.plugins.has(conflictId)) {
        throw new Error(`Plugin conflicts with installed plugin: ${conflictId}`);
      }
    }

    // Check dependencies
    for (const depId of manifest.dependencies) {
      if (!this.plugins.has(depId)) {
        throw new Error(`Missing dependency: ${depId}`);
      }
    }

    // Create plugin instance
    const plugin = new pluginModule.default();
    const pluginStorage = new PluginStorage(manifest.id);
    const api = this.createAPI(manifest.id, pluginStorage);

    const instance: PluginInstance = {
      manifest,
      plugin,
      status: 'loaded',
      api,
      loadedAt: Date.now(),
    };

    // Initialize
    try {
      plugin.init(api);
      instance.status = 'initialized';
    } catch (err) {
      instance.status = 'error';
      instance.error = err instanceof Error ? err.message : 'Unknown init error';
      throw new Error(`Plugin init failed: ${instance.error}`);
    }

    this.plugins.set(manifest.id, instance);
    this.storage.set(manifest.id, pluginStorage);

    return instance;
  }

  async uninstall(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // Cleanup
    try {
      instance.plugin.destroy();
    } catch (err) {
      pluginEngineLogger.error(`Error destroying plugin ${pluginId}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Remove all registrations
    this.unregisterAll(pluginId);

    // Clear storage
    await this.storage.get(pluginId)?.clear();

    this.plugins.delete(pluginId);
    this.storage.delete(pluginId);
  }

  async enable(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) throw new Error(`Plugin not found: ${pluginId}`);
    if (instance.status === 'disabled') {
      instance.plugin.init(instance.api);
      instance.status = 'running';
    }
  }

  async disable(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) throw new Error(`Plugin not found: ${pluginId}`);
    try {
      instance.plugin.destroy();
    } catch (err) {
      // Ignore destroy errors on disable
    }
    instance.status = 'disabled';
  }

  // =========================================================================
  // QUERY
  // =========================================================================

  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  getPluginsByType(type: PluginType): PluginInstance[] {
    return this.getAllPlugins().filter((p) => p.manifest.type === type);
  }

  getRegisteredFormulaFunctions(): Map<string, { spec: FormulaSpec; pluginId: string }> {
    return this.formulaFunctions;
  }

  getRegisteredReportTemplates(): Map<string, { template: ReportTemplate; pluginId: string }> {
    return this.reportTemplates;
  }

  // =========================================================================
  // VALIDATION
  // =========================================================================

  private validateManifest(manifest: PluginManifest): string | null {
    if (!manifest.id || !manifest.name || !manifest.version) {
      return 'Missing required fields: id, name, version';
    }
    if (!manifest.id.match(/^[a-z0-9.-]+$/)) {
      return 'Plugin ID must be lowercase with dots and hyphens only';
    }
    if (!manifest.type) {
      return 'Missing plugin type';
    }
    if (!manifest.entry) {
      return 'Missing entry point';
    }
    if (!Array.isArray(manifest.permissions)) {
      return 'Permissions must be an array';
    }
    if (!Array.isArray(manifest.dependencies)) {
      return 'Dependencies must be an array';
    }

    // Version compatibility
    if (
      manifest.minFinPlanVersion &&
      this.compareVersions(manifest.minFinPlanVersion, CURRENT_VERSION) > 0
    ) {
      return `Requires FinPlan Pro ${manifest.minFinPlanVersion} or higher`;
    }
    if (
      manifest.maxFinPlanVersion &&
      this.compareVersions(manifest.maxFinPlanVersion, CURRENT_VERSION) < 0
    ) {
      return `Not compatible with FinPlan Pro ${CURRENT_VERSION}`;
    }

    return null;
  }

  private compareVersions(a: string, b: string): number {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
    }
    return 0;
  }

  // =========================================================================
  // API FACTORY
  // =========================================================================

  private createAPI(pluginId: string, pluginStorage: PluginStorage): PluginAPI {
    return {
      formula: {
        registerFunction: (name: string, spec: FormulaSpec) => {
          this.formulaFunctions.set(name.toUpperCase(), { spec, pluginId });
        },
        unregisterFunction: (name: string) => {
          const key = name.toUpperCase();
          const entry = this.formulaFunctions.get(key);
          if (entry?.pluginId === pluginId) {
            this.formulaFunctions.delete(key);
          }
        },
        listFunctions: () => {
          return Array.from(this.formulaFunctions.values())
            .filter((e) => e.pluginId === pluginId)
            .map((e) => e.spec);
        },
      },

      reports: {
        registerTemplate: (template: ReportTemplate) => {
          this.reportTemplates.set(template.id, { template, pluginId });
        },
        unregisterTemplate: (id: string) => {
          const entry = this.reportTemplates.get(id);
          if (entry?.pluginId === pluginId) {
            this.reportTemplates.delete(id);
          }
        },
      },

      import: {
        registerConnector: (connector: ImportConnector) => {
          this.importConnectors.set(connector.id, { connector, pluginId });
        },
      },

      export: {
        registerFormat: (format: ExportFormat) => {
          this.exportFormats.set(format.id, { format, pluginId });
        },
      },

      dashboards: {
        registerWidget: (widget: DashboardWidget) => {
          this.dashboardWidgets.set(widget.id, { widget, pluginId });
        },
        unregisterWidget: (id: string) => {
          const entry = this.dashboardWidgets.get(id);
          if (entry?.pluginId === pluginId) {
            this.dashboardWidgets.delete(id);
          }
        },
      },

      workflows: {
        registerRule: (rule: WorkflowRule) => {
          this.workflowRules.set(rule.id, { rule, pluginId });
        },
        unregisterRule: (id: string) => {
          const entry = this.workflowRules.get(id);
          if (entry?.pluginId === pluginId) {
            this.workflowRules.delete(id);
          }
        },
      },

      data: {
        readCells: async () => {
          // Sandboxed — plugins can only read, not write, unless write-data permission
          return [];
        },
        readModel: async () => {
          return {};
        },
      },

      events: {
        on: (event: string, handler: (...args: unknown[]) => void) => {
          this.eventBus.on(event, handler);
        },
        off: (event: string, handler: (...args: unknown[]) => void) => {
          this.eventBus.off(event, handler);
        },
        emit: (event: string, data: unknown) => {
          this.eventBus.emit(event, data);
        },
      },

      storage: {
        get: <T>(key: string) => pluginStorage.get<T>(key),
        set: <T>(key: string, value: T) => pluginStorage.set<T>(key, value),
        delete: (key: string) => pluginStorage.delete(key),
        clear: () => pluginStorage.clear(),
      },

      ui: {
        showNotification: (message: string, type: 'info' | 'warn' | 'error') => {
          this.eventBus.emit('notification', { pluginId, message, type });
        },
        registerMenuItem: (menu: string, item: { label: string; action: () => void }) => {
          this.eventBus.emit('menu:register', { pluginId, menu, item });
        },
      },

      log: {
        info: (message: string, context?: Record<string, unknown>) =>
          pluginEngineLogger.info(`[Plugin:${pluginId}] ${message}`, context),
        warn: (message: string, context?: Record<string, unknown>) =>
          pluginEngineLogger.warn(`[Plugin:${pluginId}] ${message}`, context),
        error: (message: string, context?: Record<string, unknown>) =>
          pluginEngineLogger.error(`[Plugin:${pluginId}] ${message}`, context),
      },
    };
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  private unregisterAll(pluginId: string): void {
    for (const [key, entry] of this.formulaFunctions) {
      if (entry.pluginId === pluginId) this.formulaFunctions.delete(key);
    }
    for (const [key, entry] of this.reportTemplates) {
      if (entry.pluginId === pluginId) this.reportTemplates.delete(key);
    }
    for (const [key, entry] of this.importConnectors) {
      if (entry.pluginId === pluginId) this.importConnectors.delete(key);
    }
    for (const [key, entry] of this.exportFormats) {
      if (entry.pluginId === pluginId) this.exportFormats.delete(key);
    }
    for (const [key, entry] of this.dashboardWidgets) {
      if (entry.pluginId === pluginId) this.dashboardWidgets.delete(key);
    }
    for (const [key, entry] of this.workflowRules) {
      if (entry.pluginId === pluginId) this.workflowRules.delete(key);
    }
    this.eventBus.removeAllListeners(pluginId);
  }
}

// Singleton
export const pluginEngine = new PluginEngine();
