import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  LLM_EGRESS_BLOCKED_CODE,
  LlmEgressBlockedError,
  LlmEgressHttpError,
  assertEndpointAllowed,
  complete,
  llmEgress,
  openStream,
  setLlmEgressAuditSink,
  type LlmEgressAuditEvent,
} from './llmEgress';

describe('llmEgress chokepoint', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  const NIM_LIKE_ENDPOINT = 'https://test-nim.api.com/v1/chat/completions';

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    setLlmEgressAuditSink(null);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function enableEgress(allowedHosts?: string): void {
    vi.stubEnv('VITE_LLM_EGRESS_ENABLED', 'true');
    if (allowedHosts !== undefined) {
      vi.stubEnv('VITE_LLM_EGRESS_ALLOWED_HOSTS', allowedHosts);
    }
  }

  describe('kill switch (requirement 3)', () => {
    it('blocks all egress when VITE_LLM_EGRESS_ENABLED is not "true"', async () => {
      await expect(complete('hello')).rejects.toMatchObject({
        code: LLM_EGRESS_BLOCKED_CODE,
        reason: 'egress-disabled',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('throws the typed LlmEgressBlockedError class', async () => {
      const error = await complete('hello').catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(LlmEgressBlockedError);
      expect((error as LlmEgressBlockedError).code).toBe('LLM-EGRESS-BLOCKED');
    });
  });

  describe('host allowlist/denylist (requirement 3)', () => {
    it('allows the default NVIDIA host when enabled', async () => {
      enableEgress();
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 'ok' }) });

      await complete('hello');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('allows loopback hosts by default (local proxies)', async () => {
      enableEgress();
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

      await complete('hello', { endpoint: 'http://127.0.0.1:8000/v1/chat/completions' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('blocks hosts outside the allowlist', async () => {
      enableEgress('integrate.api.nvidia.com');

      await expect(
        complete('hello', { endpoint: 'https://evil.example.com/v1/chat/completions' })
      ).rejects.toMatchObject({ code: LLM_EGRESS_BLOCKED_CODE, reason: 'host-not-allowed' });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('denylist overrides allowlist', async () => {
      enableEgress('corp.internal');
      vi.stubEnv('VITE_LLM_EGRESS_DENIED_HOSTS', 'corp.internal');

      await expect(
        complete('hello', { endpoint: 'https://corp.internal/v1' })
      ).rejects.toMatchObject({ code: LLM_EGRESS_BLOCKED_CODE, reason: 'host-denied' });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('flags unparseable endpoint URLs as invalid-endpoint', async () => {
      enableEgress();

      await expect(complete('hello', { endpoint: 'not-a-url' })).rejects.toMatchObject({
        code: LLM_EGRESS_BLOCKED_CODE,
        reason: 'invalid-endpoint',
      });
    });

    it('assertEndpointAllowed returns a parsed URL on success', () => {
      enableEgress('test-nim.api.com');
      const url = assertEndpointAllowed(NIM_LIKE_ENDPOINT);
      expect(url.hostname).toBe('test-nim.api.com');
    });
  });

  describe('complete()', () => {
    beforeEach(() => {
      enableEgress('test-nim.api.com');
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'c1', choices: [] }),
      });
    });

    it('redacts the prompt before egress and forwards auth headers', async () => {
      const result = await complete<{ id: string }>(
        [{ role: 'user', content: 'invoice 5555555 key sk-abcdefghijklmnopqrst' }],
        {
          endpoint: NIM_LIKE_ENDPOINT,
          model: 'm1',
          temperature: 0.2,
          maxTokens: 64,
          topP: 0.5,
          headers: () => ({ Authorization: 'Bearer k1' }),
        }
      );

      expect(result.id).toBe('c1');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0]!;
      expect(url).toBe(NIM_LIKE_ENDPOINT);
      expect(init.method).toBe('POST');
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(init.headers.Authorization).toBe('Bearer k1');

      const body = JSON.parse(init.body);
      expect(body.model).toBe('m1');
      expect(body.temperature).toBe(0.2);
      expect(body.max_tokens).toBe(64);
      expect(body.top_p).toBe(0.5);
      expect(body.stream).toBe(false);
      expect(body.messages[0].content).toBe('invoice [REDACTED:DIGITS] key [REDACTED:SECRET]');
    });

    it('normalizes a bare string prompt into a user message', async () => {
      await complete<string>('plain question', { endpoint: NIM_LIKE_ENDPOINT });

      const [, init] = mockFetch.mock.calls[0]!;
      const body = JSON.parse(init.body);
      expect(body.messages).toEqual([{ role: 'user', content: 'plain question' }]);
    });

    it('throws LlmEgressHttpError on non-OK responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limited'),
      });

      const error = await complete('hi', { endpoint: NIM_LIKE_ENDPOINT }).catch(
        (caught: unknown) => caught
      );
      expect(error).toBeInstanceOf(LlmEgressHttpError);
      expect((error as LlmEgressHttpError).status).toBe(429);
      expect((error as LlmEgressHttpError).message).toBe('LLM egress HTTP 429: Rate limited');
    });

    it('falls back to "Unknown error" when the error body cannot be read', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.reject(new Error('stream gone')),
      });

      await expect(complete('hi', { endpoint: NIM_LIKE_ENDPOINT })).rejects.toThrow(
        'LLM egress HTTP 500: Unknown error'
      );
    });

    it('parses JSON from responses that only expose text()', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('{"id":"text-only"}'),
      });

      const result = await complete<{ id: string }>('hi', { endpoint: NIM_LIKE_ENDPOINT });
      expect(result.id).toBe('text-only');
    });
  });

  describe('audit trail hook (requirement 4)', () => {
    it('emits {ts, endpoint, promptBytes, redactions} to an attached sink', async () => {
      enableEgress('test-nim.api.com');
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
      const events: LlmEgressAuditEvent[] = [];
      setLlmEgressAuditSink({ append: (event) => events.push(event) });

      await complete('secret ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456 8888888', {
        endpoint: NIM_LIKE_ENDPOINT,
      });

      expect(events).toHaveLength(1);
      expect(typeof events[0]!.ts).toBe('number');
      expect(events[0]!.endpoint).toBe(NIM_LIKE_ENDPOINT);
      expect(events[0]!.promptBytes).toBeGreaterThan(0);
      expect(events[0]!.redactions).toBe(2);
    });

    it('default sink is a console-free no-op and detach restores it', async () => {
      enableEgress('test-nim.api.com');
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

      await expect(complete('hi', { endpoint: NIM_LIKE_ENDPOINT })).resolves.toEqual({});
      setLlmEgressAuditSink(null);
      await expect(complete('hi', { endpoint: NIM_LIKE_ENDPOINT })).resolves.toEqual({});
    });

    it('a throwing sink never breaks the egress path', async () => {
      enableEgress('test-nim.api.com');
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 'ok' }) });
      setLlmEgressAuditSink({
        append: () => {
          throw new Error('sink down');
        },
      });

      await expect(complete('hi', { endpoint: NIM_LIKE_ENDPOINT })).resolves.toEqual({ id: 'ok' });
    });

    it('does not audit attempts rejected by the gates', async () => {
      // Egress stays disabled -> gate fires before the audit hook.
      const events: LlmEgressAuditEvent[] = [];
      setLlmEgressAuditSink({ append: (event) => events.push(event) });

      await expect(complete('hi')).rejects.toMatchObject({ code: LLM_EGRESS_BLOCKED_CODE });
      expect(events).toHaveLength(0);
    });
  });

  describe('openStream()', () => {
    it('applies the same gates and redaction, returning the raw Response', async () => {
      enableEgress('test-nim.api.com');
      const fakeResponse = { ok: true, body: { getReader: () => ({}) } };
      mockFetch.mockResolvedValue(fakeResponse);

      const response = await openStream('token ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456', {
        endpoint: NIM_LIKE_ENDPOINT,
        model: 'stream-model',
        headers: () => ({ Authorization: 'Bearer s1' }),
      });

      expect(response).toBe(fakeResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0]!;
      expect(url).toBe(NIM_LIKE_ENDPOINT);
      expect(init.headers.Authorization).toBe('Bearer s1');
      const body = JSON.parse(init.body);
      expect(body.stream).toBe(true);
      expect(body.model).toBe('stream-model');
      expect(body.messages[0].content).toBe('token [REDACTED:SECRET]');
    });

    it('blocks streaming when egress is disabled', async () => {
      await expect(openStream('hi', { endpoint: NIM_LIKE_ENDPOINT })).rejects.toMatchObject({
        code: LLM_EGRESS_BLOCKED_CODE,
        reason: 'egress-disabled',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('namespaced facade', () => {
    it('exposes the canonical llmEgress.complete(prompt, opts) surface', async () => {
      enableEgress('test-nim.api.com');
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ via: 'facade' }) });

      const result = await llmEgress.complete<{ via: string }>('hi', {
        endpoint: NIM_LIKE_ENDPOINT,
      });
      expect(result.via).toBe('facade');
      expect(typeof llmEgress.redactPromptText).toBe('function');
      expect(typeof llmEgress.isEgressEnabled).toBe('function');
    });
  });
});
