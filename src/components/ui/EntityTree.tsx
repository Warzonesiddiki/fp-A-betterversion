import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, Globe, Home } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Entity } from '@/types';

export interface EntityTreeProps {
  entities?: Entity[];
  onSelect?: (entityId: string) => void;
  selectedId?: string;
  defaultExpanded?: boolean;
}

interface TreeNodeProps {
  entity: Entity;
  entities: Entity[];
  level: number;
  onSelect: (id: string) => void;
  selectedId?: string;
  defaultExpanded: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  entity,
  entities,
  level,
  onSelect,
  selectedId,
  defaultExpanded,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const children = entities.filter((e) => e.parentId === entity.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedId === entity.id;

  const toggleExpand = (e: React.UIEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const getIcon = () => {
    if (entity.isParent) return <Globe className="h-4 w-4 text-blue-600" />;
    if (level === 0) return <Building2 className="h-4 w-4 text-[var(--text-secondary)]" />;
    return <Home className="h-4 w-4 text-[var(--text-muted)]" />;
  };

  return (
    <div className="select-none">
      <div
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={0}
        className={cn(
          'flex items-center py-1.5 px-2 rounded-md cursor-pointer transition-all group mb-0.5',
          isSelected
            ? 'bg-blue-600 text-white shadow-sm'
            : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(entity.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(entity.id);
          }
        }}
      >
        <div
          role="button"
          tabIndex={-1}
          className={cn(
            'p-0.5 rounded hover:bg-black/10 transition-colors mr-1',
            !hasChildren && 'invisible'
          )}
          onClick={toggleExpand}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }
          }}
        >
          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>

        <div className={cn('mr-2 shrink-0 opacity-80', isSelected ? 'text-white' : '')}>
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-between">
          <span className="text-sm font-medium truncate">{entity.name}</span>
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 uppercase tracking-tighter',
              isSelected
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-[var(--text-secondary)]'
            )}
          >
            {entity.code}
          </span>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              entity={child}
              entities={entities}
              level={level + 1}
              onSelect={onSelect!}
              selectedId={selectedId}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const EntityTree: React.FC<EntityTreeProps> = ({
  entities = [],
  onSelect,
  selectedId,
  defaultExpanded = true,
}) => {
  const rootEntities = entities.filter((e) => !e.parentId);

  if (!entities || entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-[var(--border-subtle)] rounded-lg">
        <Building2 className="h-8 w-8 text-[var(--text-secondary)] opacity-20 mb-2" />
        <p className="text-xs text-[var(--text-secondary)] font-medium">No entities found</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1">
      <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-60">
        Organization Hierarchy
      </div>
      <div role="tree" aria-label="Organization hierarchy" className="overflow-hidden">
        {rootEntities.map((entity) => (
          <TreeNode
            key={entity.id}
            entity={entity}
            entities={entities}
            level={0}
            onSelect={onSelect!}
            selectedId={selectedId}
            defaultExpanded={defaultExpanded}
          />
        ))}
      </div>
    </div>
  );
};
