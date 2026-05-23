/**
 * Plugin System Type Definitions
 * Based on Part 15 spec — Plugin Architecture & Extensibility System
 */

// =============================================================================
// PLUGIN MANIFEST
// =============================================================================

export type PluginType =
  | 'formula'
  | 'report'
  | 'import'
  | 'export'
  | 'dashboard'
  | 'workflow'
  | 'industry'
  | 'theme';

export type PluginPermission =
  | 'read-data'
  | 'write-data'
  | 'read-settings'
  | 'network'
  | 'websocket'
  | 'read-files'
  | 'write-files'
  | 'notifications'
  | 'clipboard'
  | 'menus'
  | 'dialogs'
  | 'storage';

export type PluginState =
  | 'installed'
  | 'validated'
  | 'loaded'
  | 'active'
  | 'suspended'
  | 'unloaded'
  | 'uninstalled'
  | 'error';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license?: string;
  type: PluginType;
  entry: string;
  icon?: string;
  permissions: PluginPermission[];
  minFinPlanVersion?: string;
  maxFinPlanVersion?: string;
  dependencies?: string[];
  conflicts?: string[];
  tags?: string[];
  homepage?: string;
  repository?: string;
}

// =============================================================================
// PLUGIN FORMULA SPEC
// =============================================================================

export interface ParameterSpec {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'date' | 'number[]' | 'string[]';
  description?: string;
  required: boolean;
  default?: unknown;
}

export interface FormulaSpec {
  description: string;
  category: string;
  parameters: ParameterSpec[];
  returnType: string;
  execute: (...args: unknown[]) => unknown;
}

// =============================================================================
// PLUGIN REPORT SPEC
// =============================================================================

export interface ReportSection {
  type: string;
  title?: string;
  [key: string]: unknown;
}

export interface ReportOptions {
  pageSize?: string;
  orientation?: 'portrait' | 'landscape';
  margins?: { top: number; bottom: number; left: number; right: number };
  headerText?: string;
  footerText?: string;
  branding?: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sections: ReportSection[];
  options?: ReportOptions;
}

// =============================================================================
// PLUGIN IMPORT/EXPORT SPEC
// =============================================================================

export interface ImportResult {
  headers: string[];
  rows: unknown[][];
  metadata?: Record<string, unknown>;
}

export interface ImportConnector {
  id: string;
  name: string;
  description?: string;
  extensions: string[];
  detect: (header: string) => boolean;
  parse: (content: string) => Promise<ImportResult>;
}

export interface ExportFormat {
  id: string;
  name: string;
  description?: string;
  extension: string;
  generate: (data: unknown) => Promise<Blob>;
}

// =============================================================================
// PLUGIN DASHBOARD SPEC
// =============================================================================

export interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'range';
  label: string;
  default?: unknown;
  options?: unknown[];
}

export interface DashboardWidget {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category: string;
  defaultSize: { width: number; height: number };
  config: Record<string, ConfigField>;
  render: (container: HTMLElement, data: unknown, config: Record<string, unknown>) => void;
}

// =============================================================================
// PLUGIN WORKFLOW SPEC
// =============================================================================

export interface WorkflowCondition {
  type: string;
  metric?: string;
  operator?: string;
  threshold?: number;
  [key: string]: unknown;
}

export interface WorkflowAction {
  type: string;
  [key: string]: unknown;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
}

// =============================================================================
// PLUGIN UI SPEC
// =============================================================================

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  action?: () => void;
}

export interface ToolbarButton {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

export interface DialogOptions {
  title: string;
  message: string;
  type?: 'info' | 'warn' | 'error' | 'confirm';
  buttons?: string[];
}

export interface DialogResult {
  button: string;
  values?: Record<string, unknown>;
}

// =============================================================================
// PLUGIN API INTERFACE
// =============================================================================

export interface PluginStorageAPI {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

export interface PluginFormulaAPI {
  registerFunction(name: string, spec: FormulaSpec): void;
  unregisterFunction(name: string): void;
  listFunctions(): FormulaSpec[];
}

export interface PluginReportsAPI {
  registerTemplate(template: ReportTemplate): void;
  unregisterTemplate(id: string): void;
  listTemplates(): ReportTemplate[];
}

export interface PluginImportAPI {
  registerConnector(connector: ImportConnector): void;
  unregisterConnector(id: string): void;
  listConnectors(): ImportConnector[];
}

export interface PluginExportAPI {
  registerFormat(format: ExportFormat): void;
  unregisterFormat(id: string): void;
  listFormats(): ExportFormat[];
}

export interface PluginDashboardsAPI {
  registerWidget(widget: DashboardWidget): void;
  unregisterWidget(id: string): void;
  listWidgets(): DashboardWidget[];
}

export interface PluginWorkflowsAPI {
  registerRule(rule: WorkflowRule): void;
  unregisterRule(id: string): void;
  listRules(): WorkflowRule[];
}

export interface PluginEventsAPI {
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
  emit(event: string, data: unknown): void;
}

export interface PluginUIAPI {
  showNotification(message: string, type: 'info' | 'warn' | 'error'): void;
  showDialog(options: DialogOptions): Promise<DialogResult>;
  registerMenuItem(menu: string, item: MenuItem): void;
  registerToolbarButton(button: ToolbarButton): void;
}

export interface PluginLogAPI {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface PluginAPI {
  formula: PluginFormulaAPI;
  reports: PluginReportsAPI;
  import: PluginImportAPI;
  export: PluginExportAPI;
  dashboards: PluginDashboardsAPI;
  workflows: PluginWorkflowsAPI;
  events: PluginEventsAPI;
  storage: PluginStorageAPI;
  ui: PluginUIAPI;
  log: PluginLogAPI;
}

// =============================================================================
// PLUGIN INTERFACE
// =============================================================================

export interface Plugin {
  id: string;
  name: string;
  version?: string;
  init(api: PluginAPI): void;
  destroy(): void;
}

// =============================================================================
// PLUGIN REGISTRY ENTRY
// =============================================================================

export interface PluginRegistryEntry {
  manifest: PluginManifest;
  plugin: Plugin | null;
  state: PluginState;
  api: PluginAPI | null;
  permissions: Map<PluginPermission, boolean>;
  storage: Map<string, unknown>;
  registeredAt: string;
  lastError?: string;
}
