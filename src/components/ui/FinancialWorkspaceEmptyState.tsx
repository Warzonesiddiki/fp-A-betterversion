import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface FinancialWorkspaceEmptyStateStep {
  title: string;
  description: string;
}

export interface FinancialWorkspaceEmptyStateProps {
  title: string;
  description: string;
  steps: readonly FinancialWorkspaceEmptyStateStep[];
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/**
 * A finance-specific empty state that distinguishes an unconfigured workspace
 * from an error or an empty filtered result. It gives the user a safe next
 * sequence instead of a decorative generic illustration.
 */
export function FinancialWorkspaceEmptyState({
  title,
  description,
  steps,
  actions,
  icon,
  className,
}: FinancialWorkspaceEmptyStateProps): ReactElement {
  return (
    <section
      className={cn('fp-workspace-empty-state', className)}
      aria-labelledby="workspace-empty-title"
    >
      {icon ? (
        <div className="fp-workspace-empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h1 id="workspace-empty-title" className="fp-page-header__title">
        {title}
      </h1>
      <p className="fp-page-header__purpose">{description}</p>
      <ol className="fp-workspace-empty-state__steps" aria-label="Setup steps">
        {steps.map((step, index) => (
          <li key={step.title} className="fp-workspace-empty-state__step">
            <span className="fp-workspace-empty-state__number" aria-hidden="true">
              {index + 1}
            </span>
            <span>
              <strong>{step.title}</strong>
              <span className="fp-workspace-empty-state__description">{step.description}</span>
            </span>
          </li>
        ))}
      </ol>
      {actions ? <div className="fp-workspace-empty-state__actions">{actions}</div> : null}
    </section>
  );
}
