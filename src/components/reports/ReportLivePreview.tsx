import React from 'react';
import { Eye } from 'lucide-react';
import { ReportGrid } from './ReportGrid';
import type { ReportLayout, CubeData } from '@/engines/ReportBuilderEngine';

export interface ReportLivePreviewProps {
  layout: ReportLayout;
  cubeData: CubeData;
}

export function ReportLivePreview({ layout, cubeData }: ReportLivePreviewProps) {
  return (
    <div className="w-[420px] border-l border-slate-800 overflow-y-auto p-4 bg-slate-950/50">
      <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5" />
        Live Preview
      </h3>
      <div className="origin-top-left scale-[0.65] w-[154%]">
        <ReportGrid layout={layout} cubeData={cubeData} />
      </div>
    </div>
  );
}
