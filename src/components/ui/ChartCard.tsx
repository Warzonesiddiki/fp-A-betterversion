import { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  height?: number;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  height = 300,
  children,
  className = '',
  actions,
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>{children}</div>
      </CardContent>
    </Card>
  );
}

export type { ChartCardProps };
export default ChartCard;
