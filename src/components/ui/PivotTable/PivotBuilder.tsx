import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '../Button';
import { X, GripVertical, Plus } from 'lucide-react';
import type { PivotConfig, PivotField } from '@/engines/PivotTableEngine';

export interface PivotBuilderProps {
  availableFields: PivotField[];
  config: PivotConfig;
  onChange: (config: PivotConfig) => void;
  className?: string;
}

export function PivotBuilder({ availableFields, config, onChange, className }: PivotBuilderProps) {
  const handleAddField = (area: 'rows' | 'columns', fieldName: string) => {
    if (config[area].includes(fieldName)) return;
    onChange({ ...config, [area]: [...config[area], fieldName] });
  };

  const handleAddValue = (fieldName: string) => {
    if (config.values.some((v) => v.field === fieldName)) return;
    onChange({ ...config, values: [...config.values, { field: fieldName, aggregation: 'sum' }] });
  };

  const handleRemoveField = (area: 'rows' | 'columns', fieldName: string) => {
    onChange({ ...config, [area]: config[area].filter((f) => f !== fieldName) });
  };

  const handleRemoveValue = (fieldName: string) => {
    onChange({ ...config, values: config.values.filter((v) => v.field !== fieldName) });
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 rounded-lg',
        className
      )}
    >
      {/* Available Fields */}
      <div className="flex-1 border border-[var(--border-subtle)] rounded bg-[var(--bg-root)] p-3">
        <h4 className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">
          Available Fields
        </h4>
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
          {availableFields.map((field) => (
            <div
              key={field.name}
              className="flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2 rounded text-sm hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-[var(--text-muted)] cursor-grab" />
                <span className="font-medium">{field.label}</span>
                <span className="text-[10px] uppercase text-[var(--text-muted)] bg-[var(--bg-root)] px-1.5 py-0.5 rounded">
                  {field.type}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {field.type === 'dimension' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleAddField('rows', field.name)}
                    >
                      Row
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleAddField('columns', field.name)}
                    >
                      Col
                    </Button>
                  </>
                )}
                {field.type === 'measure' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleAddValue(field.name)}
                  >
                    Val
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Areas */}
      <div className="flex-1 flex flex-col gap-3">
        <ConfigArea
          title="Rows"
          items={config.rows}
          onRemove={(f) => handleRemoveField('rows', f)}
        />
        <ConfigArea
          title="Columns"
          items={config.columns}
          onRemove={(f) => handleRemoveField('columns', f)}
        />

        <div className="flex-1 border border-[var(--border-subtle)] border-dashed rounded bg-[var(--bg-root)] p-3">
          <h4 className="text-xs font-semibold uppercase text-[var(--text-muted)] mb-2">Values</h4>
          <div className="flex flex-wrap gap-2">
            {config.values.map((val) => (
              <div
                key={val.field}
                className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded text-xs font-medium"
              >
                <span>
                  {val.aggregation}({val.field})
                </span>
                <button
                  onClick={() => handleRemoveValue(val.field)}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {config.values.length === 0 && (
              <span className="text-xs text-[var(--text-muted)] italic">Add measures here</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigArea({
  title,
  items,
  onRemove,
}: {
  title: string;
  items: string[];
  onRemove: (item: string) => void;
}) {
  return (
    <div className="border border-[var(--border-subtle)] border-dashed rounded bg-[var(--bg-root)] p-3">
      <h4 className="text-xs font-semibold uppercase text-[var(--text-muted)] mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center gap-1 bg-[var(--bg-surface-hover)] border border-[var(--border-default)] px-2 py-1 rounded text-xs font-medium"
          >
            <span>{item}</span>
            <button
              onClick={() => onRemove(item)}
              className="text-[var(--text-muted)] hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <span className="text-xs text-[var(--text-muted)] italic">
            Drag fields or click to add
          </span>
        )}
      </div>
    </div>
  );
}
