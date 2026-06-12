/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { SkipToContent } from './SkipToContent';

describe('SkipToContent', () => {
  it('renders skip link with correct href', () => {
    render(<SkipToContent />);
    const link = screen.getByText('Skip to main content');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
  });
});
