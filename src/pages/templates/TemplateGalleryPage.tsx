import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import {
  LayoutGrid,
  TrendingUp,
  FileText,
  BarChart3,
  Download,
  Upload,
  Search,
  ChevronRight,
} from 'lucide-react';
import { allTemplates, templateCategories, industryLabels } from '@/config/templates';
import { TemplateEngine } from '@/engines/TemplateEngine';
import type { Template, TemplateCategory } from '@/engines/TemplateEngine';

const categoryIcons: Record<TemplateCategory, React.ReactNode> = {
  budget: <LayoutGrid className="h-4 w-4" />,
  forecast: <TrendingUp className="h-4 w-4" />,
  report: <FileText className="h-4 w-4" />,
  dashboard: <BarChart3 className="h-4 w-4" />,
};

export default function TemplateGalleryPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const filteredTemplates = useMemo(() => {
    let templates =
      activeCategory === 'all'
        ? allTemplates
        : TemplateEngine.listTemplates(allTemplates, activeCategory);
    if (search) {
      const q = search.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.industry.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.includes(q))
      );
    }
    return templates;
  }, [activeCategory, search]);

  const totalTemplates = allTemplates.length;
  const totalCategories = templateCategories.length;
  const totalIndustries = new Set(allTemplates.map((t) => t.industry)).size;

  const handleApply = (template: Template) => {
    // Instantiate and navigate to the appropriate editor
    const instance = TemplateEngine.instantiateTemplate(template);
    // Store instance in sessionStorage for the editor to pick up
    sessionStorage.setItem('templateInstance', JSON.stringify(instance));
    sessionStorage.setItem('template', JSON.stringify(template));

    // Route based on category
    const routeMap: Record<TemplateCategory, string> = {
      budget: '/budgets',
      forecast: '/forecasts',
      report: '/reports',
      dashboard: '/dashboard',
    };
    navigate(routeMap[template.category]);
  };

  const handleExport = (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    const json = TemplateEngine.exportTemplate(template);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Template Gallery</h1>
          <p className="text-muted-foreground">
            Pre-built templates for budgets, forecasts, and reports across 16 industries
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-1" /> Import
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Total Templates"
              value={totalTemplates}
              icon={<LayoutGrid className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Categories"
              value={totalCategories}
              icon={<FileText className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Industries"
              value={totalIndustries}
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue label="Featured" value={3} icon={<TrendingUp className="h-4 w-4" />} />
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm bg-background"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All ({totalTemplates})
          </button>
          {templateCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {categoryIcons[cat.id]}
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedTemplate(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {categoryIcons[template.category]}
                  <CardTitle className="text-base">{template.name}</CardTitle>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {template.category}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {template.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{industryLabels[template.industry]}</span>
                  <span>·</span>
                  <span>{template.rows.length} rows</span>
                  <span>·</span>
                  <span>{template.kpis.length} KPIs</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleExport(template, e)}
                    title="Export template"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No templates match your search.</p>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedTemplate.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTemplate.description}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium capitalize">{selectedTemplate.category}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Industry:</span>
                  <p className="font-medium">{industryLabels[selectedTemplate.industry]}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Rows:</span>
                  <p className="font-medium">{selectedTemplate.rows.length}</p>
                </div>
              </div>

              {/* KPIs */}
              {selectedTemplate.kpis.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Key Performance Indicators</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTemplate.kpis.map((kpi) => (
                      <div
                        key={kpi.id}
                        className="flex items-center gap-2 text-sm p-2 bg-muted rounded"
                      >
                        <span>{kpi.label}</span>
                        {kpi.target && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            Target: {kpi.format === 'currency' ? '$' : ''}
                            {kpi.target}
                            {kpi.format === 'percentage' ? '%' : ''}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Line Items Preview */}
              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Line Items ({selectedTemplate.rows.length})
                </h4>
                <div className="max-h-48 overflow-auto border rounded">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted">
                        <th className="text-left p-2">Item</th>
                        {selectedTemplate.columns.slice(1).map((col) => (
                          <th key={col.key} className="text-right p-2">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTemplate.rows.slice(0, 10).map((row) => (
                        <tr
                          key={row.id}
                          className={`border-b ${row.isTotal ? 'font-semibold bg-muted/50' : ''}`}
                        >
                          <td className="p-2" style={{ paddingLeft: `${row.level * 16 + 8}px` }}>
                            {row.label}
                          </td>
                          {selectedTemplate.columns.slice(1).map((col) => (
                            <td key={col.key} className="text-right p-2 text-muted-foreground">
                              {col.type === 'currency'
                                ? '$0'
                                : col.type === 'percentage'
                                  ? '0%'
                                  : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {selectedTemplate.rows.length > 10 && (
                        <tr>
                          <td
                            colSpan={selectedTemplate.columns.length}
                            className="p-2 text-center text-muted-foreground"
                          >
                            ... {selectedTemplate.rows.length - 10} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Charts */}
              {selectedTemplate.charts.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Charts ({selectedTemplate.charts.length})
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTemplate.charts.map((chart) => (
                      <span key={chart.title} className="px-2 py-1 text-xs bg-muted rounded">
                        {chart.type}: {chart.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleApply(selectedTemplate);
                    setSelectedTemplate(null);
                  }}
                >
                  <ChevronRight className="h-4 w-4 mr-1" /> Apply Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
