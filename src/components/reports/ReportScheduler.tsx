import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export interface ScheduledReport {
  id: string;
  reportId: string;
  reportName: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  format: 'pdf' | 'excel' | 'html';
  recipients: string[];
  isActive: boolean;
  nextRun: string;
}

export interface ReportSchedulerProps {
  schedules: ScheduledReport[];
  onAdd: (s: Omit<ScheduledReport, 'id'>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  availableReports: { id: string; name: string }[];
}

export function ReportScheduler({
  schedules,
  onAdd,
  onRemove,
  onToggle,
  availableReports,
}: ReportSchedulerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (schedules.length === 0 && !isModalOpen) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[var(--bg-elevated)] border border-dashed border-[var(--border-default)] rounded-lg">
        <p className="text-[var(--text-muted)] mb-4">No schedules yet</p>
        <Button onClick={() => setIsModalOpen(true)}>Add Schedule</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Scheduled Reports</h3>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          Add Schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map((s) => (
          <Card key={s.id} className="p-4 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-[var(--text-primary)]">{s.reportName}</span>
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                {s.frequency} • {s.format}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">Next run: {s.nextRun}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggle(s.id)}
                className={`w-10 h-6 rounded-full transition-colors ${s.isActive ? 'bg-blue-600' : 'bg-[var(--bg-hover)]'}`}
                aria-label={`${s.isActive ? 'Disable' : 'Enable'} ${s.reportName} schedule`}
              />
              <button
                onClick={() => {
                  if (window.confirm('Remove this report schedule?')) onRemove(s.id);
                }}
                className="text-[var(--text-muted)] hover:text-[var(--negative)]"
              >
                Remove
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Schedule">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onAdd({
              reportId: '1',
              reportName: 'P&L Statement',
              frequency: 'monthly',
              format: 'pdf',
              recipients: [],
              isActive: true,
              nextRun: '2025-02-01',
            });
            setIsModalOpen(false);
          }}
        >
          <Select
            label="Report"
            options={availableReports.map((r) => ({ value: r.id, label: r.name }))}
          />
          <Select
            label="Frequency"
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
            ]}
          />
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
