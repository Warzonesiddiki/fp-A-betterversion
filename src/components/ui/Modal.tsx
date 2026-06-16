import { forwardRef, HTMLAttributes, useCallback, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ className, isOpen, onClose, children, title, ...props }, ref) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      },
      [onClose]
    );

    useEffect(() => {
      if (!isOpen) return;

      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);

      requestAnimationFrame(() => {
        dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      });

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        previousFocusRef.current?.focus();
      };
    }, [isOpen, handleKeyDown]);

    useEffect(() => {
      if (!isOpen || !dialogRef.current) return;
      const container = dialogRef.current;
      const handleTabTrap = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;
        const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      };
      container.addEventListener('keydown', handleTabTrap);
      return () => container.removeEventListener('keydown', handleTabTrap);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity motion-reduce:transition-none"
            aria-hidden="true"
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onClose();
            }}
            role="button"
            tabIndex={0}
          />

          <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
            &#8203;
          </span>

          <div
            ref={(node) => {
              dialogRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              'inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-bottom shadow-xl transition-all motion-reduce:transition-none motion-reduce:transform-none sm:my-8 sm:w-full sm:max-w-lg sm:align-middle',
              className
            )}
            {...props}
          >
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                type="button"
                className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:hover:text-gray-300"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Modal.displayName = 'Modal';

export { Modal };
