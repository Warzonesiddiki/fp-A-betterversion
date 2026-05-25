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
}

export const Select: React.FC<SelectProps> = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  error,
  className,
  label,
}) => {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label
          className="text-xs font-medium text-slate-400"
          id={`${label.replace(/\s+/g, '-').toLowerCase()}-label`}
        >
          {label}
        </label>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] transition-all outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-red-500 focus:ring-red-500' : 'hover:border-gray-400'
          )}
          aria-labelledby={label ? `${label.replace(/\s+/g, '-').toLowerCase()}-label` : undefined}
          aria-invalid={error ? 'true' : undefined}
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
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 dark:focus:bg-gray-800 focus:text-[var(--text-primary)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors',
                    value === option.value && 'bg-blue-50 text-blue-700 font-medium'
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4 text-blue-600" />
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
