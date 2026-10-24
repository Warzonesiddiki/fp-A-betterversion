import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { useGLStore } from '@/store/glStore';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { deriveExecutiveSummary } from './executiveSummaryData';

export function ExecutiveSummary() {
  const fmt = useCurrencyFormatter();
  const entries = useGLStore((s) => s.entries);
  const derivation = useMemo(() => deriveExecutiveSummary(entries), [entries]);

  const kpis = [
    { label: 'Revenue', value: fmt.currency0(derivation.revenue) },
    { label: 'Operating income', value: fmt.currency0(derivation.operatingIncome) },
    {
      label: 'Cash',
      value: derivation.cash === null ? '—' : fmt.currency0(derivation.cash),
    },
  ];

  return (
    <div className="space-y-8 print:p-0">
      <div className="grid grid-cols-3 gap-6">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <span className="text-xs text-[var(--text-muted)] uppercase font-bold">{k.label}</span>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{k.value}</div>
          </Card>
        ))}
      </div>
      <Card className="p-6 space-y-3">
        <h3 className="font-bold text-[var(--text-primary)]">Not derivable from the posted GL</h3>
        {derivation.unavailable.map((item) => (
          <p key={item.label} className="text-sm text-[var(--text-secondary)] leading-relaxed">
            <span className="font-medium">{item.label}</span> — {item.reason}
          </p>
        ))}
      </Card>
    </div>
  );
}
