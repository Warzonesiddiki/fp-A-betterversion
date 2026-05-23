import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RestApiClient } from './RestApiClient';
import { ApiError } from './types';

// Mock axios
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    request: vi.fn(),
    isAxiosError: vi.fn(
      (err: unknown) => (err as { isAxiosError?: boolean }).isAxiosError === true
    ),
  };
  return { default: mockAxios };
});

import axios from 'axios';

const mockAxios = vi.mocked(axios);
const mockRequest = vi.mocked(mockAxios.request);

describe('RestApiClient', () => {
  let client: RestApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new RestApiClient('https://api.example.com', {
      type: 'bearer',
      bearer: { token: 'test-token' },
    });
  });

  describe('construction', () => {
    it('should create client with default options', () => {
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should create client with custom options', () => {
      new RestApiClient(
        'https://api.test.com',
        { type: 'api_key', apiKey: { headerName: 'X-Key', key: 'abc' } },
        {
          timeout: 5000,
          headers: { 'X-Custom': 'value' },
        }
      );

      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.test.com',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'X-Custom': 'value',
        },
      });
    });
  });

  describe('auth headers', () => {
    it('should inject bearer token', async () => {
      mockRequest.mockResolvedValueOnce({ data: {}, status: 200, statusText: 'OK', headers: {} });

      await client.get('/test');

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should inject API key header', async () => {
      const apiKeyClient = new RestApiClient('https://api.example.com', {
        type: 'api_key',
        apiKey: { headerName: 'X-API-Key', key: 'my-key' },
      });

      mockRequest.mockResolvedValueOnce({ data: {}, status: 200, statusText: 'OK', headers: {} });

      await apiKeyClient.get('/test');

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'my-key',
          }),
        })
      );
    });

    it('should inject basic auth header', async () => {
      const basicClient = new RestApiClient('https://api.example.com', {
        type: 'basic',
        basic: { username: 'user', password: 'pass' },
      });

      mockRequest.mockResolvedValueOnce({ data: {}, status: 200, statusText: 'OK', headers: {} });

      await basicClient.get('/test');

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Basic ${btoa('user:pass')}`,
          }),
        })
      );
    });

    it('should inject OAuth2 token', async () => {
      const oauthClient = new RestApiClient('https://api.example.com', {
        type: 'oauth2',
        oauth2: {
          clientId: 'id',
          clientSecret: 'secret',
          authorizationUrl: 'https://auth.example.com',
          tokenUrl: 'https://token.example.com',
          scopes: ['read'],
          redirectUri: 'https://app.example.com/callback',
        },
      });

      oauthClient.setOAuthTokens({
        accessToken: 'oauth-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
      });

      mockRequest.mockResolvedValueOnce({ data: {}, status: 200, statusText: 'OK', headers: {} });

      await oauthClient.get('/test');

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer oauth-token',
          }),
        })
      );
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      mockRequest.mockResolvedValue({
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
      });
    });

    it('should make GET request', async () => {
      await client.get('/users', { active: true });
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', url: '/users', params: { active: true } })
      );
    });

    it('should make POST request', async () => {
      await client.post('/users', { name: 'Test' });
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'POST', url: '/users', data: { name: 'Test' } })
      );
    });

    it('should make PUT request', async () => {
      await client.put('/users/1', { name: 'Updated' });
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'PUT', url: '/users/1', data: { name: 'Updated' } })
      );
    });

    it('should make PATCH request', async () => {
      await client.patch('/users/1', { name: 'Patched' });
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'PATCH', url: '/users/1', data: { name: 'Patched' } })
      );
    });

    it('should make DELETE request', async () => {
      await client.delete('/users/1');
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'DELETE', url: '/users/1' })
      );
    });
  });

  describe('error handling', () => {
    it('should throw ApiError on HTTP error', async () => {
      const error = Object.assign(new Error('Not Found'), {
        isAxiosError: true,
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { error: 'not found' },
          headers: {},
        },
      });
      mockRequest.mockRejectedValue(error);

      await expect(client.get('/missing')).rejects.toThrow(ApiError);
      await expect(client.get('/missing')).rejects.toMatchObject({ status: 404 });
    });

    it('should throw ApiError for network errors', async () => {
      const error = new Error('Network Error');
      mockRequest.mockRejectedValue(error);

      await expect(client.get('/fail')).rejects.toThrow(ApiError);
    }, 15000);

    it('should retry on 500 errors', async () => {
      const serverError = Object.assign(new Error('Server Error'), {
        isAxiosError: true,
        response: { status: 500, statusText: 'Internal Server Error', data: {}, headers: {} },
      });
      mockRequest
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({ data: { ok: true }, status: 200, statusText: 'OK', headers: {} });

      const result = await client.get('/flaky');
      expect(result.status).toBe(200);
      expect(mockRequest).toHaveBeenCalledTimes(3);
    }, 15000);

    it('should retry on 429 (rate limit)', async () => {
      const rateLimitError = Object.assign(new Error('Too Many Requests'), {
        isAxiosError: true,
        response: {
          status: 429,
          statusText: 'Too Many Requests',
          data: {},
          headers: { 'retry-after': '1' },
        },
      });
      mockRequest
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ data: { ok: true }, status: 200, statusText: 'OK', headers: {} });

      const result = await client.get('/rate-limited');
      expect(result.status).toBe(200);
      expect(mockRequest).toHaveBeenCalledTimes(2);
    }, 15000);
  });

  describe('response mapping', () => {
    it('should map response correctly', async () => {
      mockRequest.mockResolvedValueOnce({
        data: { id: 1, name: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: { 'x-request-id': 'abc' },
      });

      const response = await client.get<{ id: number; name: string }>('/test');

      expect(response).toEqual({
        data: { id: 1, name: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: { 'x-request-id': 'abc' },
      });
    });
  });

  describe('OAuth2 token refresh', () => {
    it('should detect expired tokens', async () => {
      const oauthClient = new RestApiClient('https://api.example.com', {
        type: 'oauth2',
        oauth2: {
          clientId: 'id',
          clientSecret: 'secret',
          authorizationUrl: 'https://auth.example.com',
          tokenUrl: 'https://token.example.com',
          scopes: ['read'],
          redirectUri: 'https://app.example.com/callback',
        },
      });

      oauthClient.setOAuthTokens({
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 10000, // Already expired
        tokenType: 'Bearer',
      });

      oauthClient.setTokenRefreshHandler(async () => ({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
      }));

      mockRequest.mockResolvedValueOnce({
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      await oauthClient.get('/test');

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer new-token',
          }),
        })
      );
    });
  });
});
