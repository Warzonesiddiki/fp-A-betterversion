import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import {
  ReportBuilderEngine,
  type ReportDefinition,
  type TemplateType,
} from '@/engines/ReportBuilderEngine';

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
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[520px] max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">New Report from Template</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-lg leading-none"
            >
              &times;
            </button>
          </div>

          <div className="p-4 space-y-2 overflow-y-auto max-h-[50vh]">
            {TEMPLATES.map((t) => (
              <button
                key={t.type}
                onClick={() => onSelectTemplate(t.type)}
                className="w-full text-left px-4 py-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-blue-500 hover:bg-slate-800 transition-colors"
              >
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
              </button>
            ))}
          </div>

          {savedReports.length > 0 && (
            <div className="p-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
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
                    className="w-full text-left px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/30 hover:border-blue-500 transition-colors"
                  >
                    <p className="text-xs text-white">{r.name}</p>
                    <p className="text-[10px] text-slate-500">
                      v{r.version} - {r.layout.rows.length} rows,{' '}
                      {r.layout.columns.length} cols
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
