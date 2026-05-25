import React from 'react';
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

export const Alert: React.FC<AlertProps> = ({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  type,
  variant = 'default',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  void type;
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
                className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {cancelText}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={onConfirm}
                className={cn(
                  'inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                  variant === 'destructive'
                    ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500'
                    : 'bg-blue-600 hover:bg-blue-700'
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
};
