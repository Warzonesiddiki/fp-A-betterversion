import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    const generatedId = useId();
    const inputId = props.id ?? generatedId;
    const errorId = `${inputId}-error`;
    return (
      <div className="space-y-1" role="region" aria-label="Input">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-primary)]">
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-panel)] text-[var(--text-primary)] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[var(--danger-fill)] focus-visible:ring-[var(--danger-fill)]',
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          ref={ref}
          {...props}
        />
        {error && (
          <span id={errorId} className="text-[10px] font-medium fin-negative" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
