import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  CommandClient,
  CommandRequestError,
  isControlPlaneEnabled,
  normalizeBaseUrl,
  resolveControlPlaneBaseUrl,
} from './commandClient';
import { createCommandEnvelope } from '@/types/commandEnvelope';

describe('commandClient feature flag', () => {
  it('is disabled when no URL and no enable flag are configured', () => {
    expect(isControlPlaneEnabled({} as ImportMetaEnv)).toBe(false);
  });

  it('is enabled when VITE_CONTROL_PLANE_URL is set', () => {
    expect(
      isControlPlaneEnabled({ VITE_CONTROL_PLANE_URL: 'https://cp.example.com' } as ImportMetaEnv)
    ).toBe(true);
  });

  it('is enabled when VITE_ENABLE_CONTROL_PLANE=true even without a URL', () => {
    expect(isControlPlaneEnabled({ VITE_ENABLE_CONTROL_PLANE: 'true' } as ImportMetaEnv)).toBe(
      true
    );
  });

  it('normalizes base URLs by trimming trailing slashes', () => {
    expect(normalizeBaseUrl('https://cp.example.com///')).toBe('https://cp.example.com');
    expect(normalizeBaseUrl('  ')).toBeNull();
    expect(resolveControlPlaneBaseUrl({} as ImportMetaEnv)).toBeNull();
  });
});

describe('CommandClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  function makeClient() {
    fetchMock = vi.fn();
    const client = new CommandClient({
      baseUrl: 'https://cp.example.com',
      accessToken: 'tok-123',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    const envelope = createCommandEnvelope(
      'plan.upsert',
      'ent-1',
      { amount: 100 },
      { correlationId: 'corr-1', idempotencyKey: 'idem-1' }
    );
    return { client, envelope };
  }

  beforeEach(() => {
    fetchMock = vi.fn();
  });

  it('posts the envelope to /api/v1/commands with the bearer token', async () => {
    const { client, envelope } = makeClient();
    fetchMock.mockResolvedValue(
      jsonResponse({
        status: 'completed',
        commandId: envelope.commandId,
        correlationId: 'corr-1',
        revision: 'r1',
        auditRecorded: true,
      })
    );

    const result = await client.submitCommand(envelope);

    expect(result.status).toBe('completed');
    expect(result.revision).toBe('r1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://cp.example.com/api/v1/commands');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok-123');
    expect(JSON.parse(init.body as string)).toMatchObject({
      commandId: envelope.commandId,
      commandType: 'plan.upsert',
      scope: { entityId: 'ent-1' },
    });
  });

  it('returns the typed conflict result for a 409', async () => {
    const { client, envelope } = makeClient();
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          status: 'conflict',
          commandId: envelope.commandId,
          correlationId: 'corr-1',
          revision: 'r2',
          error: { code: 'CONFLICT_REVISION', message: 'Base revision mismatch' },
        },
        409
      )
    );

    const result = await client.submitCommand(envelope);
    expect(result.status).toBe('conflict');
    expect(result.error?.code).toBe('CONFLICT_REVISION');
  });

  it('throws a typed error for non-CommandResult responses (401 auth)', async () => {
    const { client, envelope } = makeClient();
    // Fresh Response per call: a Response body can only be read once.
    fetchMock.mockImplementation(async () =>
      jsonResponse({ error: 'Missing or malformed Authorization header' }, 401)
    );

    await expect(client.submitCommand(envelope)).rejects.toThrow(CommandRequestError);
    await expect(client.submitCommand(envelope)).rejects.toThrow(
      'Missing or malformed Authorization header'
    );
  });

  it('queries the stored outcome by correlation id', async () => {
    const { client } = makeClient();
    fetchMock.mockResolvedValue(
      jsonResponse({
        status: 'completed',
        commandId: null,
        correlationId: 'corr-1',
        revision: 'r1',
      })
    );

    const result = await client.getCommandResult('corr-1');
    expect(result.status).toBe('completed');
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('https://cp.example.com/api/v1/commands/corr-1');
  });

  it('throws CommandRequestError on network failure', async () => {
    const { client, envelope } = makeClient();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(client.submitCommand(envelope)).rejects.toThrow(CommandRequestError);
    await expect(client.submitCommand(envelope)).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('omits the Authorization header when no token is configured', async () => {
    fetchMock = vi.fn();
    fetchMock.mockResolvedValue(
      jsonResponse({
        status: 'completed',
        commandId: null,
        correlationId: 'corr-1',
        revision: 'r1',
      })
    );
    const client = new CommandClient({
      baseUrl: 'https://cp.example.com',
      accessToken: null,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    await client.submitCommand(createCommandEnvelope('plan.upsert', 'ent-1', {}));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});
