import { useState, useEffect, useCallback, useRef } from 'react';

interface DirtyStateOptions {
  onDirtyChange?: (isDirty: boolean) => void;
  confirmMessage?: string;
  enableBeforeUnload?: boolean;
}

/**
 * Track dirty/unsaved state for forms and data
 */
export function useDirtyState(options: DirtyStateOptions = {}) {
  const {
    onDirtyChange,
    confirmMessage = 'You have unsaved changes. Are you sure you want to leave?',
    enableBeforeUnload = true,
  } = options;

  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [dirtyCount, setDirtyCount] = useState(0);
  const dirtyFields = useRef<Set<string>>(new Set());

  const markDirty = useCallback(
    (field?: string) => {
      if (field) dirtyFields.current.add(field);
      setIsDirty(true);
      setDirtyCount(dirtyFields.current.size);
      onDirtyChange?.(true);
    },
    [onDirtyChange, dirtyFields]
  );

  const markClean = useCallback(() => {
    dirtyFields.current.clear();
    setIsDirty(false);
    setLastSaved(new Date());
    setDirtyCount(0);
    onDirtyChange?.(false);
  }, [onDirtyChange, dirtyFields]);

  const resetDirty = useCallback(() => {
    dirtyFields.current.clear();
    setIsDirty(false);
    setDirtyCount(0);
  }, [dirtyFields]);

  const getDirtyFields = useCallback(() => {
    return Array.from(dirtyFields.current);
  }, [dirtyFields]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!enableBeforeUnload || !isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = confirmMessage;
      return confirmMessage;
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, enableBeforeUnload, confirmMessage]);

  return {
    isDirty,
    lastSaved,
    markDirty,
    markClean,
    resetDirty,
    getDirtyFields,
    dirtyCount,
  };
}
