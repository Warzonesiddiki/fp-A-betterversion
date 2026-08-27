import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SplitPane } from './SplitPane';

const findGlobalHFullStyles = () =>
  Array.from(document.querySelectorAll('style')).filter((el) =>
    /\.h-full[^{]*\{/.test(el.textContent ?? '')
  );

const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

afterEach(() => {
  HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
});

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

  it('injects no <style> element mutating .h-full after mount', () => {
    render(<SplitPane left={<div>Left</div>} right={<div>Right</div>} />);
    expect(findGlobalHFullStyles()).toHaveLength(0);
  });

  it('applies split width via scoped CSS variable on the left pane', () => {
    render(<SplitPane left={<div>Left</div>} right={<div>Right</div>} defaultSplit={35} />);
    const pane = screen.getByText('Left').parentElement as HTMLElement;
    expect(pane.style.getPropertyValue('--split-width')).toBe('35');
    expect(findGlobalHFullStyles()).toHaveLength(0);
  });

  it('updates pane width variable when dragged', () => {
    const rect: DOMRect = {
      width: 1000,
      height: 600,
      left: 0,
      top: 0,
      right: 1000,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => rect,
    };
    HTMLElement.prototype.getBoundingClientRect = () => rect;

    render(<SplitPane left={<div>Left</div>} right={<div>Right</div>} />);
    const pane = screen.getByText('Left').parentElement as HTMLElement;
    expect(pane.style.getPropertyValue('--split-width')).toBe('50');

    const slider = screen.getByRole('slider');
    fireEvent.mouseDown(slider);
    fireEvent.mouseMove(window, { clientX: 250 });
    fireEvent.mouseUp(window);

    expect(pane.style.getPropertyValue('--split-width')).toBe('25');
    expect(slider).toHaveAttribute('aria-valuenow', '25');
    expect(findGlobalHFullStyles()).toHaveLength(0);
  });

  it('resizes via keyboard arrows and keeps styling scoped', () => {
    render(<SplitPane left={<div>Left</div>} right={<div>Right</div>} defaultSplit={40} />);
    const slider = screen.getByRole('slider');
    const pane = screen.getByText('Left').parentElement as HTMLElement;

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider).toHaveAttribute('aria-valuenow', '45');
    expect(pane.style.getPropertyValue('--split-width')).toBe('45');

    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(slider).toHaveAttribute('aria-valuenow', '40');
    expect(pane.style.getPropertyValue('--split-width')).toBe('40');
    expect(findGlobalHFullStyles()).toHaveLength(0);
  });
});
