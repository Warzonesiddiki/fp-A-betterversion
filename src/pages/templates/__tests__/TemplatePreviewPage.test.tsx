/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
        { label: 'Revenue', category: 'income' },
        { label: 'Expenses', category: 'cost' },
      ],
      columns: [
        { label: 'Account', type: 'text' },
        { label: 'Jan', type: 'number' },
      ],
      rows: [{ name: 'Revenue', values: [100000, 100000, 100000] }],
      sections: ['Overview', 'Details'],
    },
    {
      id: 'forecast-quarterly',
      name: 'Quarterly Forecast',
      category: 'forecast',
      industry: 'general',
      description: 'Quarterly forecast template',
      kpis: [{ label: 'Revenue', category: 'income' }],
      columns: [{ label: 'Account', type: 'text' }],
      rows: [],
      sections: [],
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
    expect(screen.getAllByText(/annual budget template/i).length).toBeGreaterThan(0);
  });

  it('renders template description', () => {
    render(<TemplatePreviewPage />);
    expect(screen.getAllByText(/annual budget template for fp&a/i).length).toBeGreaterThan(0);
  });

  it('renders KPI list', () => {
    render(<TemplatePreviewPage />);
    expect(screen.getAllByText(/revenue/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/expenses/i).length).toBeGreaterThan(0);
  });

  it('renders apply button', () => {
    render(<TemplatePreviewPage />);
    expect(screen.getAllByText(/apply template/i).length).toBeGreaterThan(0);
  });

  it('renders back button with aria-label', () => {
    render(<TemplatePreviewPage />);
    expect(screen.getByLabelText(/back to templates/i)).toBeDefined();
  });
});
