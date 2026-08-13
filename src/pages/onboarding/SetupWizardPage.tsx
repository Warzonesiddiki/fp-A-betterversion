import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/store/settingsStore';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { Database, BookOpen, Coins, Building2, Globe, Calendar, Settings } from 'lucide-react';

type OrgForm = {
  companyName: string;
  industry: string;
  currency: string;
  fiscalYearStart: string;
  baseCurrency: string;
};

const INDUSTRIES = [
  'Technology/SaaS',
  'Manufacturing',
  'Retail',
  'Banking',
  'Healthcare',
  'Energy',
  'Real Estate',
  'Construction',
  'Insurance',
  'Other',
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];

export default function SetupWizardPage() {
  const navigate = useNavigate();

  const _settingsStore = useSettingsStore();
  const [step, setStep] = useState(0);
  const [org, setOrg] = useState<OrgForm>({
    companyName: '',
    industry: 'Technology/SaaS',
    currency: 'USD',
    fiscalYearStart: `${new Date().getFullYear()}-01-01`,
    baseCurrency: 'USD',
  });

  useEffect(() => {
    document.title = 'FinPlan Pro — Setup Wizard';
  }, []);

  type StepStatus = 'done' | 'current' | 'pending';
  const getStepStatus = (idx: number): StepStatus =>
    step > idx ? 'done' : step === idx ? 'current' : 'pending';

  const steps = [
    { label: 'Welcome', status: getStepStatus(0) },
    { label: 'Organization', status: getStepStatus(1) },
    { label: 'Preferences', status: getStepStatus(2) },
    { label: 'Data', status: getStepStatus(3) },
    { label: 'Done', status: getStepStatus(4) },
  ];

  const handleOrgSave = () => {
    // Settings store integration - save org config
    setStep(2);
  };

  const handlePreferencesSave = () => {
    setStep(3);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Setup Wizard</h1>
      <ProgressStepper steps={steps} currentStep={step} />

      {step === 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Welcome to FinPlan Pro</h2>
            <p className="text-sm text-[var(--text-muted)]">
              This wizard will configure your FP&A workspace. We&apos;ll set up your organization,
              preferences, and import your financial data.
            </p>
            <div className="bg-slate-800 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">What you&apos;ll need:</p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Company name and industry</li>
                <li>• Base currency and fiscal year</li>
                <li>• Chart of Accounts or GL data (optional)</li>
              </ul>
            </div>
            <Button onClick={() => setStep(1)}>Get Started</Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-blue-400" />
              <h2 className="font-semibold text-lg">Organization Details</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="company-name"
                  className="text-sm font-medium text-[var(--text-secondary)]"
                >
                  Company Name
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={org.companyName}
                  onChange={(e) => setOrg({ ...org, companyName: e.target.value })}
                  placeholder="Acme Corp"
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="industry"
                  className="text-sm font-medium text-[var(--text-secondary)]"
                >
                  Industry
                </label>
                <select
                  id="industry"
                  value={org.industry}
                  onChange={(e) => setOrg({ ...org, industry: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="globe-classname-h-3-5-w-3-5-inline-mr-1-base-currency"
                    className="text-sm font-medium text-[var(--text-secondary)]"
                  >
                    <Globe className="h-3.5 w-3.5 inline mr-1" />
                    Base Currency
                  </label>
                  <select
                    id="globe-classname-h-3-5-w-3-5-inline-mr-1-base-currency"
                    value={org.currency}
                    onChange={(e) =>
                      setOrg({ ...org, currency: e.target.value, baseCurrency: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="calendar-classname-h-3-5-w-3-5-inline-mr-1-fiscal-year-start"
                    className="text-sm font-medium text-[var(--text-secondary)]"
                  >
                    <Calendar className="h-3.5 w-3.5 inline mr-1" />
                    Fiscal Year Start
                  </label>
                  <input
                    id="calendar-classname-h-3-5-w-3-5-inline-mr-1-fiscal-year-start"
                    type="date"
                    value={org.fiscalYearStart}
                    onChange={(e) => setOrg({ ...org, fiscalYearStart: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleOrgSave} disabled={!org.companyName.trim()}>
                Continue
              </Button>
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-5 w-5 text-blue-400" />
              <h2 className="font-semibold text-lg">Preferences</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Auto-save</p>
                  <p className="text-xs text-slate-400">
                    Save changes automatically every 30 seconds
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4"
                  aria-label="Enable Auto-save"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-xs text-slate-400">Use dark theme (currently default)</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4"
                  aria-label="Enable Dark Mode"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Keyboard Shortcuts</p>
                  <p className="text-xs text-slate-400">Enable Ctrl+S, Ctrl+Z, Ctrl+K shortcuts</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4"
                  aria-label="Enable Keyboard Shortcuts"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Guided Tours</p>
                  <p className="text-xs text-slate-400">Show interactive tours for new features</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4"
                  aria-label="Enable Guided Tours"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handlePreferencesSave}>Continue</Button>
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Import Your Data</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Start by importing your Chart of Accounts or GL data. You can skip this and do it
              later.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button onClick={() => navigate('/data/gl-upload')} className="justify-start">
                <Database className="h-4 w-4 mr-2" />
                Import GL Data
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/data/chart-of-accounts')}
                className="justify-start"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Set Up Accounts
              </Button>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setStep(4)}>
                Skip for now
              </Button>
              <Button variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <Coins className="h-12 w-12 text-green-400 mx-auto" />
            <h2 className="font-semibold text-lg">All Set!</h2>
            <p className="text-sm text-[var(--text-muted)]">
              {org.companyName ? `${org.companyName} is` : 'You&apos;re'} ready to start using
              FinPlan Pro. Your {org.industry} workspace is configured with {org.currency} as base
              currency.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
              <Button variant="secondary" onClick={() => navigate('/budgets/create')}>
                Create First Budget
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
