import { useEffect, useRef, useState } from 'react';

export function useThrottle<T>(value: T, interval: number): T {
  const [throttled, setThrottled] = useState<T>(value);
  const lastUpdate = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdate.current >= interval) {
      lastUpdate.current = now;
      setThrottled(value);
    } else {
      const timer = setTimeout(
        () => {
          lastUpdate.current = Date.now();
          setThrottled(value);
        },
        interval - (now - lastUpdate.current)
      );
      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttled;
}
