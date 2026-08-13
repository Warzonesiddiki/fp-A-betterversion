import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    // Semantic tokens only — no raw palette utilities, no `dark:` variants.
    // Each token already flips in `.light`, so a single declaration is correct
    // in both themes; a `dark:` variant here would be a second source of truth
    // that silently drifts from index.css. Enforced by the no-raw-palette lint
    // rule and by buttonContrast.contract.test.ts.
    const variantClasses = {
      default:
        'bg-[var(--action-fill)] text-[var(--text-on-accent)] hover:bg-[var(--action-fill-hover)]',
      destructive:
        'bg-[var(--danger-fill)] text-[var(--text-on-accent)] hover:bg-[var(--danger-fill-hover)]',
      outline:
        'border border-[var(--border-default)] bg-[var(--surface-panel)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
      secondary:
        'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)]',
      ghost:
        'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
      link: 'underline-offset-4 hover:underline text-[var(--text-accent)]',
    };

    const sizeClasses = {
      default: 'h-10 py-2 px-4',
      sm: 'h-9 px-3 rounded-md',
      lg: 'h-11 px-8 rounded-md',
      icon: 'h-10 w-10',
    };

    return (
      <button
        className={cn(baseClasses, variantClasses[variant]!, sizeClasses[size]!, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
