import { useCallback, useState } from 'react';
export interface CommentaryTemplateDef {
  id: string;
  name: string;
  category: 'variance' | 'forecast' | 'custom';
  template: string;
  variables: string[];
}

interface CommentaryTemplateProps {
  onSelect: (text: string) => void;
  onClose: () => void;
  varianceData?: {
    actual?: number;
    budget?: number;
    variance?: number;
    variancePct?: number;
    account?: string;
    period?: string;
  };
  className?: string;
}

const BUILT_IN_TEMPLATES: CommentaryTemplateDef[] = [
  {
    id: 'variance-favorable',
    name: 'Favorable Variance',
    category: 'variance',
    template:
      'Favorable variance of {{variance}} ({{variancePct}}) vs budget for {{account}} in {{period}}. Driven by: [describe driver].',
    variables: ['variance', 'variancePct', 'account', 'period'],
  },
  {
    id: 'variance-unfavorable',
    name: 'Unfavorable Variance',
    category: 'variance',
    template:
      'Unfavorable variance of {{variance}} ({{variancePct}}) vs budget for {{account}} in {{period}}. Root cause: [describe cause]. Corrective action: [describe action].',
    variables: ['variance', 'variancePct', 'account', 'period'],
  },
  {
    id: 'variance-no-significant',
    name: 'No Significant Change',
    category: 'variance',
    template:
      'No significant variance for {{account}} in {{period}}. Actual {{actual}} vs budget {{budget}} (within acceptable threshold).',
    variables: ['account', 'period', 'actual', 'budget'],
  },
  {
    id: 'forecast-update',
    name: 'Forecast Update',
    category: 'forecast',
    template:
      'Forecast for {{account}} updated to reflect [describe change]. Prior forecast: {{budget}}, revised: [new value]. Impact: [describe impact].',
    variables: ['account', 'budget'],
  },
  {
    id: 'revenue-explanation',
    name: 'Revenue Explanation',
    category: 'variance',
    template:
      'Revenue variance of {{variance}} for {{period}}. Volume impact: [amount]. Price impact: [amount]. Mix impact: [amount].',
    variables: ['variance', 'period'],
  },
  {
    id: 'expense-explanation',
    name: 'Expense Explanation',
    category: 'variance',
    template:
      'Expense variance of {{variance}} for {{account}} in {{period}}. One-time items: [amount]. Recurring items: [amount]. Savings initiatives: [amount].',
    variables: ['variance', 'account', 'period'],
  },
];

export function CommentaryTemplate({
  onSelect,
  onClose,
  varianceData,
  className = '',
}: CommentaryTemplateProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');

  const resolveTemplate = useCallback(
    (template: CommentaryTemplateDef): string => {
      if (!varianceData) return template.template;

      const fmt = (n: number | undefined) =>
        n !== undefined
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
          : '[N/A]';

      const fmtPct = (n: number | undefined) =>
        n !== undefined ? `${(n * 100).toFixed(1)}%` : '[N/A]';

      return template.template
        .replace(/\{\{variance\}\}/g, fmt(varianceData.variance))
        .replace(/\{\{variancePct\}\}/g, fmtPct(varianceData.variancePct))
        .replace(/\{\{actual\}\}/g, fmt(varianceData.actual))
        .replace(/\{\{budget\}\}/g, fmt(varianceData.budget))
        .replace(/\{\{account\}\}/g, varianceData.account ?? '[Account]')
        .replace(/\{\{period\}\}/g, varianceData.period ?? '[Period]');
    },
    [varianceData]
  );

  const handleSelect = useCallback(() => {
    if (selectedId === 'custom') {
      if (customText.trim()) onSelect(customText.trim());
    } else {
      const template = BUILT_IN_TEMPLATES.find((t) => t.id === selectedId);
      if (template) onSelect(resolveTemplate(template));
    }
    onClose();
  }, [selectedId, customText, onSelect, onClose, resolveTemplate]);

  const varianceTemplates = BUILT_IN_TEMPLATES.filter((t) => t.category === 'variance');
  const forecastTemplates = BUILT_IN_TEMPLATES.filter((t) => t.category === 'forecast');

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-lg shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h3 className="text-sm font-medium text-slate-200">Commentary Templates</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-700"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
        {/* Variance templates */}
        <TemplateGroup
          label="Variance Explanations"
          templates={varianceTemplates}
          selectedId={selectedId}
          onSelect={setSelectedId}
          resolveTemplate={resolveTemplate}
        />

        {/* Forecast templates */}
        <TemplateGroup
          label="Forecast Updates"
          templates={forecastTemplates}
          selectedId={selectedId}
          onSelect={setSelectedId}
          resolveTemplate={resolveTemplate}
        />

        {/* Custom */}
        <div>
          <button
            type="button"
            onClick={() => setSelectedId('custom')}
            className={`w-full text-left text-sm px-3 py-2 rounded ${
              selectedId === 'custom'
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            ✏️ Custom Template
          </button>
          {selectedId === 'custom' && (
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Write your own commentary..."
              className="mt-2 w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500"
              rows={3}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-700">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 rounded hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSelect}
          disabled={!selectedId}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Insert
        </button>
      </div>
    </div>
  );
}

interface TemplateGroupProps {
  label: string;
  templates: CommentaryTemplateDef[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  resolveTemplate: (t: CommentaryTemplateDef) => string;
}

function TemplateGroup({
  label,
  templates,
  selectedId,
  onSelect,
  resolveTemplate,
}: TemplateGroupProps) {
  return (
    <div>
      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</h4>
      <div className="space-y-1">
        {templates.map((t) => (
          <div key={t.id}>
            <button
              type="button"
              onClick={() => onSelect(t.id)}
              className={`w-full text-left text-sm px-3 py-2 rounded ${
                selectedId === t.id
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t.name}
            </button>
            {selectedId === t.id && (
              <p className="text-xs text-slate-500 px-3 py-1 italic">{resolveTemplate(t)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
