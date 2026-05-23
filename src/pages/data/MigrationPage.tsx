import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import MigrationWizard from '@/components/migration/MigrationWizard';
import { ArrowLeft, Database } from 'lucide-react';
import { CubeMigrationEngine } from '@/engines/CubeMigrationEngine';

export default function MigrationPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Data Migration';
  }, []);

  const handleComplete = (snapshotId: string) => {
    navigate('/data/import', { state: { migrationComplete: true, snapshotId } });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" /> Data Migration
          </h1>
          <p className="text-muted-foreground">
            Migrate data from Excel, Planful, Adaptive, or Anaplan into FinPlan Pro
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/data')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Data
        </Button>
      </div>

      <MigrationWizard onComplete={handleComplete} onCancel={() => navigate('/data')} />
    </div>
  );
}
