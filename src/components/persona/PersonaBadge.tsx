import React from 'react';
import { cn } from '../../utils/cn';

export type PersonaVariant =
  | 'cfo'
  | 'controller'
  | 'analyst'
  | 'auditor'
  | 'compliance'
  | 'treasurer'
  | 'cxo'
  | 'board'
  | 'tax'
  | 'fp_a'
  | 'revenue'
  | 'cost'
  | 'capex'
  | 'hr'
  | 'it'
  | 'legal'
  | 'procurement'
  | 'sales'
  | 'compliance_officer';

export interface PersonaBadgeProps {
  variant: PersonaVariant;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VARIANT_STYLES: Record<PersonaVariant, string> = {
  cfo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  controller: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
  analyst: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
  auditor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  compliance: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200',
  treasurer: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200',
  cxo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200',
  board: 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-200',
  tax: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
  fp_a: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200',
  revenue: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  cost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  capex: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  hr: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
  it: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200',
  legal: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-200',
  procurement: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-200',
  sales: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200',
  compliance_officer: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200',
};

const SIZE_STYLES: Record<NonNullable<PersonaBadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

/**
 * PersonaBadge - visual identifier for the 19 persona aliases (18 + Compliance_Officer)
 * Per Hera PICK T (TURN 112+ WAVE 9) and Artemis PICK I.5 DRI handoff
 * WCAG 2.1 SC 1.3.1 (Info & Relationships) + 4.1.2 (Name/Role/Value)
 */
export const PersonaBadge: React.FC<PersonaBadgeProps> = ({
  variant,
  label,
  size = 'md',
  className,
}) => {
  const variantStyle = VARIANT_STYLES[variant] ?? VARIANT_STYLES.cfo;
  const sizeStyle = SIZE_STYLES[size] ?? SIZE_STYLES.md;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantStyle,
        sizeStyle,
        className
      )}
      role="img"
      aria-label={`Persona: ${label}`}
      data-persona={variant}
    >
      {label}
    </span>
  );
};

export default PersonaBadge;
