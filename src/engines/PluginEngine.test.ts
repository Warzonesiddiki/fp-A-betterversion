/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PluginEngine } from './PluginEngine';
import type { PluginManifest, Plugin, PluginAPI } from '@/types/plugin';

function makeManifest(overrides: Partial<PluginManifest> = {}): PluginManifest {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin',
    author: 'Test',
    license: 'MIT',
    type: 'formula',
    entry: './test-plugin',
    permissions: ['read-data'],
    dependencies: [],
    conflicts: [],
    tags: [],
    ...overrides,
  };
}

class TestPlugin implements Plugin {
  id = 'test-plugin';
  name = 'Test Plugin';
  version = '1.0.0';
  api!: PluginAPI;
  initCalls = 0;
  destroyCalls = 0;

  init(api: PluginAPI): void {
    this.api = api;
    this.initCalls++;
  }

  destroy(): void {
    this.destroyCalls++;
  }
}

describe('PluginEngine', () => {
  let engine: PluginEngine;

  beforeEach(() => {
    engine = new PluginEngine();
  });

  const pluginModule = { default: TestPlugin as unknown as new () => Plugin };

  describe('discover', () => {
    it('returns empty array (manual registration only)', async () => {
      const result = await engine.discover(['/some/path']);
      expect(result).toEqual([]);
    });
  });

  describe('install', () => {
    it('installs a valid plugin', async () => {
      const manifest = makeManifest();
      const instance = await engine.install(manifest, pluginModule);
      expect(instance.status).toBe('initialized');
      expect(instance.manifest.id).toBe('test-plugin');
    });

    it('calls plugin.init on install', async () => {
      const manifest = makeManifest();
      const instance = await engine.install(manifest, pluginModule);
      expect((instance.plugin as unknown as TestPlugin).initCalls).toBe(1);
    });

    it('rejects plugin with missing id', async () => {
      const manifest = makeManifest({ id: '' });
      await expect(engine.install(manifest, pluginModule)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('rejects plugin with invalid id format', async () => {
      const manifest = makeManifest({ id: 'INVALID_ID!' });
      await expect(engine.install(manifest, pluginModule)).rejects.toThrow('lowercase');
    });

    it('rejects plugin with missing type', async () => {
      const manifest = makeManifest({ type: '' as any });
      await expect(engine.install(manifest, pluginModule)).rejects.toThrow('Missing plugin type');
    });

    it('rejects plugin with missing entry', async () => {
      const manifest = makeManifest({ entry: '' });
      await expect(engine.install(manifest, pluginModule)).rejects.toThrow('Missing entry point');
    });

    it('rejects plugin with conflicting dependency', async () => {
      const dep = makeManifest({ id: 'dep-plugin' });
      await engine.install(dep, pluginModule);
      const conflict = makeManifest({ id: 'conflict-plugin', conflicts: ['dep-plugin'] });
      await expect(engine.install(conflict, pluginModule)).rejects.toThrow(
        'conflicts with installed'
      );
    });

    it('rejects plugin with missing dependency', async () => {
      const manifest = makeManifest({ dependencies: ['missing-dep'] });
      await expect(engine.install(manifest, pluginModule)).rejects.toThrow('Missing dependency');
    });

    it('rejects plugin requiring higher FinPlan version', async () => {
      const manifest = makeManifest({ minFinPlanVersion: '99.0.0' });
      await expect(engine.install(manifest, pluginModule)).rejects.toThrow('Requires FinPlan Pro');
    });
  });

  describe('uninstall', () => {
    it('uninstalls an installed plugin', async () => {
      const manifest = makeManifest();
      await engine.install(manifest, pluginModule);
      await engine.uninstall('test-plugin');
      expect(engine.getPlugin('test-plugin')).toBeUndefined();
    });

    it('calls plugin.destroy on uninstall', async () => {
      const manifest = makeManifest();
      const instance = await engine.install(manifest, pluginModule);
      await engine.uninstall('test-plugin');
      expect((instance.plugin as unknown as TestPlugin).destroyCalls).toBe(1);
    });

    it('throws for non-existent plugin', async () => {
      await expect(engine.uninstall('nonexistent')).rejects.toThrow('Plugin not found');
    });
  });

  describe('enable / disable', () => {
    it('disables a plugin', async () => {
      await engine.install(makeManifest(), pluginModule);
      await engine.disable('test-plugin');
      expect(engine.getPlugin('test-plugin')?.status).toBe('disabled');
    });

    it('re-enables a disabled plugin', async () => {
      await engine.install(makeManifest(), pluginModule);
      await engine.disable('test-plugin');
      await engine.enable('test-plugin');
      expect(engine.getPlugin('test-plugin')?.status).toBe('running');
    });

    it('throws for non-existent plugin', async () => {
      await expect(engine.disable('nonexistent')).rejects.toThrow('Plugin not found');
      await expect(engine.enable('nonexistent')).rejects.toThrow('Plugin not found');
    });
  });

  describe('query', () => {
    it('getPlugin returns installed plugin', async () => {
      await engine.install(makeManifest(), pluginModule);
      expect(engine.getPlugin('test-plugin')).toBeDefined();
    });

    it('getAllPlugins returns all installed', async () => {
      await engine.install(makeManifest({ id: 'p1' }), pluginModule);
      await engine.install(makeManifest({ id: 'p2' }), pluginModule);
      expect(engine.getAllPlugins().length).toBe(2);
    });

    it('getPluginsByType filters correctly', async () => {
      await engine.install(makeManifest({ id: 'eng', type: 'formula' }), pluginModule);
      await engine.install(makeManifest({ id: 'chart', type: 'dashboard' }), pluginModule);
      expect(engine.getPluginsByType('formula').length).toBe(1);
    });
  });

  describe('plugin API — formula registration', () => {
    it('registers formula function via plugin API', async () => {
      const instance = await engine.install(makeManifest(), pluginModule);
      const plugin = instance.plugin as unknown as TestPlugin;
      plugin.api.formula.registerFunction('CUSTOM_FUNC', {
        description: 'Test function',
        category: 'custom',
        parameters: [],
        returnType: 'number',
        execute: () => 42,
      });
      const funcs = engine.getRegisteredFormulaFunctions();
      expect(funcs.has('CUSTOM_FUNC')).toBe(true);
    });

    it('unregisters formula function', async () => {
      const instance = await engine.install(makeManifest(), pluginModule);
      const plugin = instance.plugin as unknown as TestPlugin;
      plugin.api.formula.registerFunction('TEMP_FUNC', {
        description: '',
        category: 'custom',
        parameters: [],
        returnType: 'number',
        execute: () => 0,
      });
      plugin.api.formula.unregisterFunction('TEMP_FUNC');
      expect(engine.getRegisteredFormulaFunctions().has('TEMP_FUNC')).toBe(false);
    });
  });

  describe('plugin API — storage', () => {
    it('stores and retrieves data', async () => {
      const instance = await engine.install(makeManifest(), pluginModule);
      const plugin = instance.plugin as unknown as TestPlugin;
      await plugin.api.storage.set('key1', { value: 42 });
      const result = await plugin.api.storage.get('key1');
      expect(result).toEqual({ value: 42 });
    });

    it('returns null for missing key', async () => {
      const instance = await engine.install(makeManifest(), pluginModule);
      const plugin = instance.plugin as unknown as TestPlugin;
      const result = await plugin.api.storage.get('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('plugin API — events', () => {
    it('registers and fires event handler', async () => {
      const instance = await engine.install(makeManifest(), pluginModule);
      const plugin = instance.plugin as unknown as TestPlugin;
      let received: unknown = null;
      plugin.api.events.on('test-event', (data) => {
        received = data;
      });
      plugin.api.events.emit('test-event', { hello: 'world' });
      expect(received).toEqual({ hello: 'world' });
    });

    it('unregisters event handler', async () => {
      const instance = await engine.install(makeManifest(), pluginModule);
      const plugin = instance.plugin as unknown as TestPlugin;
      let count = 0;
      const handler = () => {
        count++;
      };
      plugin.api.events.on('ev', handler);
      plugin.api.events.emit('ev', null);
      plugin.api.events.off('ev', handler);
      plugin.api.events.emit('ev', null);
      expect(count).toBe(1);
    });
  });
});
