import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CellComments } from './CellComments';
import type { CellComment } from '@/engines/CellCommentEngine';

describe('CellComments (deep tests)', () => {
  const mockComments: CellComment[] = [
    {
      id: 'c-root-1',
      cellKey: 'C10',
      author: 'Alice',
      text: 'Review this tax rate assumption',
      createdAt: new Date().toISOString(),
      resolved: false,
      mentions: ['Dave'],
      parentId: null,
    },
    {
      id: 'c-reply-1',
      cellKey: 'C10',
      author: 'Dave',
      text: 'Verified at 21%',
      createdAt: new Date().toISOString(),
      resolved: false,
      mentions: [],
      parentId: 'c-root-1',
    },
    {
      id: 'c-root-2',
      cellKey: 'C10',
      author: 'Carol',
      text: 'Second independent thread',
      createdAt: new Date().toISOString(),
      resolved: true,
      mentions: [],
      parentId: null,
    },
  ];

  it('renders default empty state when no comments exist', () => {
    render(
      <CellComments
        cellKey="A1"
        comments={[]}
        currentUser="Alice"
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onUnresolve={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('No comments yet. Be the first to comment.')).toBeInTheDocument();
    expect(screen.getByLabelText('Comments for cell A1')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // badge count
  });

  it('renders threads and nested replies with correct count badge', () => {
    render(
      <CellComments
        cellKey="C10"
        comments={mockComments}
        currentUser="Alice"
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onUnresolve={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Review this tax rate assumption')).toBeInTheDocument();
    expect(screen.getByText('Verified at 21%')).toBeInTheDocument();
    expect(screen.getByText('Second independent thread')).toBeInTheDocument();
  });

  it('adds a new top-level comment via Send button', async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn();

    render(
      <CellComments
        cellKey="C10"
        comments={mockComments}
        currentUser="Alice"
        onAddComment={onAddComment}
        onResolve={vi.fn()}
        onUnresolve={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: 'New comment text' });
    const sendBtn = screen.getByRole('button', { name: 'Add comment' });

    expect(sendBtn).toBeDisabled();

    act(() => {
      fireEvent.change(input, { target: { value: 'New thread comment' } });
    });

    expect(sendBtn).not.toBeDisabled();
    await user.click(sendBtn);

    expect(onAddComment).toHaveBeenCalledWith('C10', 'New thread comment', null);
    expect(input).toHaveValue('');
  });

  it('adds a new top-level comment via Enter key', () => {
    const onAddComment = vi.fn();

    render(
      <CellComments
        cellKey="C10"
        comments={[]}
        currentUser="Alice"
        onAddComment={onAddComment}
        onResolve={vi.fn()}
        onUnresolve={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: 'New comment text' });

    // Empty text -> no submission
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAddComment).not.toHaveBeenCalled();

    // Whitespace -> no submission
    act(() => {
      fireEvent.change(input, { target: { value: '   ' } });
    });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAddComment).not.toHaveBeenCalled();

    // Valid text with Enter
    act(() => {
      fireEvent.change(input, { target: { value: '  Checking assumptions  ' } });
    });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    expect(onAddComment).toHaveBeenCalledWith('C10', 'Checking assumptions', null);
    expect(input).toHaveValue('');
  });

  it('handles replying to an existing thread via onAddComment with parentId', async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn();

    render(
      <CellComments
        cellKey="C10"
        comments={mockComments}
        currentUser="Dave"
        onAddComment={onAddComment}
        onResolve={vi.fn()}
        onUnresolve={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // Find the reply button on the first thread (Alice's thread)
    const replyButtons = screen.getAllByRole('button', { name: /reply/i });
    await user.click(replyButtons[0]!);

    const replyInput = screen.getByRole('textbox', { name: 'Reply text' });
    act(() => {
      fireEvent.change(replyInput, { target: { value: 'Added another clarification' } });
    });

    const sendReplyBtn = screen.getByRole('button', { name: 'Send reply' });
    await user.click(sendReplyBtn);

    expect(onAddComment).toHaveBeenCalledWith('C10', 'Added another clarification', 'c-root-1');
  });

  it('handles close button click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <CellComments
        cellKey="C10"
        comments={mockComments}
        currentUser="Alice"
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onUnresolve={vi.fn()}
        onDelete={vi.fn()}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: 'Close comments' });
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles resolve, unresolve, and delete callbacks correctly', async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    const onUnresolve = vi.fn();
    const onDelete = vi.fn();

    render(
      <CellComments
        cellKey="C10"
        comments={mockComments}
        currentUser="Alice"
        onAddComment={vi.fn()}
        onResolve={onResolve}
        onUnresolve={onUnresolve}
        onDelete={onDelete}
        onClose={vi.fn()}
      />
    );

    // Resolve Alice's comment
    const resolveBtns = screen.getAllByRole('button', { name: 'Resolve comment' });
    await user.click(resolveBtns[0]!);
    expect(onResolve).toHaveBeenCalledWith('c-root-1');

    // Unresolve Carol's resolved comment
    const unresolveBtn = screen.getByRole('button', { name: 'Unresolve comment' });
    await user.click(unresolveBtn);
    expect(onUnresolve).toHaveBeenCalledWith('c-root-2');

    // Delete Alice's comment (Alice is currentUser)
    const deleteBtn = screen.getByRole('button', { name: 'Delete comment' });
    await user.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('c-root-1');
  });
});
