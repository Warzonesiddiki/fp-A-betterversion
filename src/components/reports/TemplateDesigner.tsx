import { useCallback, useState } from 'react';
import type {
  ExportTemplate,
  TemplateSection,
  TemplateStyle,
  TemplateType,
} from '@/engines/ExportTemplateEngine';

interface TemplateDesignerProps {
  template?: ExportTemplate;
  onSave: (template: ExportTemplate) => void;
  onCancel: () => void;
}

const SECTION_TYPES: Array<{ value: TemplateSection['type']; label: string }> = [
  { value: 'cover', label: 'Cover Page' },
  { value: 'kpi_summary', label: 'KPI Summary' },
  { value: 'table', label: 'Data Table' },
  { value: 'text', label: 'Text Block' },
  { value: 'page_break', label: 'Page Break' },
];

const TEMPLATE_TYPES: Array<{ value: TemplateType; label: string }> = [
  { value: 'board_pack', label: 'Board Pack' },
  { value: 'pl_statement', label: 'P&L Statement' },
  { value: 'balance_sheet', label: 'Balance Sheet' },
  { value: 'cash_flow', label: 'Cash Flow' },
  { value: 'budget_vs_actual', label: 'Budget vs Actual' },
  { value: 'kpi_summary', label: 'KPI Summary' },
];

let nextId = 1;

export function TemplateDesigner({ template, onSave, onCancel }: TemplateDesignerProps) {
  const [name, setName] = useState(template?.name ?? 'New Template');
  const [description, setDescription] = useState(template?.description ?? '');
  const [type, setType] = useState<TemplateType>(template?.type ?? 'board_pack');
  const [sections, setSections] = useState<TemplateSection[]>(template?.sections ?? []);
  const [style, setStyle] = useState<TemplateStyle>(
    template?.style ?? {
      primaryColor: '#1E3A5F',
      secondaryColor: '#4A90D9',
      fontFamily: 'helvetica',
      headerFontSize: 10,
      bodyFontSize: 8,
      companyName: 'FinPlan Pro',
    }
  );
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const addSection = useCallback(
    (sectionType: TemplateSection['type']) => {
      const id = `section-${Date.now()}-${nextId++}`;
      const newSection: TemplateSection = {
        id,
        type: sectionType,
        title:
          sectionType === 'cover'
            ? 'Cover Page'
            : sectionType === 'page_break'
              ? ''
              : `New ${sectionType.replace(/_/g, ' ')}`,
        order: sections.length,
        config:
          sectionType === 'cover'
            ? { title: name, subtitle: '', confidential: true }
            : sectionType === 'kpi_summary'
              ? { kpis: [] }
              : sectionType === 'table'
                ? { headers: [], rows: [] }
                : sectionType === 'text'
                  ? { content: '' }
                  : {},
      };
      setSections((prev) => [...prev, newSection]);
      setSelectedSection(id);
    },
    [sections.length, name]
  );

  const removeSection = useCallback(
    (id: string) => {
      setSections((prev) => prev.filter((s) => s.id !== id));
      if (selectedSection === id) setSelectedSection(null);
    },
    [selectedSection]
  );

  const moveSection = useCallback((id: string, direction: 'up' | 'down') => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const updateSectionTitle = useCallback((id: string, title: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  }, []);

  const handleSave = useCallback(() => {
    const now = new Date().toISOString();
    onSave({
      id: template?.id ?? `tpl-custom-${Date.now()}`,
      name,
      type,
      description,
      sections: sections.map((s, i) => ({ ...s, order: i })),
      style,
      variables: [
        { key: 'entity', label: 'Entity', defaultValue: 'Company Name' },
        { key: 'period', label: 'Period', defaultValue: 'FY 2026' },
        { key: 'currency', label: 'Currency', defaultValue: 'USD' },
        { key: 'date', label: 'Date', defaultValue: new Date().toLocaleDateString() },
        { key: 'preparedBy', label: 'Prepared By', defaultValue: 'Finance Team' },
      ],
      createdAt: template?.createdAt ?? now,
      updatedAt: now,
    });
  }, [name, type, description, sections, style, template, onSave]);

  const active = sections.find((s) => s.id === selectedSection);

  return (
    <div className="flex h-full">
      {/* Left: Section list */}
      <div className="w-64 border-r border-[var(--border-subtle)] dark:border-gray-700 p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Sections
        </h3>
        <div className="space-y-1 mb-4">
          {sections.map((section) => (
            <div
              key={section.id}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedSection(section.id);
              }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
                selectedSection === section.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-[var(--bg-hover)] dark:hover:bg-gray-800 text-[var(--text-secondary)] dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500'
              }`}
              onClick={() => setSelectedSection(section.id)}
            >
              <span className="flex-1 truncate">{section.title || section.type}</span>
              <button
                className="text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-[var(--text-secondary)] dark:hover:text-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  moveSection(section.id, 'up');
                }}
                aria-label={`Move ${section.title || section.type} up`}
              >
                ↑
              </button>
              <button
                className="text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-[var(--text-secondary)] dark:hover:text-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  moveSection(section.id, 'down');
                }}
                aria-label={`Move ${section.title || section.type} down`}
              >
                ↓
              </button>
              <button
                className="text-red-400 hover:fin-negative"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSection(section.id);
                }}
                aria-label={`Remove ${section.title || section.type} section`}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Add Section
        </h3>
        <div className="space-y-1">
          {SECTION_TYPES.map((st) => (
            <button
              key={st.value}
              className="w-full text-left px-2 py-1.5 text-sm rounded bg-gray-50 dark:bg-gray-800 dark:bg-gray-900 dark:bg-gray-800 hover:bg-[var(--bg-hover)] dark:hover:bg-gray-700 text-[var(--text-secondary)] dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500"
              onClick={() => addSection(st.value)}
            >
              + {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Section editor */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-default)] dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[var(--text-primary)] dark:text-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TemplateType)}
                className="w-full px-3 py-2 border border-[var(--border-default)] dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[var(--text-primary)] dark:text-gray-100"
              >
                {TEMPLATE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={style.companyName}
                onChange={(e) => setStyle((s) => ({ ...s, companyName: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--border-default)] dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[var(--text-primary)] dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-[var(--border-default)] dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[var(--text-primary)] dark:text-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Primary Color
              </label>
              <input
                type="color"
                value={style.primaryColor}
                onChange={(e) => setStyle((s) => ({ ...s, primaryColor: e.target.value }))}
                className="w-full h-10 border border-[var(--border-default)] dark:border-gray-600 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Secondary Color
              </label>
              <input
                type="color"
                value={style.secondaryColor}
                onChange={(e) => setStyle((s) => ({ ...s, secondaryColor: e.target.value }))}
                className="w-full h-10 border border-[var(--border-default)] dark:border-gray-600 rounded-md"
              />
            </div>
          </div>

          {/* Active section editor */}
          {active && (
            <div className="border border-[var(--border-subtle)] dark:border-gray-700 rounded-lg p-4 mt-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Edit: {active.type.replace(/_/g, ' ')}
              </h4>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={active.title}
                  onChange={(e) => updateSectionTitle(active.id, e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[var(--text-primary)] dark:text-gray-100 text-sm"
                />
              </div>
              {active.type === 'table' && (
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Configure table headers and rows in the template JSON or use the report builder
                  for dynamic data binding.
                </p>
              )}
              {active.type === 'kpi_summary' && (
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  KPI cards are auto-populated from the data context. Customize labels in the
                  template JSON.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="w-48 border-l border-[var(--border-subtle)] dark:border-gray-700 p-4 flex flex-col gap-2">
        <button
          onClick={handleSave}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          Save Template
        </button>
        <button
          onClick={onCancel}
          className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
        >
          Cancel
        </button>
        <div className="mt-4 text-xs text-[var(--text-muted)] dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
          <p className="font-medium mb-1">Variables:</p>
          <p>{'{entity}'} — Company name</p>
          <p>{'{period}'} — Reporting period</p>
          <p>{'{currency}'} — Currency code</p>
          <p>{'{date}'} — Current date</p>
          <p>{'{preparedBy}'} — Author name</p>
        </div>
      </div>
    </div>
  );
}
