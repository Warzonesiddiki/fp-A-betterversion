import { useState } from 'react';
import { cn } from '@/utils/cn';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Input } from './Input';
import type { WorkflowDefinition, WorkflowStep, StepType } from '@/engines/WorkflowEngine';

interface Props {
  onSave: (workflow: WorkflowDefinition) => void;
  initial?: WorkflowDefinition;
  className?: string;
}

export function ApprovalWorkflowDesigner({ onSave, initial, className }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [steps, setSteps] = useState<WorkflowStep[]>(initial?.steps ?? []);
  const [editingStep, setEditingStep] = useState<number | null>(null);

  const addStep = () => {
    const step: WorkflowStep = {
      id: 'step-' + Date.now(),
      name: 'Step ' + (steps.length + 1),
      type: 'sequential',
      approvers: [],
      order: steps.length,
    };
    setSteps([...steps, step]);
    setEditingStep(steps.length);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
    if (editingStep === index) setEditingStep(null);
  };

  const moveStep = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[index]!, newSteps[newIndex]!] = [newSteps[newIndex]!, newSteps[index]!];
    setSteps(newSteps.map((s, i) => ({ ...s, order: i })));
  };

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const handleSave = () => {
    if (!name || steps.length === 0) return;
    onSave({
      id: initial?.id ?? '',
      name,
      description,
      steps: steps as WorkflowStep[],
      createdBy: initial?.createdBy ?? 'user',
      createdAt: initial?.createdAt ?? '',
      isTemplate: false,
    });
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Workflow Designer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Budget Approval"
            />
          </div>
          <div>
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Approval workflow"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Steps</h3>
            <Button size="sm" onClick={addStep}>
              + Add Step
            </Button>
          </div>

          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={cn(
                'border rounded-lg p-3',
                editingStep === idx
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-[var(--border-subtle)]'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{step.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">({step.type})</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => moveStep(idx, -1)}
                    disabled={idx === 0}
                    className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-30"
                  >
                    &#8593;
                  </button>
                  <button
                    onClick={() => moveStep(idx, 1)}
                    disabled={idx === steps.length - 1}
                    className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-30"
                  >
                    &#8595;
                  </button>
                  <button
                    onClick={() => setEditingStep(editingStep === idx ? null : idx)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeStep(idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {editingStep === idx && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="step-name" className="text-xs font-medium">
                        Step Name
                      </label>
                      <Input
                        id="step-name"
                        value={step.name}
                        onChange={(e) => updateStep(idx, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="type" className="text-xs font-medium">
                        Type
                      </label>
                      <select
                        id="type"
                        value={step.type}
                        onChange={(e) => updateStep(idx, { type: e.target.value as StepType })}
                        className="w-full border rounded px-2 py-1 text-sm"
                      >
                        <option value="sequential">Sequential</option>
                        <option value="parallel">Parallel (all must approve)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="approvers-comma-separated" className="text-xs font-medium">
                      Approvers (comma-separated)
                    </label>
                    <Input
                      id="approvers-comma-separated"
                      value={step.approvers.join(', ')}
                      onChange={(e) =>
                        updateStep(idx, {
                          approvers: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="timeout-hours-optional" className="text-xs font-medium">
                        Timeout (hours, optional)
                      </label>
                      <Input
                        id="timeout-hours-optional"
                        type="number"
                        value={step.timeoutHours ?? ''}
                        onChange={(e) =>
                          updateStep(idx, {
                            timeoutHours: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="amount-threshold" className="text-xs font-medium">
                        Amount Threshold
                      </label>
                      <Input
                        id="amount-threshold"
                        type="number"
                        value={step.condition?.value ?? ''}
                        onChange={(e) =>
                          updateStep(idx, {
                            condition: e.target.value
                              ? { field: 'amount', operator: 'gt', value: Number(e.target.value) }
                              : undefined,
                          })
                        }
                        placeholder="> $10,000 needs VP"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {steps.length === 0 && (
            <div className="text-center py-8 text-[var(--text-muted)]">
              <p>No steps added yet.</p>
              <p className="text-sm">Click &quot;+ Add Step&quot; to begin.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSteps([]);
              setName('');
              setDescription('');
            }}
          >
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!name || steps.length === 0}>
            Save Workflow
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
