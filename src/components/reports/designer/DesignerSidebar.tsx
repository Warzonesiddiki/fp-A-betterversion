import React, { useState } from 'react';
import {
  Database,
  Layers,
  Hash,
  Calendar,
  Globe,
  Tag,
  GripVertical,
  Rows,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useCubeStore } from '@/store/cubeStore';
import { ROW_TYPES, COLUMN_TYPES } from '../reportBuilder.constants';
import type { DragItem } from '../reportBuilder.constants';

export interface DesignerSidebarProps {
  onDragStart: (e: React.DragEvent, item: DragItem | { type: string; value: unknown }) => void;
}

type SidebarTab = 'data' | 'elements' | 'filters';

function DimensionIcon({ name, className }: { name: string; className?: string }) {
  const n = name.toLowerCase();
  if (n.includes('time') || n.includes('period')) return <Calendar className={className} />;
  if (n.includes('entity') || n.includes('org')) return <Globe className={className} />;
  if (n.includes('account')) return <Database className={className} />;
  return <Tag className={className} />;
}

export function DesignerSidebar({ onDragStart }: DesignerSidebarProps) {
  const { engine } = useCubeStore();
  const [activeTab, setActiveTab] = useState<SidebarTab>('data');

  const dimensions = engine.listDimensions();
  const cubes = engine.listCubes();

  return (
    <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden select-none">
      {/* Tab Bar */}
      <div className="flex border-b border-slate-800">
        {(
          [
            { id: 'data' as const, label: 'Data', icon: Database },
            { id: 'elements' as const, label: 'Elements', icon: Rows },
            { id: 'filters' as const, label: 'Filters', icon: Filter },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={cn(
              'flex-1 px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-center transition-colors',
              activeTab === id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-500 hover:text-slate-300'
            )}
            onClick={() => setActiveTab(id)}
          >
            <Icon className="h-3.5 w-3.5 mx-auto mb-0.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'data' && (
          <>
            {/* Dimensions */}
            <section className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                Dimensions
              </h3>
              <div className="grid gap-1">
                {dimensions.map((dim) => (
                  <div
                    key={dim}
                    draggable
                    onDragStart={(e) =>
                      onDragStart(e as unknown as React.DragEvent, {
                        type: 'dimension',
                        value: dim,
                      })
                    }
                    className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <DimensionIcon name={dim} className="h-3.5 w-3.5 text-blue-400/70" />
                    <span className="text-xs text-slate-300">{dim}</span>
                    <ChevronRight className="h-3 w-3 text-slate-600 ml-auto opacity-0 group-hover:opacity-100" />
                  </div>
                ))}
                {dimensions.length === 0 && (
                  <p className="text-[10px] text-slate-600 px-2 py-3 text-center">
                    No dimensions registered
                  </p>
                )}
              </div>
            </section>

            {/* Measures */}
            <section className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                Measures
              </h3>
              <div className="space-y-3">
                {cubes.map((cubeName) => {
                  const cube = engine.getCube(cubeName);
                  return (
                    <div key={cubeName} className="space-y-1">
                      <div className="flex items-center gap-1.5 px-1 py-1 text-[10px] font-bold text-slate-500 uppercase">
                        <Layers className="h-3 w-3" />
                        {cubeName}
                      </div>
                      <div className="grid gap-0.5 pl-3">
                        {cube?.measures.map((m) => (
                          <div
                            key={`${cubeName}-${m.name}`}
                            draggable
                            onDragStart={(e) =>
                              onDragStart(e as unknown as React.DragEvent, {
                                type: 'measure',
                                value: { cube: cubeName, measure: m.name },
                              })
                            }
                            className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-grab active:cursor-grabbing"
                          >
                            <Hash className="h-3 w-3 text-green-400/70" />
                            <span className="text-xs text-slate-300">{m.name}</span>
                          </div>
                        ))}
                        {(!cube || cube.measures.length === 0) && (
                          <p className="text-[10px] text-slate-600 px-2">No measures</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {cubes.length === 0 && (
                  <p className="text-[10px] text-slate-600 px-2 py-3 text-center">
                    No cubes available
                  </p>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'elements' && (
          <>
            <section className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                Row Types
              </h3>
              <p className="text-[10px] text-slate-600 px-1">Drag onto the row drop zone</p>
              <div className="grid gap-1">
                {ROW_TYPES.map((rt) => (
                  <div
                    key={rt.type}
                    draggable
                    onDragStart={(e) =>
                      onDragStart(e as unknown as React.DragEvent, {
                        type: 'row-type',
                        value: rt.type,
                      })
                    }
                    className="flex items-center gap-2 px-2 py-1.5 rounded border border-slate-700 bg-slate-800/50 cursor-grab hover:border-blue-500 hover:bg-slate-800 transition-colors"
                  >
                    <GripVertical className="h-3 w-3 text-slate-600" />
                    <span
                      className={cn(
                        'text-[10px] font-mono px-1.5 py-0.5 rounded',
                        rt.type === 'total'
                          ? 'bg-green-500/20 text-green-400'
                          : rt.type === 'subtotal'
                            ? 'bg-blue-500/20 text-blue-400'
                            : rt.type === 'header'
                              ? 'bg-purple-500/20 text-purple-400'
                              : rt.type === 'blank'
                                ? 'bg-slate-600 text-slate-400'
                                : 'bg-slate-700 text-slate-300'
                      )}
                    >
                      {rt.icon}
                    </span>
                    <span className="text-xs text-slate-300">{rt.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                Column Types
              </h3>
              <p className="text-[10px] text-slate-600 px-1">Drag onto the column drop zone</p>
              <div className="grid gap-1">
                {COLUMN_TYPES.map((ct) => (
                  <div
                    key={ct.label}
                    draggable
                    onDragStart={(e) =>
                      onDragStart(e as unknown as React.DragEvent, {
                        type: 'column-type',
                        value: ct.label,
                      })
                    }
                    className="flex items-center gap-2 px-2 py-1.5 rounded border border-slate-700 bg-slate-800/50 cursor-grab hover:border-blue-500 hover:bg-slate-800 transition-colors"
                  >
                    <GripVertical className="h-3 w-3 text-slate-600" />
                    <span
                      className={cn(
                        'text-[10px] font-mono px-1.5 py-0.5 rounded',
                        ct.type === 'label'
                          ? 'bg-purple-500/20 text-purple-400'
                          : ct.period === 'actual'
                            ? 'bg-green-500/20 text-green-400'
                            : ct.period === 'budget'
                              ? 'bg-blue-500/20 text-blue-400'
                              : ct.period === 'variance'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-600 text-slate-400'
                      )}
                    >
                      {ct.type === 'label'
                        ? 'L'
                        : ct.period
                          ? ct.period.charAt(0).toUpperCase()
                          : 'C'}
                    </span>
                    <span className="text-xs text-slate-300">{ct.label}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'filters' && (
          <section className="space-y-2">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
              Drag Dimensions to Filter
            </h3>
            <p className="text-[10px] text-slate-600 px-1">
              Drop dimensions onto the filter zone in the canvas to create report filters.
            </p>
            <div className="grid gap-1">
              {dimensions.map((dim) => (
                <div
                  key={dim}
                  draggable
                  onDragStart={(e) =>
                    onDragStart(e as unknown as React.DragEvent, {
                      type: 'dimension',
                      value: dim,
                    })
                  }
                  className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800 border border-transparent hover:border-amber-600/30 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <Filter className="h-3 w-3 text-amber-400/70" />
                  <span className="text-xs text-slate-300">{dim}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
