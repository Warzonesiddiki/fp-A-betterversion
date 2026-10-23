import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { IntegrationDefinition } from '@/config/integrations';

interface ConnectIntegrationModalProps {
  definition: IntegrationDefinition;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
}

export function ConnectIntegrationModal({
  definition,
  busy,
  error,
  onClose,
  onSubmit,
}: ConnectIntegrationModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  const missingRequired = definition.fields.some(
    (field) => field.required && !(values[field.key] ?? '').trim()
  );

  return (
    <Modal isOpen onClose={onClose} title={`Connect to ${definition.name}`} size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!missingRequired && !busy) onSubmit(values);
        }}
        className="space-y-4"
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">{definition.description}</p>
        <div className="space-y-3">
          {definition.fields.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              type={field.type ?? 'text'}
              value={values[field.key] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              required={field.required}
              aria-label={`${definition.name} ${field.label}`}
              autoComplete="off"
            />
          ))}
        </div>
        {definition.fields.some((f) => f.help) && (
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            {definition.fields
              .filter((f) => f.help)
              .map((f) => (
                <li key={f.key}>
                  • {f.label}: {f.help}
                </li>
              ))}
          </ul>
        )}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={missingRequired || busy}>
            {busy ? 'Connecting…' : 'Connect'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
