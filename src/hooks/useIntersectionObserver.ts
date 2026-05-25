import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseIntersectionObserverOptions {
  /** Margin around the root element (default: '200px' for pre-loading) */
  rootMargin?: string;
  /** Visibility threshold to trigger (default: 0) */
  threshold?: number;
  /** Whether to stop observing after first intersection (default: true) */
  triggerOnce?: boolean;
}

/**
 * Observes when an element enters the viewport using IntersectionObserver.
 * Used for lazy-loading charts and heavy components.
 */
export function useIntersectionObserver({
  rootMargin = '200px',
  threshold = 0,
  triggerOnce = true,
}: UseIntersectionObserverOptions = {}) {
  const [isVisible, setIsVisible] = useState(typeof IntersectionObserver === 'undefined');
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry!.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [rootMargin, threshold, triggerOnce]);

  return { ref: elementRef, isVisible };
}

/**
 * Hook for measuring element dimensions and updating on resize.
 */
export function useElementSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const updateSize = useCallback(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      setSize({ width, height });
    }
  }, []);

  useEffect(() => {
    updateSize();

    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [updateSize]);

  return { ref, ...size };
}
