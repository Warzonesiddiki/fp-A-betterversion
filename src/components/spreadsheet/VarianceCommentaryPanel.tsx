import { useState, useCallback } from 'react';
import { BookTemplate, ChevronDown, Copy, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { AutoCommentaryEngine } from '@/engines/AutoCommentaryEngine';

interface VarianceCommentaryPanelProps {
  actual: number;
  budget: number;
  category: string;
  period: string;
  priorYear?: number;
  drivers?: readonly string[];
  onInsert: (text: string) => void;
  className?: string;
}

const templates = AutoCommentaryEngine.getTemplates();

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function VarianceCommentaryPanel({
  actual,
  budget,
  category,
  period,
  priorYear,
  drivers,
  onInsert,
  className,
}: VarianceCommentaryPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  // Guard against non-finite / missing inputs: the money primitive fails
  // loudly on NaN (by design), so a UI panel must not feed it NaN variance
  // figures. Non-finite inputs render as a neutral zero state rather than a
  // silent "NaN%" (the pre-money behavior this surfaced).
  const hasValidInputs = Number.isFinite(actual) && Number.isFinite(budget);
  const variance = hasValidInputs ? actual - budget : 0;
  const variancePct = hasValidInputs && budget !== 0 ? (variance / Math.abs(budget)) * 100 : 0;

  const autoCommentary: string = hasValidInputs
    ? AutoCommentaryEngine.generateVarianceCommentary(actual, budget, category, period, {
        priorYear,
        drivers: drivers ? [...drivers] : undefined,
      })
    : '';

  const handleCopy = useCallback((text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleInsert = useCallback(
    (text: string) => {
      onInsert(text);
    },
    [onInsert]
  );

  const getFilledTemplate = (template: string): string => {
    return AutoCommentaryEngine.interpolate(template, {
      period,
      category,
      actual,
      budget,
      amount: formatCurrency(Math.abs(variance)),
      variance: Math.abs(variancePct).toFixed(1),
      drivers: drivers?.join(', ') ?? '',
      fiscal_year: period,
      periods: '3',
      metric: category,
      start: formatCurrency(budget),
      end: formatCurrency(actual),
    });
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)]',
        className
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <BookTemplate className="h-4 w-4 text-[var(--accent-primary)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Variance Commentary
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              variance >= 0
                ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'
            )}
          >
            {variancePct >= 0 ? '+' : ''}
            {variancePct.toFixed(1)}%
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-[var(--text-tertiary)] transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-[var(--border-subtle)] px-4 pb-4 pt-3">
          {/* Auto-generated commentary */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
              Auto-Generated
            </h4>
            <div className="group relative rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3">
              <p className="pr-16 text-sm text-[var(--text-secondary)]">{autoCommentary}</p>
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleCopy(autoCommentary, 'auto')}
                  className="rounded p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  title="Copy to clipboard"
                  aria-label="Copy auto-generated commentary"
                >
                  {copiedId === 'auto' ? (
                    <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleInsert(autoCommentary)}
                  className="rounded bg-[var(--accent-primary)] px-2 py-1 text-xs text-white transition-opacity hover:opacity-90"
                  aria-label="Insert auto-generated commentary"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>

          {/* Template library */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
              Templates
            </h4>
            <div className="space-y-1.5">
              {templates.map((tmpl) => {
                const filled = getFilledTemplate(tmpl.template);
                return (
                  <div
                    key={tmpl.id}
                    className="group flex items-start gap-2 rounded-lg border border-transparent p-2 transition-colors hover:border-[var(--border-subtle)] hover:bg-[var(--surface-secondary)]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--text-primary)]">
                          {tmpl.name}
                        </span>
                        <span className="rounded bg-[var(--surface-tertiary)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--text-tertiary)]">
                          {tmpl.category}
                        </span>
                      </div>
                      <p className="truncate text-xs text-[var(--text-tertiary)]">{filled}</p>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleCopy(filled, tmpl.id)}
                        className="rounded p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        title="Copy"
                        aria-label={`Copy ${tmpl.name} template`}
                      >
                        {copiedId === tmpl.id ? (
                          <Check className="h-3 w-3 text-[var(--color-success)]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsert(filled)}
                        className="rounded bg-[var(--accent-primary)] px-1.5 py-0.5 text-[10px] text-white hover:opacity-90"
                        aria-label={`Insert ${tmpl.name} template`}
                      >
                        Use
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
