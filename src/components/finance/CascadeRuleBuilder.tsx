import { useMemo, useState } from 'react';
import { Plus, Trash2, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useDriverStore } from '@/store/driverStore';
import type { Driver, CascadeRule, CascadeType, ImpactType } from '@/engines/DriverCascadeEngine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TARGET_CUBES = ['Budget', 'Forecast', 'Scenario', 'Actual'] as const;
const TARGET_MEASURES = ['amount', 'quantity', 'rate', 'hours', 'units'] as const;
const CASCADE_TYPES: CascadeType[] = ['direct', 'weighted', 'formula'];
const IMPACT_TYPES: ImpactType[] = ['additive', 'multiplicative', 'replacement'];

const CASCADE_TYPE_LABELS: Record<CascadeType, string> = {
  direct: 'Direct — proportional to driver change',
  weighted: 'Weighted — scaled by a weight factor',
  formula: 'Formula — custom calculation',
};

const IMPACT_TYPE_LABELS: Record<ImpactType, string> = {
  additive: 'Additive — adds delta to target',
  multiplicative: 'Multiplicative — scales target by ratio',
  replacement: 'Replacement — overwrites target value',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CascadeRuleBuilderProps {
  driver: Driver;
  onRuleAdded?: (rule: CascadeRule) => void;
  onRuleRemoved?: (ruleId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CascadeRuleBuilder({
  driver,
  onRuleAdded,
  onRuleRemoved,
}: CascadeRuleBuilderProps) {
  const { addRule, removeRule, getRulesForDriver } = useDriverStore();
  const rules = useMemo(() => getRulesForDriver(driver.id), [driver.id, getRulesForDriver]);

  const [isAdding, setIsAdding] = useState(false);
  const [targetCube, setTargetCube] = useState<string>('Budget');
  const [targetAccount, setTargetAccount] = useState('');
  const [targetMeasure, setTargetMeasure] = useState('amount');
  const [cascadeType, setCascadeType] = useState<CascadeType>('direct');
  const [impactType, setImpactType] = useState<ImpactType>('multiplicative');
  const [weight, setWeight] = useState(1);
  const [formula, setFormula] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    if (!targetAccount.trim()) return;

    const rule = addRule({
      driverId: driver.id,
      targetCube,
      targetCoords: { Account: targetAccount },
      targetMeasure,
      cascadeType,
      impactType,
      weight,
      formula: cascadeType === 'formula' ? formula : undefined,
      description: description || undefined,
    });

    onRuleAdded?.(rule);

    // Reset form
    setTargetAccount('');
    setFormula('');
    setDescription('');
    setIsAdding(false);
  };

  const handleRemove = (ruleId: string) => {
    removeRule(ruleId);
    onRuleRemoved?.(ruleId);
  };

  const formatWeight = (w: number): string => {
    if (w >= 1) return `${w}x`;
    return `${(w * 100).toFixed(0)}%`;
  };

  return (
    <div className="space-y-3" role="region" aria-label="CascadeRuleBuilder">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Cascade Rules
        </h4>
        <Button size="sm" variant="ghost" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-3 h-3 mr-1" />
          Add Rule
        </Button>
      </div>

      {/* Existing Rules */}
      {rules.length > 0 && (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center gap-2 p-2 rounded-md text-xs"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--accent)' }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {driver.name}
                </div>
                <div className="truncate" style={{ color: 'var(--text-secondary)' }}>
                  → {rule.targetCube} / {rule.targetCoords.Account} / {rule.targetMeasure}
                </div>
                <div className="truncate" style={{ color: 'var(--text-secondary)' }}>
                  {CASCADE_TYPE_LABELS[rule.cascadeType]} | Weight: {formatWeight(rule.weight)}
                </div>
                {rule.description && (
                  <div className="truncate mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {rule.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRemove(rule.id)}
                className="p-1 rounded hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
                aria-label={`Remove rule targeting ${rule.targetCoords.Account}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {rules.length === 0 && !isAdding && (
        <div className="text-center py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          No cascade rules defined. Add a rule to link this driver to budget cells.
        </div>
      )}

      {/* Add Rule Form */}
      {isAdding && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">New Cascade Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Target Cube */}
            <div>
              <label
                htmlFor="cascade-target-cube"
                className="text-xs font-medium block mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Target Cube
              </label>
              <select
                id="cascade-target-cube"
                value={targetCube}
                onChange={(e) => setTargetCube(e.target.value)}
                className="w-full p-1.5 rounded text-sm border"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                }}
              >
                {TARGET_CUBES.map((cube) => (
                  <option key={cube} value={cube}>
                    {cube}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Account */}
            <div>
              <label
                htmlFor="cascade-target-account"
                className="text-xs font-medium block mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Target Account
              </label>
              <input
                id="cascade-target-account"
                type="text"
                value={targetAccount}
                onChange={(e) => setTargetAccount(e.target.value)}
                placeholder="e.g. Account:Revenue"
                className="w-full p-1.5 rounded text-sm border"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                }}
              />
            </div>

            {/* Target Measure */}
            <div>
              <label
                htmlFor="cascade-target-measure"
                className="text-xs font-medium block mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Target Measure
              </label>
              <select
                id="cascade-target-measure"
                value={targetMeasure}
                onChange={(e) => setTargetMeasure(e.target.value)}
                className="w-full p-1.5 rounded text-sm border"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                }}
              >
                {TARGET_MEASURES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Cascade Type */}
            <div>
              <label
                htmlFor="cascade-type"
                className="text-xs font-medium block mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cascade Type
              </label>
              <select
                id="cascade-type"
                value={cascadeType}
                onChange={(e) => setCascadeType(e.target.value as CascadeType)}
                className="w-full p-1.5 rounded text-sm border"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                }}
              >
                {CASCADE_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {CASCADE_TYPE_LABELS[ct]}
                  </option>
                ))}
              </select>
            </div>

            {/* Impact Type */}
            <div>
              <label
                htmlFor="cascade-impact-type"
                className="text-xs font-medium block mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Impact Type
              </label>
              <select
                id="cascade-impact-type"
                value={impactType}
                onChange={(e) => setImpactType(e.target.value as ImpactType)}
                className="w-full p-1.5 rounded text-sm border"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                }}
              >
                {IMPACT_TYPES.map((it) => (
                  <option key={it} value={it}>
                    {IMPACT_TYPE_LABELS[it]}
                  </option>
                ))}
              </select>
            </div>

            {/* Weight */}
            <div>
              <label
                htmlFor="cascade-weight"
                className="text-xs font-medium block mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Weight: {formatWeight(weight)}
              </label>
              <input
                id="cascade-weight"
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full"
              />
              <div
                className="flex justify-between text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>0</span>
                <span>5x</span>
              </div>
            </div>

            {/* Formula (only when cascadeType is formula) */}
            {cascadeType === 'formula' && (
              <div>
                <label
                  htmlFor="cascade-formula"
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Formula
                </label>
                <input
                  id="cascade-formula"
                  type="text"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  placeholder="e.g. x * 1000 + current * 0.5"
                  className="w-full p-1.5 rounded text-sm border font-mono"
                  style={{
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border)',
                  }}
                />
                <div
                  className="flex items-center gap-1 mt-1 text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <AlertCircle className="w-3 h-3" />
                  Variables: x (new driver), old_x (old driver), current (cell value)
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label
                htmlFor="cascade-description"
                className="text-xs font-medium block mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Description (optional)
              </label>
              <input
                id="cascade-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Revenue grows proportionally with growth rate"
                className="w-full p-1.5 rounded text-sm border"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!targetAccount.trim()}
                className="flex-1"
              >
                Add Rule
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
