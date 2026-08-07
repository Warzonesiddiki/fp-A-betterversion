import { describe, it, expect } from 'vitest';
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
