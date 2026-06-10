import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
      destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      outline:
        'border border-[var(--border-default)] bg-transparent text-gray-800 dark:border-gray-600 dark:text-gray-300',
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
