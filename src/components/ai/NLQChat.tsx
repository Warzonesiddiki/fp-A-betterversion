import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Send, Sparkles, Bot, User } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useGLStore } from '@/store/glStore';
import { NLQEngine } from '@/engines/NLQEngine';
import type { NLQResult } from '@/engines/NLQEngine';
import { Card, CardContent } from '@/components/ui/Card';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NLQChatProps {
  /** Additional CSS classes. */
  className?: string;
  /** Max height of the chat area. */
  maxHeight?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  result?: NLQResult;
}

// ─── Route-aware suggestions ────────────────────────────────────────────────

const ROUTE_SUGGESTIONS: Record<string, string[]> = {
  '/dashboard': ['Show revenue by department', 'What is total profit?', 'Expenses by region'],
  '/budgets': ['Show budget vs actuals', 'Budget utilization by dept', 'Remaining budget'],
  '/forecasts': ['Forecast trends', 'Compare forecast vs actual', 'Forecast by department'],
  '/reports': ['Revenue summary', 'Expense breakdown', 'Profit and loss'],
  '/variance': ['Show top variances', 'Budget variance by department', 'Unfavorable variances'],
  '/scenarios': ['Compare scenarios', 'Best vs worst case', 'Scenario revenue impact'],
};

function getSuggestions(pathname: string): string[] {
  const match = Object.keys(ROUTE_SUGGESTIONS).find((r) => pathname.startsWith(r));
  return match
    ? ROUTE_SUGGESTIONS[match]!
    : ['Show revenue by department', 'Total expenses', 'Profit trend'];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

let msgCounter = 0;
const nextId = () => `nlq-${Date.now()}-${++msgCounter}`;
const formatCurrency = (v: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);

// ─── Component ──────────────────────────────────────────────────────────────

export function NLQChat({ className, maxHeight = '400px' }: NLQChatProps) {
  const { entries } = useGLStore();
  const { pathname } = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => getSuggestions(pathname), [pathname]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleQuery = useCallback(
    (queryText: string) => {
      const trimmed = queryText.trim();
      if (!trimmed || isProcessing) return;

      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };
      setIsProcessing(true);
      setInput('');

      try {
        const query = NLQEngine.parseQuery(trimmed);
        const result = NLQEngine.executeQuery(query, entries);
        const confidence = Math.round(query.confidence * 100);

        let responseText: string;
        if (result.data.length === 0) {
          responseText = `${result.summary}\nTry rephrasing or check if GL data is loaded.`;
        } else {
          responseText = result.summary;
          if (query.confidence < 0.6) {
            responseText += `\n(Low confidence ${confidence}%)`;
          }
        }

        const assistantMsg: ChatMessage = {
          id: nextId(),
          role: 'assistant',
          content: responseText,
          timestamp: Date.now(),
          result,
        };
        setMessages((prev) => [...prev, userMsg, assistantMsg]);
      } catch {
        const errorMsg: ChatMessage = {
          id: nextId(),
          role: 'assistant',
          content:
            'Could not understand that query. Try patterns like "Show [metric] by [dimension]".',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMsg, errorMsg]);
      } finally {
        setIsProcessing(false);
      }
    },
    [entries, isProcessing]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border',
        'bg-[var(--bg-surface)] border-[var(--border-subtle)]',
        className
      )}
      style={{ maxHeight }}
      role="complementary"
      aria-label="Natural Language Query Chat"
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 border-b px-4 py-2.5"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <MessageSquare className="h-4 w-4 text-blue-400" />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          NLQ Chat
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {entries.length > 0 ? `${entries.length.toLocaleString()} entries` : 'No data'}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex flex-col">
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 py-4">
            <Sparkles className="h-5 w-5 text-blue-400/50" />
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Ask questions about your financial data in plain English
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleQuery(s)}
                  className="flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium transition-all hover:border-blue-500/30 hover:bg-blue-500/5"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  <Sparkles className="w-2 h-2 opacity-50" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div className="shrink-0 mt-0.5">
                    <div className="h-5 w-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Bot className="h-2.5 w-2.5 text-blue-400" />
                    </div>
                  </div>
                )}
                <div
                  className={cn('max-w-[85%] space-y-1', msg.role === 'user' ? 'order-first' : '')}
                >
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 text-xs leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-blue-600/10 text-[var(--text-primary)]'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {/* Mini chart for data results */}
                  {msg.result &&
                    msg.result.data.length > 0 &&
                    (() => {
                      const maxVal = Math.max(...msg.result.data.map((d) => Math.abs(d.value)));
                      return (
                        <Card className="bg-[var(--bg-elevated)] border-[var(--border-subtle)]">
                          <CardContent className="p-2">
                            <div className="space-y-1">
                              {msg.result.data.slice(0, 5).map((dp, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px]">
                                  <span
                                    className="w-20 truncate"
                                    style={{ color: 'var(--text-muted)' }}
                                  >
                                    {dp.label}
                                  </span>
                                  <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-surface)]">
                                    <div
                                      className="h-full rounded-full bg-blue-500/60"
                                      style={{
                                        width: `${maxVal > 0 ? (Math.abs(dp.value) / maxVal) * 100 : 0}%`,
                                      }}
                                    />
                                  </div>
                                  <span
                                    className="w-16 text-right font-mono"
                                    style={{ color: 'var(--text-secondary)' }}
                                  >
                                    {formatCurrency(dp.value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {msg.result.data.length > 5 && (
                              <p
                                className="text-[9px] mt-1 text-center"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                +{msg.result.data.length - 5} more
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })()}
                  {msg.result && (
                    <div
                      className="flex items-center gap-1.5 text-[9px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <span>{msg.result.query.intent}</span>
                      <span className="text-[var(--border-subtle)]">.</span>
                      <span>{Math.round(msg.result.query.confidence * 100)}%</span>
                      <span className="text-[var(--border-subtle)]">.</span>
                      <span>{msg.result.data.length} pts</span>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="shrink-0 mt-0.5">
                    <div className="h-5 w-5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
                      <User className="h-2.5 w-2.5" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 px-1">
                <div className="h-5 w-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Bot className="h-2.5 w-2.5 text-blue-400 animate-pulse" />
                </div>
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
          className="border-t px-4 py-2.5"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors focus-within:border-blue-500/50"
            style={{
              borderColor: 'var(--border-subtle)',
              background: 'var(--bg-elevated)',
            }}
          >
            <MessageSquare className="h-3 w-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your data..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--text-muted)]"
              style={{ color: 'var(--text-primary)' }}
              disabled={isProcessing}
              aria-label="Ask a natural language question"
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="flex-shrink-0 rounded-md p-1 transition-colors hover:bg-[var(--bg-surface)] disabled:opacity-30"
              style={{ color: 'var(--accent-primary)' }}
              aria-label="Send"
            >
              <Send className="h-3 w-3" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
