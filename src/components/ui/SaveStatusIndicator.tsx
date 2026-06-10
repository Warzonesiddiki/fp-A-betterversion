import { useAutoSave } from '@/hooks/useAutoSave';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SaveStatusIndicatorProps {
  data: unknown;
  onSave: (data: unknown) => void;
  delay?: number;
}

export function SaveStatusIndicator({ data, onSave, delay = 3000 }: SaveStatusIndicatorProps) {
  const { status, lastSavedAt } = useAutoSave(data, { delay, onSave });

  const config = {
    idle: { icon: null, text: '', className: 'opacity-0' },
    pending: { icon: null, text: 'Unsaved changes', className: 'text-[var(--text-muted)]' },
    saving: {
      icon: <Loader2 size={14} className="animate-spin" />,
      text: 'Saving...',
      className: 'text-blue-500',
    },
    saved: { icon: <CheckCircle size={14} />, text: 'Saved', className: 'fin-positive' },
    error: { icon: <AlertCircle size={14} />, text: 'Save failed', className: 'text-red-500' },
  };

  const { icon, text, className } = config[status];
  if (!text) return null;

  return (
    <div
      className={`flex items-center gap-2 text-xs transition-opacity ${className}`}
      role="region"
      aria-label="SaveStatusIndicator"
    >
      {icon}
      <span>{text}</span>
      {lastSavedAt && status === 'saved' && (
        <span className="text-[var(--text-muted)]">
          {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}
