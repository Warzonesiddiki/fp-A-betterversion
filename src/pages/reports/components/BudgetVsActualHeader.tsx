import { memo } from 'react';
import { HelpCircle, FileText, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

interface BudgetVsActualHeaderProps {
  onHelpClick: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
}

export const BudgetVsActualHeader = memo(function BudgetVsActualHeader({
  onHelpClick,
  onExportPDF,
  onExportExcel,
}: BudgetVsActualHeaderProps) {
  return (
    <div className="flex items-center justify-between" role="region" aria-label="BudgetVsActualHeader">
      <PageHeader
        title="Budget vs Actual"
        actions={<button
                   onClick={onHelpClick}
                   className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                   aria-label="Help"
                 >
                   <HelpCircle className="h-5 w-5" />
                 </button>}
      />
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={onExportPDF} aria-label="Export PDF">
          <FileText className="h-3.5 w-3.5 mr-1.5" />
          PDF
        </Button>
        <Button size="sm" variant="ghost" onClick={onExportExcel} aria-label="Export Excel">
          <TableIcon className="h-3.5 w-3.5 mr-1.5" />
          Excel
        </Button>
      </div>
    </div>
  );
});
