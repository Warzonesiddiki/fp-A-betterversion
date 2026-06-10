export interface CellComment {
  id: string;
  cellKey: string;
  author: string;
  text: string;
  createdAt: string;
  resolved: boolean;
  parentId: string | null;
  mentions: string[];
}

export interface CommentExport {
  cellKey: string;
  comments: CellComment[];
}

export class CellCommentEngine {
  private comments = new Map<string, CellComment[]>();
  private idCounter = 0;

  addComment(
    cellKey: string,
    author: string,
    text: string,
    parentId: string | null = null
  ): CellComment {
    const mentions = this.extractMentions(text);
    const comment: CellComment = {
      id: `cmt-${++this.idCounter}`,
      cellKey,
      author,
      text,
      createdAt: new Date().toISOString(),
      resolved: false,
      parentId,
      mentions,
    };

    const list = this.comments.get(cellKey) ?? [];
    list.push(comment);
    this.comments.set(cellKey, list);
    return comment;
  }

  replyTo(commentId: string, author: string, text: string): CellComment | null {
    for (const [, list] of this.comments) {
      const parent = list.find((c) => c.id === commentId);
      if (parent) {
        return this.addComment(parent.cellKey, author, text, commentId);
      }
    }
    return null;
  }

  resolveComment(commentId: string): boolean {
    for (const [, list] of this.comments) {
      const comment = list.find((c) => c.id === commentId);
      if (comment) {
        comment.resolved = true;
        return true;
      }
    }
    return false;
  }

  unresolveComment(commentId: string): boolean {
    for (const [, list] of this.comments) {
      const comment = list.find((c) => c.id === commentId);
      if (comment) {
        comment.resolved = false;
        return true;
      }
    }
    return false;
  }

  deleteComment(commentId: string): boolean {
    for (const [cellKey, list] of this.comments) {
      const idx = list.findIndex((c) => c.id === commentId);
      if (idx !== -1) {
        list.splice(idx, 1);
        if (list.length === 0) this.comments.delete(cellKey);
        return true;
      }
    }
    return false;
  }

  getComments(cellKey: string): CellComment[] {
    return this.comments.get(cellKey) ?? [];
  }

  getThreads(cellKey: string): CellComment[] {
    const all = this.getComments(cellKey);
    return all.filter((c) => c.parentId === null);
  }

  getReplies(parentId: string): CellComment[] {
    for (const [, list] of this.comments) {
      if (list.some((c) => c.id === parentId)) {
        return list.filter((c) => c.parentId === parentId);
      }
    }
    return [];
  }

  getCommentCount(cellKey: string): number {
    return this.getComments(cellKey).length;
  }

  hasComments(cellKey: string): boolean {
    return this.getCommentCount(cellKey) > 0;
  }

  getUnresolvedCount(): number {
    let count = 0;
    for (const [, list] of this.comments) {
      count += list.filter((c) => !c.resolved).length;
    }
    return count;
  }

  getMentionedUsers(cellKey: string): string[] {
    const mentions = new Set<string>();
    for (const c of this.getComments(cellKey)) {
      c.mentions.forEach((m) => mentions.add(m));
    }
    return [...mentions];
  }

  exportAll(): CommentExport[] {
    const result: CommentExport[] = [];
    for (const [cellKey, comments] of this.comments) {
      result.push({ cellKey, comments: [...comments] });
    }
    return result;
  }

  importData(data: CommentExport[]): void {
    this.comments.clear();
    for (const { cellKey, comments } of data) {
      this.comments.set(cellKey, [...comments]);
    }
  }

  clear(cellKey?: string): void {
    if (cellKey) {
      this.comments.delete(cellKey);
    } else {
      this.comments.clear();
    }
  }

  private extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match = mentionRegex.exec(text);
    while (match) {
      mentions.push(match[1]!);
      match = mentionRegex.exec(text);
    }
    return mentions;
  }
}
