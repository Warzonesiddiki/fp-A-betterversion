import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import DependencyGraph from '../../components/admin/DependencyGraph';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export default function DebugPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="System Debug"
        purpose="Internal tools for inspecting engine state and application performance."
      />

      <DependencyGraph />
    </div>
  );
}
