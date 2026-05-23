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
  const dirtyFields = useRef<Set<string>>(new Set());

  const markDirty = useCallback(
    (field?: string) => {
      if (field) dirtyFields.current.add(field);
      setIsDirty(true);
      onDirtyChange?.(true);
    },
    [onDirtyChange]
  );

  const markClean = useCallback(() => {
    dirtyFields.current.clear();
    setIsDirty(false);
    setLastSaved(new Date());
    onDirtyChange?.(false);
  }, [onDirtyChange]);

  const resetDirty = useCallback(() => {
    dirtyFields.current.clear();
    setIsDirty(false);
  }, []);

  const getDirtyFields = useCallback(() => {
    return Array.from(dirtyFields.current);
  }, []);

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
    dirtyCount: dirtyFields.current.size,
  };
}
