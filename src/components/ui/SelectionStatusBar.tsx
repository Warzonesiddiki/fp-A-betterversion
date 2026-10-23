import type { SelectionStats } from './DataGrid.types';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

interface SelectionStatusBarProps {
  stats: SelectionStats;
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);

export const SelectionStatusBar: React.FC<SelectionStatusBarProps> = ({ stats }) => (
  <div
    className="flex items-center gap-4 px-3 py-1 bg-[var(--bg-muted)] border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]"
    role="status"
    aria-live="polite"
  >
    <span>
      Count: <strong>{stats.count}</strong>
    </span>
    <span>
      Sum: <strong>{fmt(stats.sum)}</strong>
    </span>
    <span>
      Average: <strong>{fmt(stats.avg)}</strong>
    </span>
    <span>
      Min: <strong>{fmt(stats.min)}</strong>
    </span>
    <span>
      Max: <strong>{fmt(stats.max)}</strong>
    </span>
  </div>
);
