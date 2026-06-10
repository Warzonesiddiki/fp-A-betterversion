import { useCallback, useState } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type {
  WorkflowStep,
  StepType,
  WorkflowDefinition,
  ApprovalCondition,
} from '@/engines/WorkflowEngine';

interface WorkflowDesignerProps {
  readonly onSave: (workflow: Omit<WorkflowDefinition, 'id' | 'createdAt'>) => void;
  readonly initial?: WorkflowDefinition;
  readonly className?: string;
}

interface StepFormData {
  readonly name: string;
  readonly type: StepType;
  readonly approvers: string;
  readonly delegateTo: string;
  readonly timeoutHours: string;
  readonly conditionField: string;
  readonly conditionOperator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'between';
  readonly conditionValue: string;
}

const DEFAULT_STEP_FORM: StepFormData = {
  name: '',
  type: 'sequential',
  approvers: '',
  delegateTo: '',
  timeoutHours: '',
  conditionField: 'amount',
  conditionOperator: 'gt',
  conditionValue: '',
};

function parseCommaList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildCondition(form: StepFormData): ApprovalCondition | undefined {
  if (!form.conditionValue) return undefined;
  return {
    field: form.conditionField,
    operator: form.conditionOperator,
    value: Number(form.conditionValue),
  };
}

export function WorkflowDesigner({ onSave, initial, className }: WorkflowDesignerProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [steps, setSteps] = useState<WorkflowStep[]>(initial?.steps ?? []);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [stepForm, setStepForm] = useState<StepFormData>(DEFAULT_STEP_FORM);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setSteps([]);
    setEditingIdx(null);
    setStepForm(DEFAULT_STEP_FORM);
  }, []);

  const addStep = useCallback(() => {
    const step: WorkflowStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: stepForm.name || `Step ${steps.length + 1}`,
      type: stepForm.type,
      approvers: parseCommaList(stepForm.approvers),
      delegateTo: parseCommaList(stepForm.delegateTo),
      timeoutHours: stepForm.timeoutHours ? Number(stepForm.timeoutHours) : undefined,
      condition: buildCondition(stepForm),
      order: steps.length,
    };
    setSteps((prev) => [...prev, step]);
    setStepForm(DEFAULT_STEP_FORM);
  }, [stepForm, steps.length]);

  const removeStep = useCallback(
    (index: number) => {
      setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
      if (editingIdx === index) setEditingIdx(null);
    },
    [editingIdx]
  );

  const moveStep = useCallback((index: number, dir: -1 | 1) => {
    setSteps((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const a = next[index];
      const b = next[target];
      next[index] = b!;
      next[target] = a!;
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const loadStepIntoForm = useCallback(
    (index: number) => {
      const step = steps[index];
      if (!step) return;
      setEditingIdx(index);
      setStepForm({
        name: step.name,
        type: step.type,
        approvers: step.approvers.join(', '),
        delegateTo: step.delegateTo?.join(', ') ?? '',
        timeoutHours: step.timeoutHours?.toString() ?? '',
        conditionField: step.condition?.field ?? 'amount',
        conditionOperator: step.condition?.operator ?? 'gt',
        conditionValue: step.condition?.value?.toString() ?? '',
      });
    },
    [steps]
  );

  const saveEditedStep = useCallback(() => {
    if (editingIdx === null) return;
    setSteps((prev) =>
      prev.map((s, i) =>
        i === editingIdx
          ? {
              ...s,
              name: stepForm.name || s.name,
              type: stepForm.type,
              approvers: parseCommaList(stepForm.approvers),
              delegateTo: parseCommaList(stepForm.delegateTo),
              timeoutHours: stepForm.timeoutHours ? Number(stepForm.timeoutHours) : undefined,
              condition: buildCondition(stepForm),
            }
          : s
      )
    );
    setEditingIdx(null);
    setStepForm(DEFAULT_STEP_FORM);
  }, [editingIdx, stepForm]);

  const handleSave = useCallback(() => {
    if (!name.trim() || steps.length === 0) return;
    onSave({
      name: name.trim(),
      description,
      steps,
      createdBy: 'user',
      isTemplate: false,
    });
  }, [name, description, steps, onSave]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Workflow Designer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Budget Approval Workflow"
              className="w-full border rounded px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Approval workflow for budgets"
              className="w-full border rounded px-3 py-1.5 text-sm"
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Steps ({steps.length})</h3>

          {/* Existing Steps */}
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={cn(
                'border rounded-lg p-3 transition-colors',
                editingIdx === idx
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-[var(--border-subtle)]'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-sm">{step.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                    {step.type}
                  </span>
                  {step.condition && (
                    <span className="text-xs text-yellow-600">
                      {step.condition.field} {step.condition.operator} {step.condition.value}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveStep(idx, -1)}
                    disabled={idx === 0}
                    className="text-gray-400 hover:text-[var(--text-secondary)] disabled:opacity-30 px-1"
                    aria-label="Move up"
                  >
                    &uarr;
                  </button>
                  <button
                    onClick={() => moveStep(idx, 1)}
                    disabled={idx === steps.length - 1}
                    className="text-gray-400 hover:text-[var(--text-secondary)] disabled:opacity-30 px-1"
                    aria-label="Move down"
                  >
                    &darr;
                  </button>
                  <Button size="sm" variant="ghost" onClick={() => loadStepIntoForm(idx)}>
                    {editingIdx === idx ? 'Editing' : 'Edit'}
                  </Button>
                  <button
                    onClick={() => removeStep(idx)}
                    className="text-red-400 hover:text-red-600 px-1"
                    aria-label={`Remove step ${idx + 1}`}
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div className="mt-1 text-xs text-[var(--text-muted)] flex gap-3">
                <span>Approvers: {step.approvers.join(', ') || 'none'}</span>
                {step.delegateTo?.length ? (
                  <span>Delegates: {step.delegateTo.join(', ')}</span>
                ) : null}
                {step.timeoutHours ? <span>Timeout: {step.timeoutHours}h</span> : null}
              </div>
            </div>
          ))}

          {/* Add / Edit Form */}
          <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium">
              {editingIdx !== null ? `Edit Step ${editingIdx + 1}` : 'Add New Step'}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Step Name *</label>
                <input
                  type="text"
                  value={stepForm.name}
                  onChange={(e) => setStepForm({ ...stepForm, name: e.target.value })}
                  placeholder="Manager Approval"
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Type</label>
                <select
                  value={stepForm.type}
                  onChange={(e) => setStepForm({ ...stepForm, type: e.target.value as StepType })}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="sequential">Sequential (one-by-one)</option>
                  <option value="parallel">Parallel (all must approve)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Approvers (comma-separated) *</label>
                <input
                  type="text"
                  value={stepForm.approvers}
                  onChange={(e) => setStepForm({ ...stepForm, approvers: e.target.value })}
                  placeholder="manager, cfo"
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Delegate To (optional)</label>
                <input
                  type="text"
                  value={stepForm.delegateTo}
                  onChange={(e) => setStepForm({ ...stepForm, delegateTo: e.target.value })}
                  placeholder="backup-approver"
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium">Timeout (hours)</label>
                <input
                  type="number"
                  value={stepForm.timeoutHours}
                  onChange={(e) => setStepForm({ ...stepForm, timeoutHours: e.target.value })}
                  placeholder="24"
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Condition Operator</label>
                <select
                  value={stepForm.conditionOperator}
                  onChange={(e) =>
                    setStepForm({
                      ...stepForm,
                      conditionOperator: e.target.value as StepFormData['conditionOperator'],
                    })
                  }
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="gt">Greater than</option>
                  <option value="lt">Less than</option>
                  <option value="gte">Greater or equal</option>
                  <option value="lte">Less or equal</option>
                  <option value="eq">Equals</option>
                  <option value="between">Between</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Condition Value</label>
                <input
                  type="number"
                  value={stepForm.conditionValue}
                  onChange={(e) => setStepForm({ ...stepForm, conditionValue: e.target.value })}
                  placeholder="10000"
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {editingIdx !== null ? (
                <>
                  <Button
                    size="sm"
                    onClick={saveEditedStep}
                    disabled={!stepForm.name.trim() || !stepForm.approvers.trim()}
                  >
                    Save Changes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingIdx(null);
                      setStepForm(DEFAULT_STEP_FORM);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={addStep}
                  disabled={!stepForm.name.trim() || !stepForm.approvers.trim()}
                >
                  + Add Step
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={resetForm}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || steps.length === 0}>
            Save Workflow
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
