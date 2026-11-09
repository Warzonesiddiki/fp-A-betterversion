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
    ledgerImportable: provider === 'stripe',
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

    it('refuses ledger import when a connector has no ledger transaction feed', async () => {
      await useIntegrationStore.getState().connect('slack', { token: 'webhook-token' });

      const result = await useIntegrationStore.getState().importToLedger('slack');

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/does not provide a ledger transaction feed/i);
      expect(mocks.getAccountsMock).not.toHaveBeenCalled();
      expect(mocks.getTransactionsMock).not.toHaveBeenCalled();
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
            // Q5 stage 4: the connector's major-unit rows cross to `Money`
            // before they reach the ledger (100.00 -> 10,000 cents).
            debit: { minor: 10000 },
            credit: { minor: 0 },
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

    it('paginates accounts and every account transaction feed before importing', async () => {
      const accounts = [
        {
          externalId: 'acct-1',
          name: 'Operating',
          type: 'asset' as const,
          currency: 'USD',
          balance: 0,
          active: true,
          lastUpdated: 1,
        },
        {
          externalId: 'acct-2',
          name: 'Payroll',
          type: 'expense' as const,
          currency: 'USD',
          balance: 0,
          active: true,
          lastUpdated: 1,
        },
      ];
      mocks.getAccountsMock
        .mockResolvedValueOnce({
          items: [accounts[0]],
          total: 2,
          page: 1,
          pageSize: 200,
          hasNext: true,
        })
        .mockResolvedValueOnce({
          items: [accounts[1]],
          total: 2,
          page: 2,
          pageSize: 200,
          hasNext: false,
        });
      const transaction = (externalId: string, accountId: string) => ({
        externalId,
        accountId,
        date: '2026-08-01',
        description: 'Ledger transaction',
        amount: 100,
        currency: 'USD',
        type: 'debit' as const,
      });
      mocks.getTransactionsMock
        .mockResolvedValueOnce({
          items: [transaction('txn-1', 'acct-1')],
          total: 2,
          page: 1,
          pageSize: 200,
          hasNext: true,
        })
        .mockResolvedValueOnce({
          items: [transaction('txn-2', 'acct-1')],
          total: 2,
          page: 2,
          pageSize: 200,
          hasNext: false,
        })
        .mockResolvedValueOnce({
          items: [transaction('txn-3', 'acct-2')],
          total: 1,
          page: 1,
          pageSize: 200,
          hasNext: false,
        });
      mocks.importGLDataMock.mockReturnValue({ success: true, imported: 3, errors: 0 });
      await useIntegrationStore.getState().connect('stripe', { token: 'sk_test' });

      const result = await useIntegrationStore.getState().importToLedger('stripe');

      expect(result.imported).toBe(3);
      expect(result.complete).toBe(true);
      expect(result.omittedAccounts).toBe(0);
      expect(result.omittedTransactions).toBe(0);
      expect(mocks.getAccountsMock).toHaveBeenNthCalledWith(2, { page: 2, pageSize: 200 });
      expect(mocks.getTransactionsMock).toHaveBeenNthCalledWith(2, 'acct-1', {
        page: 2,
        pageSize: 200,
      });
      expect(mocks.getTransactionsMock).toHaveBeenNthCalledWith(3, 'acct-2', {
        page: 1,
        pageSize: 200,
      });
    });

    it('reports accounts omitted by the 25-account limit', async () => {
      const accounts = Array.from({ length: 26 }, (_, index) => ({
        externalId: `acct-${index + 1}`,
        name: `Account ${index + 1}`,
        type: 'asset' as const,
        currency: 'USD',
        balance: 0,
        active: true,
        lastUpdated: 1,
      }));
      mocks.getAccountsMock.mockResolvedValue({
        items: accounts,
        total: 26,
        page: 1,
        pageSize: 200,
        hasNext: false,
      });
      mocks.getTransactionsMock.mockResolvedValue(emptyPage);
      await useIntegrationStore.getState().connect('stripe', { token: 'sk_test' });

      const result = await useIntegrationStore.getState().importToLedger('stripe');

      expect(result.complete).toBe(false);
      expect(result.omittedAccounts).toBe(1);
      expect(result.omittedTransactions).toBeNull();
      expect(result.omissionCountsExact).toBe(false);
      expect(result.message).toMatch(/1 account.*25-account limit/i);
      expect(result.message).toMatch(/transaction count.*unknown/i);
      expect(mocks.getTransactionsMock).toHaveBeenCalledTimes(25);
    });

    it('reports an incomplete transaction import when pagination stops progressing', async () => {
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
      mocks.getTransactionsMock
        .mockResolvedValueOnce({ ...txPage, hasNext: true, nextCursor: 'cursor-1' })
        .mockResolvedValueOnce({ ...txPage, page: 2, hasNext: true, nextCursor: 'cursor-1' });
      mocks.importGLDataMock.mockReturnValue({ success: true, imported: 2, errors: 0 });
      await useIntegrationStore.getState().connect('stripe', { token: 'sk_test' });

      const result = await useIntegrationStore.getState().importToLedger('stripe');

      expect(result.complete).toBe(false);
      expect(result.omittedTransactions).toBeNull();
      expect(result.omissionCountsExact).toBe(false);
      expect(result.message).toMatch(/at least one additional transaction page.*count is unknown/i);
      expect(mocks.getTransactionsMock).toHaveBeenCalledTimes(2);
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
