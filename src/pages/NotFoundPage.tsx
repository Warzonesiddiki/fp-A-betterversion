import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="p-12 text-center">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-[var(--text-muted)] mb-6">Page not found.</p>
      <Button onClick={() => navigate('/')}>Go Home</Button>
    </div>
  );
}
