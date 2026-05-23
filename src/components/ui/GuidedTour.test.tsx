import { describe, it, expect, vi } from 'vitest';
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
