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
 *   - it tells the user not to treat the view as authoritative.
 *
 * Durability failures are not notifications; they are a mode change.
 */
import { useEffect, useState } from 'react';
import { subscribeStorageErrors, type StorageErrorEvent } from '@/utils/masterStorage';

const OPERATION_LABEL: Record<StorageErrorEvent['operation'], string> = {
  read: 'load saved data',
  write: 'save your changes',
  remove: 'delete saved data',
  decrypt: 'decrypt saved data',
};

export function StorageFailureBanner() {
  const [events, setEvents] = useState<StorageErrorEvent[]>([]);

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

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="storage-failure-banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#7f1d1d',
        color: '#fff',
        padding: '12px 16px',
        fontSize: 14,
        lineHeight: 1.5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
      }}
    >
      <strong>Storage error — your data may not be safe.</strong>{' '}
      {hasWriteFailure
        ? 'Recent changes could NOT be saved. Do not close this window; export a backup now.'
        : 'Saved data could not be loaded. What you see may be incomplete — do not treat these figures as authoritative.'}
      <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
        {events.map((e) => (
          <li key={`${e.operation}:${e.storeKey}`}>
            Failed to {OPERATION_LABEL[e.operation]} for <code>{e.storeKey}</code>: {e.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StorageFailureBanner;
