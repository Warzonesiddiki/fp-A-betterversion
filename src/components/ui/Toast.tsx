import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useAnnounce } from '@/hooks/useAnnounce';
import { cn } from '@/utils/cn';
import type { ToastMessage } from '@/types';

export interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const typeConfig = {
    success: {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-100 dark:border-green-900',
    },
    error: {
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-100 dark:border-red-900',
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      bg: 'bg-amber-50 dark:bg-amber-950',
      border: 'border-amber-100 dark:border-amber-900',
    },
    info: {
      icon: <Info className="h-5 w-5 text-blue-500" />,
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-100 dark:border-blue-900',
    },
  };

  const { icon, bg, border } = typeConfig[toast.type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        'flex w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all duration-300 animate-slide-up',
        bg,
        border
      )}
    >
      <div className="flex w-full items-start gap-4 p-4">
        <div className="shrink-0">{icon}</div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-[var(--text-primary)]">{toast.title}</h4>
          {toast.message && (
            <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          className="shrink-0 rounded-md p-1 hover:bg-[var(--bg-hover)] dark:hover:bg-gray-700 text-[var(--text-secondary)] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Progress bar for auto-dismiss */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-current opacity-20 transition-all duration-5000 ease-linear w-full"
        style={{ transitionDuration: `${toast.duration || 5000}ms` }}
      />
    </div>
  );
};
