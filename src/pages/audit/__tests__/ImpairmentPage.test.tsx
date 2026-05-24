import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => {
  const makeIcon = (name: string) => {
    const Icon = (props: any) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    AlertTriangle: makeIcon('AlertTriangle'),
    TrendingDown: makeIcon('TrendingDown'),
    Download: makeIcon('Download'),
    CheckCircle: makeIcon('CheckCircle'),
  };
});

const { render, screen } = await import('@/test/testUtils');
const { default: ImpairmentPage } = await import('@/pages/audit/ImpairmentPage');

describe('ImpairmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<ImpairmentPage />);
    expect(screen.getByRole('heading', { name: /Impairment Testing/i })).toBeTruthy();
  });
});
