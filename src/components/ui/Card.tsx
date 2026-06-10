import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

type Density = 'comfortable' | 'compact';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  density?: Density;
}

const densityPadding: Record<Density, string> = {
  comfortable: 'p-6',
  compact: 'p-3',
};

const densityHeaderPadding: Record<Density, string> = {
  comfortable: 'p-6',
  compact: 'p-3',
};

const densityTitle: Record<Density, string> = {
  comfortable: 'text-2xl',
  compact: 'text-base',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, density = 'comfortable', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm dark:border-gray-700 dark:bg-gray-800',
        density === 'compact' && 'rounded-lg',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { density?: Density }
>(({ className, density = 'comfortable', ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5', densityHeaderPadding[density]!, className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement> & { density?: Density }
>(({ className, density = 'comfortable', ...props }, ref) => (
  // eslint-disable-next-line jsx-a11y/heading-has-content -- content passed via {...props}
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', densityTitle[density]!, className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { density?: Density }
>(({ className, density = 'comfortable', ...props }, ref) => (
  <div ref={ref} className={cn(densityPadding[density]!, 'pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { density?: Density }
>(({ className, density = 'comfortable', ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center', densityPadding[density]!, 'pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
export type { Density, CardProps };
