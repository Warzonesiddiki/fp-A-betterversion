import { useState, useMemo, useCallback } from 'react';
import { Brain, Send, Sparkles, ChevronDown, ChevronUp, Loader2, Lightbulb } from 'lucide-react';
import { cn } from '@/utils/cn';
import { AICopilotEngine } from '@/engines/AICopilotEngine';
import { FinanceCopilotEngine } from '@/engines/FinanceCopilotEngine';
import { getContextForPath } from './CopilotTypes';
import type { GLState, BudgetState } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AICopilotPanelProps {
  /** Current page pathname for context-aware suggestions. */
  pathname: string;
  /** GL store state for financial queries. */
  gl?: GLState;
  /** Budget store state for budget queries. */
  budget?: BudgetState;
  /** Additional CSS classes. */
  className?: string;
  /** Collapsed by default. */
  defaultCollapsed?: boolean;
}

interface PanelMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  formula?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

let counter = 0;
function nextId(): string {
  return `panel-${Date.now()}-${++counter}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AICopilotPanel({
  pathname,
  gl,
  budget,
  className,
  defaultCollapsed = false,
}: AICopilotPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<PanelMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const context = useMemo(() => getContextForPath(pathname), [pathname]);

  const handleSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isProcessing) return;

      const userMsg: PanelMessage = { id: nextId(), role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsProcessing(true);

      setTimeout(() => {
        try {
          const answer = FinanceCopilotEngine.answer(trimmed, { gl, budget });
          const formulaResult = AICopilotEngine.suggestFormula(trimmed);

          const assistantMsg: PanelMessage = {
            id: nextId(),
            role: 'assistant',
            content: answer.answer,
            confidence: answer.confidence,
            formula: formulaResult.confidence > 0 ? formulaResult.formula : undefined,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } catch {
          setMessages((prev) => [
            ...prev,
            { id: nextId(), role: 'assistant', content: 'Could not process that query.' },
          ]);
        } finally {
          setIsProcessing(false);
        }
      }, 150);
    },
    [gl, budget, isProcessing]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border transition-all',
        'bg-[var(--bg-surface)] border-[var(--border-subtle)]',
        className
      )}
      role="complementary"
      aria-label="AI Copilot Panel"
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{ background: 'var(--accent-primary)', opacity: 0.9 }}
          >
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              AI Copilot
            </span>
            <span className="ml-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {context.label}
            </span>
          </div>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
        )}
      </button>

      {!collapsed && (
        <div className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          {/* Suggestions */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 py-3">
              {context.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="group flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Sparkles className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
                  {s.length > 40 ? s.slice(0, 40) + '...' : s}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="max-h-60 overflow-y-auto px-4 py-2 space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'rounded-lg px-3 py-2 text-xs leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-[var(--accent-primary)]/10 text-[var(--text-primary)] ml-8'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.formula && (
                    <div className="mt-1.5 flex items-center gap-1.5 rounded-md bg-[var(--bg-surface)] px-2 py-1.5">
                      <Lightbulb className="h-3 w-3 text-amber-400" />
                      <code className="font-mono text-[10px] text-[var(--text-secondary)]">
                        {msg.formula}
                      </code>
                    </div>
                  )}
                  {msg.confidence !== undefined && msg.confidence > 0 && (
                    <span className="mt-1 block text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {Math.round(msg.confidence * 100)}% confident
                    </span>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-center gap-2 px-1">
                  <Loader2
                    className="h-3 w-3 animate-spin"
                    style={{ color: 'var(--text-accent)' }}
                  />
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Analyzing...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t px-4 py-3"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div
              className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors focus-within:border-[var(--accent-primary)]"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-elevated)',
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a financial question..."
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--text-muted)]"
                style={{ color: 'var(--text-primary)' }}
                disabled={isProcessing}
                aria-label="Ask the AI copilot"
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="flex-shrink-0 rounded-md p-1 transition-colors hover:bg-[var(--bg-surface)] disabled:opacity-30"
                style={{ color: 'var(--text-accent)' }}
                aria-label="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
