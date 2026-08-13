import React, { useState, useCallback } from 'react';
import type { CellComment } from '@/engines/CellCommentEngine';
import { CellCommentEngine } from '@/engines/CellCommentEngine';

interface CellCommentPanelProps {
  engine: CellCommentEngine;
  cellKey: string;
  currentUser: string;
  onClose: () => void;
  className?: string;
}

interface CommentItemProps {
  comment: CellComment;
  replies: CellComment[];
  engine: CellCommentEngine;
  currentUser: string;
  onReply: (parentId: string) => void;
}

function CommentItem({ comment, replies, engine, currentUser, onReply }: CommentItemProps) {
  const handleResolve = useCallback(() => {
    if (comment.resolved) {
      engine.unresolveComment(comment.id);
    } else {
      engine.resolveComment(comment.id);
    }
  }, [comment, engine]);

  const timeAgo = getTimeAgo(comment.createdAt);

  return (
    <div
      className={`border-l-2 pl-3 py-2 ${comment.resolved ? 'border-slate-600 opacity-60' : 'border-blue-500'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--text-primary)] text-sm">{comment.author}</span>
          <span className="text-xs text-slate-500">{timeAgo}</span>
          {comment.mentions.length > 0 && (
            <span className="text-xs text-blue-400">
              {comment.mentions.map((m) => `@${m}`).join(' ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onReply(comment.id)}
            className="text-xs text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-700"
            title="Reply"
          >
            ↩
          </button>
          <button
            type="button"
            onClick={handleResolve}
            aria-label={comment.resolved ? 'Unresolve' : 'Resolve'}
            className={`text-xs px-1.5 py-0.5 rounded ${
              comment.resolved
                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-slate-700'
                : 'text-green-400 hover:text-green-300 hover:bg-slate-700'
            }`}
            title={comment.resolved ? 'Unresolve' : 'Resolve'}
          >
            {comment.resolved ? '↺' : '✓'}
          </button>
        </div>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">
        {comment.text}
      </p>
      {replies.length > 0 && (
        <div className="mt-2 ml-2 space-y-2">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]}
              engine={engine}
              currentUser={currentUser}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CellCommentPanel({
  engine,
  cellKey,
  currentUser,
  onClose,
  className = '',
}: CellCommentPanelProps) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  const threads = engine.getThreads(cellKey);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!text.trim()) return;

      if (replyTo) {
        engine.replyTo(replyTo, currentUser, text.trim());
        setReplyTo(null);
      } else {
        engine.addComment(cellKey, currentUser, text.trim());
      }
      setText('');
      forceUpdate();
    },
    [text, replyTo, cellKey, currentUser, engine, forceUpdate]
  );

  const handleReply = useCallback((parentId: string) => {
    setReplyTo(parentId);
  }, []);

  return (
    <div className={`flex flex-col h-full bg-slate-900 border-l border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h3 className="text-sm font-medium text-slate-200">
          Comments on <span className="text-blue-400 font-mono">{cellKey}</span>
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          aria-label="Close comments"
        >
          ✕
        </button>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {threads.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-4">No comments yet.</p>
        ) : (
          threads.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={engine.getReplies(comment.id)}
              engine={engine}
              currentUser={currentUser}
              onReply={handleReply}
            />
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-slate-700 p-3 space-y-2">
        {replyTo && (
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-300">
            <span>Replying to comment</span>
            <button type="button" onClick={() => setReplyTo(null)} className="hover:text-slate-200">
              Cancel
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyTo ? 'Write a reply...' : 'Add a comment... Use @name to mention'}
            className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500"
            rows={2}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="self-end px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            {replyTo ? 'Reply' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

function getTimeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
