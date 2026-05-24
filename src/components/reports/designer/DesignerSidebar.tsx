import React from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Layers, 
  Type, 
  Hash, 
  Calendar, 
  Globe, 
  Tag,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useCubeStore } from '@/store/cubeStore';

interface DesignerSidebarProps {
  onDragStart: (e: React.DragEvent, item: { type: string; value: any }) => void;
}

export function DesignerSidebar({ onDragStart }: DesignerSidebarProps) {
  const { engine } = useCubeStore();
  const dimensions = engine.listDimensions();
  const cubes = engine.listCubes();

  return (
    <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden select-none">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-400" />
          Data Sources
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Dimensions */}
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider px-1">
            Dimensions
          </h3>
          <div className="grid gap-1">
            {dimensions.map((dim) => (
              <motion.div
                key={dim}
                draggable
                onDragStart={(e) => onDragStart(e as any, { type: 'dimension', value: dim })}
                whileHover={{ x: 4 }}
                className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <DimensionIcon name={dim} className="h-4 w-4 text-blue-400/70" />
                <span className="text-sm text-slate-300">{dim}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Cubes & Measures */}
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider px-1">
            Measures
          </h3>
          <div className="space-y-4">
            {cubes.map((cubeName) => {
              const cube = engine.getCube(cubeName);
              return (
                <div key={cubeName} className="space-y-1">
                  <div className="flex items-center gap-1.5 px-1 py-1 text-xs font-semibold text-slate-400">
                    <Layers className="h-3 w-3" />
                    {cubeName}
                  </div>
                  <div className="grid gap-1 pl-4">
                    {cube?.measures.map((m) => (
                      <motion.div
                        key={`${cubeName}-${m.name}`}
                        draggable
                        onDragStart={(e) => onDragStart(e as any, { type: 'measure', value: { cube: cubeName, measure: m.name } })}
                        whileHover={{ x: 4 }}
                        className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-grab active:cursor-grabbing"
                      >
                        <Hash className="h-3.5 w-3.5 text-green-400/70" />
                        <span className="text-sm text-slate-300">{m.name}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Formatting/Standard Elements */}
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider px-1">
            Elements
          </h3>
          <div className="grid gap-1">
            <motion.div
              draggable
              onDragStart={(e) => onDragStart(e as any, { type: 'element', value: 'header' })}
              whileHover={{ x: 4 }}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-grab"
            >
              <Type className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-slate-300">Section Header</span>
            </motion.div>
            <motion.div
              draggable
              onDragStart={(e) => onDragStart(e as any, { type: 'element', value: 'total' })}
              whileHover={{ x: 4 }}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-grab"
            >
              <Hash className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-slate-300">Total Row</span>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}

function DimensionIcon({ name, className }: { name: string; className?: string }) {
  const n = name.toLowerCase();
  if (n.includes('time') || n.includes('period')) return <Calendar className={className} />;
  if (n.includes('entity') || n.includes('org')) return <Globe className={className} />;
  if (n.includes('account')) return <Database className={className} />;
  return <Tag className={className} />;
}
