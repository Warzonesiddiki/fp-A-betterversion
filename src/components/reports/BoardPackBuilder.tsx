import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function BoardPackBuilder() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-4">
        <h3 className="font-bold text-[var(--text-primary)]">Sections</h3>
        <div className="space-y-2">
          {[
            'Executive Summary',
            'P&L Statement',
            'Balance Sheet',
            'Cash Flow',
            'Variance Analysis',
          ].map((s) => (
            <Card key={s} className="p-3 text-sm cursor-move hover:border-blue-500">
              {s}
            </Card>
          ))}
        </div>
        <Button className="w-full">Generate PDF</Button>
      </div>
      <div className="md:col-span-2 bg-white rounded-lg p-12 min-h-[600px] shadow-2xl text-slate-900 overflow-hidden">
        <h1 className="text-3xl font-bold mb-8">Executive Summary</h1>
        <div className="h-4 bg-slate-100 w-3/4 mb-4" />
        <div className="h-4 bg-slate-100 w-full mb-4" />
        <div className="h-4 bg-slate-100 w-2/3 mb-4" />
      </div>
    </div>
  );
}
