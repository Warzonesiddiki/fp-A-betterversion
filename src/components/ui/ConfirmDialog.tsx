import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  requireTyping?: string;
  details?: string[];
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
  open: (options: ConfirmOptions) => Promise<boolean>;
  close: (result: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>()(
  immer((set, get) => ({
    isOpen: false,
    options: null,
    resolve: null,
    open: (options) => {
      return new Promise<boolean>((resolve) => {
        set((state) => {
          state.isOpen = true;
          state.options = options;
          state.resolve = resolve;
        });
      });
    },
    close: (result) => {
      const resolve = get().resolve;
      set((state) => {
        state.isOpen = false;
        state.options = null;
        state.resolve = null;
      });
      resolve?.(result);
    },
  }))
);

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ConfirmDialog() {
  const { isOpen, options, close } = useConfirmStore();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    cancelRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close(false);
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, close]);

  if (!isOpen || !options) return null;

  const variantColors = {
    danger: 'border-red-500 bg-red-50 dark:bg-red-950',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  };

  const variantButtonColors = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={options.title}
    >
      <div
        ref={dialogRef}
        className={`w-full max-w-md rounded-lg border-2 p-6 shadow-xl ${variantColors[options.variant ?? 'warning']}`}
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold dark:text-gray-100">{options.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{options.message}</p>
          </div>
        </div>

        {options.details && options.details.length > 0 && (
          <ul className="mb-4 space-y-1 text-sm text-muted-foreground">
            {options.details.map((detail, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-xs mt-1">•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={() => close(false)}
            className="px-4 py-2 text-sm rounded-md border hover:bg-[var(--bg-hover)] dark:hover:bg-gray-700 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {options.cancelLabel ?? 'Cancel'}
          </button>
          <button
            onClick={() => close(true)}
            className={`px-4 py-2 text-sm rounded-md ${variantButtonColors[options.variant ?? 'warning']} focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
          >
            {options.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const confirm = {
  delete: (itemName: string) =>
    useConfirmStore.getState().open({
      title: `Delete ${itemName}?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      details: [`${itemName} will be permanently deleted`, 'All associated data will be removed'],
    }),
  submit: (itemName: string) =>
    useConfirmStore.getState().open({
      title: `Submit ${itemName}?`,
      message: `This will send ${itemName} for approval.`,
      confirmLabel: 'Submit',
      variant: 'warning',
    }),
  lock: (itemName: string) =>
    useConfirmStore.getState().open({
      title: `Lock ${itemName}?`,
      message: 'Locked items cannot be edited.',
      confirmLabel: 'Lock',
      variant: 'danger',
    }),
  custom: (options: ConfirmOptions) => useConfirmStore.getState().open(options),
};
