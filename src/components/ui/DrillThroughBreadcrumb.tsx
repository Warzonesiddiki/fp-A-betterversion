import React from 'react';
import type { DrillBreadcrumb, DrillLevel } from '@/engines/DrillThroughEngine';

interface DrillThroughBreadcrumbProps {
  path: DrillBreadcrumb[];
  onNavigate: (level: DrillLevel) => void;
  className?: string;
}

const LEVEL_ICONS: Record<DrillLevel, string> = {
  summary: '📊',
  detail: '📋',
  'journal-entry': '📒',
  'source-document': '📄',
};

export function DrillThroughBreadcrumb({
  path,
  onNavigate,
  className = '',
}: DrillThroughBreadcrumbProps) {
  if (path.length === 0) return null;

  return (
    <nav
      aria-label="Drill-through path"
      className={`flex items-center gap-1 text-sm text-slate-300 ${className}`}
    >
      {path.map((crumb, idx) => {
        const isLast = idx === path.length - 1;
        return (
          <React.Fragment key={`${crumb.level}-${idx}`}>
            {idx > 0 && (
              <span className="text-slate-500 mx-1" aria-hidden="true">
                ›
              </span>
            )}
            <button
              type="button"
              onClick={() => onNavigate(crumb.level)}
              disabled={isLast}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                isLast
                  ? 'text-blue-400 font-medium cursor-default'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer'
              }`}
              aria-current={isLast ? 'page' : undefined}
            >
              <span aria-hidden="true">{LEVEL_ICONS[crumb.level]}</span>
              <span>{crumb.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
