import { forwardRef, HTMLAttributes, useCallback, useEffect, useId, useRef } from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';
import { isTopDialogLayer, popDialogLayer, pushDialogLayer } from './dialogLayers';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ className, isOpen, onClose, children, title, ariaLabel, ...props }, ref) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const titleId = useId();
    // W6-P0-08: this Modal's position in the shared dialog-layer stack; read
    // at event time so Escape only fires onClose while this Modal is the
    // TOPMOST layer (e.g. a confirm dialog opened above must close first).
    const layerIdRef = useRef<number | null>(null);
    // Wave-7E a11y-modal-grid: the Escape handler reads the latest onClose
    // through a ref so its identity never changes across renders. Previously
    // it was useCallback([onClose]), and because the open-effect below listed
    // handleKeyDown as a dep, ANY parent re-render passing a fresh inline
    // closure tore the effect down mid-dialog: cleanup restored focus to the
    // trigger, re-captured activeElement as the new "previous focus", and
    // pushed/popped dialog layers — corrupting both mid-dialog focus position
    // and stacked-Escape ordering. Stable handler ⇒ effect deps reduce to
    // [isOpen] and none of that churn can happen.
    const onCloseRef = useRef(onClose);
    useEffect(() => {
      onCloseRef.current = onClose;
    });

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const layerId = layerIdRef.current;
      if (layerId === null || !isTopDialogLayer(layerId)) return;
      onCloseRef.current();
    }, []);

    useEffect(() => {
      if (!isOpen) return;

      previousFocusRef.current = document.activeElement as HTMLElement;
      const layerId = pushDialogLayer();
      layerIdRef.current = layerId;
      document.addEventListener('keydown', handleKeyDown);

      // Focus the first focusable on the next frame (Q5.2 focus-restore
      // budget <50ms; the rAF shape is a structural contract pinned by
      // src/__tests__/a11y/wcag-aa.test.tsx Q5.2).
      requestAnimationFrame(() => {
        dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      });

      return () => {
        popDialogLayer(layerId);
        layerIdRef.current = null;
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
          {/* Click-to-dismiss backdrop. Pointer-only by design: it must NOT be
              a keyboard tab stop (it sits inside the dialog's focus trap and
              would otherwise trap Tab on an invisible control). Keyboard users
              dismiss with Escape or the visible Close button. */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity motion-reduce:transition-none"
            aria-hidden="true"
            onClick={onClose}
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
            aria-label={ariaLabel ?? (title ? undefined : 'Dialog')}
            aria-labelledby={!ariaLabel && title ? titleId : undefined}
            className={cn(
              'inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-bottom shadow-xl transition-all motion-reduce:transition-none motion-reduce:transform-none sm:my-8 sm:w-full sm:max-w-lg sm:align-middle',
              className
            )}
            {...props}
          >
            {title && (
              <h2 id={titleId} className="text-lg font-medium mb-4 pr-8">
                {title}
              </h2>
            )}
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
