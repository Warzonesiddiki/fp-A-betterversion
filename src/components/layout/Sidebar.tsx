import { NavLink, useLocation } from 'react-router-dom';
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
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from '@/context/ThemeContext';

const navItems = [
  {
    section: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/budgets', label: 'Budgets', icon: FileBarChart },
      { path: '/budgets/bva', label: 'Budget vs. Actuals', icon: GitCompareArrows },
      { path: '/forecasts', label: 'Forecasts', icon: TrendingUp },
      { path: '/reports', label: 'Reports', icon: BarChart3 },
      { path: '/analytics', label: 'Analytics', icon: PieChart },
    ],
  },
  {
    section: 'Analysis',
    items: [
      { path: '/variance', label: 'Variance', icon: GitCompareArrows },
      { path: '/scenarios', label: 'Scenarios', icon: FlaskConical },
      { path: '/ai', label: 'AI Analyst', icon: Brain },
    ],
  },
  {
    section: 'Management',
    items: [
      { path: '/data', label: 'Data Management', icon: Database },
      { path: '/collaboration', label: 'Collaboration', icon: MessageSquare },
      { path: '/collaboration/approvals', label: 'Approvals', icon: CheckSquare },
    ],
  },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, closeMobileSidebar } = useUIStore();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

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
              FinPlan Pro
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
          className="md:hidden p-1 rounded-md"
          style={{ color: 'var(--text-muted)' }}
          onClick={closeMobileSidebar}
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 py-3">
        <button
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs transition-colors"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
          }}
          onClick={() => {}}
          aria-label="Quick search (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" aria-hidden="true" />
          {!sidebarCollapsed && <span>Quick search...</span>}
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
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
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
                  <item.icon className="w-4 h-4 flex-shrink-0" />
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
          to="/settings"
          onClick={handleNavClick}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Settings className="w-4 h-4" />
          {!sidebarCollapsed && <span>Settings</span>}
        </NavLink>
        <NavLink
          to="/help"
          onClick={handleNavClick}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <HelpCircle className="w-4 h-4" />
          {!sidebarCollapsed && <span>Help</span>}
        </NavLink>
        <button
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-xs font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="text-base" aria-hidden="true">
            {theme === 'dark' ? '☀️' : '🌙'}
          </span>
          {!sidebarCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          className="hidden md:flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-xs font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          )}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
