import React from 'react';
import { Filter, X, GripVertical, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ReportFilter, ConditionOperator } from '@/engines/ReportBuilderEngine';

export interface ActiveFilter extends ReportFilter {
  id: string;
  label: string;
}

export interface FilterPanelProps {
  filters: ActiveFilter[];
  onAddFilter: (filter: ActiveFilter) => void;
  onRemoveFilter: (id: string) => void;
  onUpdateFilter: (id: string, updates: Partial<ActiveFilter>) => void;
  className?: string;
}

const OPERATORS: Array<{ value: ConditionOperator; label: string }> = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' },
  { value: 'gte', label: '>= ' },
  { value: 'lte', label: '<= ' },
];

function FilterRow({
  filter,
  onUpdate,
  onRemove,
}: {
  filter: ActiveFilter;
  onUpdate: (updates: Partial<ActiveFilter>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 group" role="region" aria-label="FilterPanel">
      <GripVertical className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      <span className="text-xs text-blue-400 font-medium truncate min-w-0 flex-shrink-0 max-w-[80px]">
        {filter.label}
      </span>
      <select
        value={filter.operator}
        onChange={(e) => onUpdate({ operator: e.target.value as ConditionOperator })}
        className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500 flex-shrink-0"
      >
        {OPERATORS.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={String(filter.value)}
        onChange={(e) => onUpdate({ value: e.target.value })}
        className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-blue-500"
        placeholder="Value..."
      />
      <button
        onClick={onRemove}
        className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        aria-label={`Remove filter ${filter.label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function FilterPanel({
  filters,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  className,
}: FilterPanelProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'dimension') {
        const newFilter: ActiveFilter = {
          id: `filter_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          field: data.value,
          operator: 'eq',
          value: '',
          label: data.value,
        };
        onAddFilter(newFilter);
      }
    } catch {
      // ignore invalid drag data
    }
  };

  return (
    <div
      className={cn('space-y-2', className)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Filters ({filters.length})
        </h3>
      </div>

      {filters.length === 0 ? (
        <div className="text-center py-4 text-slate-500 text-[10px] border-2 border-dashed border-slate-700 rounded-lg">
          <Plus className="h-3 w-3 mx-auto mb-1 text-slate-600" />
          Drag dimensions here to filter
        </div>
      ) : (
        <div className="space-y-1">
          {filters.map((filter) => (
            <FilterRow
              key={filter.id}
              filter={filter}
              onUpdate={(updates) => onUpdateFilter(filter.id, updates)}
              onRemove={() => onRemoveFilter(filter.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
