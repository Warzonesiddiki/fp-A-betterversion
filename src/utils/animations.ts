import { Variants, Transition } from 'framer-motion';

/**
 * Standardized Framer Motion animation variants and transitions.
 * These should be used across the app to ensure consistent motion.
 */

const defaultTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

const easeOutTransition: Transition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.3,
};

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: easeOutTransition,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { ...easeOutTransition, duration: 0.2 },
  },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
};

export const slideInRight: Variants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { ...defaultTransition, duration: 0.2 },
  },
};

export const slideInLeft: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { ...defaultTransition, duration: 0.2 },
  },
};

export const fade: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: easeOutTransition,
  },
  exit: {
    opacity: 0,
    transition: { ...easeOutTransition, duration: 0.2 },
  },
};

export const scaleUp: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { ...defaultTransition, duration: 0.2 },
  },
};

/**
 * Returns a media query boolean for reduced motion.
 * Can be used to conditionally disable animations if not using Framer Motion's
 * automatic `useReducedMotion` hook.
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
