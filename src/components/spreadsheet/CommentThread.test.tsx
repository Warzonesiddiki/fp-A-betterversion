import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CommentThread } from './CommentThread';

describe('CommentThread', () => {
  it('renders without crashing', () => {
    const baseComment = {
      id: 'c1',
      author: 'Alice',
      content: 'Hello',
      timestamp: new Date().toISOString(),
      resolved: false,
      mentions: [],
    };
    const { container } = render(
      <CommentThread
        comment={baseComment}
        replies={[]}
        currentUser="Alice"
        depth={0}
        onReply={() => {}}
        onResolve={() => {}}
        onUnresolve={() => {}}
        onDelete={() => {}}
      />
    );
    expect(container).toBeDefined();
  });
});
