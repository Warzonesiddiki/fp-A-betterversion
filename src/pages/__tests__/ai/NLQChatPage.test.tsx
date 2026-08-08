import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NLQChatPage from '../../ai/NLQChatPage';

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ state: {}, pathname: '/ai/chat' }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: () => <div />,
  Bar: () => null,
  LineChart: () => <div />,
  Line: () => null,
  PieChart: () => <div />,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  AreaChart: () => <div />,
  Area: () => null,
}));

vi.mock('@/store/glStore', () => {
  const store = {
    entries: [],
    accounts: [],
    filters: {},
  };
  const hook = Object.assign((selector?: (s: any) => any) => (selector ? selector(store) : store), {
    getState: () => store,
  });
  return { useGLStore: hook };
});

vi.mock('@/components/ui/ChatChart', () => ({
  ChatChart: () => <div data-testid="chat-chart" />,
}));

vi.mock('lucide-react', () => {
  const mk = () => () => <svg />;
  return {
    MessageSquare: mk(),
    Send: mk(),
    History: mk(),
    X: mk(),
    Loader2: mk(),
    Trash2: mk(),
    Download: mk(),
    BarChart3: mk(),
    TrendingUp: mk(),
    PieChart: mk(),
    Table: mk(),
    Sparkles: mk(),
    ChevronDown: mk(),
    ChevronUp: mk(),
    Info: mk(),
    AlertCircle: mk(),
    Copy: mk(),
    Check: mk(),
    Play: mk(),
    Settings: mk(),
    Zap: mk(),
    Clock: mk(),
  };
});

describe('NLQChatPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the NLQ Chat heading', () => {
    render(<NLQChatPage />);
    expect(screen.getByRole('heading', { level: 1, name: /nlq chat/i })).toBeInTheDocument();
    expect(screen.getByText(/ask questions about your financial data/i)).toBeInTheDocument();
  });
});
