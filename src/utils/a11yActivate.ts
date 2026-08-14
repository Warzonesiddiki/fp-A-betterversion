import type { KeyboardEvent } from 'react';

/**
 * Builds an `onKeyDown` handler that mirrors an element's `onClick`, so that
 * click-activated non-interactive elements (table rows, grid cells) satisfy
 * WCAG 2.1.1 Keyboard.
 *
 * Enter and Space are the activation keys the ARIA Authoring Practices define
 * for a button-like control. Space is `preventDefault`ed because its default
 * action scrolls the page, which would fire the handler *and* jump the
 * viewport.
 *
 * The handler ignores events that bubbled up from a nested interactive
 * descendant: a row may contain its own buttons or links, and pressing Enter
 * on a nested "Delete" button must not also trigger the row's navigation.
 *
 * An element wired with this MUST also be focusable (`tabIndex={0}`) — a key
 * handler on an element that can never hold focus is dead code.
 */
export function activateOnKey<T extends HTMLElement = HTMLElement>(
  handler: (event: KeyboardEvent<T>) => void
): (event: KeyboardEvent<T>) => void {
  return (event: KeyboardEvent<T>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    // Let nested controls own their own activation.
    if (event.target !== event.currentTarget) {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('button, a, input, select, textarea, [role="button"], [tabindex]')) {
        const owner = target.closest(
          'button, a, input, select, textarea, [role="button"], [tabindex]'
        );
        if (owner && owner !== event.currentTarget) return;
      }
    }

    event.preventDefault();
    handler(event);
  };
}
