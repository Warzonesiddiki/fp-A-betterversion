import { INDUSTRIES } from '@/utils/constants';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import {
  Rocket,
  Database,
  BookOpen,
  CheckCircle2,
  Building2,
  Globe,
  Calendar,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

type OrgForm = {
  companyName: string;
  industry: string;
  currency: string;
  fiscalYearStart: string;
};

const INDUSTRY_OPTIONS = [
  {
    id: 'technology',
    label: 'Technology/SaaS',
    icon: '💻',
    desc: 'ARR, NRR, churn, LTV/CAC, Magic Number',
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: '🏭',
    desc: 'OEE, yield, scrap rate, cycle time, capacity utilization',
  },
  {
    id: 'retail',
    label: 'Retail',
    icon: '🛒',
    desc: 'Same-store sales, inventory turnover, GMROI, basket size',
  },
  {
    id: 'banking',
    label: 'Banking',
    icon: '🏦',
    desc: 'NIM, NPL ratio, CAR, LDR, ROA, cost-to-income',
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    icon: '🏥',
    desc: 'Occupancy, ALOS, readmission, case mix index',
  },
  {
    id: 'energy',
    label: 'Energy',
    icon: '⚡',
    desc: 'Production volume, reserve life, lifting cost, BOE',
  },
  {
    id: 'realestate',
    label: 'Real Estate',
    icon: '🏠',
    desc: 'NOI, cap rate, occupancy, DSCR, LTV',
  },
  {
    id: 'construction',
    label: 'Construction',
    icon: '🏗️',
    desc: 'WIP, over/underbilling, job cost %, change order %',
  },
  {
    id: 'insurance',
    label: 'Insurance',
    icon: '🛡️',
    desc: 'Loss ratio, combined ratio, expense ratio, retention',
  },
  { id: 'other', label: 'Other', icon: '📊', desc: 'General FP&A with standard KPIs' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const updatePreferences = useSettingsStore((s) => s.updatePreferences);
  const [step, setStep] = useState(0);
  const [org, setOrg] = useState<OrgForm>({
    companyName: '',
    industry: 'technology',
    currency: 'USD',
    fiscalYearStart: `${new Date().getFullYear()}-01-01`,
  });

  useEffect(() => {
    document.title = 'FinPlan Pro — Welcome';
  }, []);

  const handleComplete = () => {
    updatePreferences({ activeSector: org.industry });
    navigate('/');
  };

  const steps = [
    { label: 'Welcome', status: (step > 0 ? 'done' : step === 0 ? 'current' : 'pending') as const },
    {
      label: 'Organization',
      status: (step > 1 ? 'done' : step === 1 ? 'current' : 'pending') as const,
    },
    { label: 'Data', status: (step > 2 ? 'done' : step === 2 ? 'current' : 'pending') as const },
    { label: 'Done', status: (step > 3 ? 'done' : step === 3 ? 'current' : 'pending') as const },
  ];

  const canProceedStep1 = org.companyName.trim().length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-xl">
        <CardContent className="p-6 space-y-6">
          <Rocket className="h-12 w-12 text-blue-400 mx-auto" />
          <h1 className="text-2xl font-bold text-center">Welcome to FinPlan Pro</h1>
          <ProgressStepper steps={steps} currentStep={step} />

          {step === 0 && (
            <div className="text-center space-y-4">
              <p className="text-slate-400">
                {user?.name ? `Hi ${user.name}! ` : ''}Your FP&A workspace is ready. Let&apos;s
                configure it in 3 quick steps.
              </p>
              <div className="bg-slate-800 rounded-lg p-4 text-left space-y-2">
                <p className="text-sm font-medium">We&apos;ll set up:</p>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" /> Organization profile
                  </li>
                  <li className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" /> Currency & fiscal year
                  </li>
                  <li className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5" /> Financial data import
                  </li>
                </ul>
              </div>
              <Button onClick={() => setStep(1)} className="w-full">
                Get Started <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-400" />
                <h2 className="font-semibold">Organization Details</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-300">Company Name *</label>
                  <input
                    type="text"
                    value={org.companyName}
                    onChange={(e) => setOrg({ ...org, companyName: e.target.value })}
                    placeholder="Acme Corp"
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Industry</label>
                  <select
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
                    <label className="text-sm font-medium text-slate-300">
                      <Globe className="h-3.5 w-3.5 inline mr-1" />
                      Currency
                    </label>
                    <select
                      value={org.currency}
                      onChange={(e) => setOrg({ ...org, currency: e.target.value })}
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
                    <label className="text-sm font-medium text-slate-300">
                      <Calendar className="h-3.5 w-3.5 inline mr-1" />
                      FY Start
                    </label>
                    <input
                      type="date"
                      value={org.fiscalYearStart}
                      onChange={(e) => setOrg({ ...org, fiscalYearStart: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} disabled={!canProceedStep1} className="flex-1">
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button variant="ghost" onClick={() => setStep(0)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold">Import Financial Data</h2>
              <p className="text-sm text-slate-400">
                Import your Chart of Accounts or GL data to get started. You can skip this step.
              </p>
              <div className="grid grid-cols-1 gap-3">
                <Button onClick={() => navigate('/data/gl-upload')} className="justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Import GL Data (Excel/CSV)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/data/chart-of-accounts')}
                  className="justify-start"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Set Up Chart of Accounts
                </Button>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(3)} className="flex-1">
                  Skip for now
                </Button>
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-14 w-14 text-green-400 mx-auto" />
              <h2 className="font-semibold text-lg">You&apos;re All Set!</h2>
              <p className="text-slate-400 text-sm">
                {org.companyName ? `${org.companyName}'s` : 'Your'} workspace is configured with{' '}
                {org.industry} sector defaults and {org.currency} currency.
              </p>
              <div className="bg-slate-800 rounded-lg p-4 text-left">
                <p className="text-sm font-medium mb-2">Quick tips:</p>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>
                    • Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Ctrl+K</kbd>{' '}
                    to open command palette
                  </li>
                  <li>
                    • Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Ctrl+S</kbd>{' '}
                    to save
                  </li>
                  <li>• Visit Help Center for keyboard shortcuts</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/')} className="flex-1">
                  Go to Dashboard
                </Button>
                <Button variant="secondary" onClick={() => navigate('/budgets/create')}>
                  Create Budget
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
