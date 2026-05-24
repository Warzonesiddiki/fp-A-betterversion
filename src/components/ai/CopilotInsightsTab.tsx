import { useState } from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import { AICopilotEngine } from '@/engines/AICopilotEngine';
import { FormulaDisplay } from './CopilotFormulaDisplay';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function FormulaInput({ onSuggest }: { onSuggest: (description: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-2"
      style={{
        borderColor: 'var(--border-subtle)',
        background: 'var(--bg-elevated)',
      }}
    >
      <Lightbulb className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onSuggest(value);
            setValue('');
          }
        }}
        placeholder="Describe what you want to calculate..."
        className="flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--text-muted)]"
        style={{ color: 'var(--text-primary)' }}
        aria-label="Describe a formula"
      />
      <button
        onClick={() => {
          if (value.trim()) {
            onSuggest(value);
            setValue('');
          }
        }}
        disabled={!value.trim()}
        className="flex-shrink-0 rounded p-1 transition-colors hover:bg-[var(--bg-surface)] disabled:opacity-30"
        style={{ color: 'var(--accent-primary)' }}
        aria-label="Get formula suggestion"
      >
        <Sparkles className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function InsightsTab({
  formulaResult,
  onFormulaResultChange,
  onSwitchToChat,
}: {
  formulaResult: ReturnType<typeof AICopilotEngine.suggestFormula> | null;
  onFormulaResultChange: (result: ReturnType<typeof AICopilotEngine.suggestFormula>) => void;
  onSwitchToChat: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      <div className="space-y-3">
        <Section title="Formula Assistant">
          <FormulaInput
            onSuggest={(desc) => {
              const result = AICopilotEngine.suggestFormula(desc);
              onFormulaResultChange(result);
              onSwitchToChat();
            }}
          />
        </Section>

        {formulaResult && formulaResult.confidence > 0 && (
          <Section title="Matched Formula">
            <FormulaDisplay
              formula={formulaResult.formula}
              description={formulaResult.description}
              confidence={formulaResult.confidence}
              onCopy={() => navigator.clipboard.writeText(formulaResult.formula)}
            />
            {formulaResult.alternatives.length > 0 && (
              <div className="mt-2">
                <p
                  className="text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Alternatives
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {formulaResult.alternatives.map((alt) => (
                    <span
                      key={alt}
                      className="rounded-full border px-2 py-0.5 text-[10px] font-mono"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {alt}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        <Section title="Quick Formulas">
          <div className="space-y-1.5">
            {[
              { key: 'growth', label: 'Growth Rate' },
              { key: 'margin', label: 'Profit Margin' },
              { key: 'variance pct', label: 'Variance %' },
              { key: 'cagr', label: 'CAGR' },
              { key: 'ytd', label: 'Year-to-Date' },
              { key: 'headcount cost', label: 'Headcount Cost' },
            ].map(({ key, label }) => {
              const result = AICopilotEngine.suggestFormula(key);
              return (
                <button
                  key={key}
                  onClick={() => {
                    onFormulaResultChange(result);
                    onSwitchToChat();
                  }}
                  className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span className="font-medium">{label}</span>
                  <code className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    {result.formula}
                  </code>
                </button>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}
