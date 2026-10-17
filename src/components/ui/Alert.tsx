import React, { memo } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { cn } from '@/utils/cn';

export interface AlertProps {
  open?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  title: string;
  message: string;
  type?: string;
  variant?: 'default' | 'destructive';
  confirmText?: string;
  cancelText?: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = memo(
  ({
    open,
    onConfirm,
    onCancel,
    title,
    message,
    type,
    variant = 'default',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    className,
  }) => {
    // Two call shapes share this component:
    //  - confirmations (useConfirmation) pass `open` + handlers → modal
    //    dialog, below.
    //  - inline banners (GL upload import failures, BudgetCreatePage form
    //    errors, DataImportPage migration errors, ReconciliationPanel) pass
    //    only title/message/type/className. Rendering the modal path for
    //    them left them with NOTHING on screen — a rejected source row
    //    computed its reason and the user never saw it (FR-002). The
    //    display-only shape renders an in-page role="alert" banner.
    const isDialog = open !== undefined || onConfirm !== undefined || onCancel !== undefined;

    if (!isDialog) {
      return (
        <div
          role="alert"
          className={cn(
            'rounded-lg border p-4',
            type === 'error'
              ? 'border-[var(--negative)] bg-[var(--negative-subtle)] text-[var(--text-on-danger-subtle)]'
              : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)]',
            className
          )}
        >
          <p className="font-semibold">{title}</p>
          <p className="text-sm">{message}</p>
        </div>
      );
    }

    return (
      <AlertDialog.Root open={open}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in" />
          <AlertDialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg bg-[var(--bg-surface)] p-6 shadow-xl border border-[var(--border-subtle)] animate-slide-up focus:outline-none">
            <AlertDialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-[var(--text-secondary)]">
              {message}
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  {cancelText}
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={cn(
                    'inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                    variant === 'destructive'
                      ? 'bg-[var(--danger-fill)] hover:bg-[var(--danger-fill-hover)]'
                      : 'bg-[var(--action-fill)] hover:bg-[var(--action-fill-hover)]'
                  )}
                >
                  {confirmText}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    );
  }
);
