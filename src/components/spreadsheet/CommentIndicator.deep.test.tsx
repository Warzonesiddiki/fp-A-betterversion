import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentIndicator } from './CommentIndicator';

describe('CommentIndicator (deep tests)', () => {
  it('renders nothing when count is 0', () => {
    const { container } = render(<CommentIndicator count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly for singular comment count and handles click stopPropagation', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const parentClick = vi.fn();

    render(
      <div role="presentation" onClick={parentClick}>
        <CommentIndicator count={1} onClick={onClick} />
      </div>
    );

    const button = screen.getByRole('button', { name: '1 comment on this cell' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', '1 comment');
    expect(screen.getByText('1')).toBeInTheDocument();

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('renders plural comment text and unresolved marker in title', () => {
    render(<CommentIndicator count={4} hasUnresolved={true} />);

    const button = screen.getByRole('button', { name: '4 comments on this cell' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', '4 comments (unresolved)');
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders 9+ when comment count exceeds 9', () => {
    render(<CommentIndicator count={15} />);
    expect(screen.getByText('9+')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '15 comments on this cell' })).toHaveAttribute(
      'title',
      '15 comments'
    );
  });

  it('handles optional onClick gracefully when omitted', () => {
    render(<CommentIndicator count={2} />);
    const button = screen.getByRole('button', { name: '2 comments on this cell' });
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it('applies custom className', () => {
    render(<CommentIndicator count={3} className="custom-indicator-class" />);
    const button = screen.getByRole('button', { name: '3 comments on this cell' });
    expect(button).toHaveClass('custom-indicator-class');
  });
});
