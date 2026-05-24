/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TourOverlay } from './TourOverlay';

// Mock the tour store
const mockNextStep = vi.fn();
const mockPrevStep = vi.fn();
const mockStopTour = vi.fn();

let tourState = {
  isActive: true,
  currentStepIndex: 0,
  steps: [
    {
      target: '#step-1',
      title: 'Step One',
      content: 'This is step one',
      placement: 'bottom' as const,
    },
    {
      target: '#step-2',
      title: 'Step Two',
      content: 'This is step two',
      placement: 'top' as const,
    },
    { target: '#step-3', title: 'Step Three', content: 'This is step three' },
  ],
};

vi.mock('@/store/tourStore', () => ({
  useTourStore: vi.fn(() => ({
    ...tourState,
    nextStep: mockNextStep,
    prevStep: mockPrevStep,
    stopTour: mockStopTour,
  })),
}));

// Mock Button - the component imports './ui/Button' which resolves wrong from ui/ dir
vi.mock('./ui/Button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    size,
  }: React.PropsWithChildren<{ onClick?: () => void; variant?: string; size?: string }>) => (
    <button onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { ...domProps } = props as Record<string, unknown>;
      return <div {...domProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('TourOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tourState = {
      isActive: true,
      currentStepIndex: 0,
      steps: [
        {
          target: '#step-1',
          title: 'Step One',
          content: 'This is step one',
          placement: 'bottom' as const,
        },
        {
          target: '#step-2',
          title: 'Step Two',
          content: 'This is step two',
          placement: 'top' as const,
        },
        { target: '#step-3', title: 'Step Three', content: 'This is step three' },
      ],
    };
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      left: 50,
      width: 200,
      height: 50,
      right: 250,
      bottom: 150,
      x: 50,
      y: 100,
      toJSON: () => {},
    }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // ─── Rendering ────────────────────────────────────────────────────

  it('renders when tour is active', () => {
    render(<TourOverlay />);
    expect(screen.getByText('Step One')).toBeInTheDocument();
  });

  it('renders nothing when tour is not active', () => {
    tourState = { ...tourState, isActive: false };
    const { container } = render(<TourOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the current step title', () => {
    render(<TourOverlay />);
    expect(screen.getByText('Step One')).toBeInTheDocument();
  });

  it('renders the current step content', () => {
    render(<TourOverlay />);
    expect(screen.getByText('This is step one')).toBeInTheDocument();
  });

  it('renders step indicator dots', () => {
    render(<TourOverlay />);
    // 3 steps = 3 dots
    const dots = document.querySelectorAll('.h-1.w-4');
    expect(dots).toHaveLength(3);
  });

  // ─── Navigation ───────────────────────────────────────────────────

  it('shows Next button', () => {
    render(<TourOverlay />);
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('does not show Back button on first step', () => {
    render(<TourOverlay />);
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });

  it('shows Back button on non-first steps', () => {
    tourState = { ...tourState, currentStepIndex: 1 };
    render(<TourOverlay />);
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('calls nextStep when Next is clicked', () => {
    render(<TourOverlay />);
    fireEvent.click(screen.getByText('Next'));
    expect(mockNextStep).toHaveBeenCalled();
  });

  it('calls prevStep when Back is clicked', () => {
    tourState = { ...tourState, currentStepIndex: 1 };
    render(<TourOverlay />);
    fireEvent.click(screen.getByText('Back'));
    expect(mockPrevStep).toHaveBeenCalled();
  });

  it('shows Finish text on last step', () => {
    tourState = { ...tourState, currentStepIndex: 2 };
    render(<TourOverlay />);
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });

  it('calls nextStep (which ends tour) when Finish is clicked', () => {
    tourState = { ...tourState, currentStepIndex: 2 };
    render(<TourOverlay />);
    fireEvent.click(screen.getByText('Finish'));
    expect(mockNextStep).toHaveBeenCalled();
  });

  // ─── Close ────────────────────────────────────────────────────────

  it('calls stopTour when X button is clicked', () => {
    render(<TourOverlay />);
    const closeBtn = screen.getByRole('button', { name: '' }); // X button has no text
    fireEvent.click(closeBtn);
    expect(mockStopTour).toHaveBeenCalled();
  });

  // ─── Step Content Updates ─────────────────────────────────────────

  it('updates content when step changes', () => {
    tourState = { ...tourState, currentStepIndex: 1 };
    render(<TourOverlay />);
    expect(screen.getByText('Step Two')).toBeInTheDocument();
    expect(screen.getByText('This is step two')).toBeInTheDocument();
  });

  // ─── Accessibility ────────────────────────────────────────────────

  it('renders overlay with high z-index for proper stacking', () => {
    render(<TourOverlay />);
    const overlay = document.querySelector('.fixed.inset-0');
    expect(overlay?.className).toContain('z-[9999]');
  });

  it('highlights the active step indicator', () => {
    render(<TourOverlay />);
    const dots = document.querySelectorAll('.h-1.w-4');
    expect(dots[0]?.className).toContain('bg-blue-500');
    expect(dots[1]?.className).toContain('bg-slate-800');
  });
});
