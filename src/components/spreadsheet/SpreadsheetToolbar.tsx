/** SpreadsheetToolbar — Font, alignment, number format, and action controls */
import { useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  DollarSign,
  Percent,
  Hash,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  ClipboardPaste,
  Paintbrush,
  Merge,
  WrapText,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export type NumberFormat = 'general' | 'number' | 'currency' | 'percent' | 'text';
export type TextAlign = 'left' | 'center' | 'right';

export interface CellStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textAlign: TextAlign;
  numberFormat: NumberFormat;
  decimals: number;
  wrapText: boolean;
}

export interface SpreadsheetToolbarProps {
  style: CellStyle;
  onStyleChange: (style: Partial<CellStyle>) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onMerge?: () => void;
  onFormatPainter?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  formatPainterActive?: boolean;
  className?: string;
}

export const defaultCellStyle: CellStyle = {
  bold: false,
  italic: false,
  underline: false,
  textAlign: 'left',
  numberFormat: 'general',
  decimals: 2,
  wrapText: false,
};

const FORMAT_LABELS: Record<NumberFormat, string> = {
  general: 'General',
  number: 'Number',
  currency: 'Currency',
  percent: 'Percent',
  text: 'Text',
};

interface BtnProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  label: string;
  children: React.ReactNode;
}
function Btn({ active, disabled, onClick, title, label, children }: BtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center justify-center w-7 h-7 rounded transition-colors',
        'focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1',
        active
          ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

const Sep = () => <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" role="separator" />;
const icon = 'h-3.5 w-3.5';

export function SpreadsheetToolbar({
  style,
  onStyleChange,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onMerge,
  onFormatPainter,
  canUndo = true,
  canRedo = true,
  formatPainterActive = false,
  className,
}: SpreadsheetToolbarProps) {
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const toggle = useCallback(
    (key: 'bold' | 'italic' | 'underline') => onStyleChange({ [key]: !style[key] }),
    [style, onStyleChange]
  );

  const toggleFormat = useCallback(
    (fmt: NumberFormat) =>
      onStyleChange({ numberFormat: style.numberFormat === fmt ? 'general' : fmt }),
    [style.numberFormat, onStyleChange]
  );

  const setAlign = useCallback((a: TextAlign) => onStyleChange({ textAlign: a }), [onStyleChange]);

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)]',
        'overflow-x-auto flex-shrink-0',
        className
      )}
      role="toolbar"
      aria-label="Spreadsheet formatting toolbar"
    >
      <Btn disabled={!canUndo} onClick={() => onUndo?.()} title="Undo (Ctrl+Z)" label="Undo">
        <Undo2 className={icon} />
      </Btn>
      <Btn disabled={!canRedo} onClick={() => onRedo?.()} title="Redo (Ctrl+Y)" label="Redo">
        <Redo2 className={icon} />
      </Btn>
      <Sep />

      <Btn onClick={() => onCut?.()} title="Cut (Ctrl+X)" label="Cut">
        <Scissors className={icon} />
      </Btn>
      <Btn onClick={() => onCopy?.()} title="Copy (Ctrl+C)" label="Copy">
        <Copy className={icon} />
      </Btn>
      <Btn onClick={() => onPaste?.()} title="Paste (Ctrl+V)" label="Paste">
        <ClipboardPaste className={icon} />
      </Btn>
      <Sep />

      {/* Number format dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowFormatMenu(!showFormatMenu)}
          className={cn(
            'inline-flex items-center gap-1 px-2 h-7 rounded text-xs font-medium transition-colors',
            'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
            'focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]'
          )}
          aria-label="Number format"
          aria-expanded={showFormatMenu}
          aria-haspopup="listbox"
        >
          <span className="min-w-[56px] text-left">{FORMAT_LABELS[style.numberFormat]}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        {showFormatMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowFormatMenu(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowFormatMenu(false);
              }}
              role="button"
              tabIndex={-1}
            />
            <div
              className="absolute top-full left-0 z-50 mt-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md shadow-lg py-1 min-w-[120px]"
              role="listbox"
              aria-label="Number format options"
            >
              {(Object.keys(FORMAT_LABELS) as NumberFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  role="option"
                  aria-selected={style.numberFormat === fmt}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-[var(--bg-hover)]',
                    style.numberFormat === fmt && 'bg-[var(--accent-primary)]/10 font-semibold'
                  )}
                  onClick={() => {
                    onStyleChange({ numberFormat: fmt });
                    setShowFormatMenu(false);
                  }}
                >
                  {FORMAT_LABELS[fmt]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <Sep />

      <Btn active={style.bold} onClick={() => toggle('bold')} title="Bold (Ctrl+B)" label="Bold">
        <Bold className={icon} />
      </Btn>
      <Btn
        active={style.italic}
        onClick={() => toggle('italic')}
        title="Italic (Ctrl+I)"
        label="Italic"
      >
        <Italic className={icon} />
      </Btn>
      <Btn
        active={style.underline}
        onClick={() => toggle('underline')}
        title="Underline (Ctrl+U)"
        label="Underline"
      >
        <Underline className={icon} />
      </Btn>
      <Sep />

      <Btn
        active={style.textAlign === 'left'}
        onClick={() => setAlign('left')}
        title="Align left"
        label="Align left"
      >
        <AlignLeft className={icon} />
      </Btn>
      <Btn
        active={style.textAlign === 'center'}
        onClick={() => setAlign('center')}
        title="Align center"
        label="Align center"
      >
        <AlignCenter className={icon} />
      </Btn>
      <Btn
        active={style.textAlign === 'right'}
        onClick={() => setAlign('right')}
        title="Align right"
        label="Align right"
      >
        <AlignRight className={icon} />
      </Btn>
      <Sep />

      <Btn
        active={style.numberFormat === 'currency'}
        onClick={() => toggleFormat('currency')}
        title="Currency"
        label="Currency format"
      >
        <DollarSign className={icon} />
      </Btn>
      <Btn
        active={style.numberFormat === 'percent'}
        onClick={() => toggleFormat('percent')}
        title="Percent"
        label="Percent format"
      >
        <Percent className={icon} />
      </Btn>
      <Btn
        active={style.numberFormat === 'number'}
        onClick={() => toggleFormat('number')}
        title="Number"
        label="Number format"
      >
        <Hash className={icon} />
      </Btn>
      <Sep />

      <Btn
        active={style.wrapText}
        onClick={() => onStyleChange({ wrapText: !style.wrapText })}
        title="Wrap text"
        label="Wrap text"
      >
        <WrapText className={icon} />
      </Btn>
      <Btn onClick={() => onMerge?.()} title="Merge cells" label="Merge cells">
        <Merge className={icon} />
      </Btn>
      <Btn
        active={formatPainterActive}
        onClick={() => onFormatPainter?.()}
        title="Format painter"
        label="Format painter"
      >
        <Paintbrush className={icon} />
      </Btn>
    </div>
  );
}
