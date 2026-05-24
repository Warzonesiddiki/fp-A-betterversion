import React, { useEffect } from 'react';
import { ReportDesigner } from '@/components/reports/designer/ReportDesigner';
import { useCubeStore } from '@/store/cubeStore';

export default function ReportDesignerPage() {
  const { initialize, isInitialized } = useCubeStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return (
    <div className="h-full w-full overflow-hidden bg-slate-950">
      <ReportDesigner />
    </div>
  );
}
