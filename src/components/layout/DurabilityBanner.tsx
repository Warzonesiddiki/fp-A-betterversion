import { hasLocalDraftFinancialTruth } from '@/domain/persistenceAuthority';

/**
 * W0.8.5 durability honesty.
 *
 * Until financial-truth stores are server-authoritative, every workspace
 * surface must state plainly that data is local-only. Clearing site data
 * destroys the ledger. This banner is the product-level disclosure; it is
 * not a toast, not a tooltip, and not colour-only (icon + text).
 */
export function DurabilityBanner() {
  if (!hasLocalDraftFinancialTruth()) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="durability-banner"
      className="px-3 sm:px-4 py-2 text-xs border-b flex items-start gap-2"
      style={{
        background: 'var(--warning-subtle)',
        color: 'var(--warning)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <span aria-hidden="true" className="font-semibold">
        !
      </span>
      <p className="m-0 leading-snug" style={{ color: 'var(--text-primary)' }}>
        <strong>Draft workspace — local only.</strong> The general ledger, budgets and forecasts
        live on this device. Clearing site data permanently destroys them. This is not a backup.
        Official numbers require server publication, which is not yet connected.
      </p>
    </div>
  );
}
