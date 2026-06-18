import React, { useState, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown, Calculator, Hash, FileText, Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { GLAccount } from '@/types';

export interface AccountTreeProps {
  accounts: GLAccount[];
  onSelect: (accountId: string) => void;
  selectedId?: string;
  defaultExpanded?: boolean;
}

interface TreeNodeProps {
  account: GLAccount;
  level: number;
  onSelect: (id: string) => void;
  selectedId?: string;
  defaultExpanded: boolean;
  filter: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  account,
  level,
  onSelect,
  selectedId,
  defaultExpanded,
  filter,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const matchesFilter =
    !filter ||
    account.name.toLowerCase().includes(filter.toLowerCase()) ||
    account.code.toLowerCase().includes(filter.toLowerCase());

  const children = account.children || [];
  const hasChildren = children.length > 0;
  const isSelected = selectedId === account.id;

  // Auto-expand if child matches filter
  const shouldBeExpanded = useMemo(() => {
    if (!filter) return isExpanded;
    const hasMatchingChild = (acc: GLAccount): boolean => {
      if (
        acc.name.toLowerCase().includes(filter.toLowerCase()) ||
        acc.code.toLowerCase().includes(filter.toLowerCase())
      )
        return true;
      return acc.children?.some(hasMatchingChild) || false;
    };
    return account.children?.some(hasMatchingChild) || false;
  }, [filter, account.children, isExpanded]);

  const toggleExpand = (e: React.UIEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const currentExpanded = filter ? shouldBeExpanded : isExpanded;

  if (filter && !matchesFilter && !shouldBeExpanded) return null;

  return (
    <div className="select-none">
      <div
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? currentExpanded : undefined}
        tabIndex={0}
        className={cn(
          'flex items-center py-1.5 px-2 rounded-md cursor-pointer transition-all group mb-0.5',
          isSelected
            ? 'bg-blue-600 text-white shadow-sm'
            : matchesFilter
              ? 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
              : 'opacity-40 hover:opacity-100 text-[var(--text-secondary)]'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(account.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(account.id);
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
          {currentExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </div>

        <div
          className={cn(
            'mr-2 shrink-0 opacity-80',
            isSelected
              ? 'text-white'
              : account.isCalculated
                ? 'text-amber-700'
                : 'text-[var(--text-muted)]'
          )}
        >
          {account.isCalculated ? (
            <Calculator className="h-3.5 w-3.5" />
          ) : (
            <Hash className="h-3.5 w-3.5" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold leading-none truncate mb-0.5 tabular-nums">
              {account.code}
            </span>
            <span className="text-sm font-medium leading-none truncate opacity-80">
              {account.name}
            </span>
          </div>
          {account.isCalculated && (
            <span
              className={cn(
                'text-[8px] font-black px-1 py-0.5 rounded ml-2 uppercase tracking-widest',
                isSelected ? 'bg-blue-500 text-white' : 'bg-amber-100 text-amber-700'
              )}
            >
              Calc
            </span>
          )}
        </div>
      </div>

      {hasChildren && currentExpanded && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              account={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              defaultExpanded={defaultExpanded}
              filter={filter}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const AccountTree: React.FC<AccountTreeProps> = memo(
  ({ accounts, onSelect, selectedId, defaultExpanded = false }) => {
    const { t } = useTranslation();
    const [filter, setFilter] = useState('');

    if (!accounts || accounts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-[var(--border-subtle)] rounded-lg">
          <FileText className="h-8 w-8 text-[var(--text-secondary)] opacity-20 mb-2" />
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            {t('accounts.notFound')}
          </p>
        </div>
      );
    }

    return (
      <div className="w-full space-y-3">
        {/* Search Input */}
        <div className="relative group px-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-secondary)] opacity-50 transition-opacity group-focus-within:opacity-100" />
          <input
            type="text"
            className="w-full h-9 pl-9 pr-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md text-xs font-medium outline-none transition-all focus:bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-500"
            placeholder="Search accounts by code or name..."
            aria-label="Search accounts"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <X className="h-3 w-3 text-[var(--text-secondary)]" />
            </button>
          )}
        </div>

        <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-60">
          Chart of Accounts
        </div>

        <div role="tree" aria-label="Chart of accounts" className="overflow-hidden space-y-0.5">
          {accounts.map((account) => (
            <TreeNode
              key={account.id}
              account={account}
              level={0}
              onSelect={onSelect}
              selectedId={selectedId}
              defaultExpanded={defaultExpanded}
              filter={filter}
            />
          ))}
        </div>
      </div>
    );
  }
);
