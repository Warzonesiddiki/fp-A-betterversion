import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- allows consumers to extend HTMLInputElement
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, label, ...props }, ref) => {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>}
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-[var(--border-default)] bg-white dark:bg-gray-800 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white',
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});
Input.displayName = 'Input';

export { Input };
