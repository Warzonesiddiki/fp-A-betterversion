import React from 'react';
import { useUIStore } from '@/store/uiStore';
import { Toast } from './Toast';
import { cn } from '@/utils/cn';
import type { ToastMessage } from '@/types';

export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// Wave-7E a11y single-region policy: the container used to wrap EVERY toast
// in one polite status region while each card carried role="alert" +
// aria-live="assertive" — an assertive region nested inside a polite one, so
// every toast (even "Saved!") interrupted whatever the user was doing.
// Politeness is now fixed per REGION at render time: success/info/warning
// land in the persistent polite status region; error lands in its SIBLING
// assertive alert region. The two are never nested, so interruption happens
// exactly when content is routed to the alert region — i.e. only on role
// change — and never via cards flipping their own aria-live dynamically.
const INTERRUPTIVE_TOAST_TYPES: ReadonlySet<ToastMessage['type']> = new Set(['error']);

const splitByPoliteness = (toasts: readonly ToastMessage[]) => {
  const politeToasts: ToastMessage[] = [];
  const alertToasts: ToastMessage[] = [];
  for (const toast of toasts) {
    if (INTERRUPTIVE_TOAST_TYPES.has(toast.type)) alertToasts.push(toast);
    else politeToasts.push(toast);
  }
  return { politeToasts, alertToasts };
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ position = 'top-right' }) => {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const { politeToasts, alertToasts } = splitByPoliteness(toasts);

  return (
    <div
      data-testid="toast-viewport"
      className={cn(
        // Neutral positioning wrapper: deliberately NO live-region semantics,
        // so neither severity region can ever be nested inside the other.
        'fixed z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none',
        positionClasses[position]
      )}
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="flex flex-col gap-3 pointer-events-none"
      >
        {politeToasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </div>
      {/* Sibling of the status region above — never a descendant. Explicitly
          atomic=false so a second error announces itself, not the whole list. */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="false"
        className="flex flex-col gap-3 pointer-events-none"
      >
        {alertToasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </div>
    </div>
  );
};
