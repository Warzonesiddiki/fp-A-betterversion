import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettingsStore } from '@/store/settingsStore';
import {
  Plug,
  Globe,
  Database,
  FileSpreadsheet,
  Webhook,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Settings,
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error';
  category: 'accounting' | 'erp' | 'bi' | 'communication' | 'storage';
  lastSync?: string;
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    description: 'Sync chart of accounts, journal entries, and financial reports.',
    icon: <FileSpreadsheet className="h-5 w-5" />,
    status: 'disconnected',
    category: 'accounting',
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Import accounts, invoices, and bank transactions.',
    icon: <FileSpreadsheet className="h-5 w-5" />,
    status: 'disconnected',
    category: 'accounting',
  },
  {
    id: 'sap',
    name: 'SAP ERP',
    description: 'Connect to SAP for consolidated financial data and master data sync.',
    icon: <Database className="h-5 w-5" />,
    status: 'disconnected',
    category: 'erp',
  },
  {
    id: 'powerbi',
    name: 'Power BI',
    description: 'Push financial datasets to Power BI dashboards and reports.',
    icon: <Globe className="h-5 w-5" />,
    status: 'disconnected',
    category: 'bi',
  },
  {
    id: 'tableau',
    name: 'Tableau',
    description: 'Export curated financial models to Tableau workbooks.',
    icon: <Globe className="h-5 w-5" />,
    status: 'disconnected',
    category: 'bi',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send budget alerts and approval notifications to Slack channels.',
    icon: <Webhook className="h-5 w-5" />,
    status: 'disconnected',
    category: 'communication',
  },
  {
    id: 'sharepoint',
    name: 'SharePoint',
    description: 'Store and version exported reports in SharePoint document libraries.',
    icon: <Database className="h-5 w-5" />,
    status: 'disconnected',
    category: 'storage',
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Sync budget data to Google Sheets for collaborative editing.',
    icon: <FileSpreadsheet className="h-5 w-5" />,
    status: 'disconnected',
    category: 'accounting',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  accounting: 'Accounting & Finance',
  erp: 'ERP Systems',
  bi: 'Business Intelligence',
  communication: 'Communication',
  storage: 'Cloud Storage',
};

export default function IntegrationSettingsPage() {
  const { organization } = useSettingsStore();
  const [integrations, setIntegrations] = useState<Integration[]>(AVAILABLE_INTEGRATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookSaved, setWebhookSaved] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro - Integration Settings';
  }, []);

  const handleConnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === id
          ? { ...int, status: 'connected' as const, lastSync: new Date().toISOString() }
          : int
      )
    );
  };

  const handleDisconnect = (id: string) => {
    if (window.confirm('Disconnect this integration? Existing synced data will be preserved.')) {
      setIntegrations((prev) =>
        prev.map((int) =>
          int.id === id ? { ...int, status: 'disconnected' as const, lastSync: undefined } : int
        )
      );
    }
  };

  const handleSync = (id: string) => {
    setIntegrations((prev) =>
      prev.map((int) => (int.id === id ? { ...int, lastSync: new Date().toISOString() } : int))
    );
  };

  const handleSaveWebhook = () => {
    if (webhookUrl) {
      setWebhookSaved(true);
      setTimeout(() => setWebhookSaved(false), 3000);
    }
  };

  const filtered = integrations.filter((int) => {
    const matchesSearch =
      !searchQuery ||
      int.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      int.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || int.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const connectedCount = integrations.filter((i) => i.status === 'connected').length;
  const categories = Array.from(new Set(integrations.map((i) => i.category)));

  return (
    <main
      className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in"
      role="main"
      aria-label="Integration settings page"
    >
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-slate-400 text-sm">
          Connect {organization.name || 'your organization'} to external accounting, ERP, BI, and
          communication tools.
        </p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Plug className="h-5 w-5 text-blue-400 shrink-0" />
            <div>
              <div className="text-sm text-slate-400">Available</div>
              <div className="font-medium text-white">{integrations.length} integrations</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
            <div>
              <div className="text-sm text-slate-400">Connected</div>
              <div className="font-medium text-green-400">{connectedCount} active</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Settings className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-sm text-slate-400">Categories</div>
              <div className="font-medium text-white">{categories.length} groups</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search integrations"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat] ?? cat}
            </option>
          ))}
        </select>
      </div>

      {/* Integration cards */}
      <div className="space-y-4">
        {Object.entries(
          filtered.reduce<Record<string, Integration[]>>((acc, int) => {
            const cat = int.category;
            (acc[cat] ??= []).push(int);
            return acc;
          }, {})
        ).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-sm font-medium text-slate-400 mb-3">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((int) => (
                <Card
                  key={int.id}
                  className={
                    int.status === 'connected' ? 'border-green-500/30 bg-green-500/5' : undefined
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-800 text-slate-400 shrink-0">
                        {int.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-white text-sm">{int.name}</h3>
                          {int.status === 'connected' ? (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/50 text-green-400">
                              Connected
                            </span>
                          ) : int.status === 'error' ? (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/50 text-red-400">
                              Error
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{int.description}</p>
                        <div className="flex items-center gap-2">
                          {int.status === 'connected' ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSync(int.id)}
                                aria-label={`Sync ${int.name}`}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Sync
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDisconnect(int.id)}
                                className="text-red-400 hover:text-red-300"
                                aria-label={`Disconnect ${int.name}`}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Disconnect
                              </Button>
                              {int.lastSync && (
                                <span className="text-xs text-slate-500 ml-auto">
                                  Last sync: {new Date(int.lastSync).toLocaleString()}
                                </span>
                              )}
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleConnect(int.id)}
                              aria-label={`Connect to ${int.name}`}
                            >
                              <Plug className="h-3 w-3 mr-1" />
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Webhook configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-violet-400" />
            Webhook Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">
            Configure a webhook endpoint to receive real-time notifications for budget approvals,
            forecast completions, and data imports.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="webhook-url" className="text-sm text-slate-400">
                Webhook URL
              </label>
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-service.com/webhook"
                aria-label="Webhook URL"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="webhook-secret" className="text-sm text-slate-400">
                Signing Secret (optional)
              </label>
              <Input
                id="webhook-secret"
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_..."
                aria-label="Webhook signing secret"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveWebhook}
              disabled={!webhookUrl}
              aria-label="Save webhook configuration"
            >
              Save Webhook
            </Button>
            {webhookSaved && (
              <span className="text-sm text-green-400 flex items-center gap-1" role="status">
                <CheckCircle className="h-4 w-4" />
                Webhook saved
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API access note */}
      <Card className="border-slate-700">
        <CardContent className="p-4 flex items-start gap-3">
          <ExternalLink className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-white mb-1">API Access</div>
            <p className="text-xs text-slate-400">
              For custom integrations, use the FinPlan Pro REST API. Generate API keys from the
              Security Settings page. Full API documentation is available in the Help section.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
