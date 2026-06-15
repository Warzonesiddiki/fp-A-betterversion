/**
 * PluginLoader tests — P0 coverage for G6 (plugins ≥80%)
 * Mnemosyne ownership: src/plugins/*.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginLoader } from './PluginLoader';
import { PluginRegistry } from './PluginRegistry';
import { createPluginAPI } from './PluginAPI';
import type { PluginManifest, Plugin, PluginAPI } from './types';

function makeManifest(overrides: Partial<PluginManifest> = {}): PluginManifest {
  return {
    id: 'loader-plugin',
    name: 'Loader Test Plugin',
    version: '1.0.0',
    description: 'A test plugin for loader',
    author: 'Test',
    type: 'formula',
    entry: 'index.js',
    permissions: ['read-data'],
    ...overrides,
  };
}

function makePlugin(): Plugin {
  return {
    id: 'loader-plugin',
    name: 'Loader Test Plugin',
    init: vi.fn(),
    destroy: vi.fn(),
  };
}

describe('PluginLoader', () => {
  let registry: PluginRegistry;
  let loader: PluginLoader;

  beforeEach(() => {
    registry = new PluginRegistry();
    loader = new PluginLoader(registry, (id: string) => createPluginAPI(id));
  });

  describe('validate', () => {
    it('accepts a valid manifest', () => {
      const result = loader.validate(makeManifest());
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('rejects manifest without id', () => {
      const result = loader.validate(makeManifest({ id: '' }));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => /id/i.test(e))).toBe(true);
    });

    it('rejects manifest without name', () => {
      const result = loader.validate(makeManifest({ name: '' }));
      expect(result.valid).toBe(false);
    });

    it('rejects manifest without version', () => {
      const result = loader.validate(makeManifest({ version: '' }));
      expect(result.valid).toBe(false);
    });

    it('rejects manifest without type', () => {
      const result = loader.validate(
        makeManifest({ type: undefined as unknown as PluginManifest['type'] })
      );
      expect(result.valid).toBe(false);
    });

    it('rejects manifest without entry', () => {
      const result = loader.validate(makeManifest({ entry: '' }));
      expect(result.valid).toBe(false);
    });

    it('rejects when permissions is not an array', () => {
      const result = loader.validate(
        makeManifest({ permissions: 'read-data' as unknown as string[] })
      );
      expect(result.valid).toBe(false);
    });

    it('rejects when minFinPlanVersion is higher than current', () => {
      const result = loader.validate(makeManifest({ minFinPlanVersion: '9.0.0' }));
      expect(result.valid).toBe(false);
    });

    it('accepts when minFinPlanVersion major matches and minor is ≤ current', () => {
      // CURRENT_VERSION is '1.0.0'. versionSatisfies checks major === and minor >=.
      // So minFinPlanVersion '1.0.0' passes.
      const result = loader.validate(makeManifest({ minFinPlanVersion: '1.0.0' }));
      expect(result.valid).toBe(true);
    });

    it('rejects duplicate registration', () => {
      registry.register(makeManifest());
      const result = loader.validate(makeManifest());
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => /already registered/i.test(e))).toBe(true);
    });

    it('rejects when conflicts with active plugin', () => {
      const conflict = makeManifest({ id: 'rival', state: 'active' } as Partial<PluginManifest>);
      registry.register(conflict, {
        id: 'rival',
        name: 'Rival',
        init: vi.fn(),
        destroy: vi.fn(),
      });
      registry.activate('rival');
      const result = loader.validate(makeManifest({ conflicts: ['rival'] }));
      expect(result.valid).toBe(false);
    });
  });

  describe('loadFromManifest', () => {
    it('loads and registers a valid plugin', async () => {
      const factory = (_api: PluginAPI): Plugin => makePlugin();
      const result = await loader.loadFromManifest(makeManifest(), factory);
      expect(result.success).toBe(true);
      expect(registry.size()).toBe(1);
    });

    it('returns error result for invalid manifest', async () => {
      const result = await loader.loadFromManifest(makeManifest({ id: '' }), () => makePlugin());
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('rejects plugin without init/destroy', async () => {
      const bad = { id: 'x', name: 'X', version: '1.0.0' } as unknown as Plugin;
      const result = await loader.loadFromManifest(makeManifest({ id: 'bad' }), () => bad);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/init|destroy/);
    });

    it('catches factory exceptions', async () => {
      const result = await loader.loadFromManifest(makeManifest({ id: 'throwy' }), () => {
        throw new Error('kaboom');
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('kaboom');
    });
  });

  describe('loadAll', () => {
    it('loads a batch sequentially and returns array of results', async () => {
      const factory = (_api: PluginAPI): Plugin => makePlugin();
      const results = await loader.loadAll([
        { manifest: makeManifest({ id: 'a' }), factory },
        { manifest: makeManifest({ id: 'b' }), factory },
      ]);
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('unload', () => {
    it('unloads a registered plugin', async () => {
      await loader.loadFromManifest(makeManifest(), () => makePlugin());
      expect(loader.unload('loader-plugin')).toBe(true);
      expect(registry.has('loader-plugin')).toBe(false);
    });

    it('returns false for unknown plugin', () => {
      expect(loader.unload('nope')).toBe(false);
    });
  });

  describe('reload', () => {
    it('unloads and reloads', async () => {
      const factory = (_api: PluginAPI): Plugin => makePlugin();
      await loader.loadFromManifest(makeManifest(), factory);
      const result = await loader.reload(makeManifest(), factory);
      expect(result.success).toBe(true);
      expect(registry.size()).toBe(1);
    });
  });

  describe('getCached / clearCache', () => {
    it('returns cached plugin instance', async () => {
      const p = makePlugin();
      await loader.loadFromManifest(makeManifest(), () => p);
      expect(loader.getCached('loader-plugin')).toBe(p);
    });

    it('clearCache removes all cached entries', async () => {
      await loader.loadFromManifest(makeManifest(), () => makePlugin());
      loader.clearCache();
      expect(loader.getCached('loader-plugin')).toBeUndefined();
    });
  });
});
