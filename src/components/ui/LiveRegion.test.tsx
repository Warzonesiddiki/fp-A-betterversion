/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { LiveRegion } from './LiveRegion';

describe('LiveRegion', () => {
  it('renders with polite aria-live by default', () => {
    render(<LiveRegion message="Loading data" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('renders with assertive aria-live when politeness is assertive', () => {
    render(<LiveRegion message="Error occurred" politeness="assertive" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });

  it('sets text content via message prop', () => {
    render(<LiveRegion message="Processing complete" />);
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Processing complete');
  });

  it('updates text content when message changes', () => {
    const { rerender } = render(<LiveRegion message="Loading" />);
    rerender(<LiveRegion message="Done" />);
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Done');
  });
});
