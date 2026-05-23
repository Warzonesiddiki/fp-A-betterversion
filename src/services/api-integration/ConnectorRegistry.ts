/**
 * API Integration Framework - Connector Registry
 *
 * Manages connector lifecycle: registration, lookup, connect/disconnect.
 * Acts as a factory for creating connectors by provider name.
 */

import type { BaseConnector } from './BaseConnector';
import type { ConnectorConfig, ConnectorHealth } from './types';

// ─── ConnectorFactory ────────────────────────────────────────────────────────

export type ConnectorFactory = (config: ConnectorConfig) => BaseConnector;

// ─── ConnectorRegistry ───────────────────────────────────────────────────────

export class ConnectorRegistry {
  private readonly factories = new Map<string, ConnectorFactory>();
  private readonly instances = new Map<string, BaseConnector>();

  // ── Factory registration ─────────────────────────────────────────────────

  /**
   * Register a connector factory for a given provider.
   */
  registerFactory(provider: string, factory: ConnectorFactory): void {
    this.factories.set(provider.toLowerCase(), factory);
  }

  /**
   * Check if a factory is registered for the provider.
   */
  hasFactory(provider: string): boolean {
    return this.factories.has(provider.toLowerCase());
  }

  /**
   * List registered providers.
   */
  getRegisteredProviders(): string[] {
    return Array.from(this.factories.keys());
  }

  // ── Instance management ──────────────────────────────────────────────────

  /**
   * Create and register a connector instance.
   */
  createConnector(config: ConnectorConfig): BaseConnector {
    const provider = config.provider.toLowerCase();
    const factory = this.factories.get(provider);

    if (!factory) {
      throw new Error(
        `No connector factory registered for provider "${provider}". ` +
          `Registered: ${this.getRegisteredProviders().join(', ')}`
      );
    }

    const connector = factory(config);
    this.instances.set(config.id, connector);
    return connector;
  }

  /**
   * Get a connector instance by ID.
   */
  getConnector(id: string): BaseConnector | undefined {
    return this.instances.get(id);
  }

  /**
   * Get all registered connector instances.
   */
  getAllConnectors(): BaseConnector[] {
    return Array.from(this.instances.values());
  }

  /**
   * Remove a connector instance.
   */
  removeConnector(id: string): boolean {
    const connector = this.instances.get(id);
    if (connector) {
      void connector.disconnect();
      this.instances.delete(id);
      return true;
    }
    return false;
  }

  // ── Bulk operations ──────────────────────────────────────────────────────

  /**
   * Connect all registered connectors.
   */
  async connectAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    const entries = Array.from(this.instances.entries());
    for (const [id, connector] of entries) {
      try {
        const success = await connector.connect();
        results.set(id, success);
      } catch {
        results.set(id, false);
      }
    }

    return results;
  }

  /**
   * Disconnect all registered connectors.
   */
  async disconnectAll(): Promise<void> {
    const connectors = Array.from(this.instances.values());
    await Promise.all(connectors.map((c) => c.disconnect()));
  }

  /**
   * Get health status for all connectors.
   */
  async getHealthAll(): Promise<Map<string, ConnectorHealth>> {
    const results = new Map<string, ConnectorHealth>();

    const entries = Array.from(this.instances.entries());
    for (const [id, connector] of entries) {
      try {
        const health = await connector.checkHealth();
        results.set(id, health);
      } catch (error: unknown) {
        results.set(id, {
          status: 'error',
          lastError: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Clear all instances (does not disconnect).
   */
  clear(): void {
    this.instances.clear();
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

export const connectorRegistry = new ConnectorRegistry();
