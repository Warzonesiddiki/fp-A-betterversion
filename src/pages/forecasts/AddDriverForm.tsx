import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export interface NewDriverForm {
  name: string;
  description: string;
  unit: 'percentage' | 'absolute' | 'index' | 'ratio';
  baseValue: number;
  currentValue: number;
  minValue: number;
  maxValue: number;
  step: number;
  category: string;
}

export const INITIAL_FORM: NewDriverForm = {
  name: '',
  description: '',
  unit: 'percentage',
  baseValue: 0,
  currentValue: 0,
  minValue: -100,
  maxValue: 100,
  step: 1,
  category: 'General',
};

export interface AddDriverFormProps {
  form: NewDriverForm;
  onFormChange: (form: NewDriverForm) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const inputStyle = {
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border)',
};

export function AddDriverForm({ form, onFormChange, onSubmit, onCancel }: AddDriverFormProps) {
  const set = (updates: Partial<NewDriverForm>) => onFormChange({ ...form, ...updates });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Add New Driver</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="driver-name"
              className="text-xs font-medium block mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Driver Name *
            </label>
            <input
              id="driver-name"
              type="text"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Revenue Growth Rate"
              className="w-full p-2 rounded text-sm border"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="driver-category"
              className="text-xs font-medium block mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Category
            </label>
            <input
              id="driver-category"
              type="text"
              value={form.category}
              onChange={(e) => set({ category: e.target.value })}
              placeholder="e.g. Revenue, Cost, Workforce"
              className="w-full p-2 rounded text-sm border"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="driver-desc"
              className="text-xs font-medium block mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Description
            </label>
            <input
              id="driver-desc"
              type="text"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Brief description"
              className="w-full p-2 rounded text-sm border"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="driver-unit"
              className="text-xs font-medium block mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Unit
            </label>
            <select
              id="driver-unit"
              value={form.unit}
              onChange={(e) => set({ unit: e.target.value as NewDriverForm['unit'] })}
              className="w-full p-2 rounded text-sm border"
              style={inputStyle}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="absolute">Absolute</option>
              <option value="index">Index</option>
              <option value="ratio">Ratio</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="driver-base"
              className="text-xs font-medium block mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Base / Current Value
            </label>
            <div className="flex gap-2">
              <input
                id="driver-base"
                type="number"
                value={form.baseValue}
                onChange={(e) => set({ baseValue: Number(e.target.value) })}
                className="w-full p-2 rounded text-sm border"
                style={inputStyle}
              />
              <input
                type="number"
                value={form.currentValue}
                onChange={(e) => set({ currentValue: Number(e.target.value) })}
                className="w-full p-2 rounded text-sm border"
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="driver-min"
              className="text-xs font-medium block mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Min / Max / Step
            </label>
            <div className="flex gap-2">
              <input
                id="driver-min"
                type="number"
                value={form.minValue}
                onChange={(e) => set({ minValue: Number(e.target.value) })}
                className="w-full p-2 rounded text-sm border"
                style={inputStyle}
              />
              <input
                type="number"
                value={form.maxValue}
                onChange={(e) => set({ maxValue: Number(e.target.value) })}
                className="w-full p-2 rounded text-sm border"
                style={inputStyle}
              />
              <input
                type="number"
                value={form.step}
                onChange={(e) => set({ step: Number(e.target.value) })}
                className="w-full p-2 rounded text-sm border"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={onSubmit} disabled={!form.name.trim()}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Driver
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
