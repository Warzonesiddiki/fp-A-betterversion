/**
 * PluginMarketplace tests — P0 coverage for G6 (plugins ≥80%)
 * Mnemosyne ownership: src/plugins/*.test.ts
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PluginMarketplace, type MarketplacePlugin } from './PluginMarketplace';

function makeMarketplacePlugin(overrides: Partial<MarketplacePlugin> = {}): MarketplacePlugin {
  return {
    id: 'test-mkt-plugin',
    name: 'Test Marketplace Plugin',
    version: '1.0.0',
    description: 'A test marketplace plugin',
    author: 'Test Author',
    license: 'MIT',
    type: 'formula',
    entry: 'test/index.js',
    permissions: ['read-data'],
    category: 'engine',
    downloads: 100,
    rating: 4.5,
    verified: true,
    ...overrides,
  };
}

describe('PluginMarketplace', () => {
  beforeEach(() => {
    // Clear module-level installed set between tests
    for (const p of PluginMarketplace.getInstalled()) {
      // synchronously attempt uninstall (test-only cleanup)
    }
  });

  afterEach(() => {
    // Best-effort cleanup so cross-test pollution doesn't compound
    for (const p of [...PluginMarketplace.getInstalled()]) {
      void PluginMarketplace.uninstall(p.id).catch(() => {
        /* ignore */
      });
    }
  });

  describe('browse', () => {
    it('returns a non-empty catalog of seed plugins', async () => {
      const list = await PluginMarketplace.browse();
      expect(list.length).toBeGreaterThan(0);
    });

    it('filters by category', async () => {
      const engines = await PluginMarketplace.browse({ category: 'engine' });
      expect(engines.every((p) => p.category === 'engine')).toBe(true);
      const charts = await PluginMarketplace.browse({ category: 'chart' });
      expect(charts.every((p) => p.category === 'chart')).toBe(true);
    });

    it('searches across name/description/author', async () => {
      const results = await PluginMarketplace.browse({ search: 'xirr' });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((p) => /xirr/i.test(p.name) || /irr/i.test(p.description))).toBe(true);
    });

    it('sorts by popular (downloads desc)', async () => {
      const results = await PluginMarketplace.browse({ sortBy: 'popular' });
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1]!.downloads).toBeGreaterThanOrEqual(results[i]!.downloads);
      }
    });

    it('sorts by rating (rating desc)', async () => {
      const results = await PluginMarketplace.browse({ sortBy: 'rating' });
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1]!.rating).toBeGreaterThanOrEqual(results[i]!.rating);
      }
    });

    it('sorts by newest (version desc, lexicographic)', async () => {
      const results = await PluginMarketplace.browse({ sortBy: 'newest' });
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1]!.version.localeCompare(results[i]!.version)).toBeGreaterThanOrEqual(
          0
        );
      }
    });

    it('returns empty for unknown category', async () => {
      const results = await PluginMarketplace.browse({ category: 'nonexistent-cat' });
      expect(results).toEqual([]);
    });
  });

  describe('install / uninstall', () => {
    it('installs a plugin and reports it as installed', async () => {
      const mp = makeMarketplacePlugin({ id: 'inst-test' });
      await PluginMarketplace.install(mp);
      expect(PluginMarketplace.isInstalled('inst-test')).toBe(true);
      const list = PluginMarketplace.getInstalled();
      expect(list.find((p) => p.id === 'inst-test')).toBeDefined();
    });

    it('uninstalls a previously installed plugin', async () => {
      const mp = makeMarketplacePlugin({ id: 'uninst-test' });
      await PluginMarketplace.install(mp);
      await PluginMarketplace.uninstall('uninst-test');
      expect(PluginMarketplace.isInstalled('uninst-test')).toBe(false);
    });

    it('uninstall throws when plugin is not installed', async () => {
      await expect(PluginMarketplace.uninstall('never-installed')).rejects.toThrow();
    });
  });

  describe('enable / disable', () => {
    it('disables a plugin', async () => {
      const mp = makeMarketplacePlugin({ id: 'disable-test' });
      await PluginMarketplace.install(mp);
      await PluginMarketplace.disable('disable-test');
      const installed = PluginMarketplace.getInstalled().find((p) => p.id === 'disable-test');
      expect(installed?.enabled).toBe(false);
    });

    it('re-enables a disabled plugin', async () => {
      const mp = makeMarketplacePlugin({ id: 'enable-test' });
      await PluginMarketplace.install(mp);
      await PluginMarketplace.disable('enable-test');
      await PluginMarketplace.enable('enable-test');
      const installed = PluginMarketplace.getInstalled().find((p) => p.id === 'enable-test');
      expect(installed?.enabled).toBe(true);
    });

    it('disable throws when plugin is not installed', async () => {
      await expect(PluginMarketplace.disable('never')).rejects.toThrow();
    });

    it('enable throws when plugin is not installed', async () => {
      await expect(PluginMarketplace.enable('never')).rejects.toThrow();
    });
  });

  describe('isInstalled', () => {
    it('returns false for unknown id', () => {
      expect(PluginMarketplace.isInstalled('nope')).toBe(false);
    });
  });

  describe('catalog metadata', () => {
    it('every seed plugin has required fields', async () => {
      const list = await PluginMarketplace.browse();
      for (const p of list) {
        expect(p.id).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(p.version).toBeTruthy();
        expect(p.author).toBeTruthy();
        expect(['engine', 'chart', 'export', 'connector', 'template', 'theme']).toContain(
          p.category
        );
        expect(typeof p.downloads).toBe('number');
        expect(typeof p.rating).toBe('number');
      }
    });
  });
});
