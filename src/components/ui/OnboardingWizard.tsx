/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressStepper, type Step } from './ProgressStepper';
import { Input } from './Input';
import { Select } from './Select';
import { FileDropZone } from './FileDropZone';
import { DataTable } from './DataTable';
import { Button } from './Button';
import { Card } from './Card';
import { LiveRegion } from './LiveRegion';
import { getAllSectors } from '@/config/sectors';
import { useSettingsStore } from '@/store/settingsStore';
import { useGLStore } from '@/store/glStore';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    fiscalYearStart: 'January',
    fiscalYear: new Date().getFullYear().toString(),
    currency: 'USD',
    sector: 'technology',
  });
  const [importedData, setImportedData] = useState<Record<string, unknown>[]>([]);
  const stepContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus the step container when step changes for better screen reader experience
    if (stepContainerRef.current) {
      stepContainerRef.current.focus();
    }
  }, [step]);

  const updateOrganization = useSettingsStore((state) => state.updateOrganization);
  const updatePreferences = useSettingsStore((state) => state.updatePreferences);
  const setEntries = useGLStore((state) => state.setEntries);

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
  ].map((m) => ({ value: m, label: t(`months.${m.toLowerCase()}`) }));

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
    // Save company info
    updateOrganization({
      name: companyInfo.name,
      fiscalYear: parseInt(companyInfo.fiscalYear),
      fiscalYearStart: `2024-${String(months.findIndex((m) => m.value === companyInfo.fiscalYearStart) + 1).padStart(2, '0')}-01`,
      baseCurrency: companyInfo.currency,
    });

    // Save preferences
    updatePreferences({
      activeSector: companyInfo.sector as any,
    });

    // Save imported data if any
    if (importedData.length > 0) {
      const timestamp = Date.now();
      const entries = importedData.map((d, i) => ({
        id: `gl-init-${timestamp}-${i}`,
        accountId: String(d.account),
        accountCode: String(d.account),
        accountName: String(d.account),
        period: String(d.date).slice(0, 7),
        periodName: String(d.date).slice(0, 7),
        debit: typeof d.amount === 'number' && d.amount > 0 ? d.amount : 0,
        credit: typeof d.amount === 'number' && d.amount < 0 ? Math.abs(d.amount) : 0,
        netChange: typeof d.amount === 'number' ? d.amount : 0,
        amount: typeof d.amount === 'number' ? d.amount : 0,
        date: String(d.date),
        description: 'Initial import during onboarding',
        reference: 'ONBOARDING',
      }));
      setEntries(entries as any);
    }

    onComplete();
  };

  const steps: Step[] = [
    {
      label: t('onboarding.steps.welcome'),
      status: step === 0 ? 'current' : step > 0 ? 'done' : 'pending',
    },
    {
      label: t('onboarding.steps.company'),
      status: step === 1 ? 'current' : step > 1 ? 'done' : 'pending',
    },
    {
      label: t('onboarding.steps.data'),
      status: step === 2 ? 'current' : step > 2 ? 'done' : 'pending',
    },
    {
      label: t('onboarding.steps.review'),
      status: step === 3 ? 'current' : step > 3 ? 'done' : 'pending',
    },
    {
      label: t('onboarding.steps.done'),
      status: step === 4 ? 'current' : step > 4 ? 'done' : 'pending',
    },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <LiveRegion message={`Step ${step + 1}: ${steps[step]!.label}`} />
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-8">
          <ProgressStepper steps={steps} currentStep={step} orientation="horizontal" />

          <div
            ref={stepContainerRef}
            tabIndex={-1}
            className="min-h-[300px] outline-none focus:ring-0"
            aria-labelledby={`step-title-${step}`}
          >
            {step === 0 && (
              <div className="animate-fade-in text-center py-6">
                <h1 className="text-3xl font-bold text-white mb-4" id="step-title-0">
                  {t('onboarding.welcome.title')}
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
                  {t('onboarding.welcome.description')}
                </p>
                <div className="mt-10">
                  <Button size="lg" onClick={() => setStep(1)}>
                    {t('onboarding.welcome.start')}
                  </Button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="animate-fade-in space-y-6">
                <h2 className="text-xl font-bold text-white mb-2" id="step-title-1">
                  {t('onboarding.setup.title')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label={t('onboarding.setup.companyName')}
                    placeholder={t('onboarding.setup.companyNamePlaceholder')}
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                  />
                  <Select
                    label={t('onboarding.setup.industry')}
                    options={sectors}
                    value={companyInfo.sector}
                    onChange={(val) => setCompanyInfo({ ...companyInfo, sector: val })}
                  />
                  <Select
                    label={t('onboarding.setup.fiscalYear')}
                    options={years}
                    value={companyInfo.fiscalYear}
                    onChange={(val) => setCompanyInfo({ ...companyInfo, fiscalYear: val })}
                  />
                  <Select
                    label={t('onboarding.setup.fiscalYearStart')}
                    options={months}
                    value={companyInfo.fiscalYearStart}
                    onChange={(val) => setCompanyInfo({ ...companyInfo, fiscalYearStart: val })}
                  />
                  <Select
                    label={t('onboarding.setup.baseCurrency')}
                    options={currencies}
                    value={companyInfo.currency}
                    onChange={(val) => setCompanyInfo({ ...companyInfo, currency: val })}
                  />
                </div>
                <div className="flex justify-end pt-6">
                  <Button onClick={() => setStep(2)}>{t('buttons.continue')}</Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in space-y-6 text-center">
                <h2 className="text-xl font-bold text-white mb-2" id="step-title-2">
                  {t('onboarding.import.title')}
                </h2>
                <p className="text-slate-400 dark:text-slate-300">
                  {t('onboarding.import.description')}
                </p>
                <div className="py-4">
                  <FileDropZone
                    accept=".csv,.xlsx"
                    onFile={(_files: File) => {
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
                    {t('buttons.back')}
                  </Button>
                  <Button variant="ghost" onClick={() => setStep(3)}>
                    {t('onboarding.import.skip')}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in space-y-6">
                <h2 className="text-xl font-bold text-white mb-2" id="step-title-3">
                  {t('onboarding.review.title')}
                </h2>
                {importedData.length > 0 ? (
                  <div className="border border-slate-800 rounded-lg overflow-hidden h-48">
                    <DataTable
                      data={importedData}
                      columns={[
                        { key: 'date', header: t('forms.date') },
                        { key: 'account', header: t('forms.account') },
                        { key: 'amount', header: t('forms.amount') },
                      ]}
                      caption="Imported data preview: date, account, and amount of each imported transaction"
                      ariaLabel="Imported data preview"
                    />
                  </div>
                ) : (
                  <p className="text-slate-400 py-10 text-center">{t('onboarding.review.empty')}</p>
                )}
                <div className="flex justify-between pt-6">
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    {t('buttons.back')}
                  </Button>
                  <Button onClick={() => setStep(4)}>{t('onboarding.finish.confirm')}</Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-in text-center py-6">
                <div
                  className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                  aria-hidden="true"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-4" id="step-title-4">
                  {t('onboarding.finish.title')}
                </h1>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                  {t('onboarding.finish.description')}
                </p>
                <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto mb-10 text-left">
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" aria-hidden="true" />{' '}
                    {t('onboarding.finish.nextSteps.viewDashboard')}
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" aria-hidden="true" />{' '}
                    {t('onboarding.finish.nextSteps.createBudget')}
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" aria-hidden="true" />{' '}
                    {t('onboarding.finish.nextSteps.generateReports')}
                  </div>
                </div>
                <Button size="lg" className="w-full sm:w-auto px-12" onClick={handleComplete}>
                  {t('onboarding.finish.goDashboard')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
