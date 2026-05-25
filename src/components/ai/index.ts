// AI Components — barrel export
export { AICopilotPanel } from './AICopilotPanel';
export type { AICopilotPanelProps } from './AICopilotPanel';

export { NLQChat } from './NLQChat';
export type { NLQChatProps } from './NLQChat';

export { AnomalyHighlight } from './AnomalyHighlight';
export type { AnomalyHighlightProps } from './AnomalyHighlight';

export { CopilotSidebar } from './CopilotSidebar';
export { ChatTab } from './CopilotChatTab';
export { AlertsTab } from './CopilotAlertsTab';
export { InsightsTab } from './CopilotInsightsTab';
export { FormulaDisplay } from './CopilotFormulaDisplay';

export type {
  CopilotMessage,
  CopilotAlert,
  CopilotSidebarProps,
  PageContext,
} from './CopilotTypes';
export {
  PAGE_CONTEXTS,
  DEFAULT_CONTEXT,
  getContextForPath,
  generateAlerts,
  nextId,
} from './CopilotTypes';
