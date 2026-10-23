import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/store/settingsStore';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Settings, LogOut, Save, Clock, Globe, DollarSign, Palette } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ProfilePage() {
  const navigate = useNavigate();
  const organization = useSettingsStore((s) => s.organization);
  const updateOrganization = useSettingsStore((s) => s.updateOrganization);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: organization.name || 'FinPlan Pro User',
    email: 'user@finplanpro.com',
    role: 'FP&A Manager',
    department: 'Finance',
    timezone: organization.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: organization.dateFormat || 'MM/DD/YYYY',
    baseCurrency: organization.baseCurrency || 'USD',
    decimalPlaces: organization.decimalPlaces ?? 2,
    theme: 'dark',
  });

  useEffect(() => {
    document.title = 'FinPlan Pro — Profile';
  }, []);

  const handleSave = () => {
    updateOrganization({
      name: form.name,
      timezone: form.timezone,
      dateFormat: form.dateFormat,
      baseCurrency: form.baseCurrency,
      decimalPlaces: form.decimalPlaces,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activityLog = [
    { action: 'Updated budget forecast', time: '2 hours ago', type: 'edit' },
    { action: 'Exported P&L report to PDF', time: '5 hours ago', type: 'export' },
    { action: 'Imported GL data (2,340 entries)', time: '1 day ago', type: 'import' },
    { action: 'Created scenario: Q3 Conservative', time: '2 days ago', type: 'create' },
    { action: 'Approved FY2026 budget', time: '3 days ago', type: 'approve' },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader title="Profile" />

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white">
              {form.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{form.name}</h2>
              <p className="text-sm text-[var(--text-muted)]">{form.email}</p>
              <Badge variant="default" className="mt-1">
                {form.role}
              </Badge>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="text-sm text-[var(--text-muted)] block mb-1">
                Name
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="department" className="text-sm text-[var(--text-muted)] block mb-1">
                Department
              </label>
              <input
                id="department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="globe-classname-h-3-w-3-timezone"
                className="text-sm text-[var(--text-muted)] flex items-center gap-1 mb-1"
              >
                <Globe className="h-3 w-3" />
                Timezone
              </label>
              <select
                id="globe-classname-h-3-w-3-timezone"
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
              >
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Berlin">Berlin (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="clock-classname-h-3-w-3-date-format"
                className="text-sm text-[var(--text-muted)] flex items-center gap-1 mb-1"
              >
                <Clock className="h-3 w-3" />
                Date Format
              </label>
              <select
                id="clock-classname-h-3-w-3-date-format"
                value={form.dateFormat}
                onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="dollarsign-classname-h-3-w-3-base-currency"
                className="text-sm text-[var(--text-muted)] flex items-center gap-1 mb-1"
              >
                <DollarSign className="h-3 w-3" />
                Base Currency
              </label>
              <select
                id="dollarsign-classname-h-3-w-3-base-currency"
                value={form.baseCurrency}
                onChange={(e) => setForm({ ...form, baseCurrency: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
              >
                {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="palette-classname-h-3-w-3-theme"
                className="text-sm text-[var(--text-muted)] flex items-center gap-1 mb-1"
              >
                <Palette className="h-3 w-3" />
                Theme
              </label>
              <select
                id="palette-classname-h-3-w-3-theme"
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {saved ? 'Saved!' : 'Save Preferences'}
            </Button>
            {saved && <span className="text-sm text-green-400">Settings saved successfully</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm" aria-label="Recent user activity log">
            <caption className="sr-only">
              Recent activity entries with action, time, and type
            </caption>
            <thead>
              <tr>
                <th scope="col" className="text-left font-medium text-[var(--text-secondary)] py-1">
                  Action
                </th>
                <th
                  scope="col"
                  className="text-right font-medium text-[var(--text-secondary)] py-1 w-[120px]"
                >
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {activityLog.map((item, i) => (
                <tr key={i} className="border-b border-slate-800 last:border-0">
                  <th scope="row" className="font-normal py-2 text-left">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${item.type === 'edit' ? 'bg-blue-400' : item.type === 'export' ? 'bg-green-400' : item.type === 'import' ? 'bg-yellow-400' : item.type === 'create' ? 'bg-purple-400' : 'bg-cyan-400'}`}
                        aria-hidden="true"
                      />
                      <span>{item.action}</span>
                    </div>
                  </th>
                  <td className="py-2 text-xs text-[var(--text-muted)] text-right">{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Button variant="ghost" className="w-full text-red-400" onClick={() => navigate('/login')}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
