/**
 * PluginDetail — Modal detail view for a marketplace plugin
 * Shows full metadata, permissions, and install/uninstall actions
 */

import { useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { MarketplacePlugin } from '@/plugins/PluginMarketplace';
import type { PluginPermission } from '@/plugins/types';

interface PluginDetailProps {
  plugin: MarketplacePlugin;
  isInstalled: boolean;
  onInstall: (plugin: MarketplacePlugin) => Promise<void>;
  onUninstall: (pluginId: string) => Promise<void>;
  onClose: () => void;
}

const PERMISSION_LABELS: Record<PluginPermission, string> = {
  'read-data': 'Read financial data',
  'write-data': 'Write financial data',
  'read-settings': 'Read settings',
  network: 'Network access',
  websocket: 'WebSocket connections',
  'read-files': 'Read files',
  'write-files': 'Write files',
  notifications: 'Show notifications',
  clipboard: 'Access clipboard',
  menus: 'Register menu items',
  dialogs: 'Show dialogs',
  storage: 'Plugin storage',
};

const PERMISSION_RISK: Record<PluginPermission, 'low' | 'medium' | 'high'> = {
  'read-data': 'medium',
  'write-data': 'high',
  'read-settings': 'low',
  network: 'high',
  websocket: 'high',
  'read-files': 'medium',
  'write-files': 'high',
  notifications: 'low',
  clipboard: 'medium',
  menus: 'low',
  dialogs: 'low',
  storage: 'low',
};

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  medium:
    'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  high: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.round(rating);
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={cn('h-4 w-4', i <= stars ? 'text-yellow-400' : 'text-gray-300')}
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

export function PluginDetail({
  plugin = {
    id: '',
    name: 'Unknown Plugin',
    description: '',
    category: 'engine',
    version: '0.0.0',
    author: 'Unknown',
    rating: 0,
    downloads: 0,
    permissions: [],
  } as unknown as PluginInfo,
  isInstalled = false,
  onInstall = async () => {},
  onUninstall = async () => {},
  onClose = () => {},
}: PluginDetailProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = useCallback(async () => {
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
  }, [isInstalled, onInstall, onUninstall, plugin]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Plugin details: ${plugin.name}`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose();
        }}
        role="button"
        tabIndex={0}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[var(--bg-elevated)] shadow-xl dark:border border-[var(--border-default)]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-elevated)] px-6 py-4 border-[var(--border-default)]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--bg-elevated)] text-3xl">
              {plugin.icon ?? '🧩'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)] text-[var(--text-primary)]">
                  {plugin.name}
                </h2>
                {plugin.verified && <Badge variant="default">Verified</Badge>}
              </div>
              <p className="text-sm text-[var(--text-muted)] text-[var(--text-muted)]">
                by {plugin.author} &middot; v{plugin.version}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 px-6 py-5">
          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--text-secondary)] text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <StarRating rating={plugin.rating} />
              <span>{plugin.rating.toFixed(1)}</span>
            </div>
            <div>{formatDownloads(plugin.downloads)} installs</div>
            <div>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                )}
              >
                {plugin.category}
              </span>
            </div>
            {plugin.license && <div>License: {plugin.license}</div>}
          </div>

          {/* Description */}
          <div>
            <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)] text-[var(--text-primary)]">
              Description
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] text-[var(--text-secondary)]">
              {plugin.description}
            </p>
          </div>

          {/* Tags */}
          {plugin.tags && plugin.tags.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)] text-[var(--text-primary)]">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {plugin.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--bg-elevated)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Permissions */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)] text-[var(--text-primary)]">
              Required Permissions
            </h3>
            <div className="space-y-1.5">
              {plugin.permissions.map((perm) => (
                <div key={perm} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                      RISK_COLORS[PERMISSION_RISK[perm] ?? 'low']
                    )}
                  >
                    {PERMISSION_RISK[perm] ?? 'low'}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)] text-[var(--text-secondary)]">
                    {PERMISSION_LABELS[perm] ?? perm}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Compatibility */}
          {plugin.minAppVersion && (
            <div className="rounded-lg bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-muted)]">
              Requires FinPlan Pro {plugin.minAppVersion} or later
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-4 text-sm">
            {plugin.homepage && (
              <a
                href={plugin.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                Homepage
              </a>
            )}
            {plugin.repository && (
              <a
                href={plugin.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                Repository
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border-default)] px-6 py-4 border-[var(--border-default)]">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant={isInstalled ? 'destructive' : 'default'}
            onClick={handleAction}
            disabled={loading}
          >
            {loading ? 'Processing...' : isInstalled ? 'Uninstall Plugin' : 'Install Plugin'}
          </Button>
        </div>
      </div>
    </div>
  );
}
