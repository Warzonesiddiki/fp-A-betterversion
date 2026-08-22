import { useState } from 'react';
import { hasLocalDraftFinancialTruth } from '@/domain/persistenceAuthority';
import { useGLStore } from '@/store/glStore';
import { hasPermission, useAuthStore } from '@/store/authStore';
import { Permissions } from '@/utils/rbacEnforcer';
import { Button } from '@/components/ui/Button';

/**
 * W0.8.5 durability honesty + W0.8.6 publish trigger.
 *
 * Financial-truth stores are still local-draft (budgets, forecasts, …), so
 * the workspace must state plainly that clearing site data destroys them.
 * The general ledger is the one surface with a live server commit channel
 * (W0.8.6-G6): when GL drafts exist, this banner offers the product trigger
 * to publish them, and reports the typed outcome inline.
 */
export function DurabilityBanner() {
  if (!hasLocalDraftFinancialTruth()) return null;
  return <DurabilityBannerInner />;
}

function DurabilityBannerInner() {
  const entries = useGLStore((s) => s.entries);
  const entrySyncState = useGLStore((s) => s.entrySyncState);
  const user = useAuthStore((s) => s.user);
  const [publishing, setPublishing] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);

  const draftCount = entries.filter((e) => (entrySyncState[e.id] ?? 'draft') === 'draft').length;
  const canPublish = hasPermission(user, Permissions.IMPORT_CREATE);

  const publishDrafts = async () => {
    setPublishing(true);
    setOutcome(null);
    try {
      const result = await useGLStore.getState().commitDraftsToServer();
      const parts: string[] = [`${result.committed} published`];
      if (result.failed > 0) parts.push(`${result.failed} failed`);
      for (const conflict of result.conflicts.slice(0, 2)) {
        parts.push(`${conflict.code}`);
      }
      setOutcome(parts.join(' · '));
    } catch (error) {
      setOutcome(error instanceof Error ? error.message : 'Publication failed');
    } finally {
      setPublishing(false);
    }
  };

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
        live on this device. Clearing site data permanently destroys them. This is not a backup. The
        general ledger can be published to the server below; budgets and forecasts remain local
        drafts.{' '}
        {canPublish && draftCount > 0 && (
          <span className="inline-flex items-center gap-2 align-baseline">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void publishDrafts()}
              disabled={publishing}
              data-testid="publish-gl-drafts"
            >
              {publishing
                ? 'Publishing…'
                : `Publish ${draftCount} GL draft${draftCount === 1 ? '' : 's'}`}
            </Button>
          </span>
        )}
        {outcome && (
          <span className="ml-2 font-semibold" data-testid="publish-outcome">
            {outcome}
          </span>
        )}
      </p>
    </div>
  );
}
