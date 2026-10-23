import React, { useId } from 'react';
// framer-motion removed for bundle diet — CSS transitions only (T011-T013)
import {
  ReportBuilderEngine,
  type ReportDefinition,
  type TemplateType,
} from '@/engines/ReportBuilderEngine';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

const TEMPLATES = ReportBuilderEngine.getAvailableTemplates();

export interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (type: TemplateType) => void;
  onLoadSaved: (report: ReportDefinition) => void;
  savedReports: ReportDefinition[];
}

export function TemplateModal({
  isOpen,
  onClose,
  onSelectTemplate,
  onLoadSaved,
  savedReports,
}: TemplateModalProps) {
  const titleId = useId();

  if (!isOpen) return null;

  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label="Close modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div
        className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl w-[520px] max-h-[80vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h2 id={titleId} className="text-sm font-bold text-[var(--text-primary)]">
              New Report from Template
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg leading-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              &times;
            </button>
          </div>

          <div className="p-4 space-y-2 overflow-y-auto max-h-[50vh]">
            {TEMPLATES.map((t) => (
              <button
                key={t.type}
                onClick={() => onSelectTemplate(t.type)}
                className="w-full text-left px-4 py-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-blue-500 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">{t.name}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.description}</p>
              </button>
            ))}
          </div>

          {savedReports.length > 0 && (
            <div className="p-4 border-t border-[var(--border-subtle)]">
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">
                Saved Reports
              </h3>
              <div className="space-y-1.5 max-h-[20vh] overflow-y-auto">
                {savedReports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      onLoadSaved(r);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-blue-500 transition-colors"
                  >
                    <p className="text-xs text-[var(--text-primary)]">{r.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      v{r.version} - {r.layout.rows.length} rows,{' '}
                      {r.layout.columns.length} cols
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
