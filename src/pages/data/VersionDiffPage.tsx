// =============================================================================
// VERSION DIFF PAGE — Compare two plan versions side-by-side
// Uses VersionControlEngine for diff computation, VersionDiffViewer for display
// =============================================================================

import { useEffect, useMemo, useState } from 'react';
import { VersionControlEngine } from '@/engines/VersionControlEngine';
import { VersionDiffViewer } from '@/components/ui/VersionDiffViewer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  GitBranch,
  GitCommit,
  ArrowLeftRight,
  RefreshCw,
  AlertTriangle,
  Database,
} from 'lucide-react';
import { useGLStore } from '@/store/glStore';
import { useBudgetStore } from '@/store/budgetStore';
import { PageHeader } from '@/components/ui/PageHeader';

/**
 * Build a VersionControlEngine from GL and Budget store data.
 * Creates a "main" branch from initial GL entries and a "current" branch
 * reflecting the latest budget/forecast state.
 */
function createEngineFromStores(
  glEntries: ReturnType<typeof useGLStore.getState>['entries'],
  lineItems: ReturnType<typeof useBudgetStore.getState>['lineItems']
): VersionControlEngine {
  const engine = new VersionControlEngine();

  const mainBranch = engine.createBranch('main', 'Initial GL import', 'system');
  const currentBranch = engine.createBranch(
    'current',
    'Current working copy',
    'system',
    mainBranch.id
  );

  // Commit GL entries as the baseline
  if (glEntries.length > 0) {
    const changes = glEntries.slice(0, 50).map((e) => ({
      cube: 'gl' as const,
      coords: {
        entity: e.entityId ?? 'default',
        account: e.accountCode,
        period: e.period,
      },
      measure: 'amount' as const,
      oldValue: null,
      newValue: e.netChange ?? e.amount ?? e.debit - e.credit,
    }));
    engine.commit(mainBranch.id, `Imported ${glEntries.length} GL entries`, 'system', changes);
  }

  // Commit budget line items as current state
  if (lineItems.length > 0) {
    const changes = lineItems.slice(0, 50).map((item) => ({
      cube: 'budget' as const,
      coords: {
        entity: 'default',
        account: item.accountCode ?? item.accountName ?? 'unknown',
        period: item.periodId ?? 'unknown',
      },
      measure: 'amount' as const,
      oldValue: null,
      newValue: item.amount ?? 0,
    }));
    engine.commit(
      currentBranch.id,
      `Current budget state (${lineItems.length} items)`,
      'system',
      changes
    );
  }

  return engine;
}

// --- Page Component ---

export default function VersionDiffPage() {
  const glEntries = useGLStore((s) => s.entries);
  const lineItems = useBudgetStore((s) => s.lineItems);

  const engine = useMemo(
    () => createEngineFromStores(glEntries, lineItems),
    [glEntries, lineItems]
  );

  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [_diffMode, _setDiffMode] = useState<'branch' | 'commit'>('branch');

  useEffect(() => {
    document.title = 'FinPlan Pro — Version Diff';
  }, []);

  const branches = useMemo(() => engine.listBranches(), [engine]);

  const sourceBranch = useMemo(
    () => (selectedSourceId ? engine.getBranch(selectedSourceId) : undefined),
    [engine, selectedSourceId]
  );

  const targetBranch = useMemo(
    () => (selectedTargetId ? engine.getBranch(selectedTargetId) : undefined),
    [engine, selectedTargetId]
  );

  const sourceCommits = useMemo(
    () => (selectedSourceId ? engine.getBranchCommits(selectedSourceId) : []),
    [engine, selectedSourceId]
  );

  const targetCommits = useMemo(
    () => (selectedTargetId ? engine.getBranchCommits(selectedTargetId) : []),
    [engine, selectedTargetId]
  );

  // Derive diff entries during render (React 19 pattern)
  const diffEntries = useMemo(() => {
    if (!selectedSourceId || !selectedTargetId) return [];
    if (selectedSourceId === selectedTargetId) return [];
    try {
      const result = engine.diff(selectedSourceId, selectedTargetId);
      return result.changes;
    } catch {
      return [];
    }
  }, [engine, selectedSourceId, selectedTargetId]);

  // Derive error message during render
  const diffError = useMemo(() => {
    if (!selectedSourceId || !selectedTargetId) return null;
    if (selectedSourceId === selectedTargetId) {
      return 'Source and target branches must be different.';
    }
    try {
      engine.diff(selectedSourceId, selectedTargetId);
      return null;
    } catch (e: unknown) {
      return e instanceof Error ? e.message : 'Failed to compute diff';
    }
  }, [engine, selectedSourceId, selectedTargetId]);

  // Empty state when no GL data exists
  if (glEntries.length === 0 && lineItems.length === 0) {
    return (
      <main
        className="p-12 text-center max-w-md mx-auto"
        role="main"
        aria-label="Version Diff - No Data"
      >
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <div
          className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4"
          aria-hidden="true"
        >
          <Database className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data to Compare</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data or create budget entries to enable version comparison.
        </p>
        <Button
          id="import-btn"
          aria-label="Navigate to data import"
          onClick={() => window.location.assign('/data/gl-upload')}
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main" aria-label="Version Diff">
      {/* Header */}
      <PageHeader
        icon={<ArrowLeftRight className="h-6 w-6 text-blue-400" aria-hidden="true" />}
        title="Version Diff"
        purpose="Compare two plan versions side-by-side with cell-level change tracking"
        actions={
          <Button
            variant="secondary"
            disabled={!selectedSourceId || !selectedTargetId}
            aria-label="Diff auto-computed"
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Diff Auto-Computed
          </Button>
        }
      />

      {/* Branch Selection */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-blue-400" aria-hidden="true" />
            Select Branches to Compare
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Branch */}
            <div>
              <label htmlFor="diff-source" className="block text-xs text-slate-500 mb-1.5">
                Source Branch (Base)
              </label>
              <select
                id="diff-source"
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">Select source...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.description}
                  </option>
                ))}
              </select>
              {sourceBranch && (
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Badge variant="secondary" className="text-[10px]">
                    {sourceCommits.length} commits
                  </Badge>
                  <span>Created by {sourceBranch.createdBy}</span>
                </div>
              )}
            </div>

            {/* Target Branch */}
            <div>
              <label htmlFor="diff-target" className="block text-xs text-slate-500 mb-1.5">
                Target Branch (Compare)
              </label>
              <select
                id="diff-target"
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">Select target...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.description}
                  </option>
                ))}
              </select>
              {targetBranch && (
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Badge variant="secondary" className="text-[10px]">
                    {targetCommits.length} commits
                  </Badge>
                  <span>Created by {targetBranch.createdBy}</span>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {diffError && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {diffError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commit Log (if branches selected) */}
      {selectedSourceId && selectedTargetId && !diffError && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                <GitCommit className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                {sourceBranch?.name} Commits
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {sourceCommits.length === 0 ? (
                  <p className="text-xs text-slate-500">No commits</p>
                ) : (
                  sourceCommits.map((c) => (
                    <div
                      key={c.id}
                      className="text-xs text-[var(--text-muted)] flex items-start gap-2"
                    >
                      <span className="text-slate-600 font-mono flex-shrink-0">
                        {c.id.slice(-8)}
                      </span>
                      <span className="truncate">{c.message}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                <GitCommit className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                {targetBranch?.name} Commits
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {targetCommits.length === 0 ? (
                  <p className="text-xs text-slate-500">No commits</p>
                ) : (
                  targetCommits.map((c) => (
                    <div
                      key={c.id}
                      className="text-xs text-[var(--text-muted)] flex items-start gap-2"
                    >
                      <span className="text-slate-600 font-mono flex-shrink-0">
                        {c.id.slice(-8)}
                      </span>
                      <span className="truncate">{c.message}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diff Viewer */}
      {selectedSourceId && selectedTargetId && !diffError && (
        <VersionDiffViewer
          diffEntries={diffEntries}
          sourceLabel={sourceBranch?.name ?? 'Source'}
          targetLabel={targetBranch?.name ?? 'Target'}
          title="Cell-Level Changes"
        />
      )}

      {/* Empty state when no branches selected */}
      {(!selectedSourceId || !selectedTargetId) && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
              <ArrowLeftRight className="h-10 w-10 text-[var(--text-muted)]" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">
              Select Two Branches
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Choose a source and target branch above to see a detailed cell-level diff between the
              two versions.
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
