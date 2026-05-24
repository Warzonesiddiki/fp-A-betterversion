import { Card } from '@/components/ui/Card';
import { Sparkline } from '@/components/ui/Sparkline';

export function ExecutiveSummary() {
  return (
    <div className="space-y-8 print:p-0">
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Revenue', val: '$4.2M', change: '+12%', data: [5, 6, 5.5, 7, 8] },
          { label: 'EBITDA', val: '$1.1M', change: '+4%', data: [1, 1.2, 0.9, 1.1, 1.3] },
          { label: 'Cash Flow', val: '$850k', change: '-2%', data: [1, 0.9, 1.1, 0.8, 0.85] },
        ].map((k) => (
          <Card key={k.label} className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase font-bold">{k.label}</span>
              <div className="text-2xl font-bold text-white">{k.val}</div>
              <span className="text-xs text-green-400">{k.change} vs budget</span>
            </div>
            <div className="w-24 h-8">
              <Sparkline data={k.data} color="#3b82f6" />
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <h3 className="font-bold text-white mb-4">Management Commentary</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Strong revenue performance this period driven by new SaaS bookings. Operating expenses
          remained within budget despite increased marketing spend. Cash position strengthened
          following timely AR collections.
        </p>
      </Card>
    </div>
  );
}
