import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentThread, type CommentThreadProps } from './CommentThread';
import type { CellComment } from '@/engines/CellCommentEngine';

describe('CommentThread (deep tests)', () => {
  const baseComment: CellComment = {
    id: 'c-1',
    cellKey: 'B2',
    author: 'Alice',
    text: 'Please check Q3 variance figures.',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    resolved: false,
    mentions: ['Bob', 'Carol'],
    parentId: null,
  };

  const defaultProps: CommentThreadProps = {
    comment: baseComment,
    replies: [],
    currentUser: 'Alice',
    depth: 0,
    onReply: vi.fn(),
    onResolve: vi.fn(),
    onUnresolve: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders author, text, relative time, and mentions', () => {
    render(<CommentThread {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Please check Q3 variance figures.')).toBeInTheDocument();
    expect(screen.getByText('@Bob @Carol')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Comment by Alice' })).toBeInTheDocument();
  });

  it('renders without mentions when mentions array is empty', () => {
    render(<CommentThread {...defaultProps} comment={{ ...baseComment, mentions: [] }} />);
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });

  it('renders resolved state and unresolve button', async () => {
    const user = userEvent.setup();
    const onUnresolve = vi.fn();
    const resolvedComment: CellComment = { ...baseComment, resolved: true };

    render(<CommentThread {...defaultProps} comment={resolvedComment} onUnresolve={onUnresolve} />);

    const unresolveBtn = screen.getByRole('button', { name: 'Unresolve comment' });
    expect(unresolveBtn).toBeInTheDocument();
    await user.click(unresolveBtn);
    expect(onUnresolve).toHaveBeenCalledWith('c-1');
  });

  it('renders resolve button for unresolved comments and resolves on click', async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();

    render(<CommentThread {...defaultProps} onResolve={onResolve} />);

    const resolveBtn = screen.getByRole('button', { name: 'Resolve comment' });
    expect(resolveBtn).toBeInTheDocument();
    await user.click(resolveBtn);
    expect(onResolve).toHaveBeenCalledWith('c-1');
  });

  it('renders delete button only for own comments and handles click', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    // Alice is current user and author -> delete button visible
    const { unmount } = render(
      <CommentThread {...defaultProps} currentUser="Alice" onDelete={onDelete} />
    );

    const deleteBtn = screen.getByRole('button', { name: 'Delete comment' });
    expect(deleteBtn).toBeInTheDocument();
    await user.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('c-1');

    unmount();

    // Bob is current user, Alice is author -> delete button NOT rendered
    render(<CommentThread {...defaultProps} currentUser="Bob" onDelete={onDelete} />);
    expect(screen.queryByRole('button', { name: 'Delete comment' })).not.toBeInTheDocument();
  });

  it('toggles reply box and handles reply submission via Send button', async () => {
    const user = userEvent.setup();
    const onReply = vi.fn();

    render(<CommentThread {...defaultProps} onReply={onReply} />);

    const replyToggle = screen.getByRole('button', { name: /reply/i });
    await user.click(replyToggle);

    const replyInput = screen.getByRole('textbox', { name: 'Reply text' });
    expect(replyInput).toBeInTheDocument();

    const sendBtn = screen.getByRole('button', { name: 'Send reply' });
    expect(sendBtn).toBeDisabled();

    act(() => {
      fireEvent.change(replyInput, { target: { value: 'Got it, adjusting now.' } });
    });

    expect(sendBtn).not.toBeDisabled();
    await user.click(sendBtn);

    expect(onReply).toHaveBeenCalledWith('c-1', 'Got it, adjusting now.');
    expect(screen.queryByRole('textbox', { name: 'Reply text' })).not.toBeInTheDocument();
  });

  it('submits reply on Enter key and ignores empty submissions', async () => {
    const onReply = vi.fn();

    render(<CommentThread {...defaultProps} onReply={onReply} />);

    fireEvent.click(screen.getByRole('button', { name: /reply/i }));
    const replyInput = screen.getByRole('textbox', { name: 'Reply text' });

    // Press enter on empty text -> nothing submitted
    fireEvent.keyDown(replyInput, { key: 'Enter', code: 'Enter' });
    expect(onReply).not.toHaveBeenCalled();

    // Press enter on whitespace -> nothing submitted
    act(() => {
      fireEvent.change(replyInput, { target: { value: '   ' } });
    });
    fireEvent.keyDown(replyInput, { key: 'Enter', code: 'Enter' });
    expect(onReply).not.toHaveBeenCalled();

    // Shift+Enter does not submit
    act(() => {
      fireEvent.change(replyInput, { target: { value: 'Line 1' } });
    });
    fireEvent.keyDown(replyInput, { key: 'Enter', shiftKey: true });
    expect(onReply).not.toHaveBeenCalled();

    // Plain Enter submits trimmed value
    act(() => {
      fireEvent.change(replyInput, { target: { value: '  All updated!  ' } });
    });
    fireEvent.keyDown(replyInput, { key: 'Enter', shiftKey: false });
    expect(onReply).toHaveBeenCalledWith('c-1', 'All updated!');
  });

  it('does not show reply button when depth >= 3 or when comment is resolved', () => {
    // depth >= 3
    const { unmount } = render(<CommentThread {...defaultProps} depth={3} />);
    expect(screen.queryByRole('button', { name: /reply/i })).not.toBeInTheDocument();
    unmount();

    // resolved
    render(<CommentThread {...defaultProps} comment={{ ...baseComment, resolved: true }} />);
    expect(screen.queryByRole('button', { name: /reply/i })).not.toBeInTheDocument();
  });

  it('renders nested replies recursively', () => {
    const reply1: CellComment = {
      id: 'c-2',
      cellKey: 'B2',
      author: 'Bob',
      text: 'First reply',
      createdAt: new Date().toISOString(),
      resolved: false,
      mentions: [],
      parentId: 'c-1',
    };

    const reply2: CellComment = {
      id: 'c-3',
      cellKey: 'B2',
      author: 'Carol',
      text: 'Second sibling reply',
      createdAt: new Date().toISOString(),
      resolved: false,
      mentions: [],
      parentId: 'c-1',
    };

    render(<CommentThread {...defaultProps} replies={[reply1, reply2]} />);

    expect(screen.getByText('First reply')).toBeInTheDocument();
    expect(screen.getByText('Second sibling reply')).toBeInTheDocument();
  });
});
