import { useEffect, useState } from 'react';

/**
 * Detects the user's prefers-reduced-motion setting.
 * Returns true if the user prefers reduced motion.
 * Updates dynamically when the setting changes.
 *
 * R9-c: degrades to `false` (motion allowed) when matchMedia is
 * unavailable — e.g. jsdom-based tests that render hook consumers without
 * stubbing window.matchMedia. Real browsers always provide matchMedia,
 * so production behavior is unchanged.
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

/**
 * Returns animation props based on reduced motion preference.
 * Use in chart components: {...getAnimationProps(reducedMotion)}
 */
export function getAnimationProps(reduced: boolean) {
  if (reduced) {
    return { isAnimationActive: false, animationDuration: 0 };
  }
  return { isAnimationActive: true, animationDuration: 800 };
}
