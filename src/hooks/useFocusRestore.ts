// src/hooks/useFocusRestore.ts
// Q5.2 FOCUS_RESTORE — sub-50ms focus restore on component unmount
// Author: Artemis — A11Y v0.6 PICK E
// Reference: docs/a11y/Q5_2_FOCUS_RESTORE.md

import { useEffect, useRef } from 'react';

/**
 * Captures the currently-focused element on mount, restores focus to it on unmount.
 * Sub-50ms restore is achievable because the DOM ref is preserved in a useRef
 * and the restore happens on the next animation frame (synchronous browser reflow).
 */
export function useFocusRestore(): void {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    return () => {
      // Restore on unmount — sub-50ms (single ref dereference + .focus() call)
      requestAnimationFrame(() => {
        previouslyFocused.current?.focus();
      });
    };
  }, []);
}
