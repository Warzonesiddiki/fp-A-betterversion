/**
 * PluginAPI — Full API surface exposed to plugins
 * Implements all PluginAPI interfaces from types.ts
 */

import type {
  PluginAPI,
  PluginFormulaAPI,
  PluginReportsAPI,
  PluginImportAPI,
  PluginExportAPI,
  PluginDashboardsAPI,
  PluginWorkflowsAPI,
  PluginEventsAPI,
  PluginStorageAPI,
  PluginUIAPI,
  PluginLogAPI,
  FormulaSpec,
  ReportTemplate,
  ImportConnector,
  ExportFormat,
  DashboardWidget,
  WorkflowRule,
  DialogOptions,
  DialogResult,
  MenuItem,
  ToolbarButton,
} from './types';
import { createLogger } from '@/utils/logger';

const pluginApiLogger = createLogger('PluginAPI');

// =============================================================================
// FORMULA API
// =============================================================================

class FormulaAPIImpl implements PluginFormulaAPI {
  private functions = new Map<string, FormulaSpec>();

  registerFunction(name: string, spec: FormulaSpec): void {
    this.functions.set(name.toUpperCase(), spec);
  }

  unregisterFunction(name: string): void {
    this.functions.delete(name.toUpperCase());
  }

  listFunctions(): FormulaSpec[] {
    return Array.from(this.functions.values());
  }

  getFunction(name: string): FormulaSpec | undefined {
    return this.functions.get(name.toUpperCase());
  }
}

// =============================================================================
// REPORTS API
// =============================================================================

class ReportsAPIImpl implements PluginReportsAPI {
  private templates = new Map<string, ReportTemplate>();

  registerTemplate(template: ReportTemplate): void {
    this.templates.set(template.id, template);
  }

  unregisterTemplate(id: string): void {
    this.templates.delete(id);
  }

  listTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }
}

// =============================================================================
// IMPORT API
// =============================================================================

class ImportAPIImpl implements PluginImportAPI {
  private connectors = new Map<string, ImportConnector>();

  registerConnector(connector: ImportConnector): void {
    this.connectors.set(connector.id, connector);
  }

  unregisterConnector(id: string): void {
    this.connectors.delete(id);
  }

  listConnectors(): ImportConnector[] {
    return Array.from(this.connectors.values());
  }

  getConnector(id: string): ImportConnector | undefined {
    return this.connectors.get(id);
  }
}

// =============================================================================
// EXPORT API
// =============================================================================

class ExportAPIImpl implements PluginExportAPI {
  private formats = new Map<string, ExportFormat>();

  registerFormat(format: ExportFormat): void {
    this.formats.set(format.id, format);
  }

  unregisterFormat(id: string): void {
    this.formats.delete(id);
  }

  listFormats(): ExportFormat[] {
    return Array.from(this.formats.values());
  }

  getFormat(id: string): ExportFormat | undefined {
    return this.formats.get(id);
  }
}

// =============================================================================
// DASHBOARDS API
// =============================================================================

class DashboardsAPIImpl implements PluginDashboardsAPI {
  private widgets = new Map<string, DashboardWidget>();

  registerWidget(widget: DashboardWidget): void {
    this.widgets.set(widget.id, widget);
  }

  unregisterWidget(id: string): void {
    this.widgets.delete(id);
  }

  unregisterWidgetById(id: string): void {
    this.widgets.delete(id);
  }

  listWidgets(): DashboardWidget[] {
    return Array.from(this.widgets.values());
  }

  getWidget(id: string): DashboardWidget | undefined {
    return this.widgets.get(id);
  }
}

// =============================================================================
// WORKFLOWS API
// =============================================================================

class WorkflowsAPIImpl implements PluginWorkflowsAPI {
  private rules = new Map<string, WorkflowRule>();

  registerRule(rule: WorkflowRule): void {
    this.rules.set(rule.id, rule);
  }

  unregisterRule(id: string): void {
    this.rules.delete(id);
  }

  listRules(): WorkflowRule[] {
    return Array.from(this.rules.values());
  }

  getRule(id: string): WorkflowRule | undefined {
    return this.rules.get(id);
  }
}

// =============================================================================
// EVENTS API
// =============================================================================

class EventsAPIImpl implements PluginEventsAPI {
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
      } catch (e: unknown) {
        pluginApiLogger.error(`Plugin event handler error for "${event}"`, {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    });
  }

  clear(): void {
    this.handlers.clear();
  }
}

// =============================================================================
// STORAGE API (per-plugin isolated storage)
// =============================================================================

class StorageAPIImpl implements PluginStorageAPI {
  private store = new Map<string, string>();
  private prefix: string;

  constructor(pluginId: string) {
    this.prefix = `plugin:${pluginId}:`;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = this.store.get(this.prefix + key);
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(this.prefix + key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    this.store.delete(this.prefix + key);
  }

  async clear(): Promise<void> {
    const prefix = this.prefix;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  async keys(): Promise<string[]> {
    const prefix = this.prefix;
    return Array.from(this.store.keys())
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.slice(prefix.length));
  }
}

// =============================================================================
// UI API
// =============================================================================

class UIAPIImpl implements PluginUIAPI {
  showNotification(message: string, type: 'info' | 'warn' | 'error'): void {
    // Documented contract (test-pinned): notifications always route to
    // console.log with a [Plugin:<level>] prefix, regardless of level.
    // Replace with the app notification-system integration when it lands.
    console.log(`[Plugin:${type}] ${message}`);
  }

  async showDialog(_options: DialogOptions): Promise<DialogResult> {
    // Placeholder — would integrate with app dialog system
    return { button: 'ok' };
  }

  registerMenuItem(_menu: string, _item: MenuItem): void {
    // Would register with app menu system
  }

  registerToolbarButton(_button: ToolbarButton): void {
    // Would register with app toolbar system
  }
}

// =============================================================================
// LOG API
// =============================================================================

class LogAPIImpl implements PluginLogAPI {
  private prefix: string;

  constructor(pluginId: string) {
    this.prefix = `[Plugin:${pluginId}]`;
  }

  // Plugin-facing log surface routes DIRECTLY to console with severity
  // mapping (ops: warn/error must reach their own streams, not collapse into
  // the structured INFO channel) and the plugin-id prefix. Arguments are
  // forwarded individually so test/monitoring spies observe real values.
  info(message: string, ...args: unknown[]): void {
    console.log(`${this.prefix} ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`${this.prefix} ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`${this.prefix} ${message}`, ...args);
  }
}

// =============================================================================
// COMPOSITE API FACTORY
// =============================================================================

/**
 * Create a complete PluginAPI instance for a given plugin.
 * Each plugin gets isolated storage and events.
 */
export function createPluginAPI(pluginId: string): PluginAPI {
  return {
    formula: new FormulaAPIImpl(),
    reports: new ReportsAPIImpl(),
    import: new ImportAPIImpl(),
    export: new ExportAPIImpl(),
    dashboards: new DashboardsAPIImpl(),
    workflows: new WorkflowsAPIImpl(),
    events: new EventsAPIImpl(),
    storage: new StorageAPIImpl(pluginId),
    ui: new UIAPIImpl(),
    log: new LogAPIImpl(pluginId),
  };
}

// Re-export implementations for direct access if needed
export {
  FormulaAPIImpl,
  ReportsAPIImpl,
  ImportAPIImpl,
  ExportAPIImpl,
  DashboardsAPIImpl,
  WorkflowsAPIImpl,
  EventsAPIImpl,
  StorageAPIImpl,
  UIAPIImpl,
  LogAPIImpl,
};
