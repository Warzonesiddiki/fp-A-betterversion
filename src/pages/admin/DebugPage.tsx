import React from 'react';
import DependencyGraph from '../../components/admin/DependencyGraph';

export default function DebugPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">System Debug</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Internal tools for inspecting engine state and application performance.
        </p>
      </div>

      <DependencyGraph />
    </div>
  );
}
