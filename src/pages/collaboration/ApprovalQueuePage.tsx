import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollaborationStore } from '@/store/collaborationStore';
import { useBudgetStore } from '@/store/budgetStore';
import { Button } from '@/components/ui/Button';

import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Table as TableIcon,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface ApprovalRow {
  id: string;
  name: string;
  type: string;
  requester: string;
  amount: number;
  submitted: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'ChangesRequested';
}

export default function ApprovalQueuePage() {
  const _navigate = useNavigate();
  const { approvals, addComment } = useCollaborationStore();
  const { budgets } = useBudgetStore();
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  useEffect(() => {
    document.title = 'FinPlan Pro — Approval Queue';
  }, []);

  const rows: ApprovalRow[] = useMemo(() => {
    if (approvals.length > 0) {
      return approvals.map((a) => ({
        id: a.id,
        name: a.resourceName,
        type: a.resourceType,
        requester: a.requesterName,
        amount: a.amount,
        submitted: a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '-',
        status: a.status,
      }));
    }
    return budgets.map((b) => ({
      id: b.id,
      name: b.name,
      type: 'Budget',
      requester: 'System',
      amount: b.totalAmount || 0,
      submitted: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '-',
      status:
        b.status === 'Approved'
          ? ('Approved' as const)
          : b.status === 'Locked'
            ? ('Approved' as const)
            : ('Pending' as const),
    }));
  }, [approvals, budgets]);

  const filtered = filter === 'All' ? rows : rows.filter((r) => r.status === filter);
  const pendingCount = rows.filter((r) => r.status === 'Pending').length;
  const approvedCount = rows.filter((r) => r.status === 'Approved').length;
  const rejectedCount = rows.filter((r) => r.status === 'Rejected').length;

  const _handleApprove = (id: string) => {
    addComment({
      resourceType: 'Budget',
      resourceId: id,
      cellId: null,
      parentId: null,
      authorId: 'current-user',
      authorName: 'Current User',
      authorInitials: 'CU',
      content: 'Approved',
      mentions: [],
      isResolved: false,
      resolvedAt: null,
    });
  };

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Name', 'Type', 'Requester', 'Amount', 'Submitted', 'Status'],
        rows: filtered.map((r) => [
          r.name,
          r.type,
          r.requester,
          formatCurrency(r.amount),
          r.submitted,
          r.status,
        ]),
      },
      { title: 'Approval Queue Report', companyName: 'FinPlan Pro' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Name', 'Type', 'Requester', 'Amount', 'Submitted', 'Status'],
        rows: filtered.map((r) => [
          r.name,
          r.type,
          r.requester,
          formatCurrency(r.amount),
          r.submitted,
          r.status,
        ]),
      },
      { title: 'Approval_Queue_Report' }
    ).catch(reportExportFailure);
  };

  const columns: Column<ApprovalRow>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'requester', header: 'Requester', sortable: true },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (_, r) => formatCurrency(r.amount),
      sortable: true,
    },
    { key: 'submitted', header: 'Submitted', align: 'right', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (_, r) => (
        <span
          className={
            r.status === 'Approved'
              ? 'text-green-400'
              : r.status === 'Rejected'
                ? 'text-red-400'
                : r.status === 'Pending'
                  ? 'text-yellow-400'
                  : 'text-blue-400'
          }
        >
          {r.status === 'Approved' ? (
            <CheckCircle className="inline h-4 w-4 mr-1" />
          ) : r.status === 'Rejected' ? (
            <XCircle className="inline h-4 w-4 mr-1" />
          ) : r.status === 'Pending' ? (
            <Clock className="inline h-4 w-4 mr-1" />
          ) : (
            <AlertCircle className="inline h-4 w-4 mr-1" />
          )}
          {r.status}
        </span>
      ),
      sortable: true,
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Approval Queue</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleExportPDF} aria-label="Export PDF">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportExcel} aria-label="Export Excel">
            <TableIcon className="h-3.5 w-3.5 mr-1.5" />
            Excel
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue
          label="Total Items"
          value={rows.length.toString()}
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <KPIValue
          label="Pending"
          value={pendingCount.toString()}
          icon={<Clock className="h-4 w-4" />}
        />
        <KPIValue
          label="Approved"
          value={approvedCount.toString()}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <KPIValue
          label="Rejected"
          value={rejectedCount.toString()}
          icon={<XCircle className="h-4 w-4" />}
        />
      </div>
      <div className="flex gap-2">
        {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'ghost'}
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        caption="Approval queue table"
        ariaLabel="Approval queue"
      />
    </div>
  );
}
