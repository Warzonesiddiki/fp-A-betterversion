import React, { useState, useCallback, useMemo } from 'react';
import { 
  GripVertical, 
  Settings2, 
  Eye, 
  Layout, 
  Save, 
  Undo2, 
  Redo2,
  Trash2,
  Plus,
  Rows,
  Columns,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { useCubeStore } from '@/store/cubeStore';
import { DesignerSidebar } from './DesignerSidebar';
import { ReportGrid } from '../ReportGrid';
import { 
  ReportBuilderEngine, 
  type ReportDefinition, 
  type ReportLayout,
  type RowType,
  type ColumnType,
  type PeriodType,
} from '@/engines/ReportBuilderEngine';

export function ReportDesigner() {
  const { engine, query } = useCubeStore();
  
  // Initial Report State
  const [report, setReport] = useState<ReportDefinition>(() => 
    ReportBuilderEngine.createReport('New Prototype Report', 'custom', 'designer')
  );
  
  const [history, setHistory] = useState<ReportDefinition[]>([report]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ ri: number, ci: number } | null>(null);

  // --- Undo/Redo ---
  const pushHistory = useCallback((next: ReportDefinition) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), next]);
    setHistoryIndex(i => i + 1);
    setReport(next);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const next = historyIndex - 1;
      setHistoryIndex(next);
      setReport(history[next]);
    }
  }, [historyIndex, history]);

  // --- Mutations ---
  const updateLayout = useCallback((updater: (layout: ReportLayout) => ReportLayout) => {
    const nextLayout = updater(report.layout);
    pushHistory({
      ...report,
      layout: nextLayout,
      updatedAt: new Date().toISOString(),
      version: report.version + 1
    });
  }, [report, pushHistory]);

  const handleDrop = useCallback((e: React.DragEvent, target: 'rows' | 'columns') => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (target === 'rows') {
        if (data.type === 'dimension') {
          // Add data rows for members of this dimension
          const members = engine.getMembers(data.value);
          updateLayout(layout => {
            let next = layout;
            // Add a header for the dimension
            next = ReportBuilderEngine.addRow(next, 'header');
            const headerIdx = next.rows.length - 1;
            const labelColIdx = next.columns.findIndex(c => c.type === 'label');
            if (labelColIdx !== -1) {
              next = ReportBuilderEngine.updateCell(next, headerIdx, labelColIdx, {
                type: 'text',
                content: { text: data.value }
              }, { bold: true, backgroundColor: '#1e293b' });
            }
            
            // Add rows for top 5 members as a prototype
            members.slice(0, 8).forEach(m => {
              next = ReportBuilderEngine.addRow(next, 'data');
              const ri = next.rows.length - 1;
              if (labelColIdx !== -1) {
                next = ReportBuilderEngine.updateCell(next, ri, labelColIdx, {
                  type: 'text',
                  content: { text: m.name }
                }, { indent: 1 });
              }
            });
            return next;
          });
        } else if (data.type === 'element') {
          updateLayout(layout => ReportBuilderEngine.addRow(layout, data.value as RowType));
        }
      } else if (target === 'columns') {
        if (data.type === 'measure') {
          updateLayout(layout => ReportBuilderEngine.addColumn(layout, {
            type: 'period',
            header: data.value.measure,
            width: 140,
            period: 'actual'
          }));
        } else if (data.type === 'dimension') {
          // If Time dimension is dropped on columns, add columns for periods
          const members = engine.getMembers(data.value);
          updateLayout(layout => {
            let next = layout;
            members.slice(0, 4).forEach(m => {
              next = ReportBuilderEngine.addColumn(next, {
                type: 'period',
                header: m.name,
                width: 120,
                period: 'actual'
              });
            });
            return next;
          });
        }
      }
    } catch (err) {
      console.error('Drop failed', err);
    }
  }, [engine, updateLayout]);

  // --- Real-time Data Mapping ---
  // In a real app, this would perform actual Cube queries based on the layout bindings
  // For the prototype, we'll generate some realistic mock cube data
  const cubeData = useMemo(() => {
    const data: Record<string, number> = {};
    // Seed with random values for the prototype preview
    report.layout.rows.forEach(row => {
      report.layout.columns.forEach(col => {
        if (col.type !== 'label') {
          const key = `${row.id}.${col.id}`; // Simple mapping for prototype
          // Actually, ReportBuilderEngine expects specific coordinate keys
          // We'll just generate enough for the visible cells
          const labelCell = row.cells.find((_, i) => report.layout.columns[i].type === 'label');
          const rowLabel = (labelCell?.content as any)?.content?.text || 'Unknown';
          const bindingKey = `${rowLabel}.${col.header}`;
          data[bindingKey] = Math.random() * 100000;
          
          // Also set the cell binding if not present
          if (row.type === 'data' && col.type === 'period') {
             // In a real implementation, updateCell would be used to set Metric content
          }
        }
      });
    });
    return data;
  }, [report.layout]);

  return (
    <div className="flex h-full w-full bg-slate-950 overflow-hidden font-sans antialiased text-slate-200">
      {/* Sidebar */}
      {!previewMode && (
        <DesignerSidebar onDragStart={(e, item) => {
          e.dataTransfer.setData('application/json', JSON.stringify(item));
        }} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header/Toolbar */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <input 
                type="text" 
                value={report.name} 
                onChange={e => setReport({...report, name: e.target.value})}
                className="bg-transparent border-none focus:ring-0 font-bold text-white p-0 text-sm h-5"
              />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                WYSIWYG Report Designer
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 rounded-lg p-0.5 mr-2">
              <button 
                onClick={() => setPreviewMode(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  !previewMode ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                )}
              >
                <Layout className="h-3.5 w-3.5" />
                Designer
              </button>
              <button 
                onClick={() => setPreviewMode(true)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  previewMode ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                )}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </button>
            </div>

            <div className="w-px h-6 bg-slate-700 mx-2" />

            <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex === 0}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <Redo2 className="h-4 w-4" />
            </Button>
            
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white ml-2 shadow-blue-900/20">
              <Save className="h-4 w-4 mr-2" />
              Save Report
            </Button>
          </div>
        </header>

        {/* Canvas Area */}
        <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 p-8 relative">
           {/* Drop Zones for Empty State */}
           {report.layout.rows.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="w-full max-w-md p-12 border-2 border-dashed border-slate-700 rounded-3xl flex flex-col items-center gap-6 text-center"
               >
                 <div className="p-4 bg-blue-500/10 rounded-2xl">
                    <Layout className="h-12 w-12 text-blue-400" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Empty Report Canvas</h3>
                    <p className="text-slate-400 text-sm">
                      Drag dimensions from the sidebar onto the canvas to begin building your native report.
                    </p>
                 </div>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-slate-300 border border-slate-700">
                       <Rows className="h-3.5 w-3.5" /> Drop on Rows
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-slate-300 border border-slate-700">
                       <Columns className="h-3.5 w-3.5" /> Drop on Cols
                    </div>
                 </div>
               </motion.div>
             </div>
           )}

           <div className="max-w-6xl mx-auto space-y-8">
              {/* Column Drop Zone */}
              <div 
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, 'columns')}
                className="flex items-center justify-center h-12 border border-dashed border-slate-700 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
              >
                 <span className="text-[10px] uppercase tracking-tighter text-slate-600 group-hover:text-blue-400 font-bold flex items-center gap-2">
                    <Plus className="h-3 w-3" />
                    Drop Dimensions/Measures here for Columns
                 </span>
              </div>

              {/* Grid Canvas */}
              <div className="flex gap-4 items-start">
                 {/* Row Drop Zone Sidebar */}
                 <div 
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, 'rows')}
                    className="w-8 self-stretch border border-dashed border-slate-700 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex items-center justify-center group"
                 >
                    <div className="rotate-90 text-[10px] uppercase tracking-tighter text-slate-600 group-hover:text-blue-400 font-bold flex items-center gap-2 whitespace-nowrap">
                       <Plus className="h-3 w-3" />
                       Drop Dimensions here for Rows
                    </div>
                 </div>

                 {/* The Actual Report Grid */}
                 <div className="flex-1 bg-slate-900/30 rounded-2xl border border-slate-800 p-1 shadow-2xl backdrop-blur-sm">
                    <ReportGrid 
                      layout={report.layout} 
                      cubeData={cubeData}
                      onCellClick={(ri, ci) => setSelectedCell({ ri, ci })}
                      className="rounded-xl overflow-hidden"
                    />
                 </div>
              </div>
           </div>
        </main>

        {/* Properties Panel (Fixed Bottom) */}
        <AnimatePresence>
          {selectedCell && (
            <motion.div 
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              className="absolute bottom-6 right-6 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-30 overflow-hidden"
            >
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5 text-blue-400" />
                  Cell Properties
                </span>
                <button onClick={() => setSelectedCell(null)}>
                  <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-red-400" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-bold">Style</label>
                   <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px]">Bold</Button>
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px]">Italic</Button>
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px]">Border</Button>
                   </div>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-bold">Binding</label>
                   <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px] font-mono text-blue-400 truncate">
                      Cube: GL_Actuals | Dim: Account
                   </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
