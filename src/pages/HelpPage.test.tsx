import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    HelpCircle: makeIcon(),
    Search: makeIcon(),
    Keyboard: makeIcon(),
    BookOpen: makeIcon(),
    FileText: makeIcon(),
    Upload: makeIcon(),
    Calculator: makeIcon(),
    BarChart3: makeIcon(),
    Settings: makeIcon(),
    Shield: makeIcon(),
    ChevronDown: makeIcon(),
    ChevronUp: makeIcon(),
  };
});

import HelpPage from '@/pages/HelpPage';

describe('HelpPage smoke test', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <HelpPage />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('displays the help center heading', () => {
    const { getByText } = render(
      <MemoryRouter>
        <HelpPage />
      </MemoryRouter>
    );
    expect(getByText(/Help Center/i)).toBeInTheDocument();
  });
});
