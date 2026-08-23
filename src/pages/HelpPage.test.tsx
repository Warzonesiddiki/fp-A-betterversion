import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});
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
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
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

// The suites below are absorbed from the retired __tests__/HelpPage.test.tsx
// mirror (search filter, topic navigation, FAQ expansion, axe audit) — they
// were that file's only coverage beyond what this colocated spec already had.
describe('HelpPage integration', () => {
  const navigateMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/help']}>
        <HelpPage />
      </MemoryRouter>
    );
  }

  it('filters topics when searching', async () => {
    renderPage();

    const searchInput = await screen.findByPlaceholderText('Search help topics...');
    expect(await screen.findByText('Importing Data')).toBeInTheDocument();
    expect(await screen.findByText('Roles & Permissions')).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'import' } });

    expect(await screen.findByText('Importing Data')).toBeInTheDocument();
    expect(screen.queryByText('Roles & Permissions')).not.toBeInTheDocument();
  });

  it('navigates to path when a topic is clicked', async () => {
    renderPage();

    // The onClick handler is on the Card which wraps the CardContent, so we
    // click the topic heading and let the event bubble up.
    fireEvent.click(await screen.findByText('Importing Data'));

    expect(navigateMock).toHaveBeenCalledWith('/data/gl-upload');
  });

  it('expands FAQ when clicked', async () => {
    renderPage();

    fireEvent.click(await screen.findByText('How do I import data from Excel?'));

    expect(await screen.findByText(/Go to Data > GL Upload/)).toBeInTheDocument();
  });
});

describe('HelpPage accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/help']}>
        <HelpPage />
      </MemoryRouter>
    );
    await screen.findByText('Help Center');
    await screen.findByText('Frequently Asked Questions');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
