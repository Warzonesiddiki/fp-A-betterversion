import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    // Tinted "-subtle" fills paired with their matching on-subtle text token;
    // the pairs are contrast-checked per theme in buttonContrast.contract.test.ts.
    const variantClasses = {
      default: 'bg-[var(--accent-subtle)] text-[var(--text-on-accent-subtle)]',
      secondary: 'bg-[var(--bg-elevated)] text-[var(--text-primary)]',
      destructive: 'bg-[var(--negative-subtle)] text-[var(--text-on-danger-subtle)]',
      outline: 'border border-[var(--border-default)] bg-transparent text-[var(--text-secondary)]',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          variantClasses[variant]!,
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
