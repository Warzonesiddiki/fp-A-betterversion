import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Download,
  ArrowLeft,
  Check,
  LayoutGrid,
  TrendingUp,
  FileText,
  BarChart3,
} from 'lucide-react';
import { allTemplates, industryLabels } from '@/config/templates';
import type { Template, TemplateCategory } from '@/engines/TemplateEngine';

const categoryIcons: Record<TemplateCategory, React.ReactNode> = {
  budget: <LayoutGrid className="h-4 w-4" />,
  forecast: <TrendingUp className="h-4 w-4" />,
  report: <FileText className="h-4 w-4" />,
  dashboard: <BarChart3 className="h-4 w-4" />,
};

export default function TemplatePreviewPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [applied, setApplied] = useState(false);

  const template = useMemo(() => allTemplates.find((t) => t.id === templateId), [templateId]);

  if (!template) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Template Not Found</h1>
        <p className="text-muted-foreground mb-4">The template you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/templates')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Gallery
        </Button>
      </div>
    );
  }

  const handleApply = () => {
    setApplied(true);
    setTimeout(() => {
      navigate('/budgets/create', { state: { templateId: template.id } });
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <p className="text-muted-foreground">{template.description}</p>
          </div>
        </div>
        <Button onClick={handleApply} disabled={applied}>
          {applied ? (
            <>
              <Check className="h-4 w-4 mr-1" /> Applied!
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" /> Apply Template
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm text-muted-foreground">Category</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              {categoryIcons[template.category]}
              <span className="font-medium capitalize">{template.category}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm text-muted-foreground">Industry</div>
            <div className="font-medium mt-1">
              {template.industry ? industryLabels[template.industry] : 'General'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm text-muted-foreground">Sections</div>
            <div className="font-medium mt-1">{template.sections?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {template.sections && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Template Structure</h2>
          {template.sections.map((section, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  {section.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {section.lineItems?.map((item: string, j: number) => (
                    <div key={j} className="px-2 py-1 bg-slate-800 rounded text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {template.kpis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">KPIs Included</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {template.kpis.map((kpi: string, i: number) => (
                <div key={i} className="p-3 bg-slate-800 rounded-lg text-center">
                  <div className="text-sm font-medium">{kpi}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
