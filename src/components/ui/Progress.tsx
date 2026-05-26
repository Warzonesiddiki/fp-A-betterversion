import { memo } from 'react';

interface ProgressProps {
  value: number;
  className?: string;
}

export const Progress = memo(function Progress({ value, className = '' }: ProgressProps) {
  return (
    <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-purple-500 transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
});
