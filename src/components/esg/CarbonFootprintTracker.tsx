import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Button } from '@/components/ui/Button';
import { ESGEngine, CarbonActivity } from '@/engines/ESGEngine';
import { Leaf, Plus, Trash2, Factory, Zap, Truck } from 'lucide-react';

interface ActivityEntry {
  id: string;
  type: string;
  amount: string;
  unit: CarbonActivity['unit'];
  emissionFactor: string;
}

const ACTIVITY_TYPES = [
  { value: 'gas', label: 'Natural Gas', icon: Factory, scope: 1 },
  { value: 'fuel', label: 'Fuel Combustion', icon: Factory, scope: 1 },
  { value: 'electricity', label: 'Electricity', icon: Zap, scope: 2 },
  { value: 'transport', label: 'Transportation', icon: Truck, scope: 3 },
  { value: 'waste', label: 'Waste', icon: Leaf, scope: 3 },
];

const UNITS: CarbonActivity['unit'][] = ['kWh', 'therms', 'gallons', 'miles', 'tonnes'];

let activityIdCounter = 0;

function createActivity(): ActivityEntry {
  activityIdCounter += 1;
  return {
    id: `act-${activityIdCounter}`,
    type: 'electricity',
    amount: '',
    unit: 'kWh',
    emissionFactor: '',
  };
}

interface CarbonFootprintTrackerProps {
  className?: string;
}

export function CarbonFootprintTracker({ className }: CarbonFootprintTrackerProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([createActivity()]);
  const [result, setResult] = useState<ReturnType<
    typeof ESGEngine.calculateCarbonFootprint
  > | null>(null);

  const updateActivity = useCallback((id: string, field: keyof ActivityEntry, value: string) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  }, []);

  const addActivity = useCallback(() => {
    setActivities((prev) => [...prev, createActivity()]);
  }, []);

  const removeActivity = useCallback((id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const calculate = useCallback(() => {
    const parsed: CarbonActivity[] = activities
      .filter((a) => a.amount && a.emissionFactor)
      .map((a) => ({
        type: a.type,
        amount: parseFloat(a.amount) || 0,
        unit: a.unit,
        emissionFactor: parseFloat(a.emissionFactor) || 0,
      }));

    if (parsed.length === 0) return;

    const carbonResult = ESGEngine.calculateCarbonFootprint(parsed);
    setResult(carbonResult);
  }, [activities]);

  const formatTons = (n: number): string => `${n.toFixed(2)} tCO2e`;

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <KPIValue
          label="Total CO2"
          value={result ? formatTons(result.totalCO2) : '--'}
          icon={<Leaf className="h-4 w-4" />}
        />
        <KPIValue
          label="Scope 1"
          value={result ? formatTons(result.scope1) : '--'}
          icon={<Factory className="h-4 w-4" />}
        />
        <KPIValue
          label="Scope 2"
          value={result ? formatTons(result.scope2) : '--'}
          icon={<Zap className="h-4 w-4" />}
        />
        <KPIValue
          label="Scope 3"
          value={result ? formatTons(result.scope3) : '--'}
          icon={<Truck className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Carbon Activities</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={addActivity}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
              <Button size="sm" onClick={calculate}>
                Calculate
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              >
                <div className="col-span-3">
                  <select
                    value={activity.type}
                    onChange={(e) => updateActivity(activity.id, 'type', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-white"
                    aria-label="Activity type"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label} (Scope {t.scope})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={activity.amount}
                    onChange={(e) => updateActivity(activity.id, 'amount', e.target.value)}
                    placeholder="Amount"
                    className="w-full bg-white dark:bg-gray-900 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-white"
                    aria-label="Amount"
                  />
                </div>
                <div className="col-span-2">
                  <select
                    value={activity.unit}
                    onChange={(e) =>
                      updateActivity(activity.id, 'unit', e.target.value as CarbonActivity['unit'])
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
                    aria-label="Unit"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    value={activity.emissionFactor}
                    onChange={(e) => updateActivity(activity.id, 'emissionFactor', e.target.value)}
                    placeholder="Emission factor"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
                    aria-label="Emission factor"
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeActivity(activity.id)}
                    disabled={activities.length === 1}
                    aria-label="Remove activity"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {result && result.breakdown.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-700">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Breakdown by Category</h4>
              <div className="space-y-2">
                {result.breakdown.map((item) => (
                  <div key={item.category} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-20 capitalize">{item.category}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${
                            result.totalCO2 > 0 ? (item.tons / result.totalCO2) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-24 text-right">
                      {formatTons(item.tons)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
