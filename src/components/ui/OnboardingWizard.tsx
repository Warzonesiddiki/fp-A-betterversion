import { useState } from 'react';
import { ProgressStepper } from './ProgressStepper';
import { Input } from './Input';
import { Select } from './Select';
import { FileDropZone } from './FileDropZone';
import { DataTable } from './DataTable';
import { Button } from './Button';
import { Card } from './Card';
import { getAllSectors } from '@/config/sectors';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    fiscalYearStart: 'January',
    fiscalYear: new Date().getFullYear().toString(),
    currency: 'USD',
    sector: 'technology',
  });
  const [importedData, setImportedData] = useState<Record<string, unknown>[]>([]);

  const sectors = getAllSectors().map((s) => ({ value: s.id, label: s.name }));
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ].map((m) => ({ value: m, label: m }));

  const currentYear = new Date().getFullYear();
  const years = [
    (currentYear - 1).toString(),
    currentYear.toString(),
    (currentYear + 1).toString(),
  ].map((y) => ({ value: y, label: y }));

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'CHF', label: 'CHF - Swiss Franc' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'BRL', label: 'BRL - Brazilian Real' },
    { value: 'MXN', label: 'MXN - Mexican Peso' },
    { value: 'ZAR', label: 'ZAR - South African Rand' },
  ];

  const handleComplete = () => {
    onComplete();
  };

  const steps = ['Welcome', 'Company', 'Data', 'Review', 'Done'];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-8">
          <ProgressStepper steps={steps} currentStep={step} className="mb-10" />

          <div className="min-h-[300px]">
            {step === 0 && (
              <div className="animate-fade-in text-center py-6">
                <h1 className="text-3xl font-bold text-white mb-4">Welcome to FinPlan Pro</h1>
                <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
                  This app helps you manage budgets, forecasts, and financial reports — all in one
                  place, completely offline. No cloud, no subscriptions, no data leaving your
                  computer.
                </p>
                <div className="mt-10">
                  <Button size="lg" onClick={() => setStep(1)}>
                    Let&apos;s Start
                  </Button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="animate-fade-in space-y-6">
                <h2 className="text-xl font-bold text-white mb-2">Company Setup</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Company Name"
                    placeholder="Enter company name"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                  />
                  <Select
                    label="Industry/Sector"
                    options={sectors}
                    value={companyInfo.sector}
                    onChange={(val) => setCompanyInfo({ ...companyInfo, sector: val })}
                  />
                  <Select
                    label="Fiscal Year"
                    options={years}
                    value={companyInfo.fiscalYear}
                    onChange={(val) => setCompanyInfo({ ...companyInfo, fiscalYear: val })}
                  />
                  <Select
                    label="Fiscal Year Start"
                    options={months}
                    value={companyInfo.fiscalYearStart}
                    onChange={(val) => setCompanyInfo({ ...companyInfo, fiscalYearStart: val })}
                  />
                  <Select
                    label="Base Currency"
                    options={currencies}
                    value={companyInfo.currency}
                    onChange={(val) => setCompanyInfo({ ...companyInfo, currency: val })}
                  />
                </div>
                <div className="flex justify-end pt-6">
                  <Button onClick={() => setStep(2)}>Continue</Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in space-y-6 text-center">
                <h2 className="text-xl font-bold text-white mb-2">Import Your Data</h2>
                <p className="text-slate-400">
                  Upload your General Ledger (GL) data in CSV or Excel format to populate your
                  dashboard.
                </p>
                <div className="py-4">
                  <FileDropZone
                    accept=".csv,.xlsx"
                    onFilesDropped={(files) => {
                      // Mock data for preview
                      setImportedData([
                        { id: 1, date: '2025-01-01', account: 'Revenue', amount: 50000 },
                        { id: 2, date: '2025-01-02', account: 'Payroll', amount: -20000 },
                      ]);
                      setStep(3);
                    }}
                  />
                </div>
                <div className="flex justify-between items-center pt-4">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button variant="ghost" onClick={() => setStep(3)}>
                    Skip for now
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in space-y-6">
                <h2 className="text-xl font-bold text-white mb-2">Review Data</h2>
                {importedData.length > 0 ? (
                  <div className="border border-slate-800 rounded-lg overflow-hidden h-48">
                    <DataTable
                      data={importedData}
                      columns={[
                        { key: 'date', label: 'Date' },
                        { key: 'account', label: 'Account' },
                        { key: 'amount', label: 'Amount' },
                      ]}
                    />
                  </div>
                ) : (
                  <p className="text-slate-400 py-10 text-center">
                    You can import your data later from the Data Management section.
                  </p>
                )}
                <div className="flex justify-between pt-6">
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(4)}>Confirm & Finish</Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-in text-center py-6">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">All Set!</h1>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                  Your workspace is ready. Here&apos;s what you can do next:
                </p>
                <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto mb-10 text-left">
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" /> View your Dashboard
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" /> Create your first Budget
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" /> Generate Financial Reports
                  </div>
                </div>
                <Button size="lg" className="w-full sm:w-auto px-12" onClick={handleComplete}>
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
