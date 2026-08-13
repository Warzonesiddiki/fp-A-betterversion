import { useState, useCallback } from 'react';
import { Reply, CheckCircle2, Circle, Trash2, Send } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CellComment } from '@/engines/CellCommentEngine';
// CHRONOS 2026-06-15: replaced local formatRelativeTime (BUG-CHR-D-1) with
// canonical import. CommentThread uses default 7-day cap. Previously had
// unbounded "Xd ago" — now shows calendar date after 7 days.
import { formatRelativeTimeLegacy as formatRelativeTime } from '@/engines/temporal';

export interface CommentThreadProps {
  comment: CellComment;
  replies: readonly CellComment[];
  currentUser: string;
  depth: number;
  onReply: (parentId: string, text: string) => void;
  onResolve: (commentId: string) => void;
  onUnresolve: (commentId: string) => void;
  onDelete: (commentId: string) => void;
}

export function CommentThread({
  comment,
  replies,
  currentUser,
  depth,
  onReply,
  onResolve,
  onUnresolve,
  onDelete,
}: CommentThreadProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleSubmitReply = useCallback(() => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    onReply(comment.id, trimmed);
    setReplyText('');
    setShowReplyBox(false);
  }, [replyText, comment.id, onReply]);

  const isOwn = comment.author === currentUser;
  const maxDepth = 3;

  return (
    <div
      className={cn(
        'group rounded-lg border p-3 transition-colors',
        comment.resolved
          ? 'border-[var(--border-subtle)] bg-[var(--surface-secondary)]/50 opacity-70'
          : 'border-[var(--border-default)] bg-[var(--surface-primary)]'
      )}
      role="article"
      aria-label={`Comment by ${comment.author}`}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">{comment.author}</span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {comment.mentions.length > 0 && (
            <span className="text-xs text-[var(--text-accent)]">
              {comment.mentions.map((m) => `@${m}`).join(' ')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {comment.resolved ? (
            <button
              type="button"
              onClick={() => onUnresolve(comment.id)}
              className="rounded p-1 text-[var(--text-positive)] hover:bg-[var(--surface-hover)]"
              title="Unresolve"
              aria-label="Unresolve comment"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onResolve(comment.id)}
              className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)]"
              title="Resolve"
              aria-label="Resolve comment"
            >
              <Circle className="h-4 w-4" />
            </button>
          )}
          {isOwn && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="rounded p-1 text-[var(--text-negative)] hover:bg-[var(--surface-hover)]"
              title="Delete"
              aria-label="Delete comment"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{comment.text}</p>

      {/* Reply button */}
      {depth < maxDepth && !comment.resolved && (
        <button
          type="button"
          onClick={() => setShowReplyBox(!showReplyBox)}
          className="mt-2 flex items-center gap-1 text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-accent)]"
        >
          <Reply className="h-3 w-3" />
          Reply
        </button>
      )}

      {/* Reply input */}
      {showReplyBox && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitReply();
              }
            }}
            placeholder="Write a reply..."
            className="flex-1 rounded border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            aria-label="Reply text"
          />
          <button
            type="button"
            onClick={handleSubmitReply}
            disabled={!replyText.trim()}
            className="rounded bg-[var(--accent-primary)] p-1.5 text-white transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            aria-label="Send reply"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-[var(--border-subtle)] pl-3">
          {replies.map((reply) => {
            const nestedReplies = replies.filter((r) => r.parentId === reply.id);
            return (
              <CommentThread
                key={reply.id}
                comment={reply}
                replies={nestedReplies}
                currentUser={currentUser}
                depth={depth + 1}
                onReply={onReply}
                onResolve={onResolve}
                onUnresolve={onUnresolve}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
