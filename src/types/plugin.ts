// =============================================================================
// PLUGIN TYPES — Part 15 Plugin Architecture
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
  | 'file-system'
  | 'notifications'
  | 'clipboard'
  | 'storage';

export type PluginStatus =
  | 'discovered'
  | 'validated'
  | 'loaded'
  | 'initialized'
  | 'running'
  | 'error'
  | 'disabled';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  type: PluginType;
  entry: string;
  icon?: string;
  permissions: PluginPermission[];
  minFinPlanVersion?: string;
  maxFinPlanVersion?: string;
  dependencies: string[];
  conflicts: string[];
  tags: string[];
  homepage?: string;
  repository?: string;
}

export interface FormulaSpec {
  description: string;
  category: string;
  parameters: FormulaParameter[];
  returnType: string;
  execute: (...args: unknown[]) => unknown;
}

export interface FormulaParameter {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  default?: unknown;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
}

export interface ReportSection {
  type: 'header' | 'table' | 'chart' | 'text' | 'kpi';
  config: Record<string, unknown>;
}

export interface ImportConnector {
  id: string;
  name: string;
  fileExtensions: string[];
  parse: (filePath: string) => Promise<ImportResult>;
}

export interface ImportResult {
  success: boolean;
  sheets: ImportSheet[];
  errors: string[];
}

export interface ImportSheet {
  name: string;
  columns: string[];
  rows: unknown[][];
}

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  generate: (data: unknown) => Promise<Blob>;
}

export interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<Record<string, unknown>>;
  defaultConfig: Record<string, unknown>;
}

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  condition: (context: unknown) => boolean;
  action: (context: unknown) => void;
}

export interface PluginAPI {
  formula: {
    registerFunction(name: string, spec: FormulaSpec): void;
    unregisterFunction(name: string): void;
    listFunctions(): FormulaSpec[];
  };
  reports: {
    registerTemplate(template: ReportTemplate): void;
    unregisterTemplate(id: string): void;
  };
  import: {
    registerConnector(connector: ImportConnector): void;
  };
  export: {
    registerFormat(format: ExportFormat): void;
  };
  dashboards: {
    registerWidget(widget: DashboardWidget): void;
    unregisterWidget(id: string): void;
  };
  workflows: {
    registerRule(rule: WorkflowRule): void;
    unregisterRule(id: string): void;
  };
  data: {
    readCells(range: string): Promise<unknown[][]>;
    readModel(): Promise<unknown>;
  };
  events: {
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    emit(event: string, data: unknown): void;
  };
  storage: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
  };
  ui: {
    showNotification(message: string, type: 'info' | 'warn' | 'error'): void;
    registerMenuItem(menu: string, item: { label: string; action: () => void }): void;
  };
  log: {
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
  };
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  init(api: PluginAPI): void;
  destroy(): void;
}

export interface PluginInstance {
  manifest: PluginManifest;
  plugin: Plugin;
  status: PluginStatus;
  api: PluginAPI;
  error?: string;
  loadedAt?: number;
}
