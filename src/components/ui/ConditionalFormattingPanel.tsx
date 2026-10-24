import { memo, useCallback, useState } from 'react';
import type { ConditionalFormatRule } from '@/engines/ConditionalFormattingEngine';
import {
  generateRuleId,
  DEFAULT_RULES,
  reorderRules,
  evaluateRule,
} from '@/engines/ConditionalFormattingEngine';
import { ConditionalCellRenderer } from './ConditionalFormattingRenderers';
import { ConditionalRuleEditor } from './ConditionalRuleEditor';
import { cn } from '@/utils/cn';

// ── Types ───────────────────────────────────────────────────────────

export interface ConditionalFormattingPanelProps {
  rules: ConditionalFormatRule[];
  onRulesChange: (_rules: ConditionalFormatRule[]) => void;
  className?: string;
}

// ── Rule Row ────────────────────────────────────────────────────────

interface RuleRowProps {
  rule: ConditionalFormatRule;
  index: number;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isLast: boolean;
}

function RuleRow({
  rule,
  index,
  onEdit,
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
  isLast,
}: RuleRowProps) {
  const previewEval = evaluateRule(rule, 5, [1, 5, 10]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2',
        !rule.enabled && 'opacity-50'
      )}
    >
      {/* Drag handle / priority */}
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          aria-label="Move up"
        >
          ▲
        </button>
        <span className="text-xs font-mono text-[var(--text-secondary)]">{rule.priority}</span>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          aria-label="Move down"
        >
          ▼
        </button>
      </div>

      {/* Preview swatch */}
      <div className="w-10">
        <ConditionalCellRenderer value={5} evaluated={previewEval} />
      </div>

      {/* Name & type */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{rule.name}</div>
        <div className="text-xs text-[var(--text-secondary)]">
          {rule.visualType} &middot; {rule.condition.operator}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggle}
          className={cn(
            'rounded px-2 py-1 text-xs',
            rule.enabled
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 dark:bg-gray-800 text-[var(--text-muted)] hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          {rule.enabled ? 'On' : 'Off'}
        </button>
        <button
          onClick={onEdit}
          className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="rounded px-2 py-1 text-xs fin-negative hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Main Panel ──────────────────────────────────────────────────────

export const ConditionalFormattingPanel = memo(function ConditionalFormattingPanel({
  rules,
  onRulesChange,
  className,
}: ConditionalFormattingPanelProps) {
  const [editingRule, setEditingRule] = useState<ConditionalFormatRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const sorted = reorderRules(rules);

  const handleAddNew = useCallback(() => {
    const newRule: ConditionalFormatRule = {
      id: generateRuleId(),
      name: 'New Rule',
      enabled: true,
      priority: rules.length > 0 ? Math.max(...rules.map((r) => r.priority)) + 1 : 100,
      condition: {
        ruleType: 'cellValue',
        operator: 'greaterThan',
        value: 0,
      },
      visualType: 'backgroundColor',
      style: { backgroundColor: '#dcfce7', textColor: '#166534' },
    };
    setEditingRule(newRule);
    setIsCreating(true);
  }, [rules]);

  const handleSave = useCallback(() => {
    if (!editingRule) return;

    if (isCreating) {
      onRulesChange([...rules, editingRule]);
    } else {
      onRulesChange(rules.map((r) => (r.id === editingRule.id ? editingRule : r)));
    }
    setEditingRule(null);
    setIsCreating(false);
  }, [editingRule, isCreating, rules, onRulesChange]);

  const handleDelete = useCallback(
    (id: string) => {
      if (!window.confirm('Delete this formatting rule?')) return;
      onRulesChange(rules.filter((r) => r.id !== id));
    },
    [rules, onRulesChange]
  );

  const handleToggle = useCallback(
    (id: string) => {
      onRulesChange(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
    },
    [rules, onRulesChange]
  );

  const handleMove = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const sortedRules = reorderRules(rules);
      const idx = sortedRules.findIndex((r) => r.id === id);
      if (idx < 0) return;

      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sortedRules.length) return;

      const a = sortedRules[idx];
      const b = sortedRules[swapIdx];
      const newRules = rules.map((r) => {
        if (r.id === a!.id) return { ...r, priority: b!.priority };
        if (r.id === b!.id) return { ...r, priority: a!.priority };
        return r;
      });
      onRulesChange(newRules);
    },
    [rules, onRulesChange]
  );

  const handleLoadDefaults = useCallback(() => {
    const merged = [...rules];
    for (const def of DEFAULT_RULES) {
      if (!merged.some((r) => r.id === def.id)) {
        merged.push(def);
      }
    }
    onRulesChange(merged);
  }, [rules, onRulesChange]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Conditional Formatting</h3>
        <div className="flex gap-2">
          {rules.length === 0 && (
            <button
              onClick={handleLoadDefaults}
              className="rounded px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              Load Defaults
            </button>
          )}
          <button
            onClick={handleAddNew}
            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            + Add Rule
          </button>
        </div>
      </div>

      {/* Rule editor */}
      {(editingRule || isCreating) && editingRule && (
        <ConditionalRuleEditor
          rule={editingRule}
          onChange={setEditingRule}
          onCancel={() => {
            setEditingRule(null);
            setIsCreating(false);
          }}
          onSave={handleSave}
        />
      )}

      {/* Rules list */}
      <div className="space-y-2">
        {sorted.length === 0 && !isCreating && (
          <p className="py-6 text-center text-sm text-[var(--text-secondary)]">
            No formatting rules. Click &quot;Add Rule&quot; or &quot;Load Defaults&quot; to get
            started.
          </p>
        )}
        {sorted.map((rule, idx) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            index={idx}
            isLast={idx === sorted.length - 1}
            onEdit={() => {
              setEditingRule(rule);
              setIsCreating(false);
            }}
            onToggle={() => handleToggle(rule.id)}
            onDelete={() => handleDelete(rule.id)}
            onMoveUp={() => handleMove(rule.id, 'up')}
            onMoveDown={() => handleMove(rule.id, 'down')}
          />
        ))}
      </div>

      {/* Stats */}
      {rules.length > 0 && (
        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
          <span>{rules.filter((r) => r.enabled).length} active rule(s)</span>
          <span>{rules.length} total</span>
        </div>
      )}
    </div>
  );
});
