import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/store/uiStore', () => ({
  useUIStore: vi.fn(() => ({ addToast: vi.fn() })),
}));

vi.mock('@/config/templates', () => ({
  allTemplates: [],
  templateCategories: [],
  industryLabels: {},
}));

vi.mock('@/engines/TemplateEngine', () => ({
  TemplateEngine: { listTemplates: vi.fn(() => []), applyTemplate: vi.fn() },
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    LayoutGrid: makeIcon(),
    TrendingUp: makeIcon(),
    FileText: makeIcon(),
    BarChart3: makeIcon(),
    Download: makeIcon(),
    Upload: makeIcon(),
    Search: makeIcon(),
    ChevronRight: makeIcon(),
  };
});

import TemplateGalleryPage from '@/pages/templates/TemplateGalleryPage';

describe('TemplateGalleryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<TemplateGalleryPage />);
    expect(screen.getByRole('heading', { name: /template/i })).toBeTruthy();
  });
});
