import { useEffect, useRef } from 'react';

export function useRenderCount(componentName: string) {
  const count = useRef(0);

  useEffect(() => {
    count.current += 1;
  });

  return count.current;
}
