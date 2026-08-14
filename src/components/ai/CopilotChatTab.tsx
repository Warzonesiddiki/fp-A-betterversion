import { Loader2, MessageSquare, Send, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';
import { AICopilotEngine } from '@/engines/AICopilotEngine';
import { FormulaDisplay } from './CopilotFormulaDisplay';
import type { CopilotMessage, PageContext } from './CopilotTypes';

function SuggestionChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
      style={{
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-secondary)',
      }}
    >
      <Sparkles className="w-3 h-3 opacity-50 group-hover:opacity-100" />
      {label}
    </button>
  );
}

export function ChatTab({
  messages,
  inputValue,
  isProcessing,
  pageContext,
  scrollRef,
  inputRef,
  onInputChange,
  onKeyDown,
  onSend,
  onSuggestionClick,
}: {
  messages: CopilotMessage[];
  inputValue: string;
  isProcessing: boolean;
  pageContext: PageContext;
  formulaResult: ReturnType<typeof AICopilotEngine.suggestFormula> | null;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: (text: string) => void;
  onSuggestionClick: (suggestion: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3"
        role="log"
        aria-live="polite"
        aria-label="Copilot messages"
      >
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'var(--accent-primary)', opacity: 0.15 }}
                >
                  <Zap className="h-3 w-3" style={{ color: 'var(--text-accent)' }} />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                  msg.role === 'user'
                    ? 'rounded-tr-sm bg-[var(--accent-primary)] text-white'
                    : 'rounded-tl-sm'
                )}
                style={
                  msg.role === 'assistant'
                    ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)' }
                    : undefined
                }
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {msg.formula && (
                  <div className="mt-2">
                    <FormulaDisplay
                      formula={msg.formula}
                      description={AICopilotEngine.explainFormula(msg.formula)}
                      confidence={msg.confidence ?? 0.85}
                      onCopy={() => navigator.clipboard.writeText(msg.formula!)}
                    />
                  </div>
                )}

                {msg.role === 'assistant' && (msg.confidence || msg.sources?.length) && (
                  <div
                    className="mt-1.5 flex flex-wrap items-center gap-2 border-t pt-1.5"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    {msg.confidence && msg.confidence > 0 && (
                      <span
                        className="text-[10px] tabular-nums"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {Math.round(msg.confidence * 100)}% confident
                      </span>
                    )}
                    {msg.sources?.map((src) => (
                      <span
                        key={src}
                        className="rounded-full bg-[var(--bg-surface)] px-2 py-0.5 text-[10px]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 px-1">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: 'var(--accent-primary)', opacity: 0.15 }}
              >
                <Loader2 className="h-3 w-3 animate-spin" style={{ color: 'var(--text-accent)' }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Analyzing...
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className="flex flex-wrap gap-1.5 border-t px-4 py-2.5"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {pageContext.suggestions.map((s) => (
          <SuggestionChip
            key={s}
            label={s.length > 35 ? s.slice(0, 35) + '…' : s}
            onClick={() => onSuggestionClick(s)}
          />
        ))}
      </div>

      <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors focus-within:border-[var(--accent-primary)]"
          style={{
            borderColor: 'var(--border-subtle)',
            background: 'var(--bg-elevated)',
          }}
        >
          <MessageSquare
            className="h-3.5 w-3.5 flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about revenue, formulas, variances..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--text-muted)]"
            style={{ color: 'var(--text-primary)' }}
            disabled={isProcessing}
            aria-label="Ask the AI copilot"
          />
          <button
            onClick={() => onSend(inputValue)}
            disabled={!inputValue.trim() || isProcessing}
            className="flex-shrink-0 rounded-md p-1 transition-colors hover:bg-[var(--bg-surface)] disabled:opacity-30"
            style={{ color: 'var(--text-accent)' }}
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
          AI suggestions may not always be accurate. Verify critical calculations.
        </p>
      </div>
    </div>
  );
}
