import { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HelpCircle, ChevronLeft, ChevronRight, Search, X, BookOpen } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from '@/context/ThemeContext';
import { usePillarNavigation } from '@/hooks/usePillarNavigation';
import { isItemActive, type PillarNavItem } from '@/types/navigation';

function NavItemLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: PillarNavItem;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const location = useLocation();
  const active = isItemActive(location.pathname, item.path);
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
        active ? 'text-white' : ''
      }`}
      style={active ? { background: 'var(--accent-primary)' } : { color: 'var(--text-secondary)' }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

export const Sidebar = memo(function Sidebar() {
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar, closeMobileSidebar } = useUIStore();
  const { theme, toggleTheme } = useTheme();
  const { pillars, legacyItems } = usePillarNavigation();

  const handleNavClick = () => {
    // Close mobile sidebar when navigating
    if (window.innerWidth < 768) {
      closeMobileSidebar();
    }
  };

  return (
    <aside
      className={`flex flex-col border-r transition-all duration-300 flex-shrink-0 h-full`}
      style={{
        width: sidebarCollapsed ? 64 : 240,
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div
        className="flex items-center gap-3 px-4 h-14 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'var(--accent-primary)' }}
            >
              <span className="text-white text-xs font-bold">FP</span>
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('app.name')}
            </span>
          </div>
        )}
        {sidebarCollapsed && (
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center mx-auto"
            style={{ background: 'var(--accent-primary)' }}
          >
            <span className="text-white text-xs font-bold">FP</span>
          </div>
        )}
        {/* Close button on mobile */}
        <button
          className="md:hidden p-1 rounded-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          style={{ color: 'var(--text-muted)' }}
          onClick={closeMobileSidebar}
          aria-label={t('accessibility.menuClose')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 py-3">
        <button
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
          }}
          onClick={() => {}}
          aria-label={t('sidebar.quickSearch')}
        >
          <Search className="w-3.5 h-3.5" aria-hidden="true" />
          {!sidebarCollapsed && <span>{t('sidebar.quickSearch')}</span>}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-4" aria-label="Primary">
        {pillars.map((pillar) =>
          pillar.items.length === 0 ? null : (
            <div key={pillar.id}>
              {!sidebarCollapsed && (
                <p
                  className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {pillar.label}
                </p>
              )}
              <div className="space-y-0.5">
                {pillar.items.map((item) => (
                  <NavItemLink
                    key={item.path}
                    item={item}
                    collapsed={sidebarCollapsed}
                    onNavigate={handleNavClick}
                  />
                ))}
              </div>
            </div>
          )
        )}

        {/* Legacy / experimental module group — explicitly labeled, never a
            supported-breadth claim (PRD E1.1 AC4). */}
        {legacyItems.length > 0 && (
          <div>
            {!sidebarCollapsed && (
              <p
                className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}
              >
                Legacy modules
              </p>
            )}
            <div className="space-y-0.5">
              {legacyItems.map((item) => (
                <NavItemLink
                  key={item.path}
                  item={item}
                  collapsed={sidebarCollapsed}
                  onNavigate={handleNavClick}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      <div
        className="px-2 py-3 border-t space-y-0.5"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <NavItemLink
          item={{ path: '/plugins', label: 'Plugins', icon: BookOpen }}
          collapsed={sidebarCollapsed}
          onNavigate={handleNavClick}
        />
        <NavItemLink
          item={{ path: '/docs/api', label: 'API Reference', icon: BookOpen }}
          collapsed={sidebarCollapsed}
          onNavigate={handleNavClick}
        />
        <NavItemLink
          item={{ path: '/help', label: t('nav.help'), icon: HelpCircle }}
          collapsed={sidebarCollapsed}
          onNavigate={handleNavClick}
        />
        <button
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          style={{ color: 'var(--text-secondary)' }}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode')}
        >
          <span className="text-base" aria-hidden="true">
            {theme === 'dark' ? '☀️' : '🌙'}
          </span>
          {!sidebarCollapsed && (
            <span>{theme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode')}</span>
          )}
        </button>
        <button
          className="hidden md:flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          style={{ color: 'var(--text-secondary)' }}
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? t('accessibility.expand') : t('sidebar.collapse')}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          )}
          {!sidebarCollapsed && <span>{t('sidebar.collapse')}</span>}
        </button>
      </div>
    </aside>
  );
});
Sidebar.displayName = 'Sidebar';
