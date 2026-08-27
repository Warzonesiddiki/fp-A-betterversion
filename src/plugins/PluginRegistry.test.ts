import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginRegistry } from './PluginRegistry';
import { PluginSandboxViolationError } from './PluginSandbox';
import { createPluginAPI } from './PluginAPI';
import type { PluginManifest, Plugin } from './types';

function makeManifest(overrides: Partial<PluginManifest> = {}): PluginManifest {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin',
    author: 'Test',
    type: 'formula',
    entry: 'index.js',
    permissions: ['read-data'],
    ...overrides,
  };
}

function makePlugin(): Plugin {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    init: vi.fn(),
    destroy: vi.fn(),
  };
}

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  describe('register', () => {
    it('registers a plugin', () => {
      const manifest = makeManifest();
      const entry = registry.register(manifest);
      expect(entry.manifest.id).toBe('test-plugin');
      expect(entry.state).toBe('installed');
      expect(registry.size()).toBe(1);
    });

    it('throws on duplicate registration', () => {
      registry.register(makeManifest());
      expect(() => registry.register(makeManifest())).toThrow('already registered');
    });

    it('emits install event', () => {
      const handler = vi.fn();
      registry.on('install', handler);
      registry.register(makeManifest());
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ pluginId: 'test-plugin', type: 'install' })
      );
    });
  });

  describe('unregister', () => {
    it('removes a plugin', () => {
      registry.register(makeManifest());
      expect(registry.unregister('test-plugin')).toBe(true);
      expect(registry.size()).toBe(0);
    });

    it('returns false for unknown id', () => {
      expect(registry.unregister('nope')).toBe(false);
    });

    it('deactivates before removing', () => {
      const plugin = makePlugin();
      registry.register(makeManifest(), plugin);
      const api = createPluginAPI('test-plugin');
      registry.setAPI('test-plugin', api);
      registry.activate('test-plugin');
      registry.unregister('test-plugin');
      expect(plugin.destroy).toHaveBeenCalled();
    });
  });

  describe('activate / deactivate', () => {
    it('activates a plugin', () => {
      const plugin = makePlugin();
      registry.register(makeManifest(), plugin);
      const api = createPluginAPI('test-plugin');
      registry.setAPI('test-plugin', api);
      expect(registry.activate('test-plugin')).toBe(true);
      expect(registry.get('test-plugin')?.state).toBe('active');
      expect(plugin.init).toHaveBeenCalledWith(api);
    });

    it('returns true if already active', () => {
      registry.register(makeManifest());
      registry.activate('test-plugin');
      expect(registry.activate('test-plugin')).toBe(true);
    });

    it('returns false for unknown id', () => {
      expect(registry.activate('nope')).toBe(false);
    });

    it('checks dependencies before activating', () => {
      registry.register(makeManifest({ id: 'dep', name: 'Dep', dependencies: [] }));
      registry.activate('dep');
      registry.register(makeManifest({ id: 'main', name: 'Main', dependencies: ['dep'] }));
      expect(registry.activate('main')).toBe(true);
    });

    it('fails activation if dependency not active', () => {
      registry.register(makeManifest({ id: 'dep', name: 'Dep' }));
      // dep is installed but not active
      registry.register(makeManifest({ id: 'main', name: 'Main', dependencies: ['dep'] }));
      expect(registry.activate('main')).toBe(false);
      expect(registry.get('main')?.state).toBe('error');
    });

    it('fails activation if conflict is active', () => {
      registry.register(makeManifest({ id: 'a', name: 'A' }));
      registry.activate('a');
      registry.register(makeManifest({ id: 'b', name: 'B', conflicts: ['a'] }));
      expect(registry.activate('b')).toBe(false);
      expect(registry.get('b')?.state).toBe('error');
    });

    it('deactivates a plugin', () => {
      const plugin = makePlugin();
      registry.register(makeManifest(), plugin);
      const api = createPluginAPI('test-plugin');
      registry.setAPI('test-plugin', api);
      registry.activate('test-plugin');
      expect(registry.deactivate('test-plugin')).toBe(true);
      expect(registry.get('test-plugin')?.state).toBe('installed');
      expect(plugin.destroy).toHaveBeenCalled();
    });

    it('returns false when deactivating non-active plugin', () => {
      registry.register(makeManifest());
      expect(registry.deactivate('test-plugin')).toBe(false);
    });

    it('fails deactivation if another plugin depends on it', () => {
      registry.register(makeManifest({ id: 'dep', name: 'Dep' }));
      const api = createPluginAPI('dep');
      registry.setAPI('dep', api);
      registry.activate('dep');
      registry.register(makeManifest({ id: 'main', name: 'Main', dependencies: ['dep'] }));
      const api2 = createPluginAPI('main');
      registry.setAPI('main', api2);
      registry.activate('main');
      expect(registry.deactivate('dep')).toBe(false);
    });

    it('handles init throwing', () => {
      const plugin = makePlugin();
      plugin.init = vi.fn(() => {
        throw new Error('init failed');
      });
      registry.register(makeManifest(), plugin);
      const api = createPluginAPI('test-plugin');
      registry.setAPI('test-plugin', api);
      expect(registry.activate('test-plugin')).toBe(false);
      expect(registry.get('test-plugin')?.state).toBe('error');
      expect(registry.get('test-plugin')?.lastError).toBe('init failed');
    });

    it('emits activate event', () => {
      const handler = vi.fn();
      registry.on('activate', handler);
      registry.register(makeManifest());
      registry.activate('test-plugin');
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'activate' }));
    });

    it('emits deactivate event', () => {
      const handler = vi.fn();
      registry.on('deactivate', handler);
      registry.register(makeManifest());
      registry.activate('test-plugin');
      registry.deactivate('test-plugin');
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'deactivate' }));
    });
  });

  describe('queries', () => {
    it('get returns entry', () => {
      registry.register(makeManifest());
      expect(registry.get('test-plugin')).toBeDefined();
    });

    it('get returns undefined for unknown', () => {
      expect(registry.get('nope')).toBeUndefined();
    });

    it('list returns all entries', () => {
      registry.register(makeManifest({ id: 'a', name: 'A' }));
      registry.register(makeManifest({ id: 'b', name: 'B' }));
      expect(registry.list()).toHaveLength(2);
    });

    it('getByType filters by type', () => {
      registry.register(makeManifest({ id: 'a', name: 'A', type: 'formula' }));
      registry.register(makeManifest({ id: 'b', name: 'B', type: 'export' }));
      expect(registry.getByType('formula')).toHaveLength(1);
    });

    it('getByState filters by state', () => {
      registry.register(makeManifest({ id: 'a', name: 'A' }));
      registry.register(makeManifest({ id: 'b', name: 'B' }));
      registry.activate('a');
      expect(registry.getByState('active')).toHaveLength(1);
      expect(registry.getByState('installed')).toHaveLength(1);
    });

    it('has returns boolean', () => {
      expect(registry.has('test-plugin')).toBe(false);
      registry.register(makeManifest());
      expect(registry.has('test-plugin')).toBe(true);
    });

    it('hasPermission checks permission', () => {
      registry.register(makeManifest({ permissions: ['read-data', 'network'] }));
      expect(registry.hasPermission('test-plugin', 'read-data')).toBe(true);
      expect(registry.hasPermission('test-plugin', 'write-data')).toBe(false);
    });

    it('size returns count', () => {
      expect(registry.size()).toBe(0);
      registry.register(makeManifest());
      expect(registry.size()).toBe(1);
    });
  });

  describe('events', () => {
    it('off removes handler', () => {
      const handler = vi.fn();
      registry.on('install', handler);
      registry.off('install', handler);
      registry.register(makeManifest());
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('storage', () => {
    it('set and get storage value', () => {
      registry.register(makeManifest());
      registry.setStorageValue('test-plugin', 'key1', 'value1');
      expect(registry.getStorageValue('test-plugin', 'key1')).toBe('value1');
    });

    it('getStorage returns map', () => {
      registry.register(makeManifest());
      registry.setStorageValue('test-plugin', 'k', 42);
      const storage = registry.getStorage('test-plugin');
      expect(storage?.get('k')).toBe(42);
    });
  });

  describe('clear', () => {
    it('clears all entries', () => {
      registry.register(makeManifest({ id: 'a', name: 'A' }));
      registry.register(makeManifest({ id: 'b', name: 'B' }));
      registry.clear();
      expect(registry.size()).toBe(0);
    });
  });

  describe('P0-03 sandbox enforcement at register', () => {
    it('rejects a manifest whose entry is inline code containing eval', () => {
      const handler = vi.fn();
      registry.on('install', handler);
      let thrown: unknown = null;
      try {
        registry.register(
          makeManifest({
            id: 'evil-eval-entry',
            entry: `(function(){ return eval("1+1"); })();`,
          })
        );
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(PluginSandboxViolationError);
      const err = thrown as PluginSandboxViolationError;
      expect(err.pluginId).toBe('evil-eval-entry');
      expect(err.violations.length).toBeGreaterThan(0);
      expect(err.message).toMatch(/eval/i);
      expect(registry.has('evil-eval-entry')).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });

    it('rejects prototype-chain escape inline entry', () => {
      let thrown: unknown = null;
      try {
        registry.register(
          makeManifest({
            id: 'evil-proto-entry',
            entry: `(function(){ var o={}; return o.constructor.constructor("return 1")(); })();`,
          })
        );
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(PluginSandboxViolationError);
      expect((thrown as PluginSandboxViolationError).message).toMatch(
        /forbidden property|constructor/i
      );
      expect(registry.has('evil-proto-entry')).toBe(false);
    });

    it('fails closed on unparseable inline entry', () => {
      let thrown: unknown = null;
      try {
        registry.register(
          makeManifest({
            id: 'evil-parse-entry',
            entry: `(function(){ var o = ; })();`,
          })
        );
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(PluginSandboxViolationError);
      expect((thrown as PluginSandboxViolationError).message).toMatch(/parse error/i);
      expect(registry.has('evil-parse-entry')).toBe(false);
    });

    it('installs unchanged when entry is a module path', () => {
      const entry = registry.register(makeManifest({ id: 'path-entry' }));
      expect(entry.state).toBe('installed');
      expect(registry.has('path-entry')).toBe(true);
    });

    it('installs unchanged when inline entry passes the sandbox scan', () => {
      const entry = registry.register(
        makeManifest({
          id: 'good-inline-entry',
          entry: `(function(){ var x = Math.max(1, 2); return { id: "x" }; })();`,
        })
      );
      expect(entry.state).toBe('installed');
      expect(registry.has('good-inline-entry')).toBe(true);
    });
  });
});
