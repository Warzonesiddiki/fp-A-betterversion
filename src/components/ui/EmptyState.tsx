import React from 'react';
import { cn } from '@/utils/cn';
import { Inbox, Search, FileX, AlertCircle } from 'lucide-react';

export interface EmptyStateProps {
  variant?: 'no-data' | 'no-results' | 'no-file' | 'error';
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const defaultIcons = {
  'no-data': <Inbox className="h-12 w-12 text-gray-300 dark:text-gray-600" />,
  'no-results': <Search className="h-12 w-12 text-gray-300 dark:text-gray-600" />,
  'no-file': <FileX className="h-12 w-12 text-gray-300 dark:text-gray-600" />,
  error: <AlertCircle className="h-12 w-12 text-red-300 dark:fin-negative" />,
};

export function EmptyState({
  variant = 'no-data',
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
      role="status"
      aria-label={title}
    >
      <div className="mb-4">{icon || defaultIcons[variant]}</div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
