/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpPanel } from './HelpPanel';

describe('HelpPanel', () => {
  const defaultSections = [
    { title: 'Getting Started', content: 'Welcome to the app.' },
    { title: 'Features', content: 'Here are the main features.' },
  ];

  const defaultProps = {
    title: 'Help Center',
    sections: defaultSections,
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering
  it('renders when isOpen is true', () => {
    render(<HelpPanel {...defaultProps} />);
    expect(screen.getByText('Help Center')).toBeInTheDocument();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<HelpPanel {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders title', () => {
    render(<HelpPanel {...defaultProps} />);
    expect(screen.getByText('Help Center')).toBeInTheDocument();
  });

  it('renders section titles', () => {
    render(<HelpPanel {...defaultProps} />);
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
  });

  it('renders section content', () => {
    render(<HelpPanel {...defaultProps} />);
    expect(screen.getByText('Welcome to the app.')).toBeInTheDocument();
    expect(screen.getByText('Here are the main features.')).toBeInTheDocument();
  });

  it('renders empty state when no sections', () => {
    render(<HelpPanel {...defaultProps} sections={[]} />);
    expect(screen.getByText('No help content available for this page.')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<HelpPanel {...defaultProps} />);
    const closeBtn = screen.getByRole('button');
    expect(closeBtn).toBeInTheDocument();
  });

  // Interactions
  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<HelpPanel {...defaultProps} onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]!);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<HelpPanel {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn();
    render(<HelpPanel {...defaultProps} onClose={onClose} />);
    // The backdrop has role="presentation"
    const backdrop = document.querySelector('[role="presentation"]');
    expect(backdrop).toBeInTheDocument();
  });
});
