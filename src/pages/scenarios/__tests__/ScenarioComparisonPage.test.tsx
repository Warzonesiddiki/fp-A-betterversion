import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/scenarioStore', () => ({
  useScenarioStore: vi.fn(() => []),
  scenarioSelectors: {
    scenarios: () => [],
    comparedScenarioIds: () => [],
  },
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  Plus: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
}));

import { render, screen } from '@/test/testUtils';
import { ScenarioComparisonPage } from '../ScenarioComparisonPage';

describe('ScenarioComparisonPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no scenarios', () => {
    render(<ScenarioComparisonPage />);
    expect(screen.getByText(/no scenarios available/i)).toBeDefined();
  });

  it('renders create scenario button in empty state', () => {
    render(<ScenarioComparisonPage />);
    expect(screen.getByText(/create scenario/i)).toBeDefined();
  });

  it('renders message to create scenario first', () => {
    render(<ScenarioComparisonPage />);
    expect(screen.getByText(/create a scenario first/i)).toBeDefined();
  });
});
