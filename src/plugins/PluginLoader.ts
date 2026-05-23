/**
 * PluginLoader — Dynamic plugin loading with validation and sandboxing
 */

import type { PluginManifest, Plugin, PluginAPI } from './types';
import { PluginRegistry } from './PluginRegistry';

export interface PluginManifestFile {
  manifest: PluginManifest;
  entry: string; // module path or inline code
}

export interface LoadResult {
  success: boolean;
  pluginId: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Semver-compatible version comparison
 */
function versionSatisfies(version: string, constraint: string): boolean {
  const parse = (v: string) => {
    const parts = v.replace(/^v/, '').split('.').map(Number);
    return { major: parts[0] ?? 0, minor: parts[1] ?? 0, patch: parts[2] ?? 0 };
  };

  const v = parse(version);
  const c = parse(constraint);
  return v.major === c.major && v.minor >= c.minor;
}

const CURRENT_VERSION = '1.0.0';

export class PluginLoader {
  private registry: PluginRegistry;
  private apiFactory: (pluginId: string) => PluginAPI;
  private moduleCache = new Map<string, Plugin>();

  constructor(registry: PluginRegistry, apiFactory: (pluginId: string) => PluginAPI) {
    this.registry = registry;
    this.apiFactory = apiFactory;
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  validate(manifest: PluginManifest): ValidationResult {
    const errors: string[] = [];

    if (!manifest.id || typeof manifest.id !== 'string') {
      errors.push('Missing or invalid plugin id');
    }
    if (!manifest.name || typeof manifest.name !== 'string') {
      errors.push('Missing or invalid plugin name');
    }
    if (!manifest.version || typeof manifest.version !== 'string') {
      errors.push('Missing or invalid plugin version');
    }
    if (!manifest.type) {
      errors.push('Missing plugin type');
    }
    if (!manifest.entry || typeof manifest.entry !== 'string') {
      errors.push('Missing or invalid entry point');
    }
    if (!Array.isArray(manifest.permissions)) {
      errors.push('Permissions must be an array');
    }

    // Version range check
    if (
      manifest.minFinPlanVersion &&
      !versionSatisfies(CURRENT_VERSION, manifest.minFinPlanVersion)
    ) {
      errors.push(`Requires FinPlan >= ${manifest.minFinPlanVersion}, current: ${CURRENT_VERSION}`);
    }
    if (
      manifest.maxFinPlanVersion &&
      versionSatisfies(manifest.maxFinPlanVersion, CURRENT_VERSION) &&
      CURRENT_VERSION !== manifest.maxFinPlanVersion
    ) {
      // Only block if current is HIGHER than max
      const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number);
      const cur = parse(CURRENT_VERSION);
      const max = parse(manifest.maxFinPlanVersion);
      if (cur[0] > max[0] || (cur[0] === max[0] && cur[1] > max[1])) {
        errors.push(
          `Requires FinPlan <= ${manifest.maxFinPlanVersion}, current: ${CURRENT_VERSION}`
        );
      }
    }

    // Conflict check
    if (manifest.conflicts) {
      for (const conflictId of manifest.conflicts) {
        if (this.registry.has(conflictId)) {
          const entry = this.registry.get(conflictId);
          if (entry?.state === 'active') {
            errors.push(`Conflicts with active plugin "${conflictId}"`);
          }
        }
      }
    }

    // Duplicate check
    if (this.registry.has(manifest.id)) {
      errors.push(`Plugin "${manifest.id}" is already registered`);
    }

    return { valid: errors.length === 0, errors };
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  /**
   * Load plugin from a manifest + module factory function.
   * The factory receives the PluginAPI and must return a Plugin object.
   */
  async loadFromManifest(
    manifest: PluginManifest,
    moduleFactory: (api: PluginAPI) => Plugin
  ): Promise<LoadResult> {
    const validation = this.validate(manifest);
    if (!validation.valid) {
      return { success: false, pluginId: manifest.id, error: validation.errors.join('; ') };
    }

    try {
      const api = this.apiFactory(manifest.id);
      const plugin = moduleFactory(api);

      // Validate plugin interface
      if (typeof plugin.init !== 'function' || typeof plugin.destroy !== 'function') {
        return {
          success: false,
          pluginId: manifest.id,
          error: 'Plugin must implement init() and destroy()',
        };
      }

      // Register and bind API
      this.registry.register(manifest, plugin);
      this.registry.setAPI(manifest.id, api);
      this.moduleCache.set(manifest.id, plugin);

      return { success: true, pluginId: manifest.id };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load plugin';
      return { success: false, pluginId: manifest.id, error: msg };
    }
  }

  /**
   * Load from a manifest file descriptor (for batch loading)
   */
  async loadAll(
    manifests: Array<{ manifest: PluginManifest; factory: (api: PluginAPI) => Plugin }>
  ): Promise<LoadResult[]> {
    const results: LoadResult[] = [];
    for (const { manifest, factory } of manifests) {
      results.push(await this.loadFromManifest(manifest, factory));
    }
    return results;
  }

  /**
   * Unload a plugin (deactivate + unregister)
   */
  unload(id: string): boolean {
    if (this.registry.has(id)) {
      this.registry.deactivate(id);
      this.registry.unregister(id);
      this.moduleCache.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Reload a plugin (unload + load again)
   */
  async reload(
    manifest: PluginManifest,
    moduleFactory: (api: PluginAPI) => Plugin
  ): Promise<LoadResult> {
    this.unload(manifest.id);
    return this.loadFromManifest(manifest, moduleFactory);
  }

  /**
   * Get cached plugin instance
   */
  getCached(id: string): Plugin | undefined {
    return this.moduleCache.get(id);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.moduleCache.clear();
  }
}
