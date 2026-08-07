/**
 * PluginMarketplacePage — Browsable plugin marketplace
 * Discovery, search, filtering, install/uninstall
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PluginCard } from '@/components/plugins/PluginCard';
import { PluginDetail } from '@/components/plugins/PluginDetail';
import { PluginMarketplace } from '@/plugins/PluginMarketplace';
import { PluginRegistry } from '@/plugins/PluginRegistry';
import type { MarketplacePlugin } from '@/plugins/PluginMarketplace';

// =============================================================================
// Filter / Sort Types
// =============================================================================

type SortOption = 'popular' | 'newest' | 'rating';
type CategoryFilter = 'all' | 'engine' | 'chart' | 'export' | 'connector' | 'template' | 'theme';

const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'engine', label: 'Engines' },
  { value: 'chart', label: 'Charts' },
  { value: 'export', label: 'Export' },
  { value: 'connector', label: 'Connectors' },
  { value: 'template', label: 'Templates' },
  { value: 'theme', label: 'Themes' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
];

// =============================================================================
// Page Component
// =============================================================================

export default function PluginMarketplacePage() {
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [detailPlugin, setDetailPlugin] = useState<MarketplacePlugin | null>(null);
  const [loading, setLoading] = useState(true);

  // Plugin registry singleton (mirrors PluginMarketplace internal state)
  const registry = useMemo(() => new PluginRegistry(), []);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadPlugins = useCallback(async () => {
    setLoading(true);
    try {
      const results = await PluginMarketplace.browse({
        category: category !== 'all' ? category : undefined,
        search: search || undefined,
        sortBy,
      });
      setPlugins(results);
    } finally {
      setLoading(false);
    }
  }, [category, search, sortBy]);

  useEffect(() => {
    loadPlugins();
  }, [loadPlugins]);

  // ---------------------------------------------------------------------------
  // Install / Uninstall
  // ---------------------------------------------------------------------------

  const handleInstall = useCallback(
    async (plugin: MarketplacePlugin) => {
      await PluginMarketplace.install(plugin);
      registry.register(plugin);
      setInstalledIds((prev) => new Set(prev).add(plugin.id));
      // Refresh list to update counts
      await loadPlugins();
    },
    [registry, loadPlugins]
  );

  const handleUninstall = useCallback(
    async (pluginId: string) => {
      await PluginMarketplace.uninstall(pluginId);
      registry.unregister(pluginId);
      setInstalledIds((prev) => {
        const next = new Set(prev);
        next.delete(pluginId);
        return next;
      });
      if (detailPlugin?.id === pluginId) {
        setDetailPlugin(null);
      }
      await loadPlugins();
    },
    [registry, loadPlugins, detailPlugin]
  );

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => {
    const total = plugins.length;
    const installed = plugins.filter((p) => installedIds.has(p.id)).length;
    const verified = plugins.filter((p) => p.verified).length;
    return { total, installed, verified };
  }, [plugins, installedIds]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] dark:text-white">
            Plugin Marketplace
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] dark:text-gray-400">
            Extend FinPlan Pro with engines, charts, connectors, and more.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] dark:text-gray-300">
          <span>{stats.total} plugins</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>{stats.verified} verified</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>{stats.installed} installed</span>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            type="text"
            placeholder="Search plugins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search plugins"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-md border border-[var(--border-default)] bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
            aria-label="Sort plugins by"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Plugin categories">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={category === cat.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCategory(cat.value)}
            role="tab"
            aria-selected={category === cat.value}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Plugin grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="ml-3 text-sm text-[var(--text-muted)]">Loading plugins...</span>
        </div>
      ) : plugins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl">🔍</span>
          <p className="mt-3 text-sm text-[var(--text-muted)] dark:text-gray-400">
            No plugins found matching your criteria.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => {
              setSearch('');
              setCategory('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Available plugins"
        >
          {plugins.map((plugin) => (
            <div key={plugin.id} role="listitem">
              <PluginCard
                plugin={plugin}
                isInstalled={installedIds.has(plugin.id)}
                onInstall={handleInstall}
                onUninstall={handleUninstall}
                onViewDetail={setDetailPlugin}
              />
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detailPlugin && (
        <PluginDetail
          plugin={detailPlugin}
          isInstalled={installedIds.has(detailPlugin.id)}
          onInstall={handleInstall}
          onUninstall={handleUninstall}
          onClose={() => setDetailPlugin(null)}
        />
      )}
    </div>
  );
}
