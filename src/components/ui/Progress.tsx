import { memo } from 'react';

interface ProgressProps {
  value: number;
  className?: string;
}

export const Progress = memo(function Progress({ value, className = '' }: ProgressProps) {
  return (
    <div
      className={`w-full bg-slate-200 rounded-full overflow-hidden dark:bg-slate-800 ${className}`}
    >
      <div
        className="h-full bg-purple-500 transition-all duration-300 ease-in-out dark:bg-purple-400"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
});
