import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAutoSaveOptions {
  delay?: number;
  onSave: (data: unknown) => void;
  enabled?: boolean;
  /**
   * Optional monotonic revision counter bumped by writers on every change.
   * When provided, dirty detection compares revisions (O(1)) instead of
   * deep-serializing whole documents with JSON.stringify.
   */
  revision?: number;
}

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export function useAutoSave<T>(data: T, options: UseAutoSaveOptions) {
  const { delay = 3000, onSave, enabled = true, revision } = options;

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Latest values live in refs so debounced saves, unload flushes, and the
  // unmount flush never read stale closures.
  const latestDataRef = useRef<T>(data);
  const lastSavedDataRef = useRef<T>(data);
  const revisionRef = useRef<number | undefined>(revision);
  const lastSavedRevisionRef = useRef<number | undefined>(revision);
  const onSaveRef = useRef(onSave);
  const dirtyRef = useRef(false);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const executeSave = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (!dirtyRef.current) return;

    let payloadChanged = true;
    if (revisionRef.current !== undefined) {
      payloadChanged = revisionRef.current !== lastSavedRevisionRef.current;
    } else {
      try {
        payloadChanged =
          JSON.stringify(latestDataRef.current) !== JSON.stringify(lastSavedDataRef.current);
      } catch {
        // Unserializable snapshot: attempt the save rather than silently drop it.
        payloadChanged = true;
      }
    }

    if (!payloadChanged) {
      dirtyRef.current = false;
      setStatus((prev) => (prev === 'pending' ? 'idle' : prev));
      return;
    }

    setStatus('saving');
    try {
      onSaveRef.current(latestDataRef.current);
      lastSavedDataRef.current = latestDataRef.current;
      if (revisionRef.current !== undefined) {
        lastSavedRevisionRef.current = revisionRef.current;
      }
      dirtyRef.current = false;
      setStatus('saved');
      setLastSavedAt(new Date());
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    onSaveRef.current = onSave;
    revisionRef.current = revision;
    latestDataRef.current = data;

    if (!enabled) return;

    const changedSinceSaved =
      revisionRef.current !== undefined
        ? revisionRef.current !== lastSavedRevisionRef.current
        : !Object.is(data, lastSavedDataRef.current);

    if (!changedSinceSaved) return;

    dirtyRef.current = true;
    setStatus('pending');
    timeoutRef.current = setTimeout(executeSave, delay);

    return () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    };
  }, [data, delay, onSave, enabled, revision, executeSave]);

  // Flush safety net: while enabled, pending work is fired on beforeunload /
  // tab-hidden, and the unmount-or-disable cleanup performs the flush so a
  // pending save is never dropped.
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => executeSave();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') executeSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      executeSave();
    };
  }, [enabled, executeSave]);

  const forceSave = useCallback(() => {
    executeSave();
  }, [executeSave]);

  return { forceSave, status, lastSavedAt };
}
