import type { LineageGraph } from './DataLineageEngine';

export type DrillLevel = 'summary' | 'detail' | 'journal-entry' | 'source-document';

export interface DrillContext {
  cellValue: number | string;
  entity?: string;
  period?: string;
  account?: string;
  accountCode?: string;
  metric?: string;
  rowId?: string;
  colId?: string;
  extra?: Record<string, unknown>;
}

export interface DrillBreadcrumb {
  level: DrillLevel;
  label: string;
  context: DrillContext;
}

export interface DrillHandler {
  level: DrillLevel;
  canHandle: (context: DrillContext) => boolean;
  render: (context: DrillContext) => unknown;
}

export type DrillListener = (path: DrillBreadcrumb[]) => void;

const LEVEL_ORDER: DrillLevel[] = ['summary', 'detail', 'journal-entry', 'source-document'];

export class DrillThroughEngine {
  private handlers = new Map<DrillLevel, DrillHandler[]>();
  private currentPath: DrillBreadcrumb[] = [];
  private listeners = new Set<DrillListener>();

  registerHandler(handler: DrillHandler): () => void {
    const list = this.handlers.get(handler.level) ?? [];
    list.push(handler);
    this.handlers.set(handler.level, list);
    return () => {
      const arr = this.handlers.get(handler.level);
      if (arr) {
        const idx = arr.indexOf(handler);
        if (idx !== -1) arr.splice(idx, 1);
      }
    };
  }

  subscribe(listener: DrillListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.currentPath));
  }

  getCurrentPath(): DrillBreadcrumb[] {
    return [...this.currentPath];
  }

  getCurrentLevel(): DrillLevel | null {
    return this.currentPath.length > 0
      ? this!.currentPath[this.currentPath.length - 1]!.level
      : null;
  }

  canDrillDown(context: DrillContext): boolean {
    const currentLevel = this.getCurrentLevel();
    const nextLevel = currentLevel ? this.getNextLevel(currentLevel) : 'summary';
    if (!nextLevel) return false;
    const handlers = this.handlers.get(nextLevel) ?? [];
    return handlers.some((h) => h.canHandle(context));
  }

  drillDown(context: DrillContext): unknown | null {
    const currentLevel = this.getCurrentLevel();
    const nextLevel = currentLevel ? this.getNextLevel(currentLevel) : 'summary';
    if (!nextLevel) return null;

    const handlers = this.handlers.get(nextLevel) ?? [];
    const handler = handlers.find((h) => h.canHandle(context));
    if (!handler) return null;

    const label = this.buildLabel(nextLevel, context);
    this.currentPath.push({ level: nextLevel, label, context });
    this.notify();
    return handler.render(context);
  }

  drillToLevel(targetLevel: DrillLevel): void {
    const idx = this.currentPath.findIndex((b) => b.level === targetLevel);
    if (idx !== -1) {
      this.currentPath = this.currentPath.slice(0, idx + 1);
      this.notify();
    }
  }

  goBack(): void {
    if (this.currentPath.length > 0) {
      this.currentPath.pop();
      this.notify();
    }
  }

  reset(): void {
    this.currentPath = [];
    this.notify();
  }

  resolveFromLineage(
    nodeId: string,
    graph: LineageGraph,
    context: DrillContext
  ): DrillBreadcrumb[] {
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];
    const crumbs: DrillBreadcrumb[] = [];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id) || depth >= LEVEL_ORDER.length) continue;
      visited.add(id);

      const node = graph.nodes.find((n) => n.id === id);
      if (node) {
        crumbs.push({
          level: LEVEL_ORDER[depth]!,
          label: node.name,
          context: { ...context, extra: { ...context.extra, nodeId: id } },
        });
      }

      const parents = graph.edges.filter((e) => e.to === id).map((e) => e.from);
      for (const p of parents) {
        if (!visited.has(p)) {
          queue.push({ id: p, depth: depth + 1 });
        }
      }
    }

    return crumbs;
  }

  private getNextLevel(current: DrillLevel): DrillLevel | null {
    const idx = LEVEL_ORDER.indexOf(current);
    return idx < LEVEL_ORDER.length - 1 ? (LEVEL_ORDER[idx + 1] ?? null) : null;
  }

  private buildLabel(level: DrillLevel, ctx: DrillContext): string {
    switch (level) {
      case 'summary':
        return ctx.metric ?? ctx.account ?? 'Summary';
      case 'detail':
        return `${ctx.account ?? 'Detail'} — ${ctx.period ?? ''}`.trim();
      case 'journal-entry':
        return `Journal Entry ${ctx.rowId ?? ''}`.trim();
      case 'source-document':
        return `Source ${ctx.extra?.documentId ?? ''}`.trim();
    }
  }
}
