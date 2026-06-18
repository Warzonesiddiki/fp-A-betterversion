import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesforceConnector } from './SalesforceConnector';
import type { ConnectorConfig } from './types';

// Mock the RestApiClient — same pattern as the other connector tests.
vi.mock('./RestApiClient', () => {
  return {
    RestApiClient: class MockRestApiClient {
      get = vi.fn();
      post = vi.fn();
      put = vi.fn();
      patch = vi.fn();
      delete = vi.fn();
      request = vi.fn();
      setOAuthTokens = vi.fn();
      getOAuthTokens = vi.fn();
      setTokenRefreshHandler = vi.fn();
      // Store the baseURL for tests that need to verify the re-base behavior
      defaults = { baseURL: 'https://login.salesforce.com' };
    },
  };
});

describe('SalesforceConnector', () => {
  let connector: SalesforceConnector;
  const mockConfig: ConnectorConfig = {
    id: 'sf-test',
    name: 'Salesforce Test',
    provider: 'salesforce',
    auth: {
      type: 'oauth2',
      oauth2: {
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
        tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
        scopes: ['api', 'refresh_token', 'offline_access'],
        redirectUri: 'https://app.example.com/callback',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new SalesforceConnector(mockConfig);
  });

  describe('construction', () => {
    it('should create connector with correct properties', () => {
      expect(connector.id).toBe('sf-test');
      expect(connector.name).toBe('Salesforce Test');
      expect(connector.provider).toBe('salesforce');
    });
  });

  describe('health check', () => {
    it('should return connected status on success', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          user_id: '005xx000001Sv1m',
          organization_id: '00Dxx0000001gPLEAY',
          username: 'admin@example.com',
          active: true,
        },
        headers: { 'sforce-limit-info': 'api-usage=23/15000' },
      });
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const health = await connector.checkHealth();
      expect(health.status).toBe('connected');
      expect(health.rateLimitRemaining).toBe(14977);
    });

    it('should return error when session is inactive', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: { active: false },
        headers: {},
      });
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const health = await connector.checkHealth();
      expect(health.status).toBe('error');
      expect(health.lastError).toBe('Salesforce session inactive');
    });

    it('should return error on network failure', async () => {
      const mockGet = vi.fn().mockRejectedValue(new Error('Network error'));
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const health = await connector.checkHealth();
      expect(health.status).toBe('error');
      expect(health.lastError).toBe('Network error');
    });
  });

  describe('OAuth code exchange', () => {
    it('should exchange code for tokens and update instanceUrl', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          access_token: 'sf-access-token',
          refresh_token: 'sf-refresh-token',
          instance_url: 'https://acme.my.salesforce.com/',
          token_type: 'Bearer',
          issued_at: '1700000000000',
          signature: 'sig',
          id: 'https://login.salesforce.com/id/00D/005',
        },
      });
      (connector as unknown as { client: { post: typeof mockPost } }).client.post = mockPost;

      const tokens = await connector.exchangeCodeForTokens(
        'auth-code',
        'https://app.example.com/cb'
      );
      expect(tokens.accessToken).toBe('sf-access-token');
      expect(tokens.tokenType).toBe('Bearer');
      // instanceUrl should be re-based (trailing slash stripped)
      expect((connector as unknown as { instanceUrl: string }).instanceUrl).toBe(
        'https://acme.my.salesforce.com'
      );
    });

    it('should throw if OAuth2 config missing', async () => {
      const noAuthConnector = new SalesforceConnector({
        ...mockConfig,
        auth: { type: 'bearer', bearer: { token: 't' } },
      });
      await expect(noAuthConnector.exchangeCodeForTokens('code', 'uri')).rejects.toThrow(
        'OAuth2 configuration required'
      );
    });
  });

  describe('OAuth token refresh', () => {
    it('should refresh and preserve refresh token', async () => {
      const mockGet = vi.fn().mockReturnValue({
        refreshToken: 'existing-refresh',
      });
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          access_token: 'new-access',
          instance_url: 'https://acme.my.salesforce.com',
          token_type: 'Bearer',
        },
      });
      (
        connector as unknown as {
          client: { getOAuthTokens: typeof mockGet; post: typeof mockPost };
        }
      ).client.getOAuthTokens = mockGet;
      (
        connector as unknown as {
          client: { getOAuthTokens: typeof mockGet; post: typeof mockPost };
        }
      ).client.post = mockPost;

      const tokens = await connector.refreshAccessToken();
      expect(tokens.accessToken).toBe('new-access');
      expect(tokens.refreshToken).toBe('existing-refresh');
    });

    it('should throw if no refresh token available', async () => {
      const mockGet = vi.fn().mockReturnValue(null);
      (
        connector as unknown as { client: { getOAuthTokens: typeof mockGet } }
      ).client.getOAuthTokens = mockGet;

      await expect(connector.refreshAccessToken()).rejects.toThrow('No refresh token available');
    });
  });

  describe('getOpportunities', () => {
    it('should query opportunities via SOQL and return paginated results', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          totalSize: 2,
          done: true,
          records: [
            {
              attributes: {
                type: 'Opportunity',
                url: '/services/data/v59.0/sobjects/Opportunity/006xx',
              },
              Id: '006xx1',
              Name: 'Acme Deal',
              AccountId: '001xx',
              StageName: 'Negotiation/Review',
              Amount: 100000,
              Probability: 70,
              CloseDate: '2026-09-30',
              IsClosed: false,
              IsWon: false,
              ForecastCategoryName: 'Commit',
              OwnerId: '005xx',
              LastModifiedDate: '2026-06-15T10:00:00Z',
            },
            {
              attributes: {
                type: 'Opportunity',
                url: '/services/data/v59.0/sobjects/Opportunity/006yy',
              },
              Id: '006yy1',
              Name: 'Beta Co',
              AccountId: null,
              StageName: 'Closed Won',
              Amount: 50000,
              Probability: 100,
              CloseDate: '2026-06-01',
              IsClosed: true,
              IsWon: true,
              ForecastCategoryName: 'Closed',
              OwnerId: '005xx',
              LastModifiedDate: '2026-06-01T12:00:00Z',
            },
          ],
        },
      });
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const result = await connector.getOpportunities({ pageSize: 100 });
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasNext).toBe(false);
      // Verify the SOQL was URL-encoded
      const callArgs = mockGet.mock.calls[0]?.[0] as string;
      expect(callArgs).toContain('SELECT');
      expect(callArgs).toContain('FROM%20Opportunity');
    });
  });

  describe('mapOpportunity', () => {
    it('should map to canonical shape with stage→category lookup', () => {
      const opp = {
        attributes: { type: 'Opportunity', url: '' },
        Id: '006xx',
        Name: 'Test',
        AccountId: '001xx',
        StageName: 'Prospecting',
        Amount: 25000,
        Probability: 20,
        CloseDate: '2026-12-31',
        CreatedDate: '2026-01-01T00:00:00Z',
        LastModifiedDate: '2026-06-15T10:00:00Z',
        IsClosed: false,
        IsWon: false,
        ForecastCategory: null,
        ForecastCategoryName: null,
        OwnerId: '005xx',
        Description: 'desc',
        LeadSource: 'Web',
        Type: 'New Customer',
        NextStep: null,
      };
      const mapped = connector.mapOpportunity(opp);
      expect(mapped.externalId).toBe('006xx');
      expect(mapped.amount).toBe(25000);
      expect(mapped.forecastCategory).toBe('Pipeline'); // Default mapping
    });

    it('should prefer explicit ForecastCategoryName over stage lookup', () => {
      const opp = {
        attributes: { type: 'Opportunity', url: '' },
        Id: '006xx',
        Name: 'Test',
        AccountId: null,
        StageName: 'Prospecting',
        Amount: 1000,
        Probability: 10,
        CloseDate: '2026-12-31',
        CreatedDate: '2026-01-01T00:00:00Z',
        LastModifiedDate: '2026-06-15T10:00:00Z',
        IsClosed: false,
        IsWon: false,
        ForecastCategory: 'BestCase',
        ForecastCategoryName: 'BestCase',
        OwnerId: '005xx',
        Description: null,
        LeadSource: null,
        Type: null,
        NextStep: null,
      };
      const mapped = connector.mapOpportunity(opp);
      expect(mapped.forecastCategory).toBe('BestCase');
    });
  });

  describe('aggregateForecast', () => {
    it('should roll up opportunities by forecast category', () => {
      const opps = [
        {
          attributes: { type: 'O', url: '' },
          Id: '1',
          Name: 'A',
          AccountId: null,
          StageName: 'Prospecting',
          Amount: 100,
          Probability: 20,
          CloseDate: '2026-12-31',
          CreatedDate: '',
          LastModifiedDate: '2026-06-15T10:00:00Z',
          IsClosed: false,
          IsWon: false,
          ForecastCategory: null,
          ForecastCategoryName: 'Pipeline',
          OwnerId: '005',
          Description: null,
          LeadSource: null,
          Type: null,
          NextStep: null,
        },
        {
          attributes: { type: 'O', url: '' },
          Id: '2',
          Name: 'B',
          AccountId: null,
          StageName: 'Negotiation',
          Amount: 200,
          Probability: 80,
          CloseDate: '2026-12-31',
          CreatedDate: '',
          LastModifiedDate: '2026-06-15T10:00:00Z',
          IsClosed: false,
          IsWon: false,
          ForecastCategory: null,
          ForecastCategoryName: 'Commit',
          OwnerId: '005',
          Description: null,
          LeadSource: null,
          Type: null,
          NextStep: null,
        },
        {
          attributes: { type: 'O', url: '' },
          Id: '3',
          Name: 'C',
          AccountId: null,
          StageName: 'Closed Won',
          Amount: 500,
          Probability: 100,
          CloseDate: '2026-12-31',
          CreatedDate: '',
          LastModifiedDate: '2026-06-15T10:00:00Z',
          IsClosed: true,
          IsWon: true,
          ForecastCategory: null,
          ForecastCategoryName: 'Closed',
          OwnerId: '005',
          Description: null,
          LeadSource: null,
          Type: null,
          NextStep: null,
        },
      ];
      const forecast = connector.aggregateForecast(opps);
      expect(forecast.pipeline).toBe(100);
      expect(forecast.commit).toBe(200);
      expect(forecast.closed).toBe(500);
      expect(forecast.total).toBe(800);
      // Weighted = 100*0.20 + 200*0.80 + 500*1.00 = 20 + 160 + 500 = 680
      expect(forecast.weightedForecast).toBe(680);
    });
  });

  describe('composite API', () => {
    it('should reject more than 25 sub-requests', async () => {
      const subrequests = Array.from({ length: 26 }, () => ({
        method: 'GET',
        url: '/services/data/v59.0/sobjects/Account/001',
      }));
      await expect(connector.composite(subrequests)).rejects.toThrow('up to 25 sub-requests');
    });
  });
});
