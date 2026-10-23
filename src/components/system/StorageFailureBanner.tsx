/**
 * Storage failure surface (N-0002).
 *
 * WHY THIS EXISTS
 * ---------------
 * `masterStorage` emits typed errors on the `subscribeStorageErrors` channel
 * when a read, write, remove or decrypt fails. Before this component, that
 * channel had NO consumer in the application: every storage failure was
 * emitted into the void. Combined with `getItem` returning `null` on failure,
 * a broken storage backend silently hydrated EMPTY stores and the app
 * presented them as the user's real financial data.
 *
 * This banner is intentionally NOT a toast:
 *   - it does not auto-dismiss,
 *   - it is role="alert" so assistive tech announces it,
 *   - it states plainly that data was not saved/loaded,
 *   - it offers two concrete actions: an independent raw emergency dump
 *     (F-B4-11 — createBackupData reads through the same failing backend, so
 *     it cannot be the only escape hatch) and navigation to Backup & Restore.
 *
 * Durability failures are not notifications; they are a mode change.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeStorageErrors, type StorageErrorEvent } from '@/utils/masterStorage';
import { downloadRawEmergencyBackup } from '@/utils/backupRestore';

const OPERATION_LABEL: Record<StorageErrorEvent['operation'], string> = {
  read: 'load saved data',
  write: 'save your changes',
  remove: 'delete saved data',
  decrypt: 'decrypt saved data',
};

export function StorageFailureBanner() {
  const [events, setEvents] = useState<StorageErrorEvent[]>([]);
  const [isDumping, setIsDumping] = useState(false);
  const [dumpError, setDumpError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(
    () =>
      subscribeStorageErrors((event) => {
        setEvents((prev) => {
          // Collapse repeats per (operation, storeKey) so a retry loop cannot
          // flood the UI, but keep the most recent message.
          const key = `${event.operation}:${event.storeKey}`;
          const rest = prev.filter((e) => `${e.operation}:${e.storeKey}` !== key);
          return [...rest, event];
        });
      }),
    []
  );

  if (events.length === 0) return null;

  const hasWriteFailure = events.some((e) => e.operation === 'write');

  const handleEmergencyDownload = async () => {
    setIsDumping(true);
    setDumpError(null);
    try {
      await downloadRawEmergencyBackup();
    } catch (cause) {
      setDumpError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setIsDumping(false);
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="storage-failure-banner"
      className="fixed top-0 left-0 right-0 z-[9999] bg-[var(--danger-fill)] text-[var(--text-on-accent)] px-4 py-3 text-sm leading-normal shadow-lg"
    >
      <strong>Storage error — your data may not be safe.</strong>{' '}
      {hasWriteFailure
        ? 'Recent changes could NOT be saved. Do not close this window; export a backup now.'
        : 'Saved data could not be loaded. What you see may be incomplete — do not treat these figures as authoritative.'}
      <ul className="mt-2 mb-0 pl-5 list-disc">
        {events.map((e) => (
          <li key={`${e.operation}:${e.storeKey}`}>
            Failed to {OPERATION_LABEL[e.operation]} for <code>{e.storeKey}</code>: {e.message}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleEmergencyDownload}
          disabled={isDumping}
          data-testid="emergency-download-button"
          className="inline-flex items-center rounded-md border border-[color:var(--text-on-accent)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--text-on-accent)] hover:bg-[var(--danger-fill-hover)] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isDumping ? 'Preparing emergency copy…' : 'Download emergency copy'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/settings/backup')}
          data-testid="backup-page-link"
          className="inline-flex items-center rounded-md border border-[color:var(--text-on-accent)] bg-transparent px-3 py-1.5 text-sm font-medium underline underline-offset-4 text-[var(--text-on-accent)] hover:bg-[var(--danger-fill-hover)]"
        >
          Open Backup &amp; Restore
        </button>
      </div>
      {dumpError && (
        <p role="status" className="mt-2 mb-0 text-xs font-medium">
          Emergency download failed: {dumpError}
        </p>
      )}
    </div>
  );
}

export default StorageFailureBanner;
