import React, { useEffect, useState } from 'react';
import { ReportDesigner } from '@/components/reports/designer/ReportDesigner';
import { useCubeStore } from '@/store/cubeStore';

export default function ReportDesignerPage() {
  const { initialize, isInitialized } = useCubeStore();
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitialized) {
      try {
        initialize();
      } catch (err) {
        setInitError(err instanceof Error ? err.message : 'Failed to initialize report engine');
      }
    }
  }, [isInitialized, initialize]);

  return (
    <div className="h-full w-full overflow-hidden bg-slate-950">
      {initError && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-sm text-red-400 m-4">
          {initError}
        </div>
      )}
      <ReportDesigner />
    </div>
  );
}
