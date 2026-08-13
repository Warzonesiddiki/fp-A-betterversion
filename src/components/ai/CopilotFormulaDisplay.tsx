import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function FormulaDisplay({
  formula,
  description,
  confidence,
  onCopy,
}: {
  formula: string;
  description: string;
  confidence: number;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="rounded-lg border p-3"
      style={{
        borderColor: 'var(--border-subtle)',
        background: 'var(--bg-elevated)',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Suggested Formula
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {Math.round(confidence * 100)}% match
          </span>
          <button
            onClick={handleCopy}
            className="rounded p-1 transition-colors hover:bg-[var(--bg-surface)]"
            aria-label={copied ? 'Copied' : 'Copy formula'}
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
            )}
          </button>
        </div>
      </div>
      <code
        className="mt-1.5 block font-mono text-xs font-medium"
        style={{ color: 'var(--text-accent)' }}
      >
        {formula}
      </code>
      <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>
    </div>
  );
}
