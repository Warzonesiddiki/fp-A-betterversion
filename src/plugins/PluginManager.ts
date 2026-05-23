/**
 * PluginManager — High-level orchestrator for the plugin system
 * Coordinates Registry, Loader, and API creation
 */

import type { PluginManifest, Plugin, PluginAPI, PluginState } from './types';
import { PluginRegistry } from './PluginRegistry';
import { PluginLoader, type LoadResult } from './PluginLoader';
import { createPluginAPI } from './PluginAPI';

export interface PluginManagerConfig {
  autoActivate?: boolean;
  validateOnInstall?: boolean;
}

const DEFAULT_CONFIG: PluginManagerConfig = {
  autoActivate: true,
  validateOnInstall: true,
};

export class PluginManager {
  private registry: PluginRegistry;
  private loader: PluginLoader;
  private config: PluginManagerConfig;
  private initialized = false;

  constructor(config: Partial<PluginManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registry = new PluginRegistry();
    this.loader = new PluginLoader(this.registry, (id) => createPluginAPI(id));
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    // Future: load persisted plugin state from storage
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // ---------------------------------------------------------------------------
  // Install / Uninstall
  // ---------------------------------------------------------------------------

  async installPlugin(
    manifest: PluginManifest,
    moduleFactory: (api: PluginAPI) => Plugin
  ): Promise<LoadResult> {
    if (!this.initialized) this.init();

    const result = await this.loader.loadFromManifest(manifest, moduleFactory);
    if (!result.success) return result;

    if (this.config.autoActivate) {
      this.registry.activate(manifest.id);
    }

    return result;
  }

  uninstallPlugin(id: string): boolean {
    if (!this.registry.has(id)) return false;
    this.registry.deactivate(id);
    this.registry.unregister(id);
    this.loader.unload(id);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Enable / Disable
  // ---------------------------------------------------------------------------

  enablePlugin(id: string): boolean {
    return this.registry.activate(id);
  }

  disablePlugin(id: string): boolean {
    return this.registry.deactivate(id);
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  getInstalledPlugins() {
    return this.registry.list();
  }

  getActivePlugins() {
    return this.registry.getActive();
  }

  getPlugin(id: string) {
    return this.registry.get(id);
  }

  getPluginsByType(type: import('./types').PluginType) {
    return this.registry.getByType(type);
  }

  getPluginState(id: string): PluginState | undefined {
    return this.registry.get(id)?.state;
  }

  isPluginActive(id: string): boolean {
    return this.registry.get(id)?.state === 'active';
  }

  // ---------------------------------------------------------------------------
  // Plugin API access (for external consumers)
  // ---------------------------------------------------------------------------

  getPluginAPI(id: string): PluginAPI | null {
    return this.registry.get(id)?.api ?? null;
  }

  // ---------------------------------------------------------------------------
  // Registry access (for advanced use)
  // ---------------------------------------------------------------------------

  getRegistry(): PluginRegistry {
    return this.registry;
  }

  getLoader(): PluginLoader {
    return this.loader;
  }

  // ---------------------------------------------------------------------------
  // Bulk operations
  // ---------------------------------------------------------------------------

  async installAll(
    plugins: Array<{ manifest: PluginManifest; factory: (api: PluginAPI) => Plugin }>
  ): Promise<LoadResult[]> {
    const results: LoadResult[] = [];
    for (const { manifest, factory } of plugins) {
      results.push(await this.installPlugin(manifest, factory));
    }
    return results;
  }

  disableAll(): void {
    for (const entry of this.registry.getActive()) {
      this.registry.deactivate(entry.manifest.id);
    }
  }

  enableAll(): void {
    for (const entry of this.registry.getByState('installed')) {
      this.registry.activate(entry.manifest.id);
    }
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  destroy(): void {
    this.disableAll();
    this.registry.clear();
    this.loader.clearCache();
    this.initialized = false;
  }
}
