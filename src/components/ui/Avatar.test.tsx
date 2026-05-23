import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders initials when no src provided', () => {
    render(<Avatar fallback="TB" />);
    expect(screen.getByText('TB')).toBeInTheDocument();
  });

  it('renders uppercased initials', () => {
    render(<Avatar fallback="ab" />);
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('renders img when src is provided', () => {
    render(<Avatar src="https://example.com/photo.jpg" alt="User" fallback="U" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    expect(img).toHaveAttribute('alt', 'User');
  });

  it('does not render initials when img is shown', () => {
    render(<Avatar src="https://example.com/photo.jpg" fallback="TB" />);
    expect(screen.queryByText('TB')).not.toBeInTheDocument();
  });

  it('falls back to initials on img error', async () => {
    render(<Avatar src="https://example.com/broken.jpg" fallback="TB" />);
    const img = screen.getByRole('img');
    img.dispatchEvent(new Event('error'));
    await waitFor(() => {
      expect(screen.getByText('TB')).toBeInTheDocument();
    });
  });

  it('applies size classes', () => {
    const { rerender } = render(<Avatar fallback="TB" size="sm" />);
    const container = screen.getByText('TB').parentElement!;
    expect(container.className).toContain('w-6');

    rerender(<Avatar fallback="TB" size="lg" />);
    expect(container.className).toContain('w-12');
  });

  it('applies custom className', () => {
    render(<Avatar fallback="X" className="my-custom-class" />);
    const container = screen.getByText('X').parentElement!;
    expect(container.className).toContain('my-custom-class');
  });

  it('renders with default md size', () => {
    render(<Avatar fallback="TB" />);
    const container = screen.getByText('TB').parentElement!;
    expect(container.className).toContain('w-8');
  });
});
