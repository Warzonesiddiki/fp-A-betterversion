import { useEffect, useRef } from 'react';

export function useRenderCount(componentName: string) {
  const count = useRef(0);

  useEffect(() => {
    count.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${componentName}] renders: ${count.current}`);
    }
  });

  return count.current;
}
