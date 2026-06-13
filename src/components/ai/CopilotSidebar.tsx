import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Brain, AlertTriangle, Lightbulb, MessageSquare, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { AICopilotEngine } from '@/engines/AICopilotEngine';
import { FinanceCopilotEngine } from '@/engines/FinanceCopilotEngine';
import { useCopilotSidebar } from '@/hooks/useCopilotSidebar';
import { useAIAnalytics } from '@/hooks/useAIAnalytics';
import type { CopilotMessage, CopilotSidebarProps } from './CopilotTypes';
import { getContextForPath, generateAlerts, nextId } from './CopilotTypes';
import { ChatTab } from './CopilotChatTab';
import { AlertsTab } from './CopilotAlertsTab';
import { InsightsTab } from './CopilotInsightsTab';

export function CopilotSidebar({ gl, budget, className }: CopilotSidebarProps) {
  const { isOpen, activeTab, toggle, close, setActiveTab } = useCopilotSidebar();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { track } = useAIAnalytics();

  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const pageContext = useMemo(() => getContextForPath(location.pathname), [location.pathname]);

  const [formulaResult, setFormulaResult] = useState<ReturnType<
    typeof AICopilotEngine.suggestFormula
  > | null>(null);

  const alerts = useMemo(
    () => generateAlerts(gl, budget, pageContext.alertThreshold),
    [gl, budget, pageContext.alertThreshold]
  );

  const highAlertCount = useMemo(
    () => alerts.filter((a) => a.severity === 'high').length,
    [alerts]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close();
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, close, toggle]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isProcessing) return;

      const userMsg: CopilotMessage = {
        id: nextId('user'),
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      setIsProcessing(true);

      const formulaSuggestion = AICopilotEngine.suggestFormula(text);
      if (formulaSuggestion.confidence > 0) {
        setFormulaResult(formulaSuggestion);
        track({
          engine: 'AICopilotEngine',
          action: 'suggestFormula',
          latencyMs: 0,
          confidence: formulaSuggestion.confidence,
          inputLength: text.length,
        });
      }

      setTimeout(() => {
        const startTime = performance.now();
        try {
          const answer = FinanceCopilotEngine.answer(text, { gl, budget });
          const latencyMs = performance.now() - startTime;
          track({
            engine: 'FinanceCopilotEngine',
            action: 'answer',
            latencyMs,
            confidence: answer.confidence,
            inputLength: text.length,
          });
          const assistantMsg: CopilotMessage = {
            id: nextId('assistant'),
            role: 'assistant',
            content: answer.answer,
            timestamp: new Date(),
            confidence: answer.confidence,
            sources: answer.sources,
            chartType: answer.chartType,
            formula: formulaSuggestion.confidence > 0 ? formulaSuggestion.formula : undefined,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: nextId('error'),
              role: 'assistant',
              content:
                'I could not process that. Try rephrasing or use one of the suggested prompts.',
              timestamp: new Date(),
            },
          ]);
        } finally {
          setIsProcessing(false);
        }
      }, 200);
    },
    [gl, budget, isProcessing, track]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInputValue(suggestion);
      sendMessage(suggestion);
    },
    [sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputValue);
      }
    },
    [inputValue, sendMessage]
  );

  const tabs = [
    { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
    { id: 'alerts' as const, label: 'Alerts', icon: AlertTriangle, badge: highAlertCount },
    { id: 'suggestions' as const, label: 'Insights', icon: Lightbulb },
  ];

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggle}
          className={cn(
            'fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105',
            'bg-[var(--accent-primary)] text-white',
            className
          )}
          aria-label="Open AI Copilot (Ctrl+J)"
          title="AI Copilot (Ctrl+J)"
        >
          <Brain className="h-5 w-5" />
          {highAlertCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {highAlertCount}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full flex-col border-l shadow-2xl transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          'w-full sm:w-[380px] md:w-[400px]',
          className
        )}
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
        aria-label="AI Financial Copilot"
      >
        <div
          className="flex h-14 items-center justify-between border-b px-4"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'var(--accent-primary)', opacity: 0.9 }}
            >
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                AI Copilot
              </h2>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {pageContext.label} context
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <kbd
              className="hidden rounded border px-1.5 py-0.5 text-[10px] font-medium md:inline-block"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              ⌘J
            </kbd>
            <button
              onClick={close}
              className="rounded-md p-1.5 transition-colors hover:bg-[var(--bg-elevated)]"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Close copilot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className="flex border-b px-2"
          style={{ borderColor: 'var(--border-subtle)' }}
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-[var(--accent-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ background: 'var(--accent-primary)' }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <ChatTab
              messages={messages}
              inputValue={inputValue}
              isProcessing={isProcessing}
              pageContext={pageContext}
              formulaResult={formulaResult}
              scrollRef={scrollRef}
              inputRef={inputRef}
              onInputChange={setInputValue}
              onKeyDown={handleKeyDown}
              onSend={sendMessage}
              onSuggestionClick={handleSuggestionClick}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsTab alerts={alerts} gl={gl} budget={budget} highAlertCount={highAlertCount} />
          )}

          {activeTab === 'suggestions' && (
            <InsightsTab
              formulaResult={formulaResult}
              onFormulaResultChange={setFormulaResult}
              onSwitchToChat={() => setActiveTab('chat')}
            />
          )}
        </div>
      </aside>
    </>
  );
}
