import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const h = vi.hoisted(() => {
  const state = {
    connections: {} as Record<string, unknown>,
    busy: {} as Record<string, boolean>,
    connect: vi.fn(),
    disconnect: vi.fn(),
    test: vi.fn(),
    sync: vi.fn(),
    importToLedger: vi.fn(),
    getConnection: vi.fn(),
  };

  const FakeIcon = () => null;

  const makeDef = (provider: string, name: string, category: string) => ({
    provider,
    name,
    description: `Description for ${name}`,
    capability: 'Accounts & transactions',
    category,
    icon: FakeIcon,
    authKind: 'token',
    syncable: provider !== 'slack',
    ledgerImportable: provider !== 'dynamics' && provider !== 'slack',
    fields: [{ key: 'secretKey', label: 'Secret Key', type: 'password', required: true }],
    buildConfig: () => ({}),
    buildConnector: () => ({}),
  });

  return { state, makeDef };
});

vi.mock('@/store/integrationStore', () => ({
  useIntegrationStore: (selector: (state: typeof h.state) => unknown) => selector(h.state),
}));

vi.mock('@/config/integrations', () => ({
  INTEGRATION_CATALOG: [
    h.makeDef('stripe', 'Stripe', 'payments'),
    h.makeDef('slack', 'Slack', 'communication'),
    h.makeDef('dynamics', 'Microsoft Dynamics 365', 'erp'),
  ],
  CATEGORY_LABELS: {
    payments: 'Payments',
    communication: 'Communication',
    accounting: 'Accounting',
    erp: 'ERP',
    crm: 'CRM',
    banking: 'Banking',
  },
}));

describe('IntegrationSettingsPage', () => {
  beforeEach(() => {
    h.state.connections = {};
    h.state.busy = {};
    vi.clearAllMocks();
  });

  it('renders the page heading and all catalog integrations', async () => {
    const { default: IntegrationSettingsPage } = await import('./IntegrationSettingsPage');
    render(<IntegrationSettingsPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Integrations');
    expect(screen.getByText('Stripe')).toBeInTheDocument();
    expect(screen.getByText('Slack')).toBeInTheDocument();
    expect(screen.getByText('Microsoft Dynamics 365')).toBeInTheDocument();
    expect(screen.getByText('3 integrations')).toBeInTheDocument();
  });

  it('opens the connect modal and submits credentials', async () => {
    const { default: IntegrationSettingsPage } = await import('./IntegrationSettingsPage');
    render(<IntegrationSettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Connect to Stripe' }));

    const field = screen.getByLabelText('Stripe Secret Key');
    expect(field).toBeInTheDocument();

    fireEvent.change(field, { target: { value: 'sk_test_123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

    expect(h.state.connect).toHaveBeenCalledWith('stripe', { secretKey: 'sk_test_123' });
  });

  it('shows sync and disconnect for a connected integration', async () => {
    h.state.connections = {
      stripe: {
        provider: 'stripe',
        id: 'conn-stripe-1',
        name: 'Stripe',
        status: 'connected',
        credentials: { secretKey: 'sk_test_123' },
        connectedAt: 1_700_000_000_000,
      },
    };
    const { default: IntegrationSettingsPage } = await import('./IntegrationSettingsPage');
    render(<IntegrationSettingsPage />);

    expect(screen.getByText('1 active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sync Stripe' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disconnect Stripe' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect to Stripe' })).not.toBeInTheDocument();
  });

  it('does not offer ledger import for a connector without a ledger transaction feed', async () => {
    h.state.connections = {
      dynamics: {
        provider: 'dynamics',
        id: 'conn-dynamics-1',
        name: 'Microsoft Dynamics 365',
        status: 'connected',
        credentials: { orgUrl: 'https://org.crm.dynamics.test' },
        connectedAt: 1_700_000_000_000,
      },
    };
    const { default: IntegrationSettingsPage } = await import('./IntegrationSettingsPage');
    render(<IntegrationSettingsPage />);

    expect(
      screen.queryByRole('button', { name: 'Import Microsoft Dynamics 365 to ledger' })
    ).not.toBeInTheDocument();
  });

  it('imports a connected integration into the ledger and displays the result', async () => {
    h.state.connections = {
      stripe: {
        provider: 'stripe',
        id: 'conn-stripe-1',
        name: 'Stripe',
        status: 'connected',
        credentials: { secretKey: 'sk_test_123' },
        connectedAt: 1_700_000_000_000,
        lastImportAt: 1_700_000_100_000,
        lastImportCount: 42,
      },
    };
    h.state.importToLedger.mockResolvedValue({
      success: true,
      imported: 42,
      skipped: 0,
      complete: true,
      omittedAccounts: 0,
      omittedTransactions: 0,
      omissionCountsExact: true,
      message: 'Imported 42 ledger rows.',
    });
    const { default: IntegrationSettingsPage } = await import('./IntegrationSettingsPage');
    render(<IntegrationSettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Import Stripe to ledger' }));
    expect(h.state.importToLedger).toHaveBeenCalledWith('stripe');
    expect(screen.getByText(/Last import: 42 rows/)).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('Imported 42 ledger rows.');
  });

  it('announces skipped rows and omitted accounts after a partial connector import', async () => {
    h.state.connections = {
      stripe: {
        provider: 'stripe',
        id: 'conn-stripe-1',
        name: 'Stripe',
        status: 'connected',
        credentials: { secretKey: 'sk_test_123' },
        connectedAt: 1_700_000_000_000,
      },
    };
    h.state.importToLedger.mockResolvedValue({
      success: true,
      imported: 25,
      skipped: 2,
      complete: false,
      omittedAccounts: 1,
      omittedTransactions: null,
      omissionCountsExact: false,
      message:
        'Imported 25 ledger rows. Import incomplete: 1 account omitted due to the 25-account limit; transaction count for omitted accounts is unknown. Skipped 2 rows.',
    });
    const { default: IntegrationSettingsPage } = await import('./IntegrationSettingsPage');
    render(<IntegrationSettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Import Stripe to ledger' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('1 account omitted');
    expect(screen.getByRole('alert')).toHaveTextContent('Skipped 2 rows');
  });

  it('supports searching the catalog', async () => {
    const { default: IntegrationSettingsPage } = await import('./IntegrationSettingsPage');
    render(<IntegrationSettingsPage />);

    fireEvent.change(screen.getByLabelText('Search integrations'), {
      target: { value: 'Slack' },
    });
    expect(screen.getByText('Slack')).toBeInTheDocument();
    expect(screen.queryByText('Stripe')).not.toBeInTheDocument();
  });
});
