import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { NLQEngine } from '@/engines/NLQEngine';
import type { NLQResult } from '@/engines/NLQEngine';
import { ChatChart } from '@/components/ui/ChatChart';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  MessageSquare,
  Send,
  Sparkles,
  BarChart3,
  TrendingUp,
  Table,
  Trash2,
  Bot,
  User,
  Copy,
  Check,
  Download,
  History,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  result?: NLQResult;
}

// ─── Example Queries ────────────────────────────────────────────────────────

const EXAMPLE_QUERIES = [
  { icon: BarChart3, text: 'Show revenue by department' },
  { icon: TrendingUp, text: 'What is the profit trend over time?' },
  { icon: Table, text: 'List expenses by region' },
  { icon: Sparkles, text: 'Compare Q1 vs Q2 revenue' },
  { icon: BarChart3, text: 'Total budget this year' },
  { icon: TrendingUp, text: 'Show cash flow YTD as a line chart' },
];

const ROUTE_SUGGESTIONS: Record<string, string[]> = {
  '/forecasts': ['Show forecast trends', 'Compare forecast vs actual', 'Forecast by department'],
  '/budgets': [
    'Show budget vs actuals',
    'Budget utilization by dept',
    'Remaining budget this quarter',
  ],
  '/reports': ['Revenue summary report', 'Expense breakdown', 'Profit and loss this year'],
  '/cash': ['Cash flow trend', 'Cash balance over time', 'Operating vs investing cash flow'],
  '/variance': [
    'Show top variances',
    'Budget variance by department',
    'Unfavorable variance details',
  ],
  '/scenarios': ['Compare scenario A vs B', 'Best case vs worst case', 'Scenario revenue impact'],
};

function getRouteSuggestions(pathname: string): string[] {
  const match = Object.keys(ROUTE_SUGGESTIONS).find((route) => pathname.startsWith(route));
  return match ? ROUTE_SUGGESTIONS[match]! : [];
}

// ─── Query History (localStorage) ──────────────────────────────────────────

const HISTORY_KEY = 'nlq-query-history';
const MAX_HISTORY = 10;

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToHistory(query: string): void {
  const prev = loadHistory().filter((q) => q !== query);
  const updated = [query, ...prev].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

// ─── Export Helpers ────────────────────────────────────────────────────────

function exportAsJSON(result: NLQResult, query: string): void {
  const blob = new Blob([JSON.stringify({ query, data: result.data }, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nlq-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAsCSV(result: NLQResult): void {
  const headers = ['label', 'value'];
  const rows = result.data.map((dp) => [dp.label, String(dp.value)]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nlq-export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

let msgCounter = 0;
function nextId(): string {
  return `msg-${Date.now()}-${++msgCounter}`;
}

const formatCurrency = (v: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);

// ─── Component ──────────────────────────────────────────────────────────────

export function NLQChatPage() {
  const { entries } = useGLStore();
  const { pathname } = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastResultRef = useRef<NLQResult | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleQuery = useCallback(
    (queryText: string) => {
      const trimmed = queryText.trim();
      if (!trimmed || isProcessing) return;

      // Add user message
      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      setIsProcessing(true);
      setInput('');
      saveToHistory(trimmed);
      setQueryHistory(loadHistory());

      // Parse and execute
      try {
        const query = NLQEngine.parseQuery(trimmed);
        const result = NLQEngine.executeQuery(query, entries);
        lastResultRef.current = result;

        const confidence = Math.round(query.confidence * 100);
        const dataCount = result.data.length;

        let responseText: string;
        if (dataCount === 0) {
          responseText = `${result.summary}\n\nTry rephrasing or check if GL data is loaded.`;
        } else {
          responseText = result.summary;
          if (query.confidence < 0.6) {
            responseText += `\n\n(Low confidence ${confidence}% — interpreted as "${query.intent}" query about ${query.entities.metrics.join(', ') || 'financial data'})`;
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
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        const errorMsg: ChatMessage = {
          id: nextId(),
          role: 'assistant',
          content: `Could not understand that query. ${errMsg}\n\nTip: Try patterns like "Show [metric] by [dimension]" or "Compare [metric] Q1 vs Q2".`,
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

  const handleExampleClick = (text: string) => {
    setInput(text);
    handleQuery(text);
  };

  const handleClear = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  // Ctrl+E global shortcut for export
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        const last = messages[messages.length - 1];
        if (last?.result) exportAsJSON(last.result, last.content);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [messages]);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleHistorySelect = (q: string) => {
    setInput(q);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const handleCopy = async (msgId: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isEmpty = messages.length === 0;
  const routeSuggestions = getRouteSuggestions(pathname);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-400" />
            NLQ Chat
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Ask questions about your financial data in plain English.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {queryHistory.length > 0 && (
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                <History className="h-4 w-4 mr-1.5" />
                History
              </Button>
              {showHistory && (
                <div className="absolute right-0 top-full mt-1 z-50 w-72 max-h-64 overflow-y-auto rounded-lg border border-slate-700/50 bg-slate-800 shadow-xl">
                  {queryHistory.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleHistorySelect(q)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 border-b border-slate-700/30 last:border-0 truncate"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {isEmpty ? (
          /* Empty State — Examples */
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-3 text-slate-500">
              <Sparkles className="h-8 w-8 text-blue-400/50" />
              <div className="text-center">
                <p className="text-lg font-medium text-slate-300">
                  Ask anything about your financials
                </p>
                <p className="text-sm text-slate-500">
                  {entries.length > 0
                    ? `${entries.length.toLocaleString()} GL entries loaded`
                    : 'No GL data loaded yet'}
                </p>
              </div>
            </div>

            {routeSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs text-slate-500 self-center">Suggested:</span>
                {routeSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleExampleClick(s)}
                    className="px-2.5 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-xs text-blue-300 hover:bg-blue-500/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl">
              {EXAMPLE_QUERIES.map((ex) => (
                <button
                  key={ex.text}
                  onClick={() => handleExampleClick(ex.text)}
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800 hover:border-blue-500/30 transition-colors text-left group"
                >
                  <ex.icon className="h-4 w-4 text-slate-500 group-hover:text-blue-400 shrink-0 transition-colors" />
                  <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">
                    {ex.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message List */
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'order-first' : ''}`}
                >
                  <Card
                    className={
                      msg.role === 'user'
                        ? 'bg-blue-600/10 border-blue-500/20'
                        : 'bg-slate-800/60 border-slate-700/50'
                    }
                  >
                    <CardContent className="p-3">
                      <p className="text-sm text-slate-200 whitespace-pre-wrap">{msg.content}</p>
                    </CardContent>
                  </Card>

                  {/* Chart for assistant messages with data */}
                  {msg.result && msg.result.data.length > 0 && msg.result.chartConfig && (
                    <ChatChart result={msg.result} />
                  )}

                  {/* Data table for KPI / table intents */}
                  {msg.result &&
                    msg.result.data.length > 0 &&
                    (msg.result.query.intent === 'kpi' || msg.result.query.intent === 'table') && (
                      <Card className="bg-slate-800/40 border-slate-700/50">
                        <CardContent className="p-3">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-700/50">
                                  <th className="text-left py-1.5 px-2 text-slate-400 font-medium">
                                    {msg.result.query.entities.dimensions[0] || 'Category'}
                                  </th>
                                  <th className="text-right py-1.5 px-2 text-slate-400 font-medium">
                                    Value
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {msg.result.data.slice(0, 15).map((dp, i) => (
                                  <tr
                                    key={i}
                                    className="border-b border-slate-700/30 last:border-0"
                                  >
                                    <td className="py-1.5 px-2 text-slate-300">{dp.label}</td>
                                    <td className="py-1.5 px-2 text-right font-mono text-slate-200">
                                      {formatCurrency(dp.value)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {msg.result.data.length > 15 && (
                            <p className="text-[11px] text-slate-500 mt-2 text-center">
                              Showing 15 of {msg.result.data.length} rows
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                  {/* Confidence badge + actions for assistant */}
                  {msg.result && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span>
                          Parsed as{' '}
                          <span className="text-slate-400">{msg.result.query.intent}</span>
                        </span>
                        <span className="text-slate-600">·</span>
                        <span>{Math.round(msg.result.query.confidence * 100)}% confidence</span>
                        <span className="text-slate-600">·</span>
                        <span>
                          {msg.result.data.length} data{' '}
                          {msg.result.data.length === 1 ? 'point' : 'points'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                          title="Copy to clipboard"
                          aria-label="Copy to clipboard"
                        >
                          {copiedId === msg.id ? (
                            <Check className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={() => exportAsCSV(msg.result!)}
                          className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                          title="Export as CSV"
                          aria-label="Export as CSV"
                        >
                          <FileSpreadsheet className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => exportAsJSON(msg.result!, msg.content)}
                          className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                          title="Export as JSON"
                          aria-label="Export as JSON"
                        >
                          <FileJson className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-slate-700/50 border border-slate-600/30 flex items-center justify-center">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-blue-400 animate-pulse" />
                </div>
                <Card className="bg-slate-800/60 border-slate-700/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-slate-400">Analyzing</span>
                      <span className="flex gap-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Quick Suggestions (visible when chat has messages) */}
        {!isEmpty && (
          <div className="flex gap-2 overflow-x-auto py-1 shrink-0">
            {(routeSuggestions.length > 0
              ? routeSuggestions
              : EXAMPLE_QUERIES.slice(0, 4).map((ex) => ex.text)
            ).map((text) => (
              <button
                key={text}
                onClick={() => handleExampleClick(text)}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3" />
                {text}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="flex gap-2 shrink-0 pt-1">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Ask about your financial data… (Shift+Enter for newline)"
              disabled={isProcessing}
              rows={1}
              className="w-full h-10 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors disabled:opacity-50 resize-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 pointer-events-none">
              Ctrl+E export
            </span>
          </div>
          <Button type="submit" disabled={!input.trim() || isProcessing} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
