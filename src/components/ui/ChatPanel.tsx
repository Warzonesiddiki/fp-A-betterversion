import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useTranslation } from 'react-i18next';
import { Loader2, MessageSquare, X, Minimize2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { NLQEngine } from '@/engines/NLQEngine';
import { NLQInput } from './NLQInput';
import { ChatMessage, type ChatMessageData } from './ChatMessage';
import { ChatChart } from './ChatChart';
import { GenerativeDashboard, nlqResultToSpec } from './GenerativeDashboard';
import type { GLEntry, GLAccount } from '@/types';
interface ChatPanelProps {
  entries?: readonly GLEntry[];
  accounts?: readonly GLAccount[];
  className?: string;
  minimized?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
}
let messageIdCounter = 0;
function nextId() {
  return `msg-${Date.now()}-${++messageIdCounter}`;
}
const WELCOME_MSG: ChatMessageData = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Ask me anything about your financial data. Try "show Q3 revenue by region" or "compare budget vs actual expenses".',
  timestamp: new Date(),
};
export function ChatPanel({
  entries = [],
  accounts,
  className,
  minimized = false,
  onToggleMinimize,
  onClose,
}: ChatPanelProps) {
  const fmtCurrency = useCurrencyFormatter();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessageData[]>([WELCOME_MSG]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  const handleQuery = useCallback(
    (text: string) => {
      // Add user message
      const userMsg: ChatMessageData = {
        id: nextId(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsProcessing(true);
      // Simulate brief processing (NLQ is sync but UX feels better with delay)
      setTimeout(() => {
        try {
          const query = NLQEngine.parseQuery(text);
          const result = NLQEngine.executeQuery(query, entries, accounts);
          const assistantMsg: ChatMessageData = {
            id: nextId(),
            role: 'assistant',
            content: result.summary,
            timestamp: new Date(),
            result,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } catch {
          const errorMsg: ChatMessageData = {
            id: nextId(),
            role: 'assistant',
            content:
              'Sorry, I could not process that query. Try rephrasing or using simpler terms.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        } finally {
          setIsProcessing(false);
        }
      }, 150);
    },
    [entries, accounts]
  );
  if (minimized) {
    return (
      <button
        onClick={onToggleMinimize}
        className={cn(
          'fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105',
          className
        )}
        aria-label="Open financial assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }
  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex w-[420px] flex-col rounded-2xl border bg-background shadow-2xl',
        'max-h-[calc(100vh-2rem)]',
        className
      )}
      role="complementary"
      aria-label="Financial assistant chat"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold">Financial Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              aria-label="Minimize chat"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-3"
        style={{ minHeight: 300, maxHeight: 400 }}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((msg) => (
          <div key={msg.id}>
            <ChatMessage message={msg} />
            {msg.result && msg.result.chartConfig && msg.role === 'assistant' && (
              <div className="ml-11 mr-4">
                <ChatChart result={msg.result} />
              </div>
            )}
            {msg.result && msg.result.data.length > 0 && msg.role === 'assistant' && (
              <div className="ml-11 mr-4 mt-2">
                <GenerativeDashboard
                  spec={nlqResultToSpec(
                    msg.result.data,
                    msg.result.query.intent,
                    msg.result.chartConfig?.title
                  )}
                />
              </div>
            )}
            {msg.result && msg.result.data.length > 0 && msg.result.query.intent === 'table' && (
              <div className="ml-11 mr-4 mt-2 overflow-x-auto rounded-xl border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-1.5 text-left font-medium" scope="col">
                        Label
                      </th>
                      <th className="px-3 py-1.5 text-right font-medium" scope="col">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {msg.result.data.slice(0, 10).map((dp, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-1.5">{dp.label}</td>
                        <td className="px-3 py-1.5 text-right font-mono">
                          {fmtCurrency.custom({ maxDecimals: 0 })(dp.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-center gap-2 px-4 py-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{t('ai.analyzing')}</span>
          </div>
        )}
      </div>
      {/* Input */}
      <div className="border-t p-3">
        <NLQInput
          onSubmit={handleQuery}
          isProcessing={isProcessing}
          placeholder="Ask about revenue, expenses, budgets..."
        />
      </div>
    </div>
  );
}
