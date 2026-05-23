/**
 * PluginRegistry — Register, discover, and manage plugin lifecycle
 */

import type {
  PluginManifest,
  Plugin,
  PluginState,
  PluginRegistryEntry,
  PluginPermission,
  PluginType,
  PluginAPI,
} from './types';

export type PluginEventType = 'install' | 'activate' | 'deactivate' | 'uninstall' | 'error';

export interface PluginEvent {
  pluginId: string;
  type: PluginEventType;
  timestamp: string;
  error?: string;
}

type EventHandler = (event: PluginEvent) => void;

export class PluginRegistry {
  private entries = new Map<string, PluginRegistryEntry>();
  private eventHandlers = new Map<PluginEventType, Set<EventHandler>>();

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  register(manifest: PluginManifest, plugin: Plugin | null = null): PluginRegistryEntry {
    if (this.entries.has(manifest.id)) {
      throw new Error(`Plugin "${manifest.id}" is already registered`);
    }

    const entry: PluginRegistryEntry = {
      manifest,
      plugin,
      state: 'installed',
      api: null,
      permissions: new Map(manifest.permissions.map((p) => [p, true])),
      storage: new Map(),
      registeredAt: new Date().toISOString(),
    };

    this.entries.set(manifest.id, entry);
    this.emit({ pluginId: manifest.id, type: 'install', timestamp: entry.registeredAt });
    return entry;
  }

  unregister(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;

    if (entry.state === 'active') {
      this.deactivate(id);
    }

    entry.state = 'uninstalled';
    this.emit({ pluginId: id, type: 'uninstall', timestamp: new Date().toISOString() });
    this.entries.delete(id);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  activate(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;

    if (entry.state === 'active') return true;

    // Validate dependencies
    if (entry.manifest.dependencies) {
      for (const depId of entry.manifest.dependencies) {
        const dep = this.entries.get(depId);
        if (!dep || dep.state !== 'active') {
          entry.state = 'error';
          entry.lastError = `Dependency "${depId}" is not active`;
          this.emit({
            pluginId: id,
            type: 'error',
            timestamp: new Date().toISOString(),
            error: entry.lastError,
          });
          return false;
        }
      }
    }

    // Check conflicts
    if (entry.manifest.conflicts) {
      for (const conflictId of entry.manifest.conflicts) {
        const conflict = this.entries.get(conflictId);
        if (conflict && conflict.state === 'active') {
          entry.state = 'error';
          entry.lastError = `Conflicts with active plugin "${conflictId}"`;
          this.emit({
            pluginId: id,
            type: 'error',
            timestamp: new Date().toISOString(),
            error: entry.lastError,
          });
          return false;
        }
      }
    }

    try {
      if (entry.plugin && entry.api) {
        entry.plugin.init(entry.api);
      }
      entry.state = 'active';
      entry.lastError = undefined;
      this.emit({ pluginId: id, type: 'activate', timestamp: new Date().toISOString() });
      return true;
    } catch (e: unknown) {
      entry.state = 'error';
      entry.lastError = e instanceof Error ? e.message : 'Activation failed';
      this.emit({
        pluginId: id,
        type: 'error',
        timestamp: new Date().toISOString(),
        error: entry.lastError,
      });
      return false;
    }
  }

  deactivate(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry || entry.state !== 'active') return false;

    // Check if other active plugins depend on this one
    for (const [otherId, otherEntry] of this.entries) {
      if (
        otherId !== id &&
        otherEntry.state === 'active' &&
        otherEntry.manifest.dependencies?.includes(id)
      ) {
        entry.state = 'error';
        entry.lastError = `Cannot deactivate: plugin "${otherId}" depends on this`;
        this.emit({
          pluginId: id,
          type: 'error',
          timestamp: new Date().toISOString(),
          error: entry.lastError,
        });
        return false;
      }
    }

    try {
      if (entry.plugin) {
        entry.plugin.destroy();
      }
      entry.state = 'installed';
      entry.lastError = undefined;
      this.emit({ pluginId: id, type: 'deactivate', timestamp: new Date().toISOString() });
      return true;
    } catch (e: unknown) {
      entry.state = 'error';
      entry.lastError = e instanceof Error ? e.message : 'Deactivation failed';
      this.emit({
        pluginId: id,
        type: 'error',
        timestamp: new Date().toISOString(),
        error: entry.lastError,
      });
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  get(id: string): PluginRegistryEntry | undefined {
    return this.entries.get(id);
  }

  list(): PluginRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  getByType(type: PluginType): PluginRegistryEntry[] {
    return this.list().filter((e) => e.manifest.type === type);
  }

  getByState(state: PluginState): PluginRegistryEntry[] {
    return this.list().filter((e) => e.state === state);
  }

  getActive(): PluginRegistryEntry[] {
    return this.getByState('active');
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  hasPermission(id: string, permission: PluginPermission): boolean {
    const entry = this.entries.get(id);
    return entry ? entry.permissions.has(permission) : false;
  }

  size(): number {
    return this.entries.size;
  }

  // ---------------------------------------------------------------------------
  // API binding
  // ---------------------------------------------------------------------------

  setAPI(id: string, api: PluginAPI): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    entry.api = api;
    return true;
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  on(type: PluginEventType, handler: EventHandler): void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, new Set());
    }
    this.eventHandlers.get(type)!.add(handler);
  }

  off(type: PluginEventType, handler: EventHandler): void {
    this.eventHandlers.get(type)?.delete(handler);
  }

  private emit(event: PluginEvent): void {
    this.eventHandlers.get(event.type)?.forEach((handler) => handler(event));
    this.eventHandlers.get('*' as PluginEventType)?.forEach((handler) => handler(event));
  }

  // ---------------------------------------------------------------------------
  // Storage (per-plugin key-value)
  // ---------------------------------------------------------------------------

  getStorage(id: string): Map<string, unknown> | undefined {
    return this.entries.get(id)?.storage;
  }

  setStorageValue(id: string, key: string, value: unknown): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    entry.storage.set(key, value);
    return true;
  }

  getStorageValue(id: string, key: string): unknown {
    return this.entries.get(id)?.storage.get(key);
  }

  // ---------------------------------------------------------------------------
  // Reset (testing)
  // ---------------------------------------------------------------------------

  clear(): void {
    for (const [id] of this.entries) {
      this.deactivate(id);
    }
    this.entries.clear();
    this.eventHandlers.clear();
  }
}
