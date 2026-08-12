/**
 * API Integration Framework - Slack Connector
 *
 * Outbound notification integration via Slack incoming webhooks (budget
 * approvals, forecast completions, close alerts). Not a pull source — data
 * flows FinPlan Pro → Slack only.
 *
 * - The webhook URL is stored as the connector base URL.
 * - performHealthCheck validates the webhook URL format (Slack webhooks have
 *   no server-side ping endpoint; posting a real message to test would spam
 *   the channel, so the check is intentionally format-based and honest about
 *   it).
 * - `sendNotification(text)` posts a message to the channel.
 *
 * API docs: https://api.slack.com/messaging/webhooks
 */

import { BaseConnector } from './BaseConnector';
import type { ConnectorConfig, ConnectorHealth, SyncOptions } from './types';

// ─── SlackConnector ──────────────────────────────────────────────────────────

const SLACK_WEBHOOK_PATTERN =
  /^https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Za-z0-9]+$/;

export class SlackConnector extends BaseConnector {
  private readonly webhookUrl: string;

  constructor(config: ConnectorConfig) {
    super(config);
    this.webhookUrl = config.baseUrl ?? '';
  }

  get channel(): string {
    return this.config.name;
  }

  // ── Health check (URL-format only — no ping endpoint exists) ────────────

  protected async performHealthCheck(): Promise<ConnectorHealth> {
    if (!SLACK_WEBHOOK_PATTERN.test(this.webhookUrl)) {
      return {
        status: 'error',
        lastError: 'Invalid Slack webhook URL — expected https://hooks.slack.com/services/…',
      };
    }
    return {
      status: 'connected',
      lastSyncAt: Date.now(),
    };
  }

  // ── Notification ─────────────────────────────────────────────────────────

  /**
   * Send a message to the configured Slack channel.
   * Returns true when Slack acknowledges the message ("ok": true).
   */
  async sendNotification(text: string): Promise<boolean> {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }

    const body = (await response.json().catch(() => ({}))) as { ok?: boolean };
    if (body.ok === false) {
      throw new Error('Slack webhook rejected the message');
    }
    return true;
  }

  // ── Sync ─────────────────────────────────────────────────────────────────

  protected async pullData(_options: SyncOptions): Promise<number> {
    // Slack is outbound-only — nothing to pull.
    return 0;
  }

  protected async pushData(_options: SyncOptions): Promise<number> {
    // Notifications are sent on demand via sendNotification(), not during a
    // bulk sync (a sync-time message would be noise, not data).
    return 0;
  }
}
