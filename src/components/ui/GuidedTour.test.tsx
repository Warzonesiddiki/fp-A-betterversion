import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuidedTour } from './GuidedTour';

const steps = [
  { title: 'Welcome', content: 'This is the dashboard overview.' },
  { title: 'Reports', content: 'View and export financial reports.' },
];

describe('GuidedTour', () => {
  it('does not render when isOpen is false', () => {
    render(<GuidedTour steps={steps} isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
  });

  it('renders step title and content when isOpen is true', () => {
    render(<GuidedTour steps={steps} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('This is the dashboard overview.')).toBeInTheDocument();
  });

  it('shows step counter', () => {
    render(<GuidedTour steps={steps} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
  });

  it('shows Skip tour button', () => {
    render(<GuidedTour steps={steps} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Skip tour')).toBeInTheDocument();
  });

  it('calls onClose when Skip tour is clicked', () => {
    const onClose = vi.fn();
    render(<GuidedTour steps={steps} isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Skip tour'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows Back button after advancing to next step', () => {
    render(<GuidedTour steps={steps} isOpen={true} onClose={vi.fn()} />);
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('calls onClose when finishing last step', () => {
    const onClose = vi.fn();
    render(<GuidedTour steps={steps} isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Finish'));
    expect(onClose).toHaveBeenCalled();
  });

  it('navigates back to previous step', () => {
    render(<GuidedTour steps={steps} isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });

  it('hides Back button on first step after navigating back', () => {
    render(<GuidedTour steps={steps} isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// R9-c: JS smooth-scroll compliance with prefers-reduced-motion.
// The real useReducedMotion hook reads window.matchMedia, so mocking
// matchMedia proves the component end-to-end (hook → scrollIntoView args).
// ---------------------------------------------------------------------------
const originalMatchMedia = window.matchMedia;

function mockMatchMedia(prefersReducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? prefersReducedMotion : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Default: motion allowed. Individual tests override via mockMatchMedia(true).
beforeEach(() => {
  mockMatchMedia(false);
});

describe('GuidedTour reduced-motion scrolling (R9-c)', () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  function mountTourAtTarget() {
    const target = document.createElement('div');
    target.id = 'tour-target';
    document.body.appendChild(target);
    render(
      <GuidedTour
        steps={[{ title: 'Welcome', content: 'Overview.', target: '#tour-target' }]}
        isOpen={true}
        onClose={vi.fn()}
      />
    );
  }

  it("scrolls the target into view instantly (behavior 'auto') when reduced motion is preferred", () => {
    mockMatchMedia(true);
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    mountTourAtTarget();
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
  });

  it('keeps smooth target scrolling when motion is allowed', () => {
    mockMatchMedia(false);
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    mountTourAtTarget();
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });
});
