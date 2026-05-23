import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useScenarioStore } from '@/store/scenarioStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { TreemapChart, TreemapDataPoint } from '@/components/charts/TreemapChart';
import { Plus, Eye, FlaskConical } from 'lucide-react';

export default function ScenarioListPage() {
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Scenario List';
  }, []);

  const { scenarios } = useScenarioStore();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = scenarios;
    if (typeFilter !== 'all') list = list.filter((s) => s.type === typeFilter);
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [scenarios, typeFilter]);

  const treemapData = useMemo<TreemapDataPoint[]>(() => {
    return scenarios.map((s) => ({
      name: s.name,
      size: Math.round(s.probability * 100) || 1,
    }));
  }, [scenarios]);

  if (scenarios.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <FlaskConical className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Scenarios Yet</h2>
        <p className="text-slate-400 mb-6">
          Create scenarios to model different financial outcomes and compare them side by side.
        </p>
        <Button onClick={() => navigate('/scenarios/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Scenario
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Scenarios</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            ></button>
          </div>
          <p className="text-sm text-slate-400 mt-1">{scenarios.length} scenarios</p>
        </div>
        <Button onClick={() => navigate('/scenarios/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Scenario
        </Button>
      </div>

      <div className="flex gap-1">
        {['all', 'Base', 'Optimistic', 'Pessimistic', 'Custom'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={
              'px-2.5 py-1.5 rounded text-xs font-medium transition-colors ' +
              (typeFilter === t
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700')
            }
          >
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      {treemapData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2">Scenario Probability Distribution</h3>
            <TreemapChart
              data={treemapData}
              height={200}
              ariaLabel="Scenario probability treemap"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-500">
            No scenarios match the filter.
          </div>
        ) : (
          filtered.map((s) => (
            <Card
              key={s.id}
              className="cursor-pointer hover:border-blue-500/50 transition-all"
              onClick={() => navigate('/scenarios/' + s.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{s.name}</h3>
                  <Badge variant={s.isActive ? 'default' : 'outline'} className="text-[10px]">
                    {s.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{s.description}</p>
                <div className="flex gap-2 text-xs text-slate-500">
                  <Badge variant="secondary" className="text-[10px]">
                    {s.type}
                  </Badge>
                  <span>{(s.probability * 100).toFixed(0)}% probability</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
