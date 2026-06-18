import React from 'react';
import { cn } from '@/utils/cn';

export interface PresenceIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  status = 'offline',
  className,
}) => {
  const statusColors = {
    online: 'bg-green-700',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-amber-500',
  };

  return (
    <div
      className={cn(
        'w-2.5 h-2.5 rounded-full ring-2 ring-[var(--bg-surface)]',
        statusColors[status]!,
        className
      )}
      aria-label={`Status: ${status}`}
      title={status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
};
