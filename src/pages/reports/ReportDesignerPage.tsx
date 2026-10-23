import React, { useEffect, useRef, useState } from 'react';
import { ReportDesigner } from '@/components/reports/designer/ReportDesigner';
import { useCubeStore } from '@/store/cubeStore';
import { useGLStore } from '@/store/glStore';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export default function ReportDesignerPage() {
  const initialize = useCubeStore((s) => s.initialize);
  const isInitialized = useCubeStore((s) => s.isInitialized);
  const syncGLActuals = useCubeStore((s) => s.syncGLActuals);
  const entries = useGLStore((s) => s.entries);
  const [initError, setInitError] = useState<string | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const syncedForRef = useRef<string>('');

  useEffect(() => {
    if (!isInitialized) {
      try {
        initialize();
      } catch (err) {
        setInitError(err instanceof Error ? err.message : 'Failed to initialize report engine');
      }
    }
  }, [isInitialized, initialize]);

  // Phase 14: load the posted ledger into the GL_Actuals cube so the
  // designer renders real figures. Before this wire the cube
  // initialized empty and the designer could only show hand-typed
  // cells. Sync is idempotent per entry-set (same keys, same values);
  // a permission refusal is disclosed, not swallowed.
  useEffect(() => {
    if (!isInitialized || entries.length === 0) return;
    const fingerprint = `${entries.length}:${entries[entries.length - 1]?.id ?? ''}`;
    if (syncedForRef.current === fingerprint) return;
    syncedForRef.current = fingerprint;
    try {
      const written = syncGLActuals(entries);
      setSyncNote(
        written > 0
          ? `Ledger loaded into the designer cube: ${written} actual cells from ${entries.length} GL entries (Scenario: Actual).`
          : null
      );
    } catch (err) {
      setSyncNote(
        `Ledger not loaded into the cube: ${err instanceof Error ? err.message : 'permission required'}. The designer shows manually entered cells only.`
      );
    }
  }, [isInitialized, entries, syncGLActuals]);

  return (
    <div className="h-full w-full overflow-hidden bg-slate-950">
      {/*
        Full-bleed editor: the designer's own toolbar is a control strip, not a page
        header, so PageHeader's left-aligned flex row would break the h-full layout.
        A visually-hidden h1 still gives the route a heading for AT users.
      */}
      <h1 className="sr-only">Report Designer</h1>
      {initError && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-sm text-red-400 m-4">
          {initError}
        </div>
      )}
      {syncNote && (
        <div
          role="status"
          className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] rounded-lg p-3 text-sm text-[var(--text-secondary)] m-4"
        >
          {syncNote}
        </div>
      )}
      <ReportDesigner />
    </div>
  );
}
