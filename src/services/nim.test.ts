import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Tests ────────────────────────────────────────────────────────────────────

describe('nim service', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Set env vars BEFORE resetModules so fresh module reads them
    vi.stubEnv('VITE_NIM_BASE_URL', 'https://test-nim.api.com/v1');
    vi.stubEnv('VITE_NIM_API_KEY_1', 'key-aaa');
    vi.stubEnv('VITE_NIM_API_KEY_2', 'key-bbb');
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('getApiKey (round-robin)', () => {
    it('should rotate between available keys', async () => {
      const { nimChat } = await import('./nim');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: '1',
            choices: [],
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          }),
      });

      await nimChat([{ role: 'user', content: 'test' }]);
      await nimChat([{ role: 'user', content: 'test' }]);

      const firstAuth = mockFetch!.mock.calls[0]![1].headers.Authorization;
      const secondAuth = mockFetch!.mock.calls[1]![1].headers.Authorization;

      expect(firstAuth).toBe('Bearer key-aaa');
      expect(secondAuth).toBe('Bearer key-bbb');
    });

    it('should throw when no keys configured', async () => {
      vi.stubEnv('VITE_NIM_API_KEY_1', '');
      vi.stubEnv('VITE_NIM_API_KEY_2', '');

      const { nimChat } = await import('./nim');

      await expect(nimChat([{ role: 'user', content: 'test' }])).rejects.toThrow(
        'NIM API keys not configured'
      );
    });
  });

  describe('nimFetch', () => {
    it('should make POST request with correct headers', async () => {
      const { nimChat } = await import('./nim');
      const mockResponse = {
        id: 'chat-1',
        choices: [
          { index: 0, message: { role: 'assistant', content: 'hi' }, finish_reason: 'stop' },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await nimChat([{ role: 'user', content: 'hello' }]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-nim.api.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: expect.stringContaining('Bearer'),
          },
        })
      );
      expect(result.id).toBe('chat-1');
    });

    it('should throw on non-OK response', async () => {
      const { nimChat } = await import('./nim');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded'),
      });

      await expect(nimChat([{ role: 'user', content: 'test' }])).rejects.toThrow(
        'NIM API error 429: Rate limit exceeded'
      );
    });

    it('should throw with fallback message when text() fails', async () => {
      const { nimChat } = await import('./nim');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.reject(new Error('body error')),
      });

      await expect(nimChat([{ role: 'user', content: 'test' }])).rejects.toThrow(
        'NIM API error 500: Unknown error'
      );
    });
  });

  describe('nimChat', () => {
    it('should send correct payload with defaults', async () => {
      const { nimChat, NIM_MODELS } = await import('./nim');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '1', choices: [], usage: {} }),
      });

      await nimChat([{ role: 'user', content: 'test' }]);

      const body = JSON.parse(mockFetch!.mock.calls[0]![1].body);
      expect(body.model).toBe(NIM_MODELS.DEFAULT);
      expect(body.temperature).toBe(0.7);
      expect(body.max_tokens).toBe(1024);
      expect(body.top_p).toBe(0.9);
      expect(body.stream).toBe(false);
    });

    it('should accept custom options', async () => {
      const { nimChat } = await import('./nim');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '1', choices: [], usage: {} }),
      });

      await nimChat([{ role: 'user', content: 'test' }], {
        model: 'meta/llama-3.1-8b-instruct',
        temperature: 0.1,
        max_tokens: 500,
        top_p: 0.5,
      });

      const body = JSON.parse(mockFetch!.mock.calls[0]![1].body);
      expect(body.model).toBe('meta/llama-3.1-8b-instruct');
      expect(body.temperature).toBe(0.1);
      expect(body.max_tokens).toBe(500);
      expect(body.top_p).toBe(0.5);
    });
  });

  describe('nimChatStream', () => {
    it('should yield parsed SSE chunks', async () => {
      const { nimChatStream } = await import('./nim');

      const encoder = new TextEncoder();
      const chunks = [
        encoder.encode(
          'data: {"id":"s1","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n'
        ),
        encoder.encode(
          'data: {"id":"s1","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}\n\n'
        ),
        encoder.encode('data: [DONE]\n\n'),
      ];

      let chunkIndex = 0;
      const reader = {
        read: vi.fn().mockImplementation(() => {
          if (chunkIndex < chunks.length) {
            return Promise.resolve({ done: false, value: chunks[chunkIndex++] });
          }
          return Promise.resolve({ done: true, value: undefined });
        }),
        releaseLock: vi.fn(),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        body: { getReader: () => reader },
      });

      const generator = nimChatStream([{ role: 'user', content: 'test' }]);
      const results = [];
      for await (const chunk of generator) {
        results.push(chunk);
      }

      expect(results).toHaveLength(2);
      expect(results![0]!.choices[0]!.delta.content).toBe('Hello');
      expect(results![1]!.choices[0]!.delta.content).toBe(' world');
      expect(reader.releaseLock).toHaveBeenCalled();
    });

    it('should throw on stream error', async () => {
      const { nimChatStream } = await import('./nim');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
      });

      const generator = nimChatStream([{ role: 'user', content: 'test' }]);

      await expect(generator.next()).rejects.toThrow('NIM stream error 502');
    });

    it('should throw when no response body', async () => {
      const { nimChatStream } = await import('./nim');

      mockFetch.mockResolvedValue({
        ok: true,
        body: null,
      });

      const generator = nimChatStream([{ role: 'user', content: 'test' }]);

      await expect(generator.next()).rejects.toThrow('No response body');
    });
  });

  describe('financial helpers', () => {
    async function setupMockChat() {
      const helpers = await import('./nim');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'fin-1',
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content: 'Analysis result' },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 },
          }),
      });

      return helpers;
    }

    it('analyzeVariance should call nimChat with correct prompt', async () => {
      const { analyzeVariance } = await setupMockChat();

      const result = await analyzeVariance({
        metric: 'Revenue',
        actual: 120000,
        budget: 100000,
        period: 'Q1 2024',
      });

      expect(result).toBe('Analysis result');
      const body = JSON.parse(mockFetch!.mock.calls[0]![1].body);
      expect(body.messages[1]!.content).toContain('Revenue');
      expect(body.messages[1]!.content).toContain('120000');
      expect(body.messages[1]!.content).toContain('100000');
      expect(body.messages[1]!.content).toContain('20.0%');
      expect(body.temperature).toBe(0.3);
    });

    it('analyzeVariance should handle zero budget', async () => {
      const { analyzeVariance } = await setupMockChat();

      await analyzeVariance({
        metric: 'New Metric',
        actual: 500,
        budget: 0,
        period: 'Q1',
      });

      const body = JSON.parse(mockFetch!.mock.calls[0]![1].body);
      // When budget is 0, variancePct is 0 (not Infinity) due to the guard: budget !== 0 ? ... : 0
      expect(body.messages[1]!.content).toContain('0.0%');
    });

    it('generateForecastInsight should format historical data', async () => {
      const { generateForecastInsight } = await setupMockChat();

      const result = await generateForecastInsight({
        metric: 'Expenses',
        historicalData: [
          { period: 'Jan', value: 10000 },
          { period: 'Feb', value: 12000 },
        ],
        forecastPeriods: 3,
      });

      expect(result).toBe('Analysis result');
      const body = JSON.parse(mockFetch!.mock.calls[0]![1].body);
      expect(body.messages[1]!.content).toContain('Expenses');
      expect(body.messages[1]!.content).toContain('Jan: 10000');
      expect(body.messages[1]!.content).toContain('Feb: 12000');
      expect(body.messages[1]!.content).toContain('3');
    });

    it('explainFormula should pass formula to nimChat', async () => {
      const { explainFormula } = await setupMockChat();

      const result = await explainFormula('EBITDA = Revenue - OpEx + D&A');

      expect(result).toBe('Analysis result');
      const body = JSON.parse(mockFetch!.mock.calls[0]![1].body);
      expect(body.messages[1]!.content).toContain('EBITDA = Revenue - OpEx + D&A');
      expect(body.temperature).toBe(0.2);
    });

    it('summarizeBudget should pass budget data to nimChat', async () => {
      const { summarizeBudget } = await setupMockChat();

      const result = await summarizeBudget({
        name: 'FY2024 Budget',
        totalRevenue: 500000,
        totalExpenses: 350000,
        lineItemCount: 42,
        period: 'FY2024',
      });

      expect(result).toBe('Analysis result');
      const body = JSON.parse(mockFetch!.mock.calls[0]![1].body);
      expect(body.messages[1]!.content).toContain('FY2024 Budget');
      expect(body.messages[1]!.content).toContain('500000');
      expect(body.messages[1]!.content).toContain('350000');
      expect(body.messages[1]!.content).toContain('42');
    });

    it('should return fallback message when response has no content', async () => {
      const { analyzeVariance } = await import('./nim');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'empty',
            choices: [
              { index: 0, message: { role: 'assistant', content: '' }, finish_reason: 'stop' },
            ],
            usage: {},
          }),
      });

      const result = await analyzeVariance({
        metric: 'Test',
        actual: 100,
        budget: 100,
        period: 'Q1',
      });

      expect(result).toBe('No analysis generated.');
    });
  });

  describe('utility functions', () => {
    it('isNimConfigured should return true when keys exist', async () => {
      const { isNimConfigured } = await import('./nim');
      expect(isNimConfigured()).toBe(true);
    });

    it('isNimConfigured should return false when no keys', async () => {
      vi.stubEnv('VITE_NIM_API_KEY_1', '');
      vi.stubEnv('VITE_NIM_API_KEY_2', '');

      const { isNimConfigured } = await import('./nim');
      expect(isNimConfigured()).toBe(false);
    });

    it('getNimKeyCount should return number of configured keys', async () => {
      const { getNimKeyCount } = await import('./nim');
      expect(getNimKeyCount()).toBe(2);
    });

    it('getNimKeyCount should return 1 when only one key set', async () => {
      vi.stubEnv('VITE_NIM_API_KEY_2', '');

      const { getNimKeyCount } = await import('./nim');
      expect(getNimKeyCount()).toBe(1);
    });
  });

  describe('NIM_MODELS', () => {
    it('should expose expected model IDs', async () => {
      const { NIM_MODELS } = await import('./nim');
      expect(NIM_MODELS.LLAMA_3_1_70B).toBe('meta/llama-3.1-70b-instruct');
      expect(NIM_MODELS.LLAMA_3_1_8B).toBe('meta/llama-3.1-8b-instruct');
      expect(NIM_MODELS.CODESTRAL_24B).toBe('mistralai/codestral-24b-instruct');
      expect(NIM_MODELS.DEFAULT).toBe('meta/llama-3.1-70b-instruct');
    });
  });
});
