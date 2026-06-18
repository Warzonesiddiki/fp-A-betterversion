import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { ConditionalFormatRules } from './ConditionalFormatRules';
import type { ConditionalFormatRule } from '@/engines/ConditionalFormattingEngine';
import { reorderRules, DEFAULT_RULES } from '@/engines/ConditionalFormattingEngine';

// ── Visual Preview ───────────────────────────────────────────────

function RulePreview({ rule }: { rule: ConditionalFormatRule }) {
  if (!rule.enabled) {
    return <span className="text-xs text-[var(--text-tertiary)]">Disabled</span>;
  }

  switch (rule.visualType) {
    case 'backgroundColor':
      return (
        <span
          className="inline-block h-5 w-5 rounded border border-[var(--border-subtle)]"
          style={{ backgroundColor: rule.style?.backgroundColor }}
          title={rule.style?.backgroundColor}
        />
      );
    case 'textColor':
      return (
        <span
          className="inline-block text-sm font-bold"
          style={{ color: rule.style?.textColor }}
          title={rule.style?.textColor}
        >
          Aa
        </span>
      );
    case 'dataBar':
      return (
        <div className="flex items-center gap-1 w-16">
          <div
            className="h-3 rounded-sm"
            style={{
              width: '60%',
              backgroundColor: rule.dataBar?.barColor,
            }}
          />
        </div>
      );
    case 'iconSet':
      return <span className="text-xs">{rule.iconSet?.type ?? 'icons'}</span>;
    case 'colorScale':
      return (
        <div
          className="h-4 w-12 rounded-sm"
          style={{
            background: `linear-gradient(to right, ${rule.colorScale?.minColor}, ${rule.colorScale?.maxColor})`,
          }}
        />
      );
    default:
      return null;
  }
}

// ── Rule Row ─────────────────────────────────────────────────────

interface RuleRowProps {
  rule: ConditionalFormatRule;
  index: number;
  total: number;
  onEdit: (rule: ConditionalFormatRule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

function RuleRow({
  rule,
  index,
  total,
  onEdit,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
}: RuleRowProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-default)] transition-colors">
      {/* Priority controls */}
      <div className="flex flex-col gap-0.5">
        <button
          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 text-xs"
          onClick={() => onMoveUp(rule.id)}
          disabled={index === 0}
          aria-label="Move up"
        >
          ▲
        </button>
        <span className="text-[10px] text-center text-[var(--text-tertiary)]">{rule.priority}</span>
        <button
          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 text-xs"
          onClick={() => onMoveDown(rule.id)}
          disabled={index === total - 1}
          aria-label="Move down"
        >
          ▼
        </button>
      </div>

      {/* Preview */}
      <RulePreview rule={rule} />

      {/* Name + condition */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{rule.name}</p>
        <p className="text-xs text-[var(--text-tertiary)] truncate">
          {rule.condition.ruleType} / {rule.condition.operator}
          {rule.condition.value !== undefined && ` ${rule.condition.value}`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          className={`text-xs px-2 py-1 rounded transition-colors ${
            rule.enabled
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => onToggle(rule.id)}
          aria-label={rule.enabled ? 'Disable rule' : 'Enable rule'}
        >
          {rule.enabled ? 'On' : 'Off'}
        </button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(rule)}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(rule.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────

export interface ConditionalFormatPanelProps {
  initialRules?: ConditionalFormatRule[];
  onRulesChange?: (rules: ConditionalFormatRule[]) => void;
}

// ── Component ────────────────────────────────────────────────────

export function ConditionalFormatPanel({
  initialRules,
  onRulesChange,
}: ConditionalFormatPanelProps) {
  const [rules, setRules] = useState<ConditionalFormatRule[]>(() =>
    reorderRules(initialRules ?? DEFAULT_RULES)
  );
  const [editingRule, setEditingRule] = useState<ConditionalFormatRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const sortedRules = useMemo(() => reorderRules(rules), [rules]);

  const updateRules = useCallback(
    (next: ConditionalFormatRule[]) => {
      const reordered = reorderRules(next);
      setRules(reordered);
      onRulesChange?.(reordered);
    },
    [onRulesChange]
  );

  const handleToggle = useCallback(
    (id: string) => {
      updateRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
    },
    [rules, updateRules]
  );

  const handleDelete = useCallback(
    (id: string) => {
      updateRules(rules.filter((r) => r.id !== id));
    },
    [rules, updateRules]
  );

  const handleMoveUp = useCallback(
    (id: string) => {
      const sorted = [...rules].sort((a, b) => b.priority - a.priority);
      const idx = sorted.findIndex((r) => r.id === id);
      if (idx <= 0) return;
      const higher = sorted[idx - 1];
      const current = sorted[idx];
      if (!higher || !current) return;
      updateRules(
        rules.map((r) => {
          if (r.id === current.id) return { ...r, priority: higher.priority };
          if (r.id === higher.id) return { ...r, priority: current.priority };
          return r;
        })
      );
    },
    [rules, updateRules]
  );

  const handleMoveDown = useCallback(
    (id: string) => {
      const sorted = [...rules].sort((a, b) => b.priority - a.priority);
      const idx = sorted.findIndex((r) => r.id === id);
      if (idx >= sorted.length - 1) return;
      const lower = sorted[idx + 1];
      const current = sorted[idx];
      if (!lower || !current) return;
      updateRules(
        rules.map((r) => {
          if (r.id === current.id) return { ...r, priority: lower.priority };
          if (r.id === lower.id) return { ...r, priority: current.priority };
          return r;
        })
      );
    },
    [rules, updateRules]
  );

  const handleSaveRule = useCallback(
    (saved: ConditionalFormatRule) => {
      const exists = rules.some((r) => r.id === saved.id);
      updateRules(exists ? rules.map((r) => (r.id === saved.id ? saved : r)) : [...rules, saved]);
      setEditingRule(null);
      setIsCreating(false);
    },
    [rules, updateRules]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingRule(null);
    setIsCreating(false);
  }, []);

  const showEditor = isCreating || editingRule !== null;

  const addPreset = (name: string, op: 'greaterThan' | 'lessThan', bg: string, fg: string) => {
    handleSaveRule({
      id: `variance-${Date.now()}`,
      name,
      enabled: true,
      priority: op === 'greaterThan' ? 100 : 99,
      condition: { ruleType: 'cellValue', operator: op, value: 0, columnKey: 'variance' },
      visualType: 'backgroundColor',
      style: { backgroundColor: bg, textColor: fg },
    });
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Conditional Formatting
        </h2>
        <Button
          size="sm"
          onClick={() => {
            setIsCreating(true);
            setEditingRule(null);
          }}
          disabled={showEditor}
        >
          + Add Rule
        </Button>
      </div>

      {/* Rule editor */}
      {showEditor && (
        <ConditionalFormatRules
          rule={editingRule ?? undefined}
          onSave={handleSaveRule}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Rule list */}
      {sortedRules.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] py-8 text-center">
          No formatting rules. Click &quot;Add Rule&quot; to create one.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sortedRules.map((rule, i) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              index={i}
              total={sortedRules.length}
              onEdit={(r) => {
                setEditingRule(r);
                setIsCreating(false);
              }}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}
        </div>
      )}

      {/* Variance presets */}
      {!showEditor && (
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <span className="text-xs text-[var(--text-tertiary)]">Quick presets:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addPreset('Favorable Variance', 'greaterThan', '#dcfce7', '#166534')}
          >
            Favorable
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addPreset('Unfavorable Variance', 'lessThan', '#fee2e2', '#991b1b')}
          >
            Unfavorable
          </Button>
        </div>
      )}
    </div>
  );
}
