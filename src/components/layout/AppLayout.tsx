import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { FinancialContextBar, type FinancialEntityOption } from './FinancialContextBar';
import { PillarNav } from './PillarNav';
import { DurabilityBanner } from './DurabilityBanner';
import { HelpPanel } from './HelpPanel';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { useFocusManagement } from '@/hooks/useFocusManagement';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTranslation } from 'react-i18next';
import { getLocaleDirection } from '@/utils/localeFormatting';
import type { SupportedLocale } from '@/utils/localeFormatting';
import type { CommandItem } from '@/components/ui/CommandPalette';
import { useEffect, useMemo } from 'react';
import { useCollaborationSetup } from '@/hooks/useCollaborationInit';
import { useFinancialContextStore } from '@/store/financialContextStore';
import { financialContextFromParams, serializeFinancialContext } from '@/types/financialContext';
import { filterNavItemsByRole } from '@/hooks/useAppNavigation';
import { NAV_SECTIONS } from '@/types/navigation';
import { useAuthStore } from '@/store/authStore';
import { useApplyDensity } from '@/hooks/useDensity';

// Draft entity options until the server master-data contract is connected
// (F-04 / P-01). The context bar never authorizes data access client-side.
const DRAFT_ENTITY_OPTIONS: readonly FinancialEntityOption[] = [
  { id: 'ent-1', label: 'US Parent', currency: 'USD' },
  { id: 'ent-2', label: 'UK Subsidiary', currency: 'GBP' },
  { id: 'ent-3', label: 'DE Subsidiary', currency: 'EUR' },
];
export default function AppLayout() {
  const {
    mobileSidebarOpen,
    closeMobileSidebar,
    commandPaletteOpen,
    toggleCommandPalette,
    helpPanelOpen,
    toggleHelpPanel,
  } = useUIStore();
  // UI-04: mirror the density preference onto <html data-density> so both
  // AG Grid and .fp-table resolve their row metrics from one source.
  useApplyDensity();

  const { mainContentRef } = useFocusManagement();
  const { i18n } = useTranslation();
  const dir = getLocaleDirection((i18n.language?.split('-')[0] ?? 'en') as SupportedLocale);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // F-03: hydrate the financial context from the URL once; then keep the URL
  // in sync with store changes (deterministic canonical serialization).
  const { context, setContext } = useFinancialContextStore();
  const activeRole = useAuthStore((s) => s.user?.role ?? 'Viewer');

  useEffect(() => {
    const patch = financialContextFromParams(searchParams);
    if (Object.keys(patch).length > 0) {
      setContext(patch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const serializedContext = useMemo(() => serializeFinancialContext(context), [context]);

  useEffect(() => {
    const current = searchParams.toString();
    if (serializedContext !== current) {
      setSearchParams(serializedContext, { replace: true });
    }
  }, [serializedContext, searchParams, setSearchParams]);

  // Initialize real-time collaboration
  useCollaborationSetup();
  // Every destination in the sidebar is also a command, from the same
  // manifest — the palette can never drift out of sync with the rail, and all
  // 190 screens are keyboard-reachable rather than the 15 once hardcoded here.
  const commandItems: CommandItem[] = useMemo(
    () =>
      NAV_SECTIONS.flatMap((section) =>
        section.groups.flatMap((group) =>
          group.items
            .filter((item) => !item.hidden)
            .map((item) => ({
              id: item.path,
              label: item.label,
              description: item.path,
              category: section.label,
              permission: item.permission,
              onSelect: () => navigate(item.path),
            }))
        )
      ),
    [navigate]
  );
  // F-03 AC5: command palette is permission-filtered by role.
  const permittedCommandItems = useMemo(
    () => filterNavItemsByRole(commandItems, activeRole),
    [commandItems, activeRole]
  );
  useKeyboardShortcuts([
    { key: 'k', ctrl: true, handler: toggleCommandPalette, description: 'Open command palette' },
    { key: '/', ctrl: true, handler: toggleCommandPalette, description: 'Open command palette' },
    {
      key: 'F1',
      handler: () => toggleHelpPanel?.(),
      description: 'Open context-sensitive help',
    },
    {
      key: '?',
      shift: true,
      handler: () => toggleHelpPanel?.(),
      description: 'Open context-sensitive help',
    },
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
        {/* W0.5 slice 3: five-pillar top navigation (BLUEPRINT §9.3). The
            legacy sidebar stays: it feeds NAV_SECTIONS into the ⌘K palette,
            serves as the mobile nav surface, and still reaches routes that
            have no pillar-hub view yet. */}
        <div
          className="flex items-center justify-center border-b px-3 py-1"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <PillarNav onOpenPalette={toggleCommandPalette} />
        </div>
        <FinancialContextBar entities={DRAFT_ENTITY_OPTIONS} />
        <DurabilityBanner />
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
      <HelpPanel
        pathname={location.pathname}
        isOpen={!!helpPanelOpen}
        onClose={() => toggleHelpPanel?.()}
      />
      <CommandPalette
        items={permittedCommandItems}
        isOpen={commandPaletteOpen}
        onClose={toggleCommandPalette}
      />
    </div>
  );
}
