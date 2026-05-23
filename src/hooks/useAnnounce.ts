import { useCallback, useRef } from 'react';

export function useAnnounce() {
  const regionRef = useRef<HTMLDivElement | null>(null);

  const getOrCreateRegion = () => {
    if (!regionRef.current) {
      const el = document.createElement('div');
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      el.className = 'sr-only';
      document.body.appendChild(el);
      regionRef.current = el;
    }
    return regionRef.current;
  };

  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    const region = getOrCreateRegion();
    region.setAttribute('aria-live', politeness);
    region.textContent = '';
    requestAnimationFrame(() => {
      region.textContent = message;
    });
  }, []);

  return announce;
}
