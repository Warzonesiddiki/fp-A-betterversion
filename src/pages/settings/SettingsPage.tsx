import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { BackupRestore } from '@/utils/backupRestore';
import {
  Building2,
  UserCog,
  Database,
  Settings2,
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  Plug,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useDensity, densityMetrics, DENSITY_MODES, DENSITY_LABELS } from '@/hooks/useDensity';

export default function SettingsPage() {
  const { organization, updateOrganization, updatePreferences } = useSettingsStore();
  const density = useDensity();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('org');
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'FinPlan Pro — System Settings';
  }, []);

  if (user?.role === 'Viewer') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="bg-red-500/10 p-4 rounded-full mb-4">
          <ShieldCheck className="w-12 h-12 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Access Restricted</h2>
        <p className="text-[var(--text-muted)] max-w-sm">
          You are currently logged in with a Viewer role. System settings and data management are
          restricted to Admin users.
        </p>
      </div>
    );
  }

  const handleExport = async () => {
    setSettingsError(null);
    try {
      await BackupRestore.exportBackup();
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to export backup');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettingsError(null);
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await BackupRestore.importBackup(file);
        if (result.success) {
          window.location.reload();
        } else {
          setSettingsError('Import failed: ' + result.errors.join('\n'));
        }
      } catch (err) {
        setSettingsError(err instanceof Error ? err.message : 'Failed to import backup');
      }
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {settingsError && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-sm text-red-400">
          {settingsError}
        </div>
      )}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-[var(--text-muted)] text-sm">
          Manage organization profiles, system preferences, and local data.
        </p>
      </div>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
        <Tabs.List className="flex border-b border-slate-800 mb-6 overflow-x-auto no-scrollbar">
          {[
            { id: 'org', label: 'Organization', icon: Building2 },
            { id: 'pref', label: 'Preferences', icon: Settings2 },
            { id: 'users', label: 'Access Control', icon: UserCog },
            { id: 'data', label: 'Data & Security', icon: Database },
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'px-4 py-3 text-sm font-medium flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="org">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <fieldset className="m-0 border-0 p-0">
                  <legend className="text-base font-semibold text-[var(--text-primary)] mb-4">
                    Organization Profile
                  </legend>
                  <div className="space-y-2">
                    <label
                      htmlFor="company-name"
                      className="text-sm font-bold text-[var(--text-secondary)]"
                    >
                      Company Name
                    </label>
                    <input
                      id="company-name"
                      type="text"
                      value={organization.name}
                      onChange={(e) => updateOrganization({ name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                      placeholder="Enter company name..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="settings-base-currency"
                      className="text-sm font-bold text-[var(--text-secondary)]"
                    >
                      Base Currency
                    </label>
                    <select
                      id="settings-base-currency"
                      aria-describedby="settings-base-currency-help"
                      value={organization.baseCurrency}
                      onChange={(e) => updateOrganization({ baseCurrency: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                    </select>
                    <p id="settings-base-currency-help" className="text-xs text-slate-500 mt-1">
                      Used as the default currency for all financial reports and transactions.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="settings-fiscal-year-start"
                      className="text-sm font-bold text-[var(--text-secondary)]"
                    >
                      Fiscal Year Start Month
                    </label>
                    <select
                      id="settings-fiscal-year-start"
                      aria-describedby="settings-fiscal-year-start-help"
                      value={organization.fiscalYearStart.split('-')[1]}
                      onChange={(e) =>
                        updateOrganization({
                          fiscalYearStart: `2026-${e.target.value}-01`,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                    >
                      <option value="01">January</option>
                      <option value="04">April</option>
                      <option value="07">July</option>
                      <option value="10">October</option>
                    </select>
                    <p id="settings-fiscal-year-start-help" className="text-xs text-slate-500 mt-1">
                      Determines the 12-month period for budgets, P&L, and variance reports.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="settings-calendar-type"
                      className="text-sm font-bold text-[var(--text-secondary)]"
                    >
                      Calendar Type
                    </label>
                    <select
                      id="settings-calendar-type"
                      value={organization.calendarType}
                      onChange={(e) =>
                        updateOrganization({
                          calendarType: e.target.value as
                            | 'Standard'
                            | '4-4-5'
                            | '4-5-4'
                            | '13-Period',
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                    >
                      <option value="Standard">Standard (Monthly)</option>
                      <option value="4-4-5">4-4-5 Retail Calendar</option>
                      <option value="4-5-4">4-5-4 Retail Calendar</option>
                      <option value="13-Period">13-Period Calendar</option>
                    </select>
                  </div>
                </fieldset>
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="pref">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <fieldset className="m-0 border-0 p-0">
                  <legend className="text-base font-semibold text-[var(--text-primary)] mb-4">
                    Preferences
                  </legend>
                  <div className="space-y-2">
                    <label
                      htmlFor="decimal-places"
                      className="text-sm font-bold text-[var(--text-secondary)]"
                    >
                      Decimal Places
                    </label>
                    <input
                      id="decimal-places"
                      type="number"
                      value={organization.decimalPlaces}
                      onChange={(e) =>
                        updateOrganization({ decimalPlaces: parseInt(e.target.value) })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                      min="0"
                      max="4"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="date-format"
                      className="text-sm font-bold text-[var(--text-secondary)]"
                    >
                      Date Format
                    </label>
                    <select
                      id="date-format"
                      aria-describedby="settings-date-format-help"
                      value={organization.dateFormat}
                      onChange={(e) => updateOrganization({ dateFormat: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                    <p id="settings-date-format-help" className="text-xs text-slate-500 mt-1">
                      Used throughout the application for all date displays and report headers.
                    </p>
                  </div>
                </fieldset>

                {/* UI-04: display density. Drives <html data-density>, which every
                    grid and .fp-table resolves its row metrics against. */}
                <fieldset className="m-0 border-0 p-0">
                  <legend className="text-base font-semibold text-[var(--text-primary)] mb-4">
                    Display Density
                  </legend>
                  <div
                    role="radiogroup"
                    aria-label="Display density"
                    aria-describedby="settings-density-help"
                    className="space-y-2"
                  >
                    {DENSITY_MODES.map((mode) => {
                      const active = density === mode;
                      const metrics = densityMetrics(mode);
                      return (
                        <label
                          key={mode}
                          className={cn(
                            'flex items-center gap-3 rounded border px-3 py-2 cursor-pointer transition-colors',
                            active
                              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                              : 'border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
                          )}
                        >
                          <input
                            type="radio"
                            name="display-density"
                            value={mode}
                            checked={active}
                            onChange={() => updatePreferences({ density: mode })}
                            className="accent-[var(--accent-primary)]"
                          />
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {DENSITY_LABELS[mode]}
                          </span>
                          <span className="ml-auto text-xs text-[var(--text-muted)] fp-numeric">
                            {metrics.rowHeight}px rows
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p id="settings-density-help" className="text-xs text-[var(--text-muted)] mt-2">
                    Controls row height and padding across every grid, table, and report.
                  </p>
                </fieldset>
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="users">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[var(--text-primary)]">User Accounts</h3>
                <Button size="sm">Invite User</Button>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 rounded overflow-hidden">
                <table className="w-full text-sm" aria-label="User roles and permissions">
                  <caption className="sr-only">
                    User roles and permissions showing role name, description, and member count
                  </caption>
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left">
                        Name
                      </th>
                      <th scope="col" className="px-4 py-2 text-left">
                        Email
                      </th>
                      <th scope="col" className="px-4 py-2 text-left">
                        Role
                      </th>
                      <th scope="col" className="px-4 py-2 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="px-4 py-3 text-white">System Admin</td>
                      <td className="px-4 py-3 text-slate-400">admin@local.host</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs">
                          Admin
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="data">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-2 text-[var(--text-primary)] mb-2">
                  <Download className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold">Export Backup</h3>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Generate a portable JSON file containing all your local records, settings, and
                  imported data.
                </p>
                <Button onClick={handleExport} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Backup
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-2 text-[var(--text-primary)] mb-2">
                  <Upload className="w-5 h-5 text-green-400" />
                  <h3 className="font-bold">Restore Backup</h3>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Import a previously exported JSON file.{' '}
                  <strong>This will merge with existing data.</strong>
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Button variant="secondary" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Backup File
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-2 text-[var(--text-primary)] mb-2">
                  <Plug className="w-5 h-5 text-violet-400" />
                  <h3 className="font-bold">Integrations</h3>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Connect external systems — QuickBooks, Xero, NetSuite, Sage, Dynamics 365,
                  Salesforce, Stripe, Plaid, and Slack — to bring financial data into FinPlan Pro.
                </p>
                <Link to="/settings/integrations" className="block">
                  <Button className="w-full">
                    <Plug className="w-4 h-4 mr-2" />
                    Manage Integrations
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-red-500/20 bg-red-500/5">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-red-400 flex items-center">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Danger Zone
                  </h3>
                  <p className="text-sm text-slate-400">
                    Completely wipe all locally stored data. This action is irreversible.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="text-red-600 hover:bg-red-500/10 hover:text-red-400 border border-red-500/20"
                >
                  Reset Application
                </Button>
              </CardContent>
            </Card>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
