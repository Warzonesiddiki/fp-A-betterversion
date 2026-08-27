import { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useFinancialContextStore } from '@/store/financialContextStore';
import { FinancialStatusBadge } from '@/components/ui/FinancialStatusBadge';
import type { FreshnessState } from '@/types/financialContext';

export interface FinancialEntityOption {
  id: string;
  label: string;
  currency: string;
}

interface FinancialContextBarProps {
  entities: readonly FinancialEntityOption[];
  versions?: readonly { id: string; label: string }[];
}

const FRESHNESS_LABELS: Record<FreshnessState, string> = {
  synced: 'Synced',
  stale: 'Stale — refresh or inspect source health',
  offlineQueued: 'Offline — queued changes are not official',
  failed: 'Failed — inspect recovery options',
  unknown: 'Freshness unknown',
};

const PERIOD_OPTIONS = [
  { value: '', label: 'Period not set' },
  { value: '2026-01..2026-03', label: 'Q1 2026 (Jan–Mar)' },
  { value: '2026-04..2026-06', label: 'Q2 2026 (Apr–Jun)' },
  { value: '2026-07..2026-09', label: 'Q3 2026 (Jul–Sep)' },
  { value: '2026-10..2026-12', label: 'Q4 2026 (Oct–Dec)' },
  { value: '2026-01..2026-12', label: 'FY 2026' },
];

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'INR'];

/**
 * FinancialContextBar — canonical global context (Scope → Time → Version →
 * Currency → Freshness), per UX §4.1. All controls are native form controls
 * (keyboard operable); state is textual, never color-only. Official views
 * resolve scope/filtering server-side (F-04); this bar renders the draft
 * workspace context and always exposes the data-authority truth state.
 */
export const FinancialContextBar = memo(function FinancialContextBar({
  entities,
  versions = [],
}: FinancialContextBarProps) {
  const { context, setContext } = useFinancialContextStore(
    useShallow((s) => ({ context: s.context, setContext: s.setContext }))
  );
  const { scope, period, version, currency, freshness, source } = context;

  const selectedEntity = entities.find((e) => e.id === scope.entityIds[0]);

  return (
    <section
      aria-label="Financial context"
      className="flex flex-wrap items-center gap-x-5 gap-y-2 px-3 sm:px-4 py-2 border-b text-xs"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Scope */}
      <div className="flex items-center gap-1.5">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Scope
        </span>
        <label className="sr-only" htmlFor="fctx-scope">
          Entity scope
        </label>
        <select
          id="fctx-scope"
          className="rounded-md border px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-subtle)',
          }}
          value={selectedEntity?.id ?? ''}
          onChange={(e) => {
            const entity = entities.find((opt) => opt.id === e.target.value);
            setContext(
              entity
                ? { scope: { entityIds: [entity.id], label: entity.label } }
                : { scope: { entityIds: [], label: 'No entity selected' } }
            );
          }}
        >
          <option value="">{scope.label}</option>
          {entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.label} ({entity.currency})
            </option>
          ))}
        </select>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1.5">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Time
        </span>
        <label className="sr-only" htmlFor="fctx-period">
          Fiscal period
        </label>
        <select
          id="fctx-period"
          className="rounded-md border px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-subtle)',
          }}
          value={period.start && period.end ? `${period.start}..${period.end}` : ''}
          onChange={(e) => {
            const [start, end] = e.target.value.split('..');
            setContext(
              start && end
                ? { period: { start, end, calendar: 'fiscal' } }
                : { period: { start: '', end: '', calendar: 'fiscal' } }
            );
          }}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Version */}
      <div className="flex items-center gap-1.5">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Version
        </span>
        <label className="sr-only" htmlFor="fctx-version">
          Scenario or version
        </label>
        <select
          id="fctx-version"
          className="rounded-md border px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-subtle)',
          }}
          value={version?.id ?? ''}
          onChange={(e) => {
            const match = versions.find((v) => v.id === e.target.value);
            setContext(
              match
                ? { version: { id: match.id, label: match.label, lifecycle: 'draft' } }
                : { version: null }
            );
          }}
        >
          <option value="">{version ? version.label : 'No version'}</option>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Currency */}
      <div className="flex items-center gap-1.5">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Currency
        </span>
        <label className="sr-only" htmlFor="fctx-currency">
          Reporting currency
        </label>
        <select
          id="fctx-currency"
          className="rounded-md border px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-subtle)',
          }}
          value={currency.code}
          onChange={(e) => setContext({ currency: { code: e.target.value } })}
        >
          {CURRENCY_OPTIONS.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>

      {/* Freshness + authority truth state */}
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Freshness
        </span>
        <span role="status" style={{ color: 'var(--text-secondary)' }}>
          {FRESHNESS_LABELS[freshness]}
        </span>
        {source === 'local-draft' ? (
          <FinancialStatusBadge status="draft" detail="Local workspace data" />
        ) : (
          <FinancialStatusBadge status="locked" detail="Server-authorized context" />
        )}
      </div>
    </section>
  );
});
