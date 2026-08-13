/**
 * Engine Catalog (N-0013).
 *
 * WHY THIS PAGE EXISTS
 * --------------------
 * Audit ZCFA-2026-07-29-002 found ~100 calculation engines that no page,
 * store or service could reach. They were exported from a barrel that nothing
 * imported, and EngineRegistry's hand-written switch knew only 40 of them, so
 * `load()` threw "Unknown engine" for the rest. They were marketed as product
 * depth while being unreachable at runtime.
 *
 * This page makes them REAL for a user: every engine in the generated
 * manifest is listed, searchable, and can be loaded on demand with its actual
 * runtime exports inspected in the browser. "Load all" exercises the entire
 * catalogue and reports genuine pass/fail counts.
 *
 * This is deliberately an admin/diagnostic surface, not a marketing page: it
 * shows what actually exists, including anything that fails to load.
 */
import { useCallback, useMemo, useState } from 'react';
import { engineRegistry } from '@/engines/EngineRegistry';
import { ENGINE_IDS, ENGINE_COUNT } from '@/engines/engineManifest.generated';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

interface EngineRow {
  id: string;
  state: LoadState;
  exports: string[];
  error?: string;
}

const initialRows = (): EngineRow[] =>
  ENGINE_IDS.map((id) => ({ id, state: 'idle' as LoadState, exports: [] }));

export default function EngineCatalogPage() {
  const [rows, setRows] = useState<EngineRow[]>(initialRows);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const update = useCallback((id: string, patch: Partial<EngineRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const loadOne = useCallback(
    async (id: string) => {
      update(id, { state: 'loading', error: undefined });
      try {
        const mod = await engineRegistry.load(id);
        const exports = Object.keys(mod)
          .filter((k) => k !== '__esModule')
          .sort();
        update(id, { state: 'loaded', exports });
      } catch (err) {
        update(id, {
          state: 'error',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [update]
  );

  const loadAll = useCallback(async () => {
    setBusy(true);
    try {
      // Sequential in small batches keeps the UI responsive and makes a
      // failing engine attributable rather than lost in a Promise.all reject.
      const batch = 12;
      for (let i = 0; i < ENGINE_IDS.length; i += batch) {
        await Promise.all(ENGINE_IDS.slice(i, i + batch).map((id) => loadOne(id)));
      }
    } finally {
      setBusy(false);
    }
  }, [loadOne]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.id.toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  const stats = useMemo(() => {
    const loaded = rows.filter((r) => r.state === 'loaded').length;
    const failed = rows.filter((r) => r.state === 'error').length;
    return { loaded, failed, total: rows.length };
  }, [rows]);

  return (
    <div className="p-6 space-y-6" aria-label="Engine Catalog">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Engine Catalog</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Every calculation engine in the build, loadable on demand. Use this to verify an engine is
          genuinely wired rather than merely present in the source tree.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter engines…"
          aria-label="Filter engines"
          className="max-w-xs"
        />
        <Button onClick={loadAll} disabled={busy} aria-label="Load all engines">
          {busy ? 'Loading…' : `Load all ${ENGINE_COUNT}`}
        </Button>
        <div
          className="text-sm text-slate-600 dark:text-slate-300"
          role="status"
          aria-live="polite"
        >
          <span data-testid="engine-total">{stats.total}</span> total ·{' '}
          <span data-testid="engine-loaded" className="text-green-700 dark:text-green-400">
            {stats.loaded} loaded
          </span>{' '}
          ·{' '}
          <span data-testid="engine-failed" className="text-red-700 dark:text-red-400">
            {stats.failed} failed
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <caption className="sr-only">
            Calculation engines with load status and runtime exports
          </caption>
          <thead>
            <tr className="text-left border-b border-slate-200 dark:border-slate-700">
              <th scope="col" className="py-2 pr-4">
                Engine
              </th>
              <th scope="col" className="py-2 pr-4">
                Status
              </th>
              <th scope="col" className="py-2 pr-4">
                Runtime exports
              </th>
              <th scope="col" className="py-2">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2 pr-4 font-mono text-xs">{row.id}</td>
                <td className="py-2 pr-4">
                  {row.state === 'loaded' && (
                    <span className="text-green-700 dark:text-green-400">Loaded</span>
                  )}
                  {row.state === 'error' && (
                    <span className="text-red-700 dark:text-red-400" title={row.error}>
                      Failed
                    </span>
                  )}
                  {row.state === 'loading' && <span className="text-slate-500">Loading…</span>}
                  {row.state === 'idle' && (
                    <span className="text-[var(--text-muted)]">Not loaded</span>
                  )}
                </td>
                <td className="py-2 pr-4 text-xs text-slate-600 dark:text-slate-300">
                  {row.state === 'loaded'
                    ? `${row.exports.length}: ${row.exports.slice(0, 4).join(', ')}${
                        row.exports.length > 4 ? '…' : ''
                      }`
                    : row.state === 'error'
                      ? row.error
                      : '—'}
                </td>
                <td className="py-2">
                  <Button
                    onClick={() => loadOne(row.id)}
                    disabled={row.state === 'loading'}
                    aria-label={`Load ${row.id}`}
                    className="text-xs px-2 py-1"
                  >
                    Load
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
