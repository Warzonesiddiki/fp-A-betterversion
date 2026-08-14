import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Plug, CheckCircle, Settings, ShieldCheck } from 'lucide-react';
import {
  CATEGORY_LABELS,
  INTEGRATION_CATALOG,
  type IntegrationCategory,
  type IntegrationDefinition,
} from '@/config/integrations';
import { useIntegrationStore } from '@/store/integrationStore';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { ConnectIntegrationModal } from '@/components/integrations/ConnectIntegrationModal';

export default function IntegrationSettingsPage() {
  const connections = useIntegrationStore((s) => s.connections);
  const busy = useIntegrationStore((s) => s.busy);
  const connect = useIntegrationStore((s) => s.connect);
  const disconnect = useIntegrationStore((s) => s.disconnect);
  const test = useIntegrationStore((s) => s.test);
  const sync = useIntegrationStore((s) => s.sync);
  const importToLedger = useIntegrationStore((s) => s.importToLedger);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<IntegrationCategory | 'all'>('all');
  const [connecting, setConnecting] = useState<IntegrationDefinition | null>(null);
  const [connectError, setConnectError] = useState<string | undefined>(undefined);

  useEffect(() => {
    document.title = 'FinPlan Pro — Integrations';
  }, []);

  const filtered = useMemo(
    () =>
      INTEGRATION_CATALOG.filter((def) => {
        const matchesSearch =
          !searchQuery ||
          def.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          def.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || def.category === categoryFilter;
        return matchesSearch && matchesCategory;
      }),
    [searchQuery, categoryFilter]
  );

  const grouped = useMemo(
    () =>
      filtered.reduce<Record<string, IntegrationDefinition[]>>((acc, def) => {
        (acc[def.category] ??= []).push(def);
        return acc;
      }, {}),
    [filtered]
  );

  const connectedCount = Object.values(connections).filter((c) => c.status === 'connected').length;
  const categoryCount = new Set(INTEGRATION_CATALOG.map((d) => d.category)).size;

  const handleSubmitConnect = async (values: Record<string, string>) => {
    if (!connecting) return;
    setConnectError(undefined);
    const ok = await connect(connecting.provider, values);
    if (ok) {
      setConnecting(null);
    } else {
      setConnectError(
        connections[connecting.provider]?.lastError ??
          'Connection failed — check your credentials and try again.'
      );
    }
  };

  return (
    <main
      className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in"
      role="main"
      aria-label="Integration settings page"
    >
      <PageHeader
        title="Integrations"
        purpose="Connect external accounting, ERP, CRM, payments, banking, and communication systems. Credentials stay on this device in local encrypted storage."
      />

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Plug className="h-5 w-5 text-blue-400 shrink-0" />
            <div>
              <div className="text-sm text-[var(--text-muted)]">Available</div>
              <div className="font-medium text-[var(--text-primary)]">
                {INTEGRATION_CATALOG.length} integrations
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
            <div>
              <div className="text-sm text-[var(--text-muted)]">Connected</div>
              <div className="font-medium text-green-400">{connectedCount} active</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Settings className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-sm text-[var(--text-muted)]">Categories</div>
              <div className="font-medium text-[var(--text-primary)]">{categoryCount} groups</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search integrations"
          className="flex-1"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as IntegrationCategory | 'all')}
          className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Integration cards, grouped by category */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-sm font-medium text-[var(--text-muted)] mb-3">
              {CATEGORY_LABELS[category as IntegrationCategory] ?? category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((def) => (
                <IntegrationCard
                  key={def.provider}
                  definition={def}
                  connection={connections[def.provider]}
                  busy={busy[def.provider] ?? false}
                  onConnect={setConnecting}
                  onTest={test}
                  onSync={sync}
                  onImport={importToLedger}
                  onDisconnect={disconnect}
                />
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent
              className="p-8 text-center text-[var(--text-muted)] text-sm"
              role="status"
              aria-live="polite"
            >
              No integrations match your search.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Security note */}
      <Card className="border-slate-700">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-[var(--text-muted)] shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)] mb-1">
              Local credentials
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Integration credentials are stored only on this device in the app&apos;s local
              encrypted storage — they are never transmitted to FinPlan Pro servers. &quot;Test
              connection&quot; performs a real API health check against the provider; OAuth2
              providers accept a pasted access token from your provider&apos;s OAuth flow until a
              full server-authorized redirect flow ships. &quot;Import&quot; pulls transactions from
              the connected provider and writes them to the GL ledger through the standard import
              pipeline (validation + duplicate detection).
            </p>
          </div>
        </CardContent>
      </Card>

      {connecting && (
        <ConnectIntegrationModal
          definition={connecting}
          busy={busy[connecting.provider] ?? false}
          error={connectError}
          onClose={() => {
            setConnecting(null);
            setConnectError(undefined);
          }}
          onSubmit={handleSubmitConnect}
        />
      )}
    </main>
  );
}
