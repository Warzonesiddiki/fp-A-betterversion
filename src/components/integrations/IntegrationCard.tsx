import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Download, Plug, RefreshCw, XCircle } from 'lucide-react';
import { CATEGORY_LABELS, type IntegrationDefinition } from '@/config/integrations';
import type { IntegrationConnection } from '@/store/integrationStore';
import { cn } from '@/utils/cn';

interface IntegrationCardProps {
  definition: IntegrationDefinition;
  connection?: IntegrationConnection;
  busy: boolean;
  onConnect: (definition: IntegrationDefinition) => void;
  onTest: (provider: string) => void;
  onSync: (provider: string) => void;
  onImport: (provider: string) => void;
  onDisconnect: (provider: string) => void;
}

function formatSyncTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function IntegrationCard({
  definition,
  connection,
  busy,
  onConnect,
  onTest,
  onSync,
  onImport,
  onDisconnect,
}: IntegrationCardProps) {
  const status = connection?.status ?? 'disconnected';
  const isConnected = status === 'connected';
  const isError = status === 'error';
  const Icon = definition.icon;

  return (
    <Card
      className={cn(
        isConnected ? 'border-green-500/30 bg-green-500/5' : undefined,
        isError ? 'border-red-500/30 bg-red-500/5' : undefined
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-400 shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-white text-sm">{definition.name}</h3>
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {CATEGORY_LABELS[definition.category]}
              </span>
              {isConnected && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/50 text-green-400">
                  Connected
                </span>
              )}
              {isError && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/50 text-red-400">
                  Error
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-1">{definition.description}</p>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              <span className="text-slate-400 font-medium">Syncs:</span> {definition.capability}
            </p>

            {isError && connection?.lastError && (
              <p className="text-xs text-red-400 mb-3 break-words" role="alert">
                {connection.lastError}
              </p>
            )}

            <div className="flex items-center gap-2">
              {connection ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTest(definition.provider)}
                    disabled={busy}
                    aria-label={`Test ${definition.name} connection`}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                  {definition.syncable && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSync(definition.provider)}
                        disabled={busy}
                        aria-label={`Sync ${definition.name}`}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sync
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onImport(definition.provider)}
                        disabled={busy}
                        aria-label={`Import ${definition.name} to ledger`}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Import
                      </Button>
                    </>
                  )}
                  {connection.lastImportAt && (
                    <span className="text-xs text-[var(--text-muted)] ml-auto">
                      Last import: {connection.lastImportCount ?? 0} rows
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDisconnect(definition.provider)}
                    className="text-red-400 hover:text-red-300"
                    aria-label={`Disconnect ${definition.name}`}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Disconnect
                  </Button>
                  {connection.lastSyncAt && (
                    <span className="text-xs text-[var(--text-muted)] ml-auto">
                      Last sync: {formatSyncTime(connection.lastSyncAt)}
                    </span>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onConnect(definition)}
                  aria-label={`Connect to ${definition.name}`}
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
  );
}

export function StatusIcon({ status }: { status: 'connected' | 'error' | 'disconnected' }) {
  if (status === 'connected') return <CheckCircle className="h-4 w-4 text-green-400" />;
  if (status === 'error') return <XCircle className="h-4 w-4 text-red-400" />;
  return null;
}
