import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ templateId: 'budget-annual' })),
    useNavigate: vi.fn(() => vi.fn()),
  };
});

vi.mock('@/config/templates', () => ({
  allTemplates: [
    {
      id: 'budget-annual',
      name: 'Annual Budget Template',
      category: 'budget',
      industry: 'general',
      description: 'Annual budget template for FP&A',
      kpis: [
        { name: 'Revenue', category: 'income', formula: 'sum' },
        { name: 'Expenses', category: 'cost', formula: 'sum' },
      ],
    },
    {
      id: 'forecast-quarterly',
      name: 'Quarterly Forecast',
      category: 'forecast',
      industry: 'general',
      description: 'Quarterly forecast template',
      kpis: [{ name: 'Revenue', category: 'income', formula: 'sum' }],
    },
  ],
  industryLabels: { general: 'General' },
}));

vi.mock('lucide-react', () => ({
  Download: makeIcon(),
  ArrowLeft: makeIcon(),
  Check: makeIcon(),
  LayoutGrid: makeIcon(),
  TrendingUp: makeIcon(),
  FileText: makeIcon(),
  BarChart3: makeIcon(),
}));

function makeIcon() {
  return ({ className }: any) => <span data-testid="mock-icon" className={className} />;
}

import { render, screen, fireEvent } from '@/test/testUtils';
import TemplatePreviewPage from '../TemplatePreviewPage';

describe('TemplatePreviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders template name', () => {
    render(<TemplatePreviewPage />);
    expect(screen.getByText(/annual budget template/i)).toBeDefined();
  });

  it('renders template description', () => {
    render(<TemplatePreviewPage />);
    expect(screen.getByText(/annual budget template for fp&a/i)).toBeDefined();
  });

  it('renders KPI list', () => {
    render(<TemplatePreviewPage />);
    expect(screen.getByText(/revenue/i)).toBeDefined();
    expect(screen.getByText(/expenses/i)).toBeDefined();
  });

  it('renders apply button', () => {
    render(<TemplatePreviewPage />);
    expect(screen.getByText(/apply/i)).toBeDefined();
  });

  it('renders back button', () => {
    render(<TemplatePreviewPage />);
    expect(screen.getByText(/back/i)).toBeDefined();
  });
});
