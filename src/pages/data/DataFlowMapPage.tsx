import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { INTEGRATION_CATALOG } from '@/config/integrations';

const ledgerProviders = INTEGRATION_CATALOG.filter((provider) => provider.ledgerImportable);
const nonLedgerProviders = INTEGRATION_CATALOG.filter((provider) => !provider.ledgerImportable);

export default function DataFlowMapPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Data Flow Map"
        purpose="Illustrative code-level paths only—not live usage or runtime tracing."
      />

      <Card>
        <CardHeader>
          <CardTitle>Code-level data paths</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <section aria-labelledby="file-gl-flow-heading" className="space-y-2">
            <h2 id="file-gl-flow-heading" className="font-semibold">
              File-based GL intake
            </h2>
            <p className="text-sm">
              CSV/XLSX upload → <code>GLUploadPage</code> → <code>parseGLRows</code> validation →{' '}
              <code>glStore.importGLData</code> → ledger, trial balance, and statement views.
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Synthetic D365 F&amp;O and Business Central fixtures are tested; the owner’s real
              export and source control totals have not been reconciled.
            </p>
          </section>

          <section aria-labelledby="connector-gl-flow-heading" className="space-y-2">
            <h2 id="connector-gl-flow-heading" className="font-semibold">
              Connector-to-ledger intake
            </h2>
            <p className="text-sm">
              <code>/settings/integrations</code> → <code>INTEGRATION_CATALOG</code> →{' '}
              <code>integrationStore</code> pagination and mapping →{' '}
              <code>glStore.importGLData</code>.
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              The settings path uses the catalog and integration store directly; it does not use{' '}
              <code>ConnectorRegistry</code>.
            </p>
          </section>

          <section aria-labelledby="review-flow-heading" className="space-y-2">
            <h2 id="review-flow-heading" className="font-semibold">
              Review and correction
            </h2>
            <p className="text-sm">
              <code>glStore</code> → <code>/data/exceptions</code> rule findings and evidence →
              human disposition → <code>/data/corrections</code> request and event history.
            </p>
          </section>

          <section aria-labelledby="comparison-flow-heading" className="space-y-2">
            <h2 id="comparison-flow-heading" className="font-semibold">
              Comparison and reporting
            </h2>
            <p className="text-sm">
              <code>glStore</code> → <code>/data/comparison</code> day/month/year views and entry
              drill-through → trial balance, statements, and board-pack outputs.
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Missing periods are shown as “not in file,” not silently treated as zero.
            </p>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration catalog capability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            The ledger-import lists are derived from <code>ledgerImportable</code> in the same
            catalog used by the settings page.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section aria-labelledby="ledger-importable-heading">
              <h2 id="ledger-importable-heading" className="mb-2 font-semibold">
                Ledger import enabled
              </h2>
              <ul aria-label="Ledger-importable providers" className="list-disc space-y-1 pl-5">
                {ledgerProviders.map((provider) => (
                  <li key={provider.provider}>{provider.name}</li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="not-ledger-importable-heading">
              <h2 id="not-ledger-importable-heading" className="mb-2 font-semibold">
                Not marked for ledger import
              </h2>
              <ul aria-label="Not marked for ledger import" className="list-disc space-y-1 pl-5">
                {nonLedgerProviders.map((provider) => (
                  <li key={provider.provider}>{provider.name}</li>
                ))}
              </ul>
            </section>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Catalog eligibility is not proof of live-provider compatibility or accounting
            completeness. The Dynamics connector is Dataverse CRM, not D365 F&amp;O or Business
            Central GL; provider tests are mocked and no live verification is claimed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
