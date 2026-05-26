import React, { useState, useEffect, useCallback, useId } from 'react';
import { cn } from '@/utils/cn';

export interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  locale?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency = 'USD',
  locale = 'en-US',
  disabled = false,
  error,
  label,
  className,
}) => {
  const id = useId();
  const [displayValue, setDisplayValue] = useState('');

  const formatValue = useCallback(
    (val: number) => {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    },
    [locale]
  );

  useEffect(() => {
    setDisplayValue(formatValue(value));
  }, [value, formatValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9.-]/g, '');
    if (rawValue === '' || rawValue === '-') {
      setDisplayValue(rawValue);
      return;
    }

    const numericValue = parseFloat(rawValue);
    if (!isNaN(numericValue)) {
      onChange(numericValue);
      // We don't setDisplayValue here to avoid formatting issues while typing
      // The useEffect will update it when the value prop changes
    }
  };

  const handleBlur = () => {
    setDisplayValue(formatValue(value));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Show raw number on focus for easier editing
    setDisplayValue(value.toString());
    e.target.select();
  };

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <span className="text-xs font-bold text-[var(--text-secondary)] opacity-50">
            {new Intl.NumberFormat(locale, { style: 'currency', currency })
              .format(0)
              .replace(/[0-9.,\s]/g, '')}
          </span>
        </div>
        <input
          id={id}
          type="text"
          className={cn(
            'w-full h-10 pl-8 pr-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md text-sm font-medium text-[var(--text-primary)] text-right tabular-nums outline-none transition-all focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-red-500 focus:ring-red-500' : 'hover:border-gray-400'
          )}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder="0"
          aria-label={label ? undefined : 'Currency amount'}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tighter">
            {currency}
          </span>
        </div>
      </div>
      {error && (
        <span id={`${id}-error`} className="text-[10px] font-medium fin-negative" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
