/**
 * useFocusManagement — Accessibility focus management hooks
 * WCAG 2.1 AA compliant focus handling
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Focus main content on route change
 */
export function useRouteFocus(headingRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const timer = setTimeout(() => {
      headingRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [headingRef]);
}

/**
 * Trap focus within a container (modals, dialogs)
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    first?.focus();

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef]);
}

/**
 * Restore focus after element unmounts
 */
export function useFocusRestore() {
  const previousFocus = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocus.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    previousFocus.current?.focus();
    previousFocus.current = null;
  }, []);

  return { saveFocus, restoreFocus };
}

/**
 * Skip to content link
 */
/**
 * Main focus management hook — provides ref for main content area
 */
export function useFocusManagement() {
  const mainContentRef = useRef<HTMLElement>(null);
  return { mainContentRef };
}

export function useSkipToContent() {
  const skipRef = useRef<HTMLAnchorElement>(null);

  const handleSkip = useCallback(() => {
    const main = document.querySelector('main');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus();
    }
  }, []);

  return { skipRef, handleSkip };
}
