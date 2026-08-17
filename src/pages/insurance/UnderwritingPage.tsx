import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Percent } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { useGLStore } from '@/store/glStore';
import { formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { deriveUnderwriting } from './underwritingData';

const fiscalPeriods = buildFiscalPeriods();

export default function UnderwritingPage() {
  const fmt = useCurrencyFormatter();
  const navigate = useNavigate();
  const { entries } = useGLStore();
  const [periodId, setPeriodId] = useState('P01');
  const derivation = useMemo(() => deriveUnderwriting(entries), [entries]);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <Percent className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Underwriting Analytics Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import General Ledger entries to view posted premium, claims and underwriting expense.
          Rate adequacy, loss picks and state filings are not invented.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Underwriting Analytics"
          purpose="Posted premium, claims and expense from the General Ledger. Rate adequacy, loss picks and regulatory filings require a rating / actuarial feed the GL does not carry — they are omitted, not estimated."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={fiscalPeriods} />
          <Button variant="outline" size="sm" className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Rate Filing Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue label="Posted Premium" value={fmt.currency0(derivation.premium)} />
        <KPIValue label="Posted Claims" value={fmt.currency0(derivation.claims)} />
        <KPIValue
          label="Loss Ratio"
          value={derivation.lossRatioPct === null ? '—' : formatPercent(derivation.lossRatioPct, 1)}
        />
        <KPIValue
          label="Combined Ratio"
          value={
            derivation.combinedRatioPct === null
              ? '—'
              : formatPercent(derivation.combinedRatioPct, 1)
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Not derivable from the posted GL</CardTitle>
          <CardDescription>Omitted rather than estimated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[var(--text-muted)]">
          {derivation.unavailable.map((item) => (
            <p key={item.label}>
              <span className="font-medium text-[var(--text-secondary)]">{item.label}</span> —{' '}
              {item.reason}
            </p>
          ))}
          {derivation.expenseRatioPct !== null && (
            <p>
              <span className="font-medium text-[var(--text-secondary)]">Expense ratio</span> —{' '}
              {formatPercent(derivation.expenseRatioPct, 1)} from posted prefix-6 cost over premium.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
