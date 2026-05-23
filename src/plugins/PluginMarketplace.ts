/**
 * PluginMarketplace — Plugin discovery, installation, and management
 *
 * Turns FinPlan Pro from a product into a platform.
 * Users can install custom engines, charts, export formats, connectors.
 */

import { PluginRegistry } from './PluginRegistry';
import { PluginLoader } from './PluginLoader';
import type { PluginManifest, PluginPermission } from './types';

export interface MarketplacePlugin extends PluginManifest {
  description: string;
  author: string;
  homepage: string;
  icon: string;
  category: 'engine' | 'chart' | 'export' | 'connector' | 'template' | 'theme';
  downloads: number;
  rating: number;
  verified: boolean;
  screenshots?: string[];
}

export interface InstalledPlugin extends MarketplacePlugin {
  installedAt: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export class PluginMarketplace {
  private static installed: Map<string, InstalledPlugin> = new Map();

  static async browse(filters?: {
    category?: string;
    search?: string;
    sortBy?: 'popular' | 'newest' | 'rating';
  }): Promise<MarketplacePlugin[]> {
    const plugins = await this.getLocalPluginCatalog();
    let filtered = plugins;

    if (filters?.category) {
      filtered = filtered.filter((p) => p.category === filters.category);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q)
      );
    }
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'popular':
          filtered.sort((a, b) => b.downloads - a.downloads);
          break;
        case 'newest':
          filtered.sort((a, b) => b.version.localeCompare(a.version));
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
      }
    }

    return filtered;
  }

  static async install(manifest: MarketplacePlugin): Promise<void> {
    if (!this.isCompatible(manifest.minAppVersion)) {
      throw new Error(`Plugin requires FinPlan Pro ${manifest.minAppVersion} or later`);
    }

    for (const dep of manifest.dependencies) {
      const installed = await PluginRegistry.get(dep);
      if (!installed) {
        throw new Error(`Plugin depends on "${dep}" which is not installed`);
      }
    }

    const approved = await this.requestPermissions(manifest.permissions);
    if (!approved) {
      throw new Error('Plugin permissions not approved');
    }

    await PluginLoader.load(manifest);
    await PluginRegistry.register(manifest);

    const installed: InstalledPlugin = {
      ...manifest,
      installedAt: new Date().toISOString(),
      enabled: true,
      config: {},
    };
    this.installed.set(manifest.id, installed);
  }

  static async uninstall(pluginId: string): Promise<void> {
    const plugin = this.installed.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not installed`);

    await PluginRegistry.unregister(pluginId);
    this.installed.delete(pluginId);
  }

  static async enable(pluginId: string): Promise<void> {
    const plugin = this.installed.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not installed`);
    plugin.enabled = true;
  }

  static async disable(pluginId: string): Promise<void> {
    const plugin = this.installed.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not installed`);
    plugin.enabled = false;
  }

  static getInstalled(): InstalledPlugin[] {
    return Array.from(this.installed.values());
  }

  static isInstalled(pluginId: string): boolean {
    return this.installed.has(pluginId);
  }

  private static async getLocalPluginCatalog(): Promise<MarketplacePlugin[]> {
    return [];
  }

  private static isCompatible(minVersion: string): boolean {
    return true;
  }

  private static async requestPermissions(permissions: PluginPermission[]): Promise<boolean> {
    return true;
  }
}
