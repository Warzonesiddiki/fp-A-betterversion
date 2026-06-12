/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

vi.mock('lucide-react', () => {
  const makeIcon = (name: string) => {
    const Icon = (props: any) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    Scale: makeIcon('Scale'),
    TrendingUp: makeIcon('TrendingUp'),
    Download: makeIcon('Download'),
    Filter: makeIcon('Filter'),
  };
});

const { render } = await import('@/test/testUtils');
const { default: FairValuePage } = await import('@/pages/audit/FairValuePage');

describe('FairValuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<FairValuePage />);
    expect(screen.getByRole('heading', { name: /Fair Value Measurement/i })).toBeTruthy();
  });
});
