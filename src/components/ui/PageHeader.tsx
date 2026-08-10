import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  /** A concise decision-oriented explanation of why this page exists. */
  purpose?: ReactNode;
  /** Contextual status such as freshness or lifecycle; use FinancialStatusBadge when applicable. */
  status?: ReactNode;
  actions?: ReactNode;
}

/**
 * Canonical Atlas page heading. It gives financial pages a consistent purpose,
 * context/status location, and action placement without forcing card-based UI.
 */
export function PageHeader({
  title,
  purpose,
  status,
  actions,
  className,
  children,
  ...props
}: PageHeaderProps): ReactElement {
  return (
    <header className={cn('fp-page-header', className)} {...props}>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="fp-page-header__title">{title}</h1>
          {status}
        </div>
        {purpose ? <div className="fp-page-header__purpose">{purpose}</div> : null}
        {children}
      </div>
      {actions ? <div className="fp-page-header__actions">{actions}</div> : null}
    </header>
  );
}
