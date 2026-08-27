/**
 * PluginLoader — Dynamic plugin loading with validation and sandboxing
 */

import type { PluginManifest, Plugin, PluginAPI } from './types';
import { PluginRegistry } from './PluginRegistry';
import { executeSandboxed, findEntryCodeViolations, validatePluginCode } from './PluginSandbox';

export interface PluginManifestFile {
  manifest: PluginManifest;
  entry: string; // module path or inline code
}

export interface LoadResult {
  success: boolean;
  pluginId: string;
  error?: string;
  sandboxViolations?: readonly string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * W6-P0-03 (2026-08-24): every plugin execution goes through the hardened
 * sandbox entry (executeSandboxed) instead of invoking factories directly.
 *
 * - FACTORY_BOOTSTRAP_SOURCE is a constant IIFE that runs INSIDE the wrapper
 *   and calls the host-bound factory (`__fpPluginFactory`) with the full
 *   PluginAPI (`__fpApi`, bound via SandboxOptions.bindings). It is itself
 *   re-validated by the sandbox's AST gate on every call.
 * - Honest boundary note: a compiled host closure invoked from the wrapper
 *   still resolves its free variables in its DEFINITION scope — the wrapper
 *   adds a uniform gate (AST check of embedded source, wall-clock budget,
 *   structured failures), not retroactive isolation. Inline SOURCE plugins
 *   (loadFromSource) get the full containment: parse → AST allowlist →
 *   wrapped execution with blocked globals.
 */
const FACTORY_BOOTSTRAP_SOURCE = '(function(){ return __fpPluginFactory(__fpApi); })();';

/**
 * Generous wall-clock budget for host factories/sources. The loop heartbeat
 * cannot instrument already-compiled foreign closures; the post-hoc elapsed
 * check in executeSandboxed still bounds them by this value.
 */
const SANDBOXED_EXEC_TIMEOUT_MS = 10_000;

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
      if (cur![0]! > max![0]! || (cur[0] === max[0] && cur![1]! > max![1]!)) {
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

  private gateEntryCode(manifest: PluginManifest): LoadResult | null {
    const violations = findEntryCodeViolations(manifest.entry);
    if (!violations) return null;
    return {
      success: false,
      pluginId: manifest.id,
      error: `Sandbox scan rejected plugin entry: ${violations.join('; ')}`,
      sandboxViolations: violations,
    };
  }

  /**
   * Load plugin from a manifest + module factory function.
   * The factory receives the PluginAPI and must return a Plugin object.
   *
   * W6-P0-03: the factory invocation is routed through executeSandboxed —
   * the same validated/sandboxed execution entry documented for plugins —
   * so loader behavior matches docs/architecture/plugin-security.md.
   */
  async loadFromManifest(
    manifest: PluginManifest,
    moduleFactory: (api: PluginAPI) => Plugin
  ): Promise<LoadResult> {
    const validation = this.validate(manifest);
    if (!validation.valid) {
      return { success: false, pluginId: manifest.id, error: validation.errors.join('; ') };
    }

    const entryGate = this.gateEntryCode(manifest);
    if (entryGate) return entryGate;

    try {
      const api = this.apiFactory(manifest.id);

      // Route execution through the hardened sandbox entry (W6-P0-03).
      const run = executeSandboxed<Plugin>(FACTORY_BOOTSTRAP_SOURCE, {
        bindings: { __fpPluginFactory: moduleFactory, __fpApi: api },
        timeoutMs: SANDBOXED_EXEC_TIMEOUT_MS,
      });
      if (!run.success || run.value === undefined || run.value === null) {
        return {
          success: false,
          pluginId: manifest.id,
          error: run.error ?? 'Plugin factory did not produce a plugin',
        };
      }
      const plugin = run.value;

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
   * Load a plugin from inline entry SOURCE (PluginManifestFile.entry may be
   * "module path or inline code"). The source must be an expression that
   * RETURNS a Plugin object (e.g. an IIFE) and runs with full sandbox
   * containment: acorn parse → AST allowlist → strict wrapper with blocked
   * globals, loop heartbeat, and scheduling bounds. The sandboxed `finplan`
   * global exposes the reduced register and log API surface.
   */
  async loadFromSource(manifest: PluginManifest, source: string): Promise<LoadResult> {
    const validation = this.validate(manifest);
    if (!validation.valid) {
      return { success: false, pluginId: manifest.id, error: validation.errors.join('; ') };
    }

    const entryGate = this.gateEntryCode(manifest);
    if (entryGate) return entryGate;

    const sourceVerdict = validatePluginCode(source);
    if (!sourceVerdict.safe) {
      const violations = [sourceVerdict.reason ?? 'plugin source failed the sandbox scan'];
      return {
        success: false,
        pluginId: manifest.id,
        error: `Sandbox scan rejected plugin source: ${violations.join('; ')}`,
        sandboxViolations: violations,
      };
    }

    try {
      const api = this.apiFactory(manifest.id);

      const run = executeSandboxed<Plugin>(source, {
        bindings: {},
        timeoutMs: SANDBOXED_EXEC_TIMEOUT_MS,
      });
      if (!run.success || run.value === undefined || run.value === null) {
        return {
          success: false,
          pluginId: manifest.id,
          error: run.error ?? 'Plugin source produced no value',
        };
      }
      const plugin = run.value;

      if (typeof plugin.init !== 'function' || typeof plugin.destroy !== 'function') {
        return {
          success: false,
          pluginId: manifest.id,
          error: 'Plugin must implement init() and destroy()',
        };
      }

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
