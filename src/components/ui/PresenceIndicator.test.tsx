/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PresenceIndicator } from './PresenceIndicator';

describe('PresenceIndicator', () => {
  // Rendering
  it('renders a div element', () => {
    const { container } = render(<PresenceIndicator status="online" />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('renders with aria-label for online status', () => {
    render(<PresenceIndicator status="online" />);
    expect(screen.getByLabelText('Status: online')).toBeInTheDocument();
  });

  it('renders with aria-label for offline status', () => {
    render(<PresenceIndicator status="offline" />);
    expect(screen.getByLabelText('Status: offline')).toBeInTheDocument();
  });

  it('renders with aria-label for busy status', () => {
    render(<PresenceIndicator status="busy" />);
    expect(screen.getByLabelText('Status: busy')).toBeInTheDocument();
  });

  it('renders with aria-label for away status', () => {
    render(<PresenceIndicator status="away" />);
    expect(screen.getByLabelText('Status: away')).toBeInTheDocument();
  });

  // Title attribute
  it('has title with capitalized status', () => {
    render(<PresenceIndicator status="online" />);
    expect(screen.getByTitle('Online')).toBeInTheDocument();
  });

  it('has title for busy status', () => {
    render(<PresenceIndicator status="busy" />);
    expect(screen.getByTitle('Busy')).toBeInTheDocument();
  });

  // Styling
  it('applies green color for online', () => {
    render(<PresenceIndicator status="online" />);
    const el = screen.getByLabelText('Status: online');
    expect(el.className).toContain('bg-green-700');
  });

  it('applies gray color for offline', () => {
    render(<PresenceIndicator status="offline" />);
    const el = screen.getByLabelText('Status: offline');
    expect(el.className).toContain('bg-gray-400');
  });

  it('applies red color for busy', () => {
    render(<PresenceIndicator status="busy" />);
    const el = screen.getByLabelText('Status: busy');
    expect(el.className).toContain('bg-red-500');
  });

  it('applies amber color for away', () => {
    render(<PresenceIndicator status="away" />);
    const el = screen.getByLabelText('Status: away');
    expect(el.className).toContain('bg-amber-500');
  });

  it('applies custom className', () => {
    render(<PresenceIndicator status="online" className="extra-class" />);
    const el = screen.getByLabelText('Status: online');
    expect(el.className).toContain('extra-class');
  });

  it('has rounded-full class', () => {
    render(<PresenceIndicator status="online" />);
    const el = screen.getByLabelText('Status: online');
    expect(el.className).toContain('rounded-full');
  });
});
