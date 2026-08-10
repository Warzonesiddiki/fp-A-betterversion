import type { HTMLAttributes, ReactElement } from 'react';
import { cn } from '../../utils/cn';

export const financialStatusValues = [
  'draft',
  'calculated',
  'manual',
  'pendingApproval',
  'locked',
  'certified',
  'stale',
  'offlineQueued',
  'failed',
  'aiGenerated',
] as const;

export type FinancialStatus = (typeof financialStatusValues)[number];

interface StatusDefinition {
  label: string;
  description: string;
  icon: string;
}

const statusDefinitions: Record<FinancialStatus, StatusDefinition> = {
  draft: { label: 'Draft', description: 'Draft; not published', icon: '✎' },
  calculated: {
    label: 'Calculated',
    description: 'Calculated from formula; inspect dependencies',
    icon: 'ƒ',
  },
  manual: { label: 'Manual input', description: 'Manual financial input', icon: '•' },
  pendingApproval: { label: 'Pending approval', description: 'Awaiting approval', icon: '◷' },
  locked: { label: 'Locked', description: 'Locked; edits are prohibited', icon: '⌁' },
  certified: { label: 'Certified', description: 'Certified financial result', icon: '✓' },
  stale: {
    label: 'Stale',
    description: 'Data may be stale; refresh or inspect source health',
    icon: '!',
  },
  offlineQueued: {
    label: 'Offline — queued',
    description: 'Offline; queued changes are not official',
    icon: '↟',
  },
  failed: { label: 'Failed', description: 'Action failed; inspect recovery options', icon: '×' },
  aiGenerated: {
    label: 'AI-generated draft',
    description: 'AI-generated draft; review sources before use',
    icon: '✦',
  },
};

export interface FinancialStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: FinancialStatus;
  /** Adds material context, such as approver, timestamp, or queued change count. */
  detail?: string;
}

/**
 * A shared, non-colour-only representation of a financial lifecycle state.
 * It is intentionally textual so state remains understandable in exports,
 * high-contrast modes, and assistive technology.
 */
export function FinancialStatusBadge({
  status,
  detail,
  className,
  ...props
}: FinancialStatusBadgeProps): ReactElement {
  const definition = statusDefinitions[status];
  const accessibleDescription = detail
    ? `${definition.description}: ${detail}`
    : definition.description;

  return (
    <span
      aria-label={accessibleDescription}
      className={cn('fp-financial-status', `fp-financial-status--${status}`, className)}
      data-financial-status={status}
      role="status"
      {...props}
    >
      <span aria-hidden="true" className="fp-financial-status__icon">
        {definition.icon}
      </span>
      <span>{definition.label}</span>
      {detail ? <span className="fp-financial-status__detail">{detail}</span> : null}
    </span>
  );
}
