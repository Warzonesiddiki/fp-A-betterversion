/**
 * @superseded 2026-08-12 — by the Integrations hub at /settings/integrations
 * (ledger #29/#30). This page was backed by the in-memory ConnectorEngine (no
 * persistence; connections lost on reload) and is no longer routed — the
 * /settings/connectors route redirects to the hub. Kept (tested, unreachable)
 * pending final removal once the hub is committed and shipped.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { KPIValue } from '@/components/ui/KPIValue';
import { ConnectorEngine, type ConnectorConfig } from '@/engines/ConnectorEngine';
import { Plug, Plus, Trash2, CheckCircle, XCircle, RefreshCw, Database } from 'lucide-react';

export default function ConnectorSettingsPage() {
  const [connectors, setConnectors] = useState<ConnectorConfig[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'quickbooks' as ConnectorConfig['type'],
    baseUrl: '',
    apiKey: '',
    clientId: '',
    clientSecret: '',
  });
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing'>>(
    {}
  );

  useEffect(() => {
    document.title = 'FinPlan Pro — Connector Settings';
    setConnectors(ConnectorEngine.listConnectors());
  }, []);

  const handleAdd = () => {
    const id = `conn-${Date.now()}`;
    const config: ConnectorConfig = { id, ...form };
    ConnectorEngine.register(config);
    setConnectors(ConnectorEngine.listConnectors());
    setForm({
      name: '',
      type: 'quickbooks',
      baseUrl: '',
      apiKey: '',
      clientId: '',
      clientSecret: '',
    });
    setShowAdd(false);
  };

  const handleTest = async (id: string) => {
    setTestResults((prev) => ({ ...prev, [id]: 'testing' }));
    const result = await ConnectorEngine.connect(id);
    setTestResults((prev) => ({ ...prev, [id]: result.success ? 'success' : 'error' }));
  };

  const handleRemove = (id: string) => {
    ConnectorEngine.unregister(id);
    setConnectors(ConnectorEngine.listConnectors());
  };

  const typeLabels: Record<ConnectorConfig['type'], string> = {
    quickbooks: 'QuickBooks',
    netsuite: 'NetSuite',
    salesforce: 'Salesforce',
    custom: 'Custom API',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ERP Connectors</h1>
          <p className="text-muted-foreground">Connect to external accounting and ERP systems</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4 mr-1" /> Add Connector
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Connectors"
              value={connectors.length}
              icon={<Plug className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Connected"
              value={Object.values(testResults).filter((r) => r === 'success').length}
              icon={<CheckCircle className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue label="Supported" value={4} icon={<Database className="h-4 w-4" />} />
          </CardContent>
        </Card>
      </div>

      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle>Add Connector</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My QuickBooks"
              />
              <Select
                label="Type"
                value={form.type}
                onChange={(value) => setForm({ ...form, type: value as ConnectorConfig['type'] })}
                options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))}
              />
              <Input
                label="Base URL"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                placeholder="https://quickbooks.api.intuit.com/v3"
              />
              <Input
                label="API Key (optional)"
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              />
              <Input
                label="Client ID (optional)"
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              />
              <Input
                label="Client Secret (optional)"
                type="password"
                value={form.clientSecret}
                onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!form.name || !form.baseUrl}>
                Add
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {connectors.length > 0 ? (
        <div className="space-y-3">
          {connectors.map((conn) => (
            <Card key={conn.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{conn.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {typeLabels[conn.type]} · {conn.baseUrl}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {testResults[conn.id] === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {testResults[conn.id] === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(conn.id)}
                    disabled={testResults[conn.id] === 'testing'}
                  >
                    <RefreshCw
                      className={`h-3 w-3 mr-1 ${testResults[conn.id] === 'testing' ? 'animate-spin' : ''}`}
                    />
                    Test
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(conn.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Plug className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No connectors configured. Add one to sync data from your ERP system.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
