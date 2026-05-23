import { useCallback, useEffect, useRef } from 'react';

interface UseAutoSaveOptions {
  delay?: number;
  onSave: (data: unknown) => void;
  enabled?: boolean;
}

export function useAutoSave<T>(data: T, options: UseAutoSaveOptions) {
  const { delay = 3000, onSave, enabled = true } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const previousDataRef = useRef<T>(data);

  const save = useCallback(() => {
    if (!enabled) return;
    if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
      onSave(data);
      previousDataRef.current = data;
    }
  }, [data, onSave, enabled]);

  useEffect(() => {
    if (!enabled) return;

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

  return { forceSave };
}
