/**
 * PluginMarketplace tests — P0 coverage for G6 (plugins ≥80%)
 * Mnemosyne ownership: src/plugins/*.test.ts
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  APP_PLUGIN_API_VERSION,
  MarketplaceInstallError,
  PluginMarketplace,
  type MarketplaceConsentRecord,
  type MarketplaceInstallOptions,
  type MarketplacePlugin,
} from './PluginMarketplace';
import type { Plugin, PluginAPI } from './types';

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

/** Minimal valid plugin module factory (passes the loader interface check). */
function okFactory(_api: PluginAPI): Plugin {
  return { id: 'factory-product', name: 'Factory Product', init: () => {}, destroy: () => {} };
}

/** Factory whose product fails the loader's init/destroy interface check. */
function invalidFactory(_api: PluginAPI): Plugin {
  return {} as Plugin;
}

function consentFor(mp: MarketplacePlugin, granted = mp.permissions): MarketplaceConsentRecord {
  return { pluginId: mp.id, permissions: granted, grantedAt: '2026-08-24T00:00:00.000Z' };
}

function installOptionsFor(
  mp: MarketplacePlugin,
  overrides: Partial<MarketplaceInstallOptions> = {}
): MarketplaceInstallOptions {
  return { factory: okFactory, consent: consentFor(mp), ...overrides };
}

/** Capture the rejection value instead of relying on toThrow matchers alone. */
async function captureRejection(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => null,
    (e: unknown) => e
  );
}

describe('PluginMarketplace', () => {
  beforeEach(() => {
    // Clear module-level installed set between tests
    for (const _p of PluginMarketplace.getInstalled()) {
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
      await PluginMarketplace.install(mp, installOptionsFor(mp));
      expect(PluginMarketplace.isInstalled('inst-test')).toBe(true);
      const list = PluginMarketplace.getInstalled();
      expect(list.find((p) => p.id === 'inst-test')).toBeDefined();
    });

    it('uninstalls a previously installed plugin', async () => {
      const mp = makeMarketplacePlugin({ id: 'uninst-test' });
      await PluginMarketplace.install(mp, installOptionsFor(mp));
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
      await PluginMarketplace.install(mp, installOptionsFor(mp));
      await PluginMarketplace.disable('disable-test');
      const installed = PluginMarketplace.getInstalled().find((p) => p.id === 'disable-test');
      expect(installed?.enabled).toBe(false);
    });

    it('re-enables a disabled plugin', async () => {
      const mp = makeMarketplacePlugin({ id: 'enable-test' });
      await PluginMarketplace.install(mp, installOptionsFor(mp));
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

  // -------------------------------------------------------------------------
  // Wave-7E marketplace-integrity: load-result gating, semver engine gate,
  // explicit permission consent (default-deny), surfaced validation errors.
  // -------------------------------------------------------------------------

  describe('APP_PLUGIN_API_VERSION', () => {
    it('is an exported full semver string', () => {
      expect(typeof APP_PLUGIN_API_VERSION).toBe('string');
      expect(APP_PLUGIN_API_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('marketplace integrity (Wave-7E)', () => {
    it('happy path: compatible plugin with valid factory + consent installs', async () => {
      const mp = makeMarketplacePlugin({ id: 'integrity-happy' });
      await expect(PluginMarketplace.install(mp, installOptionsFor(mp))).resolves.toBeUndefined();
      expect(PluginMarketplace.isInstalled('integrity-happy')).toBe(true);
    });

    it('failed load does NOT register and throws MarketplaceInstallError(load-failed)', async () => {
      const mp = makeMarketplacePlugin({ id: 'integrity-bad-factory' });
      const err = await captureRejection(
        PluginMarketplace.install(mp, installOptionsFor(mp, { factory: invalidFactory }))
      );
      expect(err).toBeInstanceOf(MarketplaceInstallError);
      const installErr = err as MarketplaceInstallError;
      expect(installErr.code).toBe('load-failed');
      expect(installErr.pluginId).toBe('integrity-bad-factory');
      expect(installErr.message).toContain('integrity-bad-factory');
      expect(PluginMarketplace.isInstalled('integrity-bad-factory')).toBe(false);
      expect(PluginMarketplace.getInstalled().some((p) => p.id === mp.id)).toBe(false);
    });

    it('surfaces loader validation errors instead of swallowing them', async () => {
      const mp = makeMarketplacePlugin({ id: 'integrity-invalid-manifest', entry: '' });
      const err = await captureRejection(PluginMarketplace.install(mp, installOptionsFor(mp)));
      expect(err).toBeInstanceOf(MarketplaceInstallError);
      const installErr = err as MarketplaceInstallError;
      expect(installErr.code).toBe('load-failed');
      expect(String(installErr.detail)).toContain('entry point');
      expect(PluginMarketplace.isInstalled(mp.id)).toBe(false);
    });

    it('rejects incompatible manifest.engineVersion with the reason', async () => {
      const mp = makeMarketplacePlugin({
        id: 'integrity-engine-mismatch',
        engineVersion: '^2.0.0',
      });
      const err = await captureRejection(PluginMarketplace.install(mp, installOptionsFor(mp)));
      expect(err).toBeInstanceOf(MarketplaceInstallError);
      const installErr = err as MarketplaceInstallError;
      expect(installErr.code).toBe('incompatible-version');
      expect(installErr.message).toContain('^2.0.0');
      expect(installErr.message).toContain(APP_PLUGIN_API_VERSION);
      expect(PluginMarketplace.isInstalled(mp.id)).toBe(false);
    });

    it('accepts a compatible engineVersion range', async () => {
      const mp = makeMarketplacePlugin({ id: 'integrity-engine-match', engineVersion: '^1.0.0' });
      await expect(PluginMarketplace.install(mp, installOptionsFor(mp))).resolves.toBeUndefined();
      expect(PluginMarketplace.isInstalled(mp.id)).toBe(true);
    });

    it('enforces minAppVersion floor against the app plugin API version', async () => {
      const mp = makeMarketplacePlugin({ id: 'integrity-floor', minAppVersion: '9.9.9' });
      const err = await captureRejection(PluginMarketplace.install(mp, installOptionsFor(mp)));
      expect(err).toBeInstanceOf(MarketplaceInstallError);
      expect((err as MarketplaceInstallError).code).toBe('incompatible-version');
      expect(PluginMarketplace.isInstalled(mp.id)).toBe(false);
    });

    it('missing dependency rejects with typed code', async () => {
      const mp = makeMarketplacePlugin({ id: 'integrity-dep', dependencies: ['ghost-dep'] });
      const err = await captureRejection(PluginMarketplace.install(mp, installOptionsFor(mp)));
      expect(err).toBeInstanceOf(MarketplaceInstallError);
      expect((err as MarketplaceInstallError).code).toBe('missing-dependency');
    });

    it('default-deny: missing consent record rejects with typed code', async () => {
      const mp = makeMarketplacePlugin({ id: 'integrity-no-consent' });
      const err = await captureRejection(PluginMarketplace.install(mp, { factory: okFactory }));
      expect(err).toBeInstanceOf(MarketplaceInstallError);
      const installErr = err as MarketplaceInstallError;
      expect(installErr.code).toBe('permission-consent-required');
      expect(installErr.message).toContain('read-data');
      expect(PluginMarketplace.isInstalled(mp.id)).toBe(false);
    });

    it('partial consent (not covering all declared permissions) rejects and lists missing grants', async () => {
      const mp = makeMarketplacePlugin({ id: 'integrity-partial-consent' });
      mp.permissions = ['read-data', 'storage'];
      const err = await captureRejection(
        PluginMarketplace.install(mp, {
          factory: okFactory,
          consent: consentFor(mp, ['read-data']),
        })
      );
      expect(err).toBeInstanceOf(MarketplaceInstallError);
      const installErr = err as MarketplaceInstallError;
      expect(installErr.code).toBe('permission-consent-required');
      expect(String(installErr.detail)).toContain('storage');
      expect(PluginMarketplace.isInstalled(mp.id)).toBe(false);
    });

    it('consent record bound to another plugin id is rejected', async () => {
      const mp = makeMarketplacePlugin({ id: 'integrity-cross-consent' });
      const foreignConsent = { ...consentFor(mp), pluginId: 'some-other-plugin' };
      const err = await captureRejection(
        PluginMarketplace.install(mp, { factory: okFactory, consent: foreignConsent })
      );
      expect(err).toBeInstanceOf(MarketplaceInstallError);
      expect((err as MarketplaceInstallError).code).toBe('permission-consent-required');
    });

    it('plugin with no declared permissions installs without consent', async () => {
      const mp = makeMarketplacePlugin({ id: 'integrity-no-perms', permissions: [] });
      await expect(PluginMarketplace.install(mp, { factory: okFactory })).resolves.toBeUndefined();
      expect(PluginMarketplace.isInstalled(mp.id)).toBe(true);
    });
  });
});
