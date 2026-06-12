/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState } from 'react';
import { useCallback } from 'react';
import { cn } from '@/utils/cn';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';

export type NumberFormat =
  | 'general'
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'scientific'
  | 'text';

export interface CellFormat {
  format: NumberFormat;
  decimals: number;
  useThousandsSeparator: boolean;
  currencySymbol: string;
  dateFormat: string;
  prefix: string;
  suffix: string;
  negativeStyle: 'minus' | 'parentheses' | 'red';
}

export interface CellFormatterProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (format: CellFormat) => void;
  currentFormat?: CellFormat;
  className?: string;
}

const defaultFormat: CellFormat = {
  format: 'general',
  decimals: 2,
  useThousandsSeparator: true,
  currencySymbol: '$',
  dateFormat: 'MM/DD/YYYY',
  prefix: '',
  suffix: '',
  negativeStyle: 'minus',
};

const formatOptions = [
  { value: 'general', label: 'General' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percent', label: 'Percentage' },
  { value: 'date', label: 'Date' },
  { value: 'scientific', label: 'Scientific' },
  { value: 'text', label: 'Text' },
];

const currencyOptions = [
  { value: '$', label: '$ USD' },
  { value: '€', label: '€ EUR' },
  { value: '£', label: '£ GBP' },
  { value: '¥', label: '¥ JPY' },
  { value: '₹', label: '₹ INR' },
  { value: 'A$', label: 'A$ AUD' },
  { value: 'C$', label: 'C$ CAD' },
  { value: 'CHF', label: 'CHF' },
];

const dateFormatOptions = [
  { value: 'MM/DD/YYYY', label: '12/31/2026' },
  { value: 'DD/MM/YYYY', label: '31/12/2026' },
  { value: 'YYYY-MM-DD', label: '2026-12-31' },
  { value: 'MMM DD, YYYY', label: 'Dec 31, 2026' },
  { value: 'DD MMM YYYY', label: '31 Dec 2026' },
  { value: 'MMMM DD, YYYY', label: 'December 31, 2026' },
];

const negativeStyleOptions = [
  { value: 'minus', label: '-1,234.56' },
  { value: 'parentheses', label: '(1,234.56)' },
  { value: 'red', label: '1,234.56 (red)' },
];

function formatPreview(format: CellFormat): string {
  const sample = 1234.56;
  const negSample = -1234.56;

  switch (format.format) {
    case 'general':
      return sample.toLocaleString();
    case 'number': {
      const opts: Intl.NumberFormatOptions = {
        minimumFractionDigits: format.decimals,
        maximumFractionDigits: format.decimals,
        useGrouping: format.useThousandsSeparator,
      };
      const formatted = sample.toLocaleString('en-US', opts);
      const negFormatted = negSample.toLocaleString('en-US', opts);
      if (format.negativeStyle === 'parentheses') return `(${negFormatted.replace('-', '')})`;
      return formatted;
    }
    case 'currency': {
      const opts: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: format.decimals,
        maximumFractionDigits: format.decimals,
      };
      return sample.toLocaleString('en-US', opts).replace('$', format.currencySymbol);
    }
    case 'percent':
      return `${(sample * 100).toFixed(format.decimals)}%`;
    case 'date':
      return '12/31/2026';
    case 'scientific':
      return sample.toExponential(format.decimals);
    case 'text':
      return String(sample);
    default:
      return String(sample);
  }
}

export function CellFormatter({
  isOpen,
  onClose,
  onApply,
  currentFormat,
  className,
}: CellFormatterProps) {
  const [format, setFormat] = useState<CellFormat>(currentFormat || defaultFormat);

  const updateFormat = useCallback(<K extends keyof CellFormat>(key: K, value: CellFormat[K]) => {
    setFormat((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleApply = useCallback(() => {
    onApply(format);
    onClose();
  }, [format, onApply, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Format Cells"
      className={cn('max-w-md', className)}
    >
      <div className="space-y-4 p-4">
        {/* Format Type */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
            Category
          </label>
          <Select
            options={formatOptions}
            value={format.format}
            onChange={(v: string) => updateFormat('format', v as NumberFormat)}
          />
        </div>

        {/* Number options */}
        {(format.format === 'number' ||
          format.format === 'currency' ||
          format.format === 'percent' ||
          format.format === 'scientific') && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                Decimal Places
              </label>
              <Input
                type="number"
                min={0}
                max={15}
                value={format.decimals}
                onChange={(e) => updateFormat('decimals', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={format.useThousandsSeparator}
                  onChange={(e) => updateFormat('useThousandsSeparator', e.target.checked)}
                  className="rounded border-[var(--border-default)]"
                  aria-label="Use thousands separator"
                />
                Thousands separator
              </label>
            </div>
          </div>
        )}

        {/* Currency symbol */}
        {format.format === 'currency' && (
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
              Symbol
            </label>
            <Select
              options={currencyOptions}
              value={format.currencySymbol}
              onChange={(v: string) => updateFormat('currencySymbol', v)}
            />
          </div>
        )}

        {/* Date format */}
        {format.format === 'date' && (
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
              Date Format
            </label>
            <Select
              options={dateFormatOptions}
              value={format.dateFormat}
              onChange={(v: string) => updateFormat('dateFormat', v)}
            />
          </div>
        )}

        {/* Negative style */}
        {(format.format === 'number' || format.format === 'currency') && (
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
              Negative Numbers
            </label>
            <Select
              options={negativeStyleOptions}
              value={format.negativeStyle}
              onChange={(v: string) =>
                updateFormat('negativeStyle', v as CellFormat['negativeStyle'])
              }
            />
          </div>
        )}

        {/* Prefix/Suffix */}
        {format.format !== 'date' && format.format !== 'text' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                Prefix
              </label>
              <Input
                value={format.prefix}
                onChange={(e) => updateFormat('prefix', e.target.value)}
                placeholder="e.g., ~"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                Suffix
              </label>
              <Input
                value={format.suffix}
                onChange={(e) => updateFormat('suffix', e.target.value)}
                placeholder="e.g., units"
              />
            </div>
          </div>
        )}

        {/* Preview */}
        <div
          className="bg-[var(--bg-surface)] rounded-md p-3 border border-[var(--border-subtle)]"
          role="status"
          aria-live="polite"
          aria-label="Format preview"
        >
          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Sample
          </div>
          <div className="text-lg font-mono text-[var(--text-primary)] tabular-nums">
            {format.prefix}
            {formatPreview(format)}
            {format.suffix}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </div>
    </Modal>
  );
}
