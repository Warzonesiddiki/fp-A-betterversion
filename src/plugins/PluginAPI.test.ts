/**
 * PluginAPI tests — P0 coverage for G6 (plugins ≥80%)
 * Mnemosyne ownership: src/plugins/*.test.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPluginAPI } from './PluginAPI';
import type { PluginAPI } from './types';

describe('createPluginAPI', () => {
  let api: PluginAPI;

  beforeEach(() => {
    api = createPluginAPI('test-plugin');
  });

  describe('namespace exposure', () => {
    it('exposes formula namespace', () => {
      expect(api.formula).toBeDefined();
      expect(api.formula.registerFunction).toBeTypeOf('function');
      expect(api.formula.unregisterFunction).toBeTypeOf('function');
      expect(api.formula.listFunctions).toBeTypeOf('function');
    });

    it('exposes reports namespace', () => {
      expect(api.reports).toBeDefined();
      expect(api.reports.registerTemplate).toBeTypeOf('function');
      expect(api.reports.listTemplates).toBeTypeOf('function');
    });

    it('exposes storage namespace', () => {
      expect(api.storage).toBeDefined();
      expect(api.storage.get).toBeTypeOf('function');
      expect(api.storage.set).toBeTypeOf('function');
      expect(api.storage.delete).toBeTypeOf('function');
      expect(api.storage.clear).toBeTypeOf('function');
      expect(api.storage.keys).toBeTypeOf('function');
    });

    it('exposes ui namespace', () => {
      expect(api.ui).toBeDefined();
      expect(api.ui.showNotification).toBeTypeOf('function');
      expect(api.ui.showDialog).toBeTypeOf('function');
      expect(api.ui.registerMenuItem).toBeTypeOf('function');
      expect(api.ui.registerToolbarButton).toBeTypeOf('function');
    });

    it('exposes dashboards, export, import, workflows, log namespaces', () => {
      expect(api.dashboards).toBeDefined();
      expect(api.export).toBeDefined();
      expect(api.import).toBeDefined();
      expect(api.workflows).toBeDefined();
      expect(api.log).toBeDefined();
    });

    it('exposes events namespace with on/emit/off', () => {
      expect(api.events).toBeDefined();
      expect(api.events.on).toBeTypeOf('function');
      expect(api.events.emit).toBeTypeOf('function');
      expect(api.events.off).toBeTypeOf('function');
    });
  });

  describe('storage', () => {
    it('round-trips primitive values', async () => {
      await api.storage.set('k1', 'hello');
      expect(await api.storage.get('k1')).toBe('hello');
    });

    it('returns null for missing keys', async () => {
      expect(await api.storage.get('missing')).toBeNull();
    });

    it('stores objects as JSON', async () => {
      const obj = { a: 1, b: [2, 3] };
      await api.storage.set('o', obj);
      expect(await api.storage.get('o')).toEqual(obj);
    });

    it('keys() returns only keys for this plugin', async () => {
      const api2 = createPluginAPI('other-plugin');
      await api.storage.set('x', 1);
      await api2.storage.set('y', 2);
      const mine = await api.storage.keys();
      expect(mine).toEqual(['x']);
    });

    it('delete removes key', async () => {
      await api.storage.set('k', 'v');
      await api.storage.delete('k');
      expect(await api.storage.get('k')).toBeNull();
    });

    it('clear wipes all keys for this plugin', async () => {
      await api.storage.set('a', 1);
      await api.storage.set('b', 2);
      await api.storage.clear();
      expect(await api.storage.keys()).toEqual([]);
    });
  });

  describe('events', () => {
    it('on / emit delivers payload', () => {
      const handler = vi.fn();
      api.events.on('hello', handler);
      api.events.emit('hello', { x: 1 });
      expect(handler).toHaveBeenCalledWith({ x: 1 });
    });

    it('off removes the handler', () => {
      const handler = vi.fn();
      api.events.on('hello', handler);
      api.events.off('hello', handler);
      api.events.emit('hello', {});
      expect(handler).not.toHaveBeenCalled();
    });

    it('multiple handlers all fire', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      api.events.on('multi', h1);
      api.events.on('multi', h2);
      api.events.emit('multi', 42);
      expect(h1).toHaveBeenCalledWith(42);
      expect(h2).toHaveBeenCalledWith(42);
    });

    it('a handler exception does not stop other handlers', () => {
      const err = vi.fn();
      const ok = vi.fn();
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        err();
      });
      api.events.on('boom', () => {
        throw new Error('explode');
      });
      api.events.on('boom', ok);
      api.events.emit('boom', 'data');
      expect(err).toHaveBeenCalled();
      expect(ok).toHaveBeenCalled();
      errSpy.mockRestore();
    });
  });

  describe('ui.showNotification', () => {
    it('logs the notification with the level and message', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {
        /* swallow */
      });
      api.ui.showNotification('hello world', 'info');
      expect(spy).toHaveBeenCalledWith('[Plugin:info] hello world');
      spy.mockRestore();
    });

    it('accepts warn and error levels (all currently use console.log)', () => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {
        /* swallow */
      });
      api.ui.showNotification('w', 'warn');
      api.ui.showNotification('e', 'error');
      // Implementation detail: showNotification always routes to console.log.
      // (A future fix should route warn→console.warn, error→console.error.)
      expect(log).toHaveBeenCalledWith('[Plugin:warn] w');
      expect(log).toHaveBeenCalledWith('[Plugin:error] e');
      log.mockRestore();
    });
  });

  describe('ui.showDialog', () => {
    it('returns a default OK result', async () => {
      const r = await api.ui.showDialog({ title: 't', message: 'm' });
      expect(r.button).toBe('ok');
    });
  });

  describe('ui.registerMenuItem / registerToolbarButton', () => {
    it('registerMenuItem is callable', () => {
      expect(() =>
        api.ui.registerMenuItem('file', { id: 'm1', label: 'M1', action: () => undefined })
      ).not.toThrow();
    });

    it('registerToolbarButton is callable', () => {
      expect(() =>
        api.ui.registerToolbarButton({
          id: 'b1',
          label: 'B1',
          icon: 'icon',
          action: () => undefined,
        })
      ).not.toThrow();
    });
  });

  describe('formula namespace', () => {
    it('registerFunction then listFunctions reflects the new function', () => {
      api.formula.registerFunction('myFn', {
        description: 'desc',
        category: 'cat',
        parameters: [],
        returnType: 'number',
        execute: () => 42,
      });
      const fns = api.formula.listFunctions();
      expect(fns.some((f) => f.description === 'desc')).toBe(true);
    });

    it('unregisterFunction removes the function', () => {
      api.formula.registerFunction('f1', {
        description: 'f1',
        category: 'c',
        parameters: [],
        returnType: 'number',
        execute: () => 0,
      });
      api.formula.unregisterFunction('f1');
      const fns = api.formula.listFunctions();
      expect(fns.some((f) => f.description === 'f1')).toBe(false);
    });
  });

  describe('reports / import / export / dashboards / workflows', () => {
    it('reports.registerTemplate and listTemplates round-trip', () => {
      api.reports.registerTemplate({
        id: 'r1',
        name: 'R1',
        sections: [],
      });
      expect(api.reports.listTemplates().find((t) => t.id === 'r1')).toBeDefined();
      api.reports.unregisterTemplate('r1');
      expect(api.reports.listTemplates().find((t) => t.id === 'r1')).toBeUndefined();
    });

    it('import.registerConnector and listConnectors round-trip', () => {
      api.import.registerConnector({
        id: 'c1',
        name: 'C1',
        extensions: ['.xlsx'],
        detect: () => true,
        parse: async () => ({ headers: [], rows: [] }),
      });
      expect(api.import.listConnectors().find((c) => c.id === 'c1')).toBeDefined();
    });

    it('export.registerFormat and listFormats round-trip', () => {
      api.export.registerFormat({
        id: 'f1',
        name: 'F1',
        extension: '.f1',
        generate: async () => new Blob(['x']),
      });
      expect(api.export.listFormats().find((c) => c.id === 'f1')).toBeDefined();
    });

    it('dashboards.registerWidget and listWidgets round-trip', () => {
      api.dashboards.registerWidget({
        id: 'w1',
        name: 'W1',
        category: 'kpi',
        defaultSize: { width: 1, height: 1 },
        config: {},
        render: () => undefined,
      });
      expect(api.dashboards.listWidgets().find((c) => c.id === 'w1')).toBeDefined();
    });

    it('workflows.registerRule and listRules round-trip', () => {
      api.workflows.registerRule({
        id: 'rule1',
        name: 'R1',
        trigger: 'on-save',
        conditions: [],
        actions: [],
      });
      expect(api.workflows.listRules().find((c) => c.id === 'rule1')).toBeDefined();
    });
  });

  describe('log namespace', () => {
    let infoSpy: ReturnType<typeof vi.spyOn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;
    let errorSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      infoSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });
    afterEach(() => {
      infoSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('log.info prefixes with plugin id and forwards args', () => {
      api.log.info('msg', 1, 2);
      expect(infoSpy).toHaveBeenCalledWith('[Plugin:test-plugin] msg', 1, 2);
    });

    it('log.warn routes to console.warn with plugin id prefix', () => {
      api.log.warn('w');
      expect(warnSpy).toHaveBeenCalledWith('[Plugin:test-plugin] w');
    });

    it('log.error routes to console.error with plugin id prefix', () => {
      api.log.error('e');
      expect(errorSpy).toHaveBeenCalledWith('[Plugin:test-plugin] e');
    });
  });

  describe('isolation', () => {
    it('two plugins have distinct storage namespaces', async () => {
      const a = createPluginAPI('a');
      const b = createPluginAPI('b');
      await a.storage.set('shared', 'from-a');
      await b.storage.set('shared', 'from-b');
      expect(await a.storage.get('shared')).toBe('from-a');
      expect(await b.storage.get('shared')).toBe('from-b');
    });

    it('two plugins have distinct event buses', () => {
      const a = createPluginAPI('a');
      const b = createPluginAPI('b');
      const handler = vi.fn();
      a.events.on('x', handler);
      b.events.emit('x', 1);
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
