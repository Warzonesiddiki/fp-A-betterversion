/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { VisuallyHidden } from './VisuallyHidden';

describe('VisuallyHidden', () => {
  it('renders children', () => {
    render(<VisuallyHidden>Hidden Text</VisuallyHidden>);
    expect(screen.getByText('Hidden Text')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <VisuallyHidden>
        <span>Item 1</span>
        <span>Item 2</span>
      </VisuallyHidden>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});
