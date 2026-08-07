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
    permissions: ['read-data', 'write-data'],
    dependencies: [],
    conflicts: [],
    tags: ['finance', 'tax'],
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

  describe('plugin API — formula, UI, reports, dashboards, workflows, and storage', () => {
    it('registers and unregisters formula functions, report templates, dashboards and rules', async () => {
      const instance = await engine.install(makeManifest(), pluginModule);
      const plugin = instance.plugin as unknown as TestPlugin;

      plugin.api.ui.showNotification('Hello Plugin', 'info');
      plugin.api.ui.registerMenuItem('file', { label: 'Custom Item', action: () => {} });

      plugin.api.formula.registerFunction('CUSTOM_FUNC', {
        description: 'Test function',
        category: 'custom',
        parameters: [],
        returnType: 'number',
        execute: () => 42,
      });
      expect(engine.getRegisteredFormulaFunctions().has('CUSTOM_FUNC')).toBe(true);
      expect(plugin.api.formula.listFunctions().length).toBe(1);

      plugin.api.formula.unregisterFunction('CUSTOM_FUNC');
      expect(engine.getRegisteredFormulaFunctions().has('CUSTOM_FUNC')).toBe(false);

      plugin.api.reports.registerTemplate({ id: 'tmpl-1', name: 'Custom Report', sections: [] });
      plugin.api.reports.unregisterTemplate('tmpl-1');

      plugin.api.dashboards.registerWidget({
        id: 'widget-1',
        name: 'Custom Widget',
        type: 'chart',
      });
      plugin.api.dashboards.unregisterWidget('widget-1');

      plugin.api.workflows.registerRule({
        id: 'rule-1',
        name: 'Approval Rule',
        trigger: 'close',
        action: 'notify',
      });
      plugin.api.workflows.unregisterRule('rule-1');

      plugin.api.export.registerFormat({
        id: 'custom-fmt',
        name: 'Custom Export',
        extension: 'cx',
      });
      plugin.api.import.registerConnector({
        id: 'custom-conn',
        name: 'Custom DB',
        connect: async () => true,
      });

      plugin.api.log.info('Info message');
      plugin.api.log.warn('Warn message');
      plugin.api.log.error('Error message');

      const cells = await plugin.api.data.readCells();
      const model = await plugin.api.data.readModel();
      expect(cells).toEqual([]);
      expect(model).toEqual({});
    });

    it('stores, retrieves, deletes, and clears data', async () => {
      const instance = await engine.install(makeManifest(), pluginModule);
      const plugin = instance.plugin as unknown as TestPlugin;

      await plugin.api.storage.set('key1', { value: 42 });
      const result = await plugin.api.storage.get('key1');
      expect(result).toEqual({ value: 42 });

      await plugin.api.storage.delete('key1');
      expect(await plugin.api.storage.get('key1')).toBeNull();

      await plugin.api.storage.set('k2', 'val');
      await plugin.api.storage.clear();
      expect(await plugin.api.storage.get('k2')).toBeNull();
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
