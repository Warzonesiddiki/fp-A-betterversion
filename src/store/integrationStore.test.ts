import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BaseConnector } from '@/services/api-integration/BaseConnector';
import { useIntegrationStore } from './integrationStore';
import { useAuthStore } from './authStore';

// W6-P0-14: RBAC-aware fixture — grants exactly the permissions this store's
// guarded actions enforce (mirrors glUploadStore.test.ts).
function authenticateIntegrationUser() {
  useAuthStore.setState({
    user: {
      id: 'integration-test-user',
      email: 'integration-test@finplan.local',
      firstName: 'Integration',
      lastName: 'Tester',
      avatarUrl: null,
      role: 'Admin',
      departmentId: 'finance',
      departmentName: 'Finance',
      entityId: 'entity-001',
      status: 'Active',
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: false,
      permissions: ['import:create', 'import:update', 'import:delete'],
    },
    isAuthenticated: true,
  });
}

const { stripeDef, slackDef, mocks } = vi.hoisted(() => {
  const mocks = {
    connectMock: vi.fn(),
    syncMock: vi.fn(),
    setOAuthTokensMock: vi.fn(),
    getAccountsMock: vi.fn(),
    getTransactionsMock: vi.fn(),
    importGLDataMock: vi.fn(),
  };

  const makeDef = (provider: string, name: string) => ({
    provider,
    name,
    buildConfig: (values: Record<string, string>, id: string) => ({
      id,
      name,
      provider,
      auth: { type: 'bearer' as const, bearer: { token: values.token ?? '' } },
    }),
    buildConnector: () =>
      ({
        connect: mocks.connectMock,
        sync: mocks.syncMock,
        setOAuthTokens: mocks.setOAuthTokensMock,
        getAccounts: mocks.getAccountsMock,
        getTransactions: mocks.getTransactionsMock,
      }) as unknown as BaseConnector,
  });

  return {
    stripeDef: makeDef('stripe', 'Stripe'),
    slackDef: makeDef('slack', 'Slack'),
    mocks,
  };
});

vi.mock('@/config/integrations', () => ({
  INTEGRATION_CATALOG: [stripeDef, slackDef],
  getIntegrationDefinition: (provider: string) =>
    [stripeDef, slackDef].find((def) => def.provider === provider),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: {
    getState: () => ({ importGLData: mocks.importGLDataMock }),
  },
}));

const initialState = { connections: {}, busy: {} };

const emptyPage = { items: [], total: 0, page: 1, pageSize: 200, hasNext: false };
const txPage = {
  items: [
    {
      externalId: 'txn-1',
      accountId: 'acct-1',
      date: '2026-08-01',
      description: 'Vendor payment',
      amount: 100,
      currency: 'USD',
      type: 'debit',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 200,
  hasNext: false,
};

describe('integrationStore', () => {
  beforeEach(() => {
    authenticateIntegrationUser();
    useIntegrationStore.setState(initialState);
    vi.clearAllMocks();
    mocks.connectMock.mockResolvedValue(true);
    mocks.syncMock.mockResolvedValue({
      success: true,
      recordsSynced: 5,
      errors: [],
      duration: 10,
      timestamp: 12345,
    });
    mocks.getAccountsMock.mockResolvedValue(emptyPage);
    mocks.getTransactionsMock.mockResolvedValue(emptyPage);
    mocks.importGLDataMock.mockReturnValue({
      success: true,
      imported: 1,
      duplicates: 0,
      errors: 0,
    });
  });

  it('starts with no connections', () => {
    expect(useIntegrationStore.getState().getConnection('stripe')).toBeUndefined();
  });

  it('connect succeeds and persists the connection', async () => {
    const ok = await useIntegrationStore.getState().connect('stripe', { token: 'sk_test' });

    expect(ok).toBe(true);
    const connection = useIntegrationStore.getState().getConnection('stripe');
    expect(connection?.status).toBe('connected');
    expect(connection?.credentials).toEqual({ token: 'sk_test' });
    expect(connection?.connectedAt).toBeDefined();
    expect(useIntegrationStore.getState().busy.stripe).toBe(false);
  });

  it('connect applies a pasted OAuth access token to the connector', async () => {
    await useIntegrationStore.getState().connect('stripe', {
      token: 'sk_test',
      accessToken: 'oauth-token',
    });
    expect(mocks.setOAuthTokensMock).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'oauth-token' })
    );
  });

  it('connect failure sets status error with an honest message', async () => {
    mocks.connectMock.mockResolvedValue(false);
    const ok = await useIntegrationStore.getState().connect('stripe', { token: 'bad' });

    expect(ok).toBe(false);
    const connection = useIntegrationStore.getState().getConnection('stripe');
    expect(connection?.status).toBe('error');
    expect(connection?.lastError).toContain('check your credentials');
    expect(connection?.connectedAt).toBeUndefined();
  });

  it('connect catching a thrown error records the error message', async () => {
    mocks.connectMock.mockRejectedValue(new Error('Invalid API key'));
    const ok = await useIntegrationStore.getState().connect('stripe', { token: 'bad' });

    expect(ok).toBe(false);
    expect(useIntegrationStore.getState().getConnection('stripe')?.lastError).toBe(
      'Invalid API key'
    );
  });

  it('connect rejects unknown providers', async () => {
    const ok = await useIntegrationStore.getState().connect('sap', {});
    expect(ok).toBe(false);
    expect(useIntegrationStore.getState().getConnection('sap')).toBeUndefined();
  });

  it('disconnect removes the connection', async () => {
    await useIntegrationStore.getState().connect('stripe', { token: 'sk_test' });
    useIntegrationStore.getState().disconnect('stripe');
    expect(useIntegrationStore.getState().getConnection('stripe')).toBeUndefined();
  });

  it('test re-verifies an existing connection', async () => {
    await useIntegrationStore.getState().connect('stripe', { token: 'sk_test' });
    mocks.connectMock.mockResolvedValue(false);
    const ok = await useIntegrationStore.getState().test('stripe');
    expect(ok).toBe(false);
    expect(useIntegrationStore.getState().getConnection('stripe')?.status).toBe('error');
  });

  it('sync records the pulled record count and timestamp', async () => {
    await useIntegrationStore.getState().connect('stripe', { token: 'sk_test' });
    const ok = await useIntegrationStore.getState().sync('stripe');

    expect(ok).toBe(true);
    expect(mocks.syncMock).toHaveBeenCalledWith(expect.objectContaining({ direction: 'pull' }));
    const connection = useIntegrationStore.getState().getConnection('stripe');
    expect(connection?.lastSyncAt).toBe(12345);
    expect(connection?.lastSyncCount).toBe(5);
    expect(useIntegrationStore.getState().busy.stripe).toBe(false);
  });

  it('sync failure marks the connection error', async () => {
    mocks.syncMock.mockResolvedValue({
      success: false,
      recordsSynced: 0,
      errors: ['Rate limited'],
      duration: 10,
      timestamp: 12345,
    });
    await useIntegrationStore.getState().connect('stripe', { token: 'sk_test' });
    const ok = await useIntegrationStore.getState().sync('stripe');

    expect(ok).toBe(false);
    const connection = useIntegrationStore.getState().getConnection('stripe');
    expect(connection?.status).toBe('error');
    expect(connection?.lastError).toBe('Rate limited');
  });

  it('sync without a connection returns false', async () => {
    const ok = await useIntegrationStore.getState().sync('slack');
    expect(ok).toBe(false);
  });

  describe('importToLedger', () => {
    it('returns an honest failure when there is no connection', async () => {
      const result = await useIntegrationStore.getState().importToLedger('stripe');
      expect(result.success).toBe(false);
      expect(result.message).toContain('No connection');
      expect(mocks.importGLDataMock).not.toHaveBeenCalled();
    });

    it('pulls accounts then transactions and imports rows into the GL ledger', async () => {
      mocks.getAccountsMock.mockResolvedValue({
        items: [
          {
            externalId: 'acct-1',
            name: 'Operating',
            type: 'asset',
            currency: 'USD',
            balance: 0,
            active: true,
            lastUpdated: 1,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 200,
        hasNext: false,
      });
      mocks.getTransactionsMock.mockResolvedValue(txPage);
      await useIntegrationStore.getState().connect('stripe', { token: 'sk_test' });

      const result = await useIntegrationStore.getState().importToLedger('stripe');

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(mocks.getTransactionsMock).toHaveBeenCalledWith(
        'acct-1',
        expect.objectContaining({ page: 1 })
      );
      expect(mocks.importGLDataMock).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            accountCode: 'acct-1',
            debit: 100,
            credit: 0,
            date: '2026-08-01',
          }),
        ],
        'stripe-connector'
      );
      const connection = useIntegrationStore.getState().getConnection('stripe');
      expect(connection?.lastImportAt).toBeDefined();
      expect(connection?.lastImportCount).toBe(1);
      expect(useIntegrationStore.getState().busy.stripe).toBe(false);
    });

    it('falls back to a direct transaction pull when the provider has no accounts feed', async () => {
      mocks.getAccountsMock.mockResolvedValue(emptyPage);
      mocks.getTransactionsMock.mockResolvedValue(txPage);
      await useIntegrationStore.getState().connect('stripe', { token: 'sk_test' });

      await useIntegrationStore.getState().importToLedger('stripe');

      expect(mocks.getTransactionsMock).toHaveBeenCalledWith(
        'ledger',
        expect.objectContaining({ page: 1 })
      );
    });

    it('reports zero imports and skips the ledger write when nothing is pulled', async () => {
      mocks.getTransactionsMock.mockResolvedValue(emptyPage);
      await useIntegrationStore.getState().connect('stripe', { token: 'sk_test' });

      const result = await useIntegrationStore.getState().importToLedger('stripe');

      expect(result.success).toBe(true);
      expect(result.imported).toBe(0);
      expect(mocks.importGLDataMock).not.toHaveBeenCalled();
    });

    it('surfaces ledger-rejected rows as skipped', async () => {
      mocks.getAccountsMock.mockResolvedValue(emptyPage);
      mocks.getTransactionsMock.mockResolvedValue(txPage);
      mocks.importGLDataMock.mockReturnValue({ success: false, imported: 0, errors: 2 });
      await useIntegrationStore.getState().connect('stripe', { token: 'sk_test' });

      const result = await useIntegrationStore.getState().importToLedger('stripe');

      expect(result.success).toBe(true);
      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(2);
    });

    it('marks the connection error when the pull throws', async () => {
      mocks.getAccountsMock.mockRejectedValue(new Error('Plaid API unreachable'));
      await useIntegrationStore.getState().connect('stripe', { token: 'sk_test' });

      const result = await useIntegrationStore.getState().importToLedger('stripe');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Plaid API unreachable');
      expect(useIntegrationStore.getState().getConnection('stripe')?.status).toBe('error');
      expect(useIntegrationStore.getState().busy.stripe).toBe(false);
    });
  });
});
