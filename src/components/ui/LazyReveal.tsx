import { useRef, useEffect, useState, memo } from 'react';
import { cn } from '@/utils/cn';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface LazyRevealProps {
  children: React.ReactNode;
  /** Animation variant */
  variant?: 'fade-in' | 'slide-up' | 'scale-in';
  /** Delay in ms before animation starts */
  delay?: number;
  /** Root margin for IntersectionObserver (default: '0px 0px -80px 0px') */
  rootMargin?: string;
  /** Threshold for IntersectionObserver */
  threshold?: number;
  /** Trigger once and stop observing */
  once?: boolean;
  className?: string;
  /** Override reduced-motion per instance (default: respect user preference) */
  animate?: boolean;
}

const variantClassMap: Record<string, string> = {
  'fade-in': 'animate-fade-in',
  'slide-up': 'animate-slide-up',
  'scale-in': 'animate-scale-in',
};

/**
 * Lazy load reveal — wraps content that animates in when it enters the viewport.
 * Uses IntersectionObserver for performance and respects prefers-reduced-motion.
 *
 * @example
 * <LazyReveal variant="slide-up" delay={100}>
 *   <MyComponent />
 * </LazyReveal>
 */
export const LazyReveal = memo(function LazyReveal({
  children,
  variant = 'fade-in',
  delay = 0,
  rootMargin = '0px 0px -80px 0px',
  threshold = 0.1,
  once = true,
  className,
  animate: animateProp,
}: LazyRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  const shouldAnimate = animateProp !== undefined ? animateProp : !reducedMotion;

  useEffect(() => {
    const el = ref.current;
    if (!el || !shouldAnimate) {
      // If reduced motion, show immediately
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry!.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(el);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once, shouldAnimate]);

  const animationClass =
    shouldAnimate && isVisible ? variantClassMap[variant] || `animate-${variant}` : '';

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: shouldAnimate ? 'opacity 0.3s ease' : 'none',
        animationDelay: delay > 0 ? `${delay}ms` : undefined,
        animationFillMode: 'backwards',
      }}
      className={cn(isVisible ? animationClass : '', className)}
    >
      {children}
    </div>
  );
});
