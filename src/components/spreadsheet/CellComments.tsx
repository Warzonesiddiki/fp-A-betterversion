import { useState, useCallback, useMemo } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CellComment } from '@/engines/CellCommentEngine';
import { CommentThread } from './CommentThread';

interface CellCommentsProps {
  cellKey: string;
  comments: readonly CellComment[];
  currentUser: string;
  onAddComment: (cellKey: string, text: string, parentId: string | null) => void;
  onResolve: (commentId: string) => void;
  onUnresolve: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onClose: () => void;
  className?: string;
}

export function CellComments({
  cellKey = '',
  comments = [],
  currentUser = '',
  onAddComment = () => {},
  onResolve = () => {},
  onUnresolve = () => {},
  onDelete = () => {},
  onClose = () => {},
  className,
}: CellCommentsProps) {
  const [newComment, setNewComment] = useState('');

  const threads = useMemo(() => comments.filter((c) => c.parentId === null), [comments]);

  const getReplies = useCallback(
    (parentId: string) => comments.filter((c) => c.parentId === parentId),
    [comments]
  );

  const handleAddComment = useCallback(() => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    onAddComment(cellKey, trimmed, null);
    setNewComment('');
  }, [newComment, cellKey, onAddComment]);

  const handleReply = useCallback(
    (parentId: string, text: string) => {
      onAddComment(cellKey, text, parentId);
    },
    [cellKey, onAddComment]
  );

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-lg',
        'w-[360px] max-h-[480px]',
        className
      )}
      role="complementary"
      aria-label={`Comments for cell ${cellKey}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[var(--accent-primary)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">Comments</span>
          <span className="rounded-full bg-[var(--accent-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent-primary)]">
            {comments.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          aria-label="Close comments"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-3">
        {threads.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
            No comments yet. Be the first to comment.
          </p>
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => (
              <CommentThread
                key={thread.id}
                comment={thread}
                replies={getReplies(thread.id)}
                currentUser={currentUser}
                depth={0}
                onReply={handleReply}
                onResolve={onResolve}
                onUnresolve={onUnresolve}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* New comment input */}
      <div className="border-t border-[var(--border-subtle)] p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            placeholder="Add a comment... (use @name to mention)"
            className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            aria-label="New comment text"
          />
          <button
            type="button"
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="rounded-lg bg-[var(--accent-primary)] px-3 py-2 text-white transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            aria-label="Add comment"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
