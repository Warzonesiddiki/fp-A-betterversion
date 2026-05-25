import { Outlet, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { Sidebar } from './Sidebar';
import Navbar from './Navbar';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { useFocusManagement } from '@/hooks/useFocusManagement';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTranslation } from 'react-i18next';
import { getLocaleDirection } from '@/utils/localeFormatting';
import type { SupportedLocale } from '@/utils/localeFormatting';
import type { CommandItem } from '@/components/ui/CommandPalette';
import { useMemo } from 'react';
export default function AppLayout() {
  const { mobileSidebarOpen, closeMobileSidebar, commandPaletteOpen, toggleCommandPalette } =
    useUIStore();
  const { mainContentRef } = useFocusManagement();
  const { i18n } = useTranslation();
  const dir = getLocaleDirection((i18n.language?.split('-')[0] ?? 'en') as SupportedLocale);
  const navigate = useNavigate();
  const commandItems: CommandItem[] = useMemo(
    () => [
      {
        id: 'dashboard',
        label: 'Go to Dashboard',
        category: 'Navigation',
        shortcut: 'Ctrl+1',
        onSelect: () => navigate('/'),
      },
      {
        id: 'budgets',
        label: 'Go to Budgets',
        category: 'Navigation',
        shortcut: 'Ctrl+2',
        onSelect: () => navigate('/budgets'),
      },
      {
        id: 'forecasts',
        label: 'Go to Forecasts',
        category: 'Navigation',
        shortcut: 'Ctrl+3',
        onSelect: () => navigate('/forecasts'),
      },
      {
        id: 'scenarios',
        label: 'Go to Scenarios',
        category: 'Navigation',
        shortcut: 'Ctrl+4',
        onSelect: () => navigate('/scenarios'),
      },
      {
        id: 'reports',
        label: 'Go to Reports',
        category: 'Navigation',
        shortcut: 'Ctrl+5',
        onSelect: () => navigate('/reports'),
      },
      {
        id: 'consolidation',
        label: 'Go to Consolidation',
        category: 'Navigation',
        shortcut: 'Ctrl+6',
        onSelect: () => navigate('/consolidation'),
      },
      {
        id: 'settings',
        label: 'Go to Settings',
        category: 'Navigation',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'collaboration',
        label: 'Go to Collaboration',
        category: 'Navigation',
        onSelect: () => navigate('/collaboration'),
      },
      {
        id: 'gl-explorer',
        label: 'Go to GL Explorer',
        category: 'Data',
        onSelect: () => navigate('/data/gl-explorer'),
      },
      {
        id: 'trial-balance',
        label: 'Go to Trial Balance',
        category: 'Data',
        onSelect: () => navigate('/data/trial-balance'),
      },
      {
        id: 'chart-of-accounts',
        label: 'Go to Chart of Accounts',
        category: 'Data',
        onSelect: () => navigate('/data/chart-of-accounts'),
      },
      {
        id: 'import',
        label: 'Go to Data Import',
        category: 'Data',
        onSelect: () => navigate('/data/import'),
      },
      {
        id: 'approval-queue',
        label: 'Go to Approval Queue',
        category: 'Workflow',
        onSelect: () => navigate('/collaboration/approvals'),
      },
      {
        id: 'fx-rates',
        label: 'Go to FX Rates',
        category: 'Currency',
        onSelect: () => navigate('/currency/fx-rates'),
      },
      {
        id: 'audit-trail',
        label: 'Go to Audit Trail',
        category: 'Compliance',
        onSelect: () => navigate('/audit/trail'),
      },
    ],
    [navigate]
  );
  useKeyboardShortcuts([
    { key: 'k', ctrl: true, handler: toggleCommandPalette, description: 'Open command palette' },
    { key: '/', ctrl: true, handler: toggleCommandPalette, description: 'Open command palette' },
  ]);
  return (
    <div
      className="flex h-screen responsive-root"
      dir={dir}
      style={{ background: 'var(--bg-root)' }}
    >
      {/* Skip Navigation Links — WCAG 2.1 AA bypass blocks */}
      <SkipToContent targetId="main-content" />
      <SkipToContent targetId="main-nav" />
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}
      {/* Sidebar: hidden on mobile, shown as overlay when toggled */}
      <nav id="main-nav" aria-label="Main navigation">
        <div
          className={`
            fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0
            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <Sidebar />
        </div>
      </nav>
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <main
          id="main-content"
          ref={mainContentRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6"
          tabIndex={-1}
          role="main"
          aria-label="Main content"
        >
          <Outlet />
        </main>
      </div>
      <ToastContainer />
      <CommandPalette
        items={commandItems}
        isOpen={commandPaletteOpen}
        onClose={toggleCommandPalette}
      />
    </div>
  );
}
