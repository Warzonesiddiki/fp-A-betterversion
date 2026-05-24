import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { PageErrorBoundary } from './PageErrorBoundary';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useRouteError: () => new Error('Page not found'),
  };
});

describe('PageErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <PageErrorBoundary>
        <div>Page Content</div>
      </PageErrorBoundary>
    );
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });
});
