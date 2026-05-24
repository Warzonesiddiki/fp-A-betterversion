import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { AsyncErrorBoundary } from './AsyncErrorBoundary';

describe('AsyncErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <AsyncErrorBoundary>
        <div>Safe Content</div>
      </AsyncErrorBoundary>
    );
    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });
});
