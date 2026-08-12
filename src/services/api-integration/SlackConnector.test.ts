import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SlackConnector } from './SlackConnector';

const mockFetch = vi.fn();

describe('SlackConnector', () => {
  const baseConfig = {
    id: 'slack-test',
    name: 'Slack Test',
    provider: 'slack',
    baseUrl: 'https://hooks.slack.com/services/T123456/B789012/abcDEF123',
    auth: {
      type: 'bearer' as const,
      bearer: { token: '' },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('construction', () => {
    it('creates a connector with correct properties', () => {
      const connector = new SlackConnector(baseConfig);
      expect(connector.id).toBe('slack-test');
      expect(connector.provider).toBe('slack');
    });
  });

  describe('health check', () => {
    it('accepts a well-formed Slack webhook URL', async () => {
      const connector = new SlackConnector(baseConfig);
      const health = await connector.checkHealth();
      expect(health.status).toBe('connected');
    });

    it('rejects a malformed webhook URL', async () => {
      const connector = new SlackConnector({
        ...baseConfig,
        baseUrl: 'https://example.com/not-a-slack-webhook',
      });
      const health = await connector.checkHealth();
      expect(health.status).toBe('error');
      expect(health.lastError).toContain('Invalid Slack webhook URL');
    });
  });

  describe('sendNotification', () => {
    it('posts a message and returns true on acknowledgment', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue({ ok: true }),
      });
      const connector = new SlackConnector(baseConfig);

      const result = await connector.sendNotification('Budget approved');
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        baseConfig.baseUrl,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: 'Budget approved' }),
        })
      );
    });

    it('throws when Slack rejects the message', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue({ ok: false, error: 'invalid_payload' }),
      });
      const connector = new SlackConnector(baseConfig);

      await expect(connector.sendNotification('Hi')).rejects.toThrow(/rejected/);
    });

    it('throws on HTTP error', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });
      const connector = new SlackConnector(baseConfig);

      await expect(connector.sendNotification('Hi')).rejects.toThrow(/404/);
    });
  });

  describe('sync', () => {
    it('is outbound-only: pull and push both record zero', async () => {
      const connector = new SlackConnector(baseConfig);
      const pull = await connector.sync({ direction: 'pull' });
      const push = await connector.sync({ direction: 'push' });
      expect(pull.success).toBe(true);
      expect(pull.recordsSynced).toBe(0);
      expect(push.recordsSynced).toBe(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
