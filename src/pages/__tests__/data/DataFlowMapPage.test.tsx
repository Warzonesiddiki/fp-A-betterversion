import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@/test/testUtils';
import DataFlowMapPage from '@/pages/data/DataFlowMapPage';

describe('DataFlowMapPage', () => {
  it('identifies itself as an illustrative code-level map, not live tracing', () => {
    render(<DataFlowMapPage />);

    expect(screen.getByRole('heading', { name: 'Data Flow Map' })).toBeInTheDocument();
    expect(screen.getByText(/illustrative.*not live usage/i)).toBeInTheDocument();
  });

  it('shows the implemented GL file and connector paths into glStore', () => {
    render(<DataFlowMapPage />);

    expect(screen.getByText('parseGLRows')).toBeInTheDocument();
    expect(screen.getByText('integrationStore')).toBeInTheDocument();
    expect(screen.getAllByText('glStore.importGLData')).toHaveLength(2);
  });

  it('lists ledger-importable providers separately from CRM and notification connectors', () => {
    render(<DataFlowMapPage />);

    const importable = screen.getByRole('list', { name: 'Ledger-importable providers' });
    const excluded = screen.getByRole('list', { name: 'Not marked for ledger import' });

    expect(within(importable).getByText('QuickBooks Online')).toBeInTheDocument();
    expect(within(importable).getByText('Xero')).toBeInTheDocument();
    expect(within(importable).getByText('Stripe')).toBeInTheDocument();
    expect(within(importable).queryByText('Salesforce')).not.toBeInTheDocument();
    expect(within(importable).queryByText('Microsoft Dynamics 365')).not.toBeInTheDocument();
    expect(within(excluded).getByText('Salesforce')).toBeInTheDocument();
    expect(within(excluded).getByText('Microsoft Dynamics 365')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Dynamics connector is Dataverse CRM, not D365 F\s*&?O or Business Central GL/i
      )
    ).toBeInTheDocument();
  });
});
