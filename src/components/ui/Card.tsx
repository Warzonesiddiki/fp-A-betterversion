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
        'rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-sm',
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

/**
 * Heading level for a card title.
 *
 * Defaults to `h3`, which is correct for a card nested under a section `h2`.
 * Pages that place cards directly beneath the `<h1>` from `PageHeader` skip a
 * level and trip axe's `heading-order` — those pass `as="h2"`. The level is a
 * prop rather than a hardcoded tag because the correct value depends on where
 * the card sits in the document, which the primitive cannot know.
 */
type HeadingLevel = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement> & { density?: Density; as?: HeadingLevel }
>(({ className, density = 'comfortable', as: Heading = 'h3', ...props }, ref) => (
  <Heading
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
