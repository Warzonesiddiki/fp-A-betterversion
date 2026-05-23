import { lazy, type ComponentType } from 'react';

export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | undefined;

    for (let i = 0; i < retries; i++) {
      try {
        return await factory();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, interval));
          // Clear module cache by reloading
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('_retry', String(i + 1));
            window.history.replaceState(null, '', url.toString());
          }
        }
      }
    }

    throw lastError;
  });
}
