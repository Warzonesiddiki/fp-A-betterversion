import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  label?: string;
  required?: boolean;
  /** id for the trigger, so an external <label htmlFor> can associate with it */
  id?: string;
}

/**
 * Radix Select forbids empty-string item values ("A <Select.Item /> must
 * have a value prop that is not an empty string"), but callers legitimately
 * model a "no selection / skip" option as { value: '' } — e.g.
 * GLColumnMapper's '-- Skip Column --'. Such options are encoded with an
 * internal sentinel when talking to Radix and translated back on change, so
 * the public API (including value: '') is preserved exactly.
 *
 * Regression lock: tests/e2e/spine/20-gl-upload-to-journals.spec.ts — the
 * GL-upload journey crashed its route group on this before the sentinel.
 */
const EMPTY_VALUE_SENTINEL = '__fp_select_empty__';

const toItemValue = (value: string): string => (value === '' ? EMPTY_VALUE_SENTINEL : value);

const fromItemValue = (value: string): string => (value === EMPTY_VALUE_SENTINEL ? '' : value);

export const Select: React.FC<SelectProps> = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  error,
  className,
  label,
  required = false,
  id,
}) => {
  return (
    <div
      className={cn('flex flex-col gap-1.5 w-full', className)}
      role="region"
      aria-label="Select"
    >
      {label && (
        <label
          className="text-xs font-medium text-[var(--text-secondary)]"
          id={`${label.replace(/\s+/g, '-').toLowerCase()}-label`}
        >
          {label}
        </label>
      )}
      <SelectPrimitive.Root
        value={value ?? ''}
        onValueChange={(next) => onChange?.(fromItemValue(next))}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={id}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] transition-all outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-[var(--negative)] focus:ring-[var(--negative)]'
              : 'hover:border-[var(--border-default)]'
          )}
          aria-labelledby={label ? `${label.replace(/\s+/g, '-').toLowerCase()}-label` : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-required={required ? 'true' : undefined}
          aria-describedby={
            error ? `${label?.replace(/\s+/g, '-').toLowerCase() || 'select'}-error` : undefined
          }
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="relative z-[10000] max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-md animate-in fade-in-0 zoom-in-95"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1">
              <ChevronUp className="h-4 w-4" />
            </SelectPrimitive.ScrollUpButton>

            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={toItemValue(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-[var(--bg-hover)] focus:text-[var(--text-primary)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors',
                    value === option.value &&
                      'bg-[var(--accent-subtle)] text-[var(--text-on-accent-subtle)] font-medium'
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4 text-[var(--text-on-accent-subtle)]" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>

            <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1">
              <ChevronDown className="h-4 w-4" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {error && (
        <span
          className="text-[10px] font-medium fin-negative"
          id={`${label?.replace(/\s+/g, '-').toLowerCase() || 'select'}-error`}
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
};
