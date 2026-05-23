/**
 * Plugin System — Barrel Export
 */

export { PluginRegistry } from './PluginRegistry';
export type { PluginEventType, PluginEvent } from './PluginRegistry';

export { PluginLoader } from './PluginLoader';
export type { LoadResult, ValidationResult } from './PluginLoader';

export { createPluginAPI } from './PluginAPI';

export { PluginManager } from './PluginManager';
export type { PluginManagerConfig } from './PluginManager';

export type {
  PluginType,
  PluginPermission,
  PluginState,
  PluginManifest,
  ParameterSpec,
  FormulaSpec,
  ReportSection,
  ReportOptions,
  ReportTemplate,
  ImportResult,
  ImportConnector,
  ExportFormat,
  ConfigField,
  DashboardWidget,
  WorkflowCondition,
  WorkflowAction,
  WorkflowRule,
  MenuItem,
  ToolbarButton,
  DialogOptions,
  DialogResult,
  PluginStorageAPI,
  PluginFormulaAPI,
  PluginReportsAPI,
  PluginImportAPI,
  PluginExportAPI,
  PluginDashboardsAPI,
  PluginWorkflowsAPI,
  PluginEventsAPI,
  PluginUIAPI,
  PluginLogAPI,
  PluginAPI,
  Plugin,
  PluginRegistryEntry,
} from './types';
