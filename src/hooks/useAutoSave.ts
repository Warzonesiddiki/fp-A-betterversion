import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAutoSaveOptions {
  delay?: number;
  onSave: (data: unknown) => void;
  enabled?: boolean;
}

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export function useAutoSave<T>(data: T, options: UseAutoSaveOptions) {
  const { delay = 3000, onSave, enabled = true } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const previousDataRef = useRef<T>(data);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const save = useCallback(() => {
    if (!enabled) return;
    if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
      setStatus('saving');
      try {
        onSave(data);
        previousDataRef.current = data;
        setStatus('saved');
        setLastSavedAt(new Date());
      } catch {
        setStatus('error');
      }
    }
  }, [data, onSave, enabled]);

  useEffect(() => {
    if (!enabled) return;

    setStatus('pending');
    timeoutRef.current = setTimeout(save, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, save, enabled]);

  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    save();
  }, [save]);

  return { forceSave, status, lastSavedAt };
}
