/**
 * PluginCard — Marketplace card for browsing plugins
 * Shows plugin metadata with install/uninstall actions
 */

import { useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { MarketplacePlugin } from '@/plugins/PluginMarketplace';
import { formatCompact } from '@/utils/financialFormatting';

interface PluginCardProps {
  plugin: MarketplacePlugin;
  isInstalled: boolean;
  onInstall: (plugin: MarketplacePlugin) => Promise<void>;
  onUninstall: (pluginId: string) => Promise<void>;
  onViewDetail: (plugin: MarketplacePlugin) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  engine: 'Engine',
  chart: 'Chart',
  export: 'Export',
  connector: 'Connector',
  template: 'Template',
  theme: 'Theme',
};

const CATEGORY_COLORS: Record<string, string> = {
  engine: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  chart: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  export: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  connector: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  template: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
  theme: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
};

function StarRating({ rating }: { rating: number }) {
  const stars = Math.round(rating);
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i <= stars
              ? 'text-yellow-400'
              : 'text-gray-300 dark:text-gray-600 dark:text-gray-400 dark:text-gray-500'
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${formatCompact(n)}`;
  if (n >= 1_000) return `${formatCompact(n)}`;
  return String(n);
}

export function PluginCard({
  plugin = {
    id: '',
    name: 'Unknown Plugin',
    category: 'engine',
    rating: 0,
    downloads: 0,
    verified: false,
  } as MarketplacePlugin,
  isInstalled = false,
  onInstall = async () => {},
  onUninstall = async () => {},
  onViewDetail = () => {},
}: PluginCardProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setLoading(true);
      try {
        if (isInstalled) {
          await onUninstall(plugin.id);
        } else {
          await onInstall(plugin);
        }
      } finally {
        setLoading(false);
      }
    },
    [isInstalled, onInstall, onUninstall, plugin]
  );

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onViewDetail(plugin);
      }
    },
    [onViewDetail, plugin]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className="group flex flex-col rounded-lg border border-[var(--border-default)] bg-white dark:bg-gray-900 dark:bg-gray-800 p-5 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 cursor-pointer"
      onClick={() => onViewDetail(plugin)}
      onKeyDown={handleCardKeyDown}
      aria-label={`View details for ${plugin.name}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 dark:bg-gray-700 text-2xl">
          {plugin.icon ?? '🧩'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[var(--text-primary)] dark:text-white">
              {plugin.name}
            </h3>
            {plugin.verified && (
              <Badge variant="default" className="shrink-0 text-[10px]">
                Verified
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[var(--text-muted)] dark:text-gray-400 dark:text-gray-500">
            {plugin.author}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-[var(--text-secondary)] dark:text-gray-300">
        {plugin.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
            CATEGORY_COLORS[plugin.category] ??
              'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
          )}
        >
          {CATEGORY_LABELS[plugin.category] ?? plugin.category}
        </span>
        {plugin.tags?.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:bg-gray-700 dark:text-gray-300"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--border-default)] pt-3 dark:border-gray-700">
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] dark:text-gray-400 dark:text-gray-500">
          <StarRating rating={plugin.rating} />
          <span>{formatDownloads(plugin.downloads)} installs</span>
        </div>
        <Button
          size="sm"
          variant={isInstalled ? 'destructive' : 'default'}
          onClick={handleAction}
          disabled={loading}
          aria-label={isInstalled ? `Uninstall ${plugin.name}` : `Install ${plugin.name}`}
        >
          {loading ? '...' : isInstalled ? 'Uninstall' : 'Install'}
        </Button>
      </div>
    </div>
  );
}
