import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SplitPane } from './SplitPane';

describe('SplitPane', () => {
  it('renders left and right children', () => {
    render(<SplitPane left={<div>Left Panel</div>} right={<div>Right Panel</div>} />);
    expect(screen.getByText('Left Panel')).toBeInTheDocument();
    expect(screen.getByText('Right Panel')).toBeInTheDocument();
  });

  it('renders slider with role and aria attributes', () => {
    render(<SplitPane left={<div>Left</div>} right={<div>Right</div>} />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-orientation', 'vertical');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  it('uses defaultSplit ratio', () => {
    render(<SplitPane left={<div>Left</div>} right={<div>Right</div>} defaultSplit={30} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '30');
  });
});
