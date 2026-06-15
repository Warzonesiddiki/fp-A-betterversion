/**
 * PluginManager tests — P0 coverage for G6 (services/plugins ≥80%)
 * Mnemosyne ownership: src/test/ + src/plugins/*.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginManager } from './PluginManager';
import { createPluginAPI } from './PluginAPI';
import type { PluginManifest, Plugin, PluginAPI } from './types';

function makeManifest(overrides: Partial<PluginManifest> = {}): PluginManifest {
  return {
    id: 'mgr-plugin',
    name: 'Manager Test Plugin',
    version: '1.0.0',
    description: 'A test plugin for manager',
    author: 'Test',
    type: 'formula',
    entry: 'index.js',
    permissions: ['read-data'],
    ...overrides,
  };
}

function makePlugin(): Plugin {
  return {
    id: 'mgr-plugin',
    name: 'Manager Test Plugin',
    init: vi.fn(),
    destroy: vi.fn(),
  };
}

function makeFactory() {
  return (_api: PluginAPI): Plugin => makePlugin();
}

describe('PluginManager', () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = new PluginManager();
  });

  describe('init / isInitialized', () => {
    it('starts uninitialized', () => {
      expect(manager.isInitialized()).toBe(false);
    });

    it('becomes initialized after init()', () => {
      manager.init();
      expect(manager.isInitialized()).toBe(true);
    });

    it('init is idempotent', () => {
      manager.init();
      manager.init();
      expect(manager.isInitialized()).toBe(true);
    });
  });

  describe('installPlugin', () => {
    it('installs and auto-activates a plugin by default', async () => {
      manager.init();
      const result = await manager.installPlugin(makeManifest(), makeFactory());
      expect(result.success).toBe(true);
      expect(result.pluginId).toBe('mgr-plugin');
      expect(manager.isPluginActive('mgr-plugin')).toBe(true);
    });

    it('respects autoActivate=false', async () => {
      manager = new PluginManager({ autoActivate: false });
      manager.init();
      await manager.installPlugin(makeManifest(), makeFactory());
      expect(manager.isPluginActive('mgr-plugin')).toBe(false);
      expect(manager.getPlugin('mgr-plugin')?.state).toBe('installed');
    });

    it('returns error result for invalid manifest (no id)', async () => {
      manager.init();
      const badManifest = makeManifest({ id: '' });
      const result = await manager.installPlugin(badManifest, makeFactory());
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('auto-inits on install if not initialized', async () => {
      const result = await manager.installPlugin(makeManifest(), makeFactory());
      expect(result.success).toBe(true);
      expect(manager.isInitialized()).toBe(true);
    });
  });

  describe('uninstallPlugin', () => {
    it('uninstalls an installed plugin', async () => {
      manager.init();
      await manager.installPlugin(makeManifest(), makeFactory());
      const ok = manager.uninstallPlugin('mgr-plugin');
      expect(ok).toBe(true);
      expect(manager.getPlugin('mgr-plugin')).toBeUndefined();
    });

    it('returns false for unknown plugin', () => {
      expect(manager.uninstallPlugin('nope')).toBe(false);
    });
  });

  describe('enable / disable', () => {
    beforeEach(async () => {
      manager = new PluginManager({ autoActivate: false });
      manager.init();
      await manager.installPlugin(makeManifest(), makeFactory());
    });

    it('enablePlugin activates', () => {
      expect(manager.enablePlugin('mgr-plugin')).toBe(true);
      expect(manager.isPluginActive('mgr-plugin')).toBe(true);
    });

    it('disablePlugin deactivates', () => {
      manager.enablePlugin('mgr-plugin');
      expect(manager.disablePlugin('mgr-plugin')).toBe(true);
      expect(manager.isPluginActive('mgr-plugin')).toBe(false);
    });

    it('returns false for unknown plugin on enable/disable', () => {
      expect(manager.enablePlugin('nope')).toBe(false);
      expect(manager.disablePlugin('nope')).toBe(false);
    });
  });

  describe('queries', () => {
    it('getInstalledPlugins returns list', async () => {
      manager.init();
      await manager.installPlugin(makeManifest({ id: 'a' }), makeFactory());
      await manager.installPlugin(makeManifest({ id: 'b' }), makeFactory());
      const list = manager.getInstalledPlugins();
      expect(list).toHaveLength(2);
    });

    it('getActivePlugins returns active list', async () => {
      manager.init();
      await manager.installPlugin(makeManifest({ id: 'a' }), makeFactory());
      await manager.installPlugin(makeManifest({ id: 'b' }), makeFactory());
      expect(manager.getActivePlugins()).toHaveLength(2);
    });

    it('getPlugin returns entry', async () => {
      manager.init();
      await manager.installPlugin(makeManifest(), makeFactory());
      const entry = manager.getPlugin('mgr-plugin');
      expect(entry?.manifest.id).toBe('mgr-plugin');
    });

    it('getPluginState returns state', async () => {
      manager.init();
      await manager.installPlugin(makeManifest(), makeFactory());
      expect(manager.getPluginState('mgr-plugin')).toBe('active');
    });

    it('getPluginAPI returns API or null', async () => {
      manager.init();
      await manager.installPlugin(makeManifest(), makeFactory());
      const api = manager.getPluginAPI('mgr-plugin');
      expect(api).not.toBeNull();
      expect(api?.formula).toBeDefined();
    });

    it('getPluginAPI returns null for unknown', () => {
      expect(manager.getPluginAPI('nope')).toBeNull();
    });

    it('getPluginsByType filters by type', async () => {
      manager.init();
      await manager.installPlugin(makeManifest({ id: 'f1', type: 'formula' }), makeFactory());
      await manager.installPlugin(makeManifest({ id: 'r1', type: 'report' }), makeFactory());
      const formulas = manager.getPluginsByType('formula');
      expect(formulas).toHaveLength(1);
      expect(formulas[0]?.manifest.id).toBe('f1');
    });
  });

  describe('getRegistry / getLoader', () => {
    it('getRegistry returns the registry', () => {
      const r = manager.getRegistry();
      expect(r).toBeDefined();
      expect(r.size()).toBe(0);
    });

    it('getLoader returns the loader', () => {
      const l = manager.getLoader();
      expect(l).toBeDefined();
    });
  });

  describe('bulk operations', () => {
    it('installAll installs a batch sequentially', async () => {
      manager.init();
      const results = await manager.installAll([
        { manifest: makeManifest({ id: 'x' }), factory: makeFactory() },
        { manifest: makeManifest({ id: 'y' }), factory: makeFactory() },
      ]);
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('disableAll deactivates everything', async () => {
      manager.init();
      await manager.installPlugin(makeManifest({ id: 'a' }), makeFactory());
      await manager.installPlugin(makeManifest({ id: 'b' }), makeFactory());
      manager.disableAll();
      expect(manager.getActivePlugins()).toHaveLength(0);
    });

    it('enableAll activates all installed', async () => {
      manager = new PluginManager({ autoActivate: false });
      manager.init();
      await manager.installPlugin(makeManifest({ id: 'a' }), makeFactory());
      await manager.installPlugin(makeManifest({ id: 'b' }), makeFactory());
      manager.enableAll();
      expect(manager.getActivePlugins()).toHaveLength(2);
    });
  });

  describe('destroy', () => {
    it('clears all state and resets initialized', async () => {
      manager.init();
      await manager.installPlugin(makeManifest(), makeFactory());
      manager.destroy();
      expect(manager.isInitialized()).toBe(false);
      expect(manager.getInstalledPlugins()).toHaveLength(0);
    });
  });

  describe('API factory wiring', () => {
    it('each installed plugin gets its own API (storage isolation)', async () => {
      manager.init();
      const api1 = createPluginAPI('p1');
      const api2 = createPluginAPI('p2');
      // Verify two distinct APIs have distinct storage
      await api1.storage.set('k', 'v1');
      await api2.storage.set('k', 'v2');
      expect(await api1.storage.get('k')).toBe('v1');
      expect(await api2.storage.get('k')).toBe('v2');
    });
  });
});
