/**
 * PluginMarketplace — Plugin discovery, installation, and management
 *
 * Turns FinPlan Pro from a product into a platform.
 * Users can install custom engines, charts, export formats, connectors.
 */

import { PluginRegistry } from './PluginRegistry';
import { PluginLoader } from './PluginLoader';
import { semverSatisfies } from './pluginSemver';
import type { Plugin, PluginAPI, PluginManifest, PluginPermission } from './types';

/**
 * Wave-7E marketplace-integrity: the plugin-API surface version this app build
 * exposes. Marketplace engine compatibility is checked against this constant.
 */
export const APP_PLUGIN_API_VERSION = '1.0.0';

/** Machine-readable failure reasons surfaced by {@link MarketplaceInstallError}. */
export type MarketplaceInstallErrorCode =
  | 'incompatible-version'
  | 'missing-dependency'
  | 'permission-consent-required'
  | 'load-failed'
  | 'sandbox-violation';

/**
 * Typed install failure. Callers/UI must branch on `code` instead of parsing
 * message strings; `detail` carries the loader's validation/load error text
 * that was previously swallowed.
 */
export class MarketplaceInstallError extends Error {
  readonly code: MarketplaceInstallErrorCode;
  readonly pluginId: string;
  readonly detail?: string;

  constructor(
    code: MarketplaceInstallErrorCode,
    pluginId: string,
    message: string,
    detail?: string
  ) {
    super(message);
    this.name = 'MarketplaceInstallError';
    this.code = code;
    this.pluginId = pluginId;
    this.detail = detail;
  }
}

/** Explicit user approval covering a plugin's declared permissions (default-deny). */
export interface MarketplaceConsentRecord {
  /** Must match the manifest id — consent cannot be reused across plugins. */
  pluginId: string;
  /** Permission set the user explicitly granted. */
  permissions: readonly PluginPermission[];
  /** ISO timestamp of the explicit approval. */
  grantedAt: string;
}

export interface MarketplaceInstallOptions {
  /**
   * Module factory producing the live plugin instance for the loader/sandbox.
   * Required for a successful install: catalog entries ship manifests only,
   * so without a factory the load step fails and nothing is registered.
   */
  factory?: (api: PluginAPI) => Plugin;
  /**
   * Consent record granting the manifest's declared permissions. Absent or
   * non-covering consent = default-deny rejection.
   */
  consent?: MarketplaceConsentRecord;
}

// Module-level singleton instances
const registry = new PluginRegistry();
const loader = new PluginLoader(registry, () => ({}) as never);

export interface MarketplacePlugin extends PluginManifest {
  description: string;
  author: string;
  homepage?: string;
  icon?: string;
  category: 'engine' | 'chart' | 'export' | 'connector' | 'template' | 'theme';
  downloads: number;
  rating: number;
  verified: boolean;
  screenshots?: string[];
  minAppVersion?: string;
  /**
   * Semver range of the app plugin-API surface this plugin runs against
   * (e.g. "^1.0.0", ">=1.0.0 <2.0.0"). Checked against APP_PLUGIN_API_VERSION.
   */
  engineVersion?: string;
}

export interface InstalledPlugin extends MarketplacePlugin {
  installedAt: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export class PluginMarketplace {
  private static installed: Map<string, InstalledPlugin> = new Map();

  static async browse(filters?: {
    category?: string;
    search?: string;
    sortBy?: 'popular' | 'newest' | 'rating';
  }): Promise<MarketplacePlugin[]> {
    const plugins = await this.getLocalPluginCatalog();
    let filtered = plugins;

    if (filters?.category) {
      filtered = filtered.filter((p) => p.category === filters.category);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q)
      );
    }
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'popular':
          filtered.sort((a, b) => b.downloads - a.downloads);
          break;
        case 'newest':
          filtered.sort((a, b) => b.version.localeCompare(a.version));
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
      }
    }

    return filtered;
  }

  static async install(
    manifest: MarketplacePlugin,
    options: MarketplaceInstallOptions = {}
  ): Promise<void> {
    // Gate 1 — engine compatibility (real semver range vs app plugin API).
    const compatibilityError = this.getCompatibilityError(manifest);
    if (compatibilityError) {
      throw new MarketplaceInstallError('incompatible-version', manifest.id, compatibilityError);
    }

    // Gate 2 — declared dependencies must already be installed.
    if (manifest.dependencies) {
      for (const dep of manifest.dependencies) {
        if (!registry.get(dep)) {
          throw new MarketplaceInstallError(
            'missing-dependency',
            manifest.id,
            `Plugin depends on "${dep}" which is not installed`
          );
        }
      }
    }

    // Gate 3 — explicit permission consent; default-deny without a record.
    const grantedPermissions = this.resolveGrantedPermissions(manifest, options.consent);

    // Gate 4 — actually load through the sandboxed loader and honor its result.
    // Catalog entries ship manifests only, so a module factory is required for
    // a successful load; without one nothing is registered.
    if (!options.factory) {
      throw new MarketplaceInstallError(
        'load-failed',
        manifest.id,
        `Plugin "${manifest.id}" failed to load`,
        'No module factory provided: pass the plugin module factory via MarketplaceInstallOptions.factory.'
      );
    }
    const result = await loader.loadFromManifest(manifest, options.factory);
    if (!result.success) {
      if (result.sandboxViolations && result.sandboxViolations.length > 0) {
        throw new MarketplaceInstallError(
          'sandbox-violation',
          manifest.id,
          `Plugin "${manifest.id}" rejected by the plugin sandbox`,
          result.error
        );
      }
      // Previously swallowed: the LoadResult was ignored and the plugin was
      // registered anyway. The loader's validation/load error now surfaces.
      throw new MarketplaceInstallError(
        'load-failed',
        manifest.id,
        `Plugin "${manifest.id}" failed to load`,
        result.error
      );
    }

    // The loader already registered manifest + instance in the shared registry
    // (a second register() here would throw "already registered"). Restrict
    // registry permission grants to the explicitly consented subset.
    const entry = registry.get(manifest.id);
    if (entry) {
      const declared: readonly PluginPermission[] = Array.isArray(manifest.permissions)
        ? manifest.permissions
        : [];
      for (const permission of declared) {
        entry.permissions.set(permission, grantedPermissions.has(permission));
      }
    }

    const installed: InstalledPlugin = {
      ...manifest,
      installedAt: new Date().toISOString(),
      enabled: true,
      config: {},
    };
    this.installed.set(manifest.id, installed);
  }

  static async uninstall(pluginId: string): Promise<void> {
    const plugin = this.installed.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not installed`);

    registry.unregister(pluginId);
    this.installed.delete(pluginId);
  }

  static async enable(pluginId: string): Promise<void> {
    const plugin = this.installed.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not installed`);
    plugin.enabled = true;
  }

  static async disable(pluginId: string): Promise<void> {
    const plugin = this.installed.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not installed`);
    plugin.enabled = false;
  }

  static getInstalled(): InstalledPlugin[] {
    return Array.from(this.installed.values());
  }

  static isInstalled(pluginId: string): boolean {
    return this.installed.has(pluginId);
  }

  private static async getLocalPluginCatalog(): Promise<MarketplacePlugin[]> {
    return SEED_CATALOG;
  }

  /**
   * Wave-7E: real compatibility gate (was an always-true stub). Checks the
   * minAppVersion floor and the engineVersion semver range against
   * APP_PLUGIN_API_VERSION. Returns a human-readable rejection reason or null.
   */
  private static getCompatibilityError(manifest: MarketplacePlugin): string | null {
    const { minAppVersion, engineVersion } = manifest;
    if (minAppVersion && !semverSatisfies(APP_PLUGIN_API_VERSION, `>=${minAppVersion}`)) {
      return `Plugin requires FinPlan Pro ${minAppVersion} or later (app plugin API version: ${APP_PLUGIN_API_VERSION})`;
    }
    if (engineVersion && !semverSatisfies(APP_PLUGIN_API_VERSION, engineVersion)) {
      return `Plugin engine requirement "${engineVersion}" is not satisfied by app plugin API version ${APP_PLUGIN_API_VERSION}`;
    }
    return null;
  }

  /**
   * Wave-7E: explicit consent gate (was an always-approve stub). Default-deny:
   * every declared permission must be covered by a consent record bound to
   * this plugin id. Returns the granted subset of declared permissions.
   */
  private static resolveGrantedPermissions(
    manifest: MarketplacePlugin,
    consent?: MarketplaceConsentRecord
  ): Set<PluginPermission> {
    const declared: readonly PluginPermission[] = Array.isArray(manifest.permissions)
      ? manifest.permissions
      : [];
    if (declared.length === 0) return new Set();

    let detail: string;
    if (!consent) {
      detail = 'No consent record provided (default-deny)';
    } else if (consent.pluginId !== manifest.id) {
      detail = `Consent record belongs to plugin "${consent.pluginId}", not "${manifest.id}"`;
    } else if (typeof consent.grantedAt !== 'string' || consent.grantedAt.length === 0) {
      detail = 'Consent record is missing grantedAt';
    } else {
      const granted = new Set<PluginPermission>(consent.permissions);
      const missing = declared.filter((p) => !granted.has(p));
      if (missing.length === 0) return granted;
      detail = `Missing grants: ${missing.join(', ')}`;
    }

    throw new MarketplaceInstallError(
      'permission-consent-required',
      manifest.id,
      `Plugin "${manifest.id}" requires explicit user consent for permissions: ${declared.join(', ')}`,
      detail
    );
  }
}

// =============================================================================
// SEED CATALOG — Built-in marketplace plugins
// =============================================================================

const SEED_CATALOG: MarketplacePlugin[] = [
  {
    id: 'finplan-xirr',
    name: 'XIRR Engine',
    version: '1.0.0',
    description:
      'Extended IRR calculation for irregular cash flows. Supports XNPV, XIRR, and modified IRR with date-based schedules.',
    author: 'FinPlan Labs',
    license: 'MIT',
    type: 'formula',
    entry: 'finplan-xirr/index.js',
    icon: '📈',
    permissions: ['read-data', 'storage'],
    tags: ['finance', 'irr', 'cash-flow', 'valuation'],
    category: 'engine',
    downloads: 12400,
    rating: 4.8,
    verified: true,
    homepage: 'https://github.com/finplan/finplan-xirr',
    repository: 'https://github.com/finplan/finplan-xirr',
  },
  {
    id: 'finplan-waterfall-pro',
    name: 'Waterfall Chart Pro',
    version: '2.1.0',
    description:
      'Advanced waterfall chart with bridge analysis, cumulative mode, and customizable color schemes for variance reporting.',
    author: 'FinPlan Labs',
    license: 'MIT',
    type: 'dashboard',
    entry: 'finplan-waterfall-pro/index.js',
    icon: '🌊',
    permissions: ['read-data', 'storage'],
    tags: ['charts', 'waterfall', 'variance', 'visualization'],
    category: 'chart',
    downloads: 8900,
    rating: 4.6,
    verified: true,
  },
  {
    id: 'finplan-pdf-export',
    name: 'PDF Export Pro',
    version: '1.3.0',
    description:
      'Export financial reports to branded PDF with custom headers, footers, logos, and multi-page support.',
    author: 'FinPlan Labs',
    license: 'MIT',
    type: 'export',
    entry: 'finplan-pdf-export/index.js',
    icon: '📄',
    permissions: ['read-data', 'write-files', 'storage'],
    tags: ['export', 'pdf', 'reports', 'branding'],
    category: 'export',
    downloads: 15200,
    rating: 4.9,
    verified: true,
  },
  {
    id: 'finplan-saas-metrics',
    name: 'SaaS Metrics Pack',
    version: '1.2.0',
    description:
      'Industry-grade SaaS formulas: ARR, MRR, CAC, LTV, NRR, logo churn, cohort retention, and Rule of 40.',
    author: 'FinPlan Labs',
    license: 'MIT',
    type: 'formula',
    entry: 'finplan-saas-metrics/index.js',
    icon: '☁️',
    permissions: ['read-data', 'storage'],
    tags: ['saas', 'metrics', 'arr', 'ltv', 'cac'],
    category: 'engine',
    downloads: 9600,
    rating: 4.7,
    verified: true,
  },
  {
    id: 'finplan-sqlite-connector',
    name: 'SQLite Connector',
    version: '1.0.0',
    description:
      'Import data directly from SQLite databases. Supports table selection, column mapping, and incremental sync.',
    author: 'Community',
    license: 'Apache-2.0',
    type: 'import',
    entry: 'finplan-sqlite-connector/index.js',
    icon: '🗃️',
    permissions: ['read-files', 'read-data', 'storage'],
    tags: ['import', 'sqlite', 'database', 'connector'],
    category: 'connector',
    downloads: 3200,
    rating: 4.3,
    verified: false,
  },
  {
    id: 'finplan-dark-pro',
    name: 'Dark Pro Theme',
    version: '1.1.0',
    description:
      'Premium dark theme with OLED-optimized blacks, accessible contrast ratios, and accent color customization.',
    author: 'Community',
    license: 'MIT',
    type: 'theme',
    entry: 'finplan-dark-pro/index.js',
    icon: '🌙',
    permissions: ['storage'],
    tags: ['theme', 'dark', 'oled', 'accessibility'],
    category: 'theme',
    downloads: 6800,
    rating: 4.5,
    verified: false,
  },
  {
    id: 'finplan-consolidation-template',
    name: 'IFRS Consolidation Template',
    version: '1.0.0',
    description:
      'Pre-built report template for IFRS 10 consolidated financial statements with intercompany eliminations.',
    author: 'FinPlan Labs',
    license: 'MIT',
    type: 'report',
    entry: 'finplan-consolidation-template/index.js',
    icon: '🏛️',
    permissions: ['read-data', 'storage'],
    tags: ['ifrs', 'consolidation', 'template', 'reporting'],
    category: 'template',
    downloads: 4100,
    rating: 4.4,
    verified: true,
  },
  {
    id: 'finplan-csv-advanced',
    name: 'Advanced CSV Connector',
    version: '2.0.0',
    description:
      'CSV/TSV import with auto-detect delimiters, encoding fallback, multi-sheet support, and streaming for large files.',
    author: 'Community',
    license: 'MIT',
    type: 'import',
    entry: 'finplan-csv-advanced/index.js',
    icon: '📊',
    permissions: ['read-files', 'read-data', 'storage'],
    tags: ['import', 'csv', 'data', 'connector'],
    category: 'connector',
    downloads: 7500,
    rating: 4.2,
    verified: false,
  },
  {
    id: 'finplan-workflow-alerts',
    name: 'Budget Alert Workflows',
    version: '1.0.0',
    description:
      'Automated budget threshold alerts. Trigger notifications when spending exceeds configurable percentages.',
    author: 'FinPlan Labs',
    license: 'MIT',
    type: 'workflow',
    entry: 'finplan-workflow-alerts/index.js',
    icon: '🔔',
    permissions: ['read-data', 'notifications', 'storage'],
    tags: ['workflow', 'alerts', 'budget', 'automation'],
    category: 'engine',
    downloads: 5800,
    rating: 4.6,
    verified: true,
  },
  {
    id: 'finplan-treemap',
    name: 'Treemap Chart',
    version: '1.0.0',
    description:
      'Hierarchical treemap visualization for budget allocation, cost center analysis, and portfolio composition.',
    author: 'Community',
    license: 'MIT',
    type: 'dashboard',
    entry: 'finplan-treemap/index.js',
    icon: '🗺️',
    permissions: ['read-data', 'storage'],
    tags: ['charts', 'treemap', 'visualization', 'budget'],
    category: 'chart',
    downloads: 2900,
    rating: 4.1,
    verified: false,
  },
];
