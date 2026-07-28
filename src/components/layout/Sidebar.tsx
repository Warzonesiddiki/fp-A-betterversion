import { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  FileBarChart,
  TrendingUp,
  BarChart3,
  PieChart,
  GitCompareArrows,
  FlaskConical,
  Brain,
  Database,
  MessageSquare,
  CheckSquare,
  Settings,
  Puzzle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Cpu,
  Factory,
  ShoppingCart,
  Landmark,
  Activity,
  Zap,
  Leaf,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from '@/context/ThemeContext';

export const Sidebar = memo(function Sidebar() {
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar, closeMobileSidebar } = useUIStore();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    {
      section: t('sidebar.sections.main'),
      items: [
        { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { path: '/budgets', label: t('nav.budgets'), icon: FileBarChart },
        { path: '/budgets/bva', label: t('nav.bva'), icon: GitCompareArrows },
        { path: '/forecasts', label: t('nav.forecasts'), icon: TrendingUp },
        { path: '/reports', label: t('nav.reports'), icon: BarChart3 },
        { path: '/analytics', label: t('nav.analytics'), icon: PieChart },
        { path: '/analytics/pivot-explorer', label: 'Pivot Explorer', icon: BarChart3 },
      ],
    },
    {
      section: t('sidebar.sections.analysis'),
      items: [
        { path: '/variance', label: t('nav.variance'), icon: GitCompareArrows },
        { path: '/scenarios', label: t('nav.scenarios'), icon: FlaskConical },
        { path: '/ai', label: t('nav.aiAnalyst'), icon: Brain },
      ],
    },
    {
      section: t('sidebar.sections.industries'),
      items: [
        { path: '/saas/arr', label: t('nav.saas'), icon: Cpu },
        { path: '/manufacturing/production', label: t('nav.manufacturing'), icon: Factory },
        { path: '/retail/stores', label: t('nav.retail'), icon: ShoppingCart },
        { path: '/banking/nim', label: t('nav.banking'), icon: Landmark },
        { path: '/healthcare/dashboard', label: t('nav.healthcare'), icon: Activity },
        { path: '/energy/dashboard', label: t('nav.energy'), icon: Zap },
        { path: '/esg/carbon', label: t('nav.esg'), icon: Leaf },
      ],
    },
    {
      section: t('sidebar.sections.management'),
      items: [
        { path: '/data', label: t('nav.dataManagement'), icon: Database },
        { path: '/collaboration', label: t('nav.collaboration'), icon: MessageSquare },
        { path: '/collaboration/approvals', label: t('nav.approvals'), icon: CheckSquare },
      ],
    },
  ];

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

      <nav className="flex-1 overflow-y-auto px-2 space-y-4">
        {navItems.map((section) => (
          <div key={section.section}>
            {!sidebarCollapsed && (
              <p
                className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}
              >
                {section.section}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                      ? 'text-white'
                      : ''
                  }`}
                  style={
                    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                      ? { background: 'var(--accent-primary)' }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div
        className="px-2 py-3 border-t space-y-0.5"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <NavLink
          to="/plugins"
          onClick={handleNavClick}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Puzzle className="w-4 h-4" aria-hidden="true" />
          {!sidebarCollapsed && <span>Plugins</span>}
        </NavLink>
        <NavLink
          to="/settings"
          onClick={handleNavClick}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
          {!sidebarCollapsed && <span>{t('nav.settings')}</span>}
        </NavLink>
        <NavLink
          to="/docs/api"
          onClick={handleNavClick}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          {!sidebarCollapsed && <span>API Reference</span>}
        </NavLink>
        <NavLink
          to="/help"
          onClick={handleNavClick}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          <HelpCircle className="w-4 h-4" aria-hidden="true" />
          {!sidebarCollapsed && <span>{t('nav.help')}</span>}
        </NavLink>
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
