import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportStore } from '@/store/reportStore';
import { ReportTemplateLibrary } from '@/components/reports/ReportTemplateLibrary';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  type ReportDefinition,
  type TemplateType,
} from '@/engines/ReportBuilderEngine';

/** Sort field options */
type SortField = 'name' | 'updatedAt' | 'createdAt' | 'template';
type SortDir = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

/** All template type labels for the filter chips */
const TEMPLATE_LABELS: Record<TemplateType, string> = {
  income_statement: 'Income Statement',
  balance_sheet: 'Balance Sheet',
  cash_flow: 'Cash Flow',
  budget_vs_actual: 'Budget vs Actual',
  variance_analysis: 'Variance Analysis',
  board_pack: 'Board Pack',
  executive_summary: 'Executive Summary',
  custom: 'Custom',
};

/** Sort dropdown options */
const SORT_OPTIONS: Array<{ value: `${SortField}:${SortDir}`; label: string }> = [
  { value: 'updatedAt:desc', label: 'Recently updated' },
  { value: 'name:asc', label: 'Name (A → Z)' },
  { value: 'name:desc', label: 'Name (Z → A)' },
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
];

export default function ReportTemplateLibraryPage() {
  const navigate = useNavigate();
  const { reports, createReport, deleteReport } = useReportStore();

  useEffect(() => {
    document.title = 'FinPlan Pro - Report Templates';
  }, []);

  // ── Local view state ─────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState<TemplateType | 'all'>('all');
  const [sortValue, setSortValue] = useState<`${SortField}:${SortDir}`>('updatedAt:desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());

  // ── Stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const all = reports ?? [];
    return {
      total: all.length,
      active: all.filter((r) => !r.isArchived).length,
      archived: all.filter((r) => r.isArchived).length,
      sectors: new Set(all.flatMap((r) => r.tags ?? [])).size,
    };
  }, [reports]);

  // ── Filtered + sorted reports ────────────────────────────────────
  const visibleReports = useMemo(() => {
    const all = (reports as unknown as ReportDefinition[]) ?? [];
    const q = search.trim().toLowerCase();

    let filtered = all.filter((r) => {
      // Template type filter
      if (templateFilter !== 'all' && r.template !== templateFilter) return false;
      // Search across name + description + tags
      if (q) {
        const haystack = `${r.name} ${r.description} ${(r.tags ?? []).join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // Sort
    const [field, dir] = sortValue.split(':') as [SortField, SortDir];
    filtered = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (field === 'name') cmp = a.name.localeCompare(b.name);
      else if (field === 'template') cmp = a.template.localeCompare(b.template);
      else cmp = (a[field] ?? '').localeCompare(b[field] ?? '');
      return dir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [reports, search, templateFilter, sortValue]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleSelectTemplate = useCallback(
    (template: TemplateType) => {
      createReport({
        name: `${TEMPLATE_LABELS[template]} Report`,
        type: template,
        format: 'standard',
        createdAt: new Date().toISOString(),
        createdBy: 'current-user',
      });
      navigate(`/reports`);
    },
    [createReport, navigate]
  );

  const handleSelectReport = useCallback(
    (report: ReportDefinition) => {
      navigate(`/reports?selected=${report.id}`);
    },
    [navigate]
  );

  const handleDeleteReport = useCallback(
    (reportId: string) => {
      deleteReport(reportId);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    },
    [deleteReport]
  );

  const handleCloneReport = useCallback(
    (report: ReportDefinition) => {
      createReport({
        name: `${report.name} (Copy)`,
        type: report.template,
        format: 'standard',
        createdAt: new Date().toISOString(),
        createdBy: 'current-user',
      });
    },
    [createReport]
  );

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    const ok = window.confirm(
      `Delete ${selectedIds.size} report${selectedIds.size === 1 ? '' : 's'}? This cannot be undone.`
    );
    if (!ok) return;
    selectedIds.forEach((id) => deleteReport(id));
    setSelectedIds(new Set());
  }, [selectedIds, deleteReport]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setTemplateFilter('all');
  }, []);

  return (
    <main
      className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden"
      role="main"
      aria-label="Report template library"
    >
      {/* Stats header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Report Templates
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Browse, filter, and create financial reports from pre-built templates.
            </p>
          </div>
          <Button onClick={() => handleSelectTemplate('custom')}>
            + New Custom Report
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="p-3">
              <div className="text-xs uppercase text-blue-700 dark:text-blue-300">Total</div>
              <div className="mt-1 font-mono text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.total}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950">
            <CardContent className="p-3">
              <div className="text-xs uppercase text-green-700 dark:text-green-300">Active</div>
              <div className="mt-1 font-mono text-2xl font-bold text-green-900 dark:text-green-100">
                {stats.active}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 dark:bg-gray-800">
            <CardContent className="p-3">
              <div className="text-xs uppercase text-gray-700 dark:text-gray-300">Archived</div>
              <div className="mt-1 font-mono text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.archived}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-950">
            <CardContent className="p-3">
              <div className="text-xs uppercase text-purple-700 dark:text-purple-300">Tags</div>
              <div className="mt-1 font-mono text-2xl font-bold text-purple-900 dark:text-purple-100">
                {stats.sectors}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filter + sort bar */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-950">
        <div className="flex-1">
          <Input
            label="Search reports"
            placeholder="Search by name, description, or tag…"
            value={search}
            onChange={(v) => setSearch(v)}
          />
        </div>

        <div className="w-48">
          <label htmlFor="sort" className="sr-only">
            Sort by
          </label>
          <select
            id="sort"
            value={sortValue}
            onChange={(e) => setSortValue(e.target.value as `${SortField}:${SortDir}`)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-pressed={viewMode === 'grid'}
            className={`px-3 py-2 text-sm font-medium ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            className={`border-l border-gray-300 px-3 py-2 text-sm font-medium dark:border-gray-600 ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Template type filter chips */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-900">
        <button
          type="button"
          onClick={() => setTemplateFilter('all')}
          aria-pressed={templateFilter === 'all'}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            templateFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          All ({stats.total})
        </button>
        {(Object.keys(TEMPLATE_LABELS) as TemplateType[]).map((tpl) => {
          const count = (reports ?? []).filter((r) => (r as unknown as ReportDefinition).template === tpl).length;
          if (count === 0) return null;
          return (
            <button
              key={tpl}
              type="button"
              onClick={() => setTemplateFilter(tpl)}
              aria-pressed={templateFilter === tpl}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                templateFilter === tpl
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {TEMPLATE_LABELS[tpl]} ({count})
            </button>
          );
        })}
        {(search || templateFilter !== 'all') && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="ml-2 text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Bulk actions toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between border-b border-blue-200 bg-blue-50 px-6 py-2 dark:border-blue-800 dark:bg-blue-950">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="default">{selectedIds.size} selected</Badge>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-blue-700 hover:underline dark:text-blue-300"
            >
              Clear selection
            </button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkDelete}>
              Delete selected
            </Button>
          </div>
        </div>
      )}

      {/* Library (delegates to existing component) */}
      <div className="flex-1 overflow-hidden">
        <ReportTemplateLibrary
          savedReports={visibleReports}
          onSelectTemplate={handleSelectTemplate}
          onSelectReport={handleSelectReport}
          onDeleteReport={handleDeleteReport}
          onCloneReport={handleCloneReport}
        />
      </div>

      {/* Empty state overlay */}
      {visibleReports.length === 0 && (search || templateFilter !== 'all') && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center">
          <Card className="pointer-events-auto bg-white shadow-lg dark:bg-gray-800">
            <CardHeader>
              <CardTitle>No reports match your filters</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                Try adjusting your search or clearing the active filter.
              </p>
              <Button onClick={handleClearFilters}>Clear filters</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
