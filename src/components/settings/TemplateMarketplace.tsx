import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface TemplateMarketplaceProps {
  templates: ReportTemplate[];
  onSelect: (id: string) => void;
}

export function TemplateMarketplace({ templates, onSelect }: TemplateMarketplaceProps) {
  if (templates.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-xl border border-dashed border-slate-700">
        No templates available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((t) => (
        <Card
          key={t.id}
          className="p-6 flex flex-col h-full hover:border-blue-500 cursor-pointer transition-colors"
          onClick={() => onSelect(t.id)}
        >
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-bold text-slate-200">{t.name}</h4>
            <Badge variant="default">{t.category}</Badge>
          </div>
          <p className="text-sm text-slate-400 mb-6 flex-1">{t.description}</p>
          <button className="text-sm text-blue-400 font-semibold hover:text-blue-300 self-start">
            Use Template
          </button>
        </Card>
      ))}
    </div>
  );
}
