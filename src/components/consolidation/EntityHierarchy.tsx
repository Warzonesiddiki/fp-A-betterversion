import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Globe,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import type {
  ConsolidationMethod,
  EntityHierarchyNode,
  EntityData,
  OwnershipStructure,
} from '@/engines/ConsolidationEngine';

export interface EntityHierarchyProps {
  entities: EntityData[];
  ownerships: OwnershipStructure[];
  rootEntityId: string;
  onAddEntity?: (_parentId: string) => void;
  onEditEntity?: (_entityId: string) => void;
  onDeleteEntity?: (_entityId: string) => void;
  onUpdateOwnership?: (_parentId: string, _childId: string, _pct: number) => void;
  onUpdateMethod?: (_parentId: string, _childId: string, _method: ConsolidationMethod) => void;
  readOnly?: boolean;
  className?: string;
}

const METHOD_STYLES: Record<ConsolidationMethod, string> = {
  full: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  equity: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  cost: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

function NodeRow({
  node,
  depth,
  ownerships,
  readOnly,
  onAdd,
  onEdit,
  onDelete,
  onPctUpdate,
  onMethodUpdate,
}: {
  node: EntityHierarchyNode;
  depth: number;
  ownerships: OwnershipStructure[];
  readOnly: boolean;
  onAdd?: (_id: string) => void;
  onEdit?: (_id: string) => void;
  onDelete?: (_id: string) => void;
  onPctUpdate?: (_p: string, _c: string, _v: number) => void;
  onMethodUpdate?: (_p: string, _c: string, _m: ConsolidationMethod) => void;
}) {
  const [open, setOpen] = useState(depth < 3);
  const [editing, setEditing] = useState(false);
  const [pct, setPct] = useState(node.ownershipPct.toString());
  const isRoot = depth === 0;
  const hasKids = node.children.length > 0;
  const nci = 100 - node.effectivePct;
  const parent = ownerships.find((o) => o.childId === node.entityId);

  const savePct = useCallback(() => {
    const v = Number(pct);
    if (!isNaN(v) && v >= 0 && v <= 100 && parent) onPctUpdate?.(parent.parentId, node.entityId, v);
    setEditing(false);
  }, [pct, parent, node.entityId, onPctUpdate]);

  return (
    <div className="select-none">
      <div
        role="treeitem"
        aria-expanded={hasKids ? open : undefined}
        aria-selected={false}
        aria-level={depth + 1}
        tabIndex={0}
        className={cn(
          'flex items-center gap-3 py-2 px-3 rounded-lg transition-colors group hover:bg-[var(--bg-muted)]',
          isRoot && 'bg-[var(--bg-muted)]/50 border border-[var(--border-subtle)]'
        )}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && hasKids) {
            e.preventDefault();
            setOpen(!open);
          }
        }}
      >
        <button
          type="button"
          className="flex items-center justify-center w-5 h-5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          onClick={() => hasKids && setOpen(!open)}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {hasKids &&
            (open ? (
              <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
            ))}
        </button>
        <div
          className={cn(
            'p-2 rounded-md',
            isRoot
              ? 'bg-blue-500/10 text-blue-500'
              : hasKids
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-orange-500/10 text-orange-500'
          )}
        >
          {isRoot ? <Globe className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)] truncate">
              {node.entityName}
            </span>
            <span className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-muted)] px-1.5 py-0.5 rounded">
              {node.entityId}
            </span>
          </div>
          {!isRoot && (
            <div className="text-[10px] text-[var(--text-secondary)] flex gap-2 mt-0.5">
              <span>Effective: {node.effectivePct.toFixed(1)}%</span>
              {nci > 0 && (
                <>
                  <span>|</span>
                  <span>NCI: {nci.toFixed(1)}%</span>
                </>
              )}
            </div>
          )}
        </div>
        {!isRoot && (
          <select
            value={node.method}
            onChange={(e) =>
              parent &&
              onMethodUpdate?.(
                parent.parentId,
                node.entityId,
                e.target.value as ConsolidationMethod
              )
            }
            disabled={readOnly}
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full border cursor-pointer',
              METHOD_STYLES[node.method],
              readOnly && 'opacity-60 cursor-not-allowed'
            )}
            aria-label="Consolidation method"
          >
            <option value="full">Full</option>
            <option value="equity">Equity</option>
            <option value="cost">Cost</option>
          </select>
        )}
        {!isRoot &&
          (editing ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                max={100}
                value={pct}
                onChange={(e) => setPct(e.target.value)}
                className="w-16 h-7 text-xs text-center"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') savePct();
                  if (e.key === 'Escape') setEditing(false);
                }}
              />
              <button
                type="button"
                onClick={savePct}
                className="p-0.5 text-emerald-500 hover:bg-emerald-500/10 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                aria-label="Save"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="p-0.5 text-red-600 hover:bg-red-500/10 rounded"
                aria-label="Cancel"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => !readOnly && setEditing(true)}
              className={cn(
                'text-xs font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20',
                !readOnly && 'hover:bg-blue-500/20 cursor-pointer'
              )}
              disabled={readOnly}
              aria-label={`Ownership: ${node.ownershipPct}%`}
            >
              {node.ownershipPct}%
            </button>
          ))}
        {!readOnly && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onAdd?.(node.entityId)}
              className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]"
              aria-label={`Add child to ${node.entityName}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onEdit?.(node.entityId)}
              className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]"
              aria-label={`Edit ${node.entityName}`}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            {!isRoot && (
              <button
                type="button"
                onClick={() => onDelete?.(node.entityId)}
                className="p-1 rounded hover:bg-red-500/10 text-red-600"
                aria-label={`Delete ${node.entityName}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
      {hasKids && open && (
        <div
          className="ml-6 mt-1 border-l border-[var(--border-subtle)] pl-4 space-y-1"
          role="group"
        >
          {node.children.map((child) => (
            <NodeRow
              key={child.entityId}
              node={child}
              depth={depth + 1}
              ownerships={ownerships}
              readOnly={readOnly}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              onPctUpdate={onPctUpdate}
              onMethodUpdate={onMethodUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function EntityHierarchy({
  entities = [],
  ownerships = [],
  rootEntityId = '',
  onAddEntity,
  onEditEntity,
  onDeleteEntity,
  onUpdateOwnership,
  onUpdateMethod,
  readOnly = false,
  className,
}: EntityHierarchyProps) {
  const rootNode = useMemo((): EntityHierarchyNode | null => {
    const lookup = new Map(entities.map((e) => [e.entityId, e]));
    const eff = new Map<string, number>();
    eff.set(rootEntityId, 100);
    const q: { id: string; pct: number }[] = [{ id: rootEntityId, pct: 100 }];
    while (q.length > 0) {
      const { id, pct } = q.shift()!;
      for (const o of ownerships.filter((x) => x.parentId === id)) {
        const ep = (pct * o.ownershipPct) / 100;
        eff.set(o.childId, (eff.get(o.childId) ?? 0) + ep);
        q.push({ id: o.childId, pct: ep });
      }
    }
    const build = (id: string, dp: number): EntityHierarchyNode => ({
      entityId: id,
      entityName: lookup.get(id)?.entityName ?? id,
      ownershipPct: dp,
      effectivePct: eff.get(id) ?? 0,
      method: ownerships.find((o) => o.childId === id)?.method ?? 'full',
      children: ownerships
        .filter((o) => o.parentId === id)
        .map((o) => build(o.childId, o.ownershipPct)),
    });
    const root = lookup.get(rootEntityId);
    if (!root) return null;
    return {
      entityId: rootEntityId,
      entityName: root.entityName,
      ownershipPct: 100,
      effectivePct: 100,
      method: 'full',
      children: ownerships
        .filter((o) => o.parentId === rootEntityId)
        .map((o) => build(o.childId, o.ownershipPct)),
    };
  }, [entities, ownerships, rootEntityId]);

  const stats = useMemo(
    () => ({
      total: entities.length,
      subs: entities.filter((e) => e.entityId !== rootEntityId).length,
      full: ownerships.filter((o) => o.method === 'full').length,
      other: ownerships.filter((o) => o.method !== 'full').length,
    }),
    [entities, ownerships, rootEntityId]
  );

  if (!rootNode)
    return (
      <Card className={className}>
        <CardContent className="p-12 text-center">
          <p className="text-[var(--text-secondary)]">No entity hierarchy found.</p>
        </CardContent>
      </Card>
    );

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Entities" value={stats.total} />
        <StatCard label="Subsidiaries" value={stats.subs} variant="info" />
        <StatCard label="Full Consolidation" value={stats.full} variant="success" />
        <StatCard label="Equity/Cost Method" value={stats.other} variant="warning" />
      </div>
      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <CardHeader className="border-b border-[var(--border-subtle)] flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Entity Hierarchy</CardTitle>
          {!readOnly && (
            <Button size="sm" variant="outline" onClick={() => onAddEntity?.(rootEntityId)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Entity
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4">
          <div role="tree" aria-label="Entity ownership hierarchy" className="max-w-4xl">
            <NodeRow
              node={rootNode}
              depth={0}
              ownerships={ownerships}
              readOnly={readOnly}
              onAdd={onAddEntity}
              onEdit={onEditEntity}
              onDelete={onDeleteEntity}
              onPctUpdate={onUpdateOwnership}
              onMethodUpdate={onUpdateMethod}
            />
          </div>
        </CardContent>
      </Card>
      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="font-medium text-[var(--text-secondary)]">Methods:</span>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={METHOD_STYLES.full}>
                Full
              </Badge>
              <span className="text-[var(--text-secondary)]">
                ASC 810 - 100% elimination, NCI recognized
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={METHOD_STYLES.equity}>
                Equity
              </Badge>
              <span className="text-[var(--text-secondary)]">
                ASC 323 - proportional share of earnings
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={METHOD_STYLES.cost}>
                Cost
              </Badge>
              <span className="text-[var(--text-secondary)]">
                ASC 320 - dividends received as income
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: number;
  variant?: 'default' | 'info' | 'success' | 'warning';
}) {
  const cls = {
    default: '',
    info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30',
    success: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30',
    warning: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
  };
  return (
    <Card className={cls[variant]}>
      <CardContent className="p-3 text-center">
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
      </CardContent>
    </Card>
  );
}
