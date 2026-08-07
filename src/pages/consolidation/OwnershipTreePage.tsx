import { useState } from 'react';
import { useEntityStore } from '@/store/entityStore';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronRight, ChevronDown, Building2, Globe } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  code: string;
  currency: string;
  country: string;
  parentId: string | null;
  ownershipPct: number;
}

function EntityNode({
  entity,
  entities,
  depth,
}: {
  entity: Entity;
  entities: Entity[];
  depth: number;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const children = entities.filter((e) => e.parentId === entity.id);
  const hasChildren = children.length > 0;

  return (
    <div className="select-none">
      <div
        role="button"
        tabIndex={0}
        className={`flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer ${depth === 0 ? 'bg-[var(--bg-muted)]/50 border border-[var(--border-subtle)]' : ''}`}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && hasChildren) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <div className="flex items-center justify-center w-5">
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
            )
          ) : null}
        </div>

        <div
          className={`p-2 rounded-md ${!entity.parentId ? 'bg-blue-500/10 text-blue-400' : hasChildren ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}
        >
          {!entity.parentId ? <Globe className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">{entity.name}</span>
            <span className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-muted)] px-1.5 py-0.5 rounded uppercase">
              {entity.code}
            </span>
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] flex gap-2">
            <span>{entity.country}</span>
            <span>•</span>
            <span>{entity.currency}</span>
          </div>
        </div>

        {entity.parentId && (
          <div className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full border border-blue-400/20">
            {entity.ownershipPct}% Ownership
          </div>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="ml-6 mt-1 border-l border-[var(--border-subtle)] pl-4 space-y-1">
          {children.map((child) => (
            <EntityNode key={child.id} entity={child} entities={entities} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OwnershipTreePage() {
  // WIRED (C-3): entity tree from the real entityStore (persisted, RBAC-gated).
  // ownershipPct is not rendered by this page; it is carried for future
  // ownership metadata (defaults to 100 = fully owned until imported).
  const storeEntities = useEntityStore((s) => s.entities);
  const entities: Entity[] = storeEntities.map((e) => ({
    id: e.id,
    name: e.name,
    code: e.code,
    currency: e.currency,
    country: e.country,
    parentId: e.parentId,
    ownershipPct: 100,
  }));
  const rootEntities = entities.filter((e) => !e.parentId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Ownership Structure</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Hierarchical visualization of your legal entity tree.
          </p>
        </div>
        <Link to="/consolidation">
          <Button variant="outline">Manage Entities</Button>
        </Link>
      </div>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <CardHeader className="border-b border-[var(--border-subtle)]">
          <CardTitle className="text-sm font-medium">Entity Hierarchy</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {entities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-secondary)] mb-4">No entities defined yet.</p>
              <Link to="/consolidation">
                <Button>Add Entities First</Button>
              </Link>
            </div>
          ) : (
            <div className="max-w-3xl space-y-4">
              {rootEntities.map((root) => (
                <EntityNode key={root.id} entity={root} entities={entities} depth={0} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-500/5 border-blue-500/10">
          <CardContent className="p-4 flex gap-4 items-center">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
              R
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">Root Entities</div>
              <div className="text-xl font-bold text-[var(--text-primary)]">
                {rootEntities.length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/10">
          <CardContent className="p-4 flex gap-4 items-center">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              S
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">Subsidaries</div>
              <div className="text-xl font-bold text-[var(--text-primary)]">
                {entities.length - rootEntities.length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--bg-surface)] border-[var(--border-subtle)]">
          <CardContent className="p-4 flex gap-4 items-center">
            <div className="h-10 w-10 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-secondary)] font-bold">
              C
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">Total Entities</div>
              <div className="text-xl font-bold text-[var(--text-primary)]">{entities.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
