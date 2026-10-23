/**
 * Animation hooks for FinPlan Pro
 * All hooks respect prefers-reduced-motion
 */

import { useMemo } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function useStagger<T>(
  items: T[],
  delayMs = 20
): Array<{ item: T; style: React.CSSProperties }> {
  const reduced = useReducedMotion();
  return useMemo(() => {
    if (reduced) return items.map((item) => ({ item, style: { transition: 'none' } }));
    return items.map((item, i) => ({
      item,
      style: {
        animation: 'fadeIn 0.2s ease forwards',
        animationDelay: `${i * delayMs}ms`,
      } as React.CSSProperties,
    }));
  }, [items, delayMs, reduced]);
}

export function usePageTransition(): { style: React.CSSProperties } {
  const reduced = useReducedMotion();
  return useMemo(() => {
    if (reduced) return { style: { transition: 'none' } };
    return { style: { transition: 'opacity 0.2s ease, transform 0.2s ease' } };
  }, [reduced]);
}

export { useReducedMotion } from './useReducedMotion';
