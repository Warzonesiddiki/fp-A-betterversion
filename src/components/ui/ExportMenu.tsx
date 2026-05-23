import React from 'react';
import { Download, FileDown, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/utils/cn';

export interface ExportMenuProps {
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  onExport,
  disabled = false,
  label = 'Export',
  className,
}) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          disabled={disabled}
          aria-label={label}
          aria-haspopup="menu"
          className={cn(
            'flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
            className
          )}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>{label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-[90] min-w-[160px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-xl p-1 animate-in fade-in-0 zoom-in-95"
          align="end"
          sideOffset={5}
        >
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-50">
            Choose Format
          </div>

          <DropdownMenu.Item
            className="flex items-center space-x-2 px-3 py-2 text-sm text-[var(--text-primary)] rounded-md outline-none cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
            onClick={() => onExport('excel')}
          >
            <FileSpreadsheet className="h-4 w-4 fin-positive group-hover:scale-110 transition-transform" />
            <span className="font-medium">Excel (.xlsx)</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center space-x-2 px-3 py-2 text-sm text-[var(--text-primary)] rounded-md outline-none cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
            onClick={() => onExport('pdf')}
          >
            <FileText className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="font-medium">PDF Document</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center space-x-2 px-3 py-2 text-sm text-[var(--text-primary)] rounded-md outline-none cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
            onClick={() => onExport('csv')}
          >
            <FileDown className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="font-medium">CSV (Data Only)</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-[var(--border-subtle)] my-1" />

          <div className="px-2 py-1 text-[9px] text-center text-[var(--text-secondary)] opacity-60 leading-tight">
            Deterministic Export Protocol v3.1
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
