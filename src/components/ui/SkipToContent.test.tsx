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

  it('stays natively tabbable without a tabIndex override (WCAG 2.4.1)', () => {
    // W-A11Y-001 m-minor: an <a href> is focusable via Tab by default; the
    // component must not remove itself from the keyboard order (tabIndex=-1)
    // and gains nothing from a redundant tabIndex={0}.
    render(<SkipToContent />);
    const link = screen.getByText('Skip to main content');
    expect(link).not.toHaveAttribute('tabindex');
  });

  it('uses the visible-on-focus pattern so pointer users never see it', () => {
    render(<SkipToContent />);
    const link = screen.getByText('Skip to main content');
    expect(link.className).toContain('sr-only');
    expect(link.className).toContain('focus:not-sr-only');
  });
});
