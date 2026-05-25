import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  LogOut,
  TrendingUp,
  FileBarChart,
  Upload,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useUIStore } from '@/store/uiStore';

const entities = [
  { id: 'ent-1', name: 'US Parent', currency: 'USD' },
  { id: 'ent-2', name: 'UK Subsidiary', currency: 'GBP' },
  { id: 'ent-3', name: 'DE Subsidiary', currency: 'EUR' },
];

export const Navbar = memo(function Navbar() {
  const navigate = useNavigate();
  const { user, activeEntityId, switchEntity } = useAuthStore();
  const { notifications, unreadCount } = useNotificationStore();
  const { openMobileSidebar } = useUIStore();
  const [showEntityMenu, setShowEntityMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const activeEntity = entities.find((e) => e.id === activeEntityId);

  return (
    <header
      className="flex items-center justify-between h-14 px-3 sm:px-4 border-b"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Hamburger menu for mobile */}
        <button
          className="md:hidden p-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          style={{ color: 'var(--text-muted)' }}
          onClick={openMobileSidebar}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="relative">
          <button
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
            onClick={() => setShowEntityMenu(!showEntityMenu)}
            aria-haspopup="listbox"
            aria-expanded={showEntityMenu}
            aria-label="Select entity"
          >
            <span className="truncate max-w-[120px] sm:max-w-none">
              {activeEntity?.name || 'Select Entity'}
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          </button>
          {showEntityMenu && (
            <div
              role="listbox"
              tabIndex={0}
              aria-label="Select entity"
              className="absolute top-full left-0 mt-1 w-48 rounded-md shadow-lg z-50 py-1"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowEntityMenu(false);
              }}
            >
              {entities.map((e) => (
                <button
                  key={e.id}
                  role="option"
                  aria-selected={activeEntityId === e.id}
                  className={`w-full text-left px-4 py-2 text-xs ${activeEntityId === e.id ? 'font-semibold' : ''}`}
                  style={{
                    color:
                      activeEntityId === e.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                  onClick={() => {
                    switchEntity(e.id);
                    setShowEntityMenu(false);
                  }}
                >
                  {e.name}{' '}
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    ({e.currency})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          className="p-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          style={{ color: 'var(--text-muted)' }}
          onClick={() => navigate('/help')}
          aria-label="Search"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="relative">
          <button
            className="p-2 rounded-md transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            aria-label="Create new"
            aria-haspopup="menu"
            aria-expanded={showCreateMenu}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
          {showCreateMenu && (
            <div
              className="absolute top-full right-0 mt-1 w-48 rounded-md shadow-lg z-50 py-1"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <button
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => {
                  navigate('/budgets/create');
                  setShowCreateMenu(false);
                }}
              >
                <FileBarChart className="w-3.5 h-3.5" /> New Budget
              </button>
              <button
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => {
                  navigate('/forecasts/create');
                  setShowCreateMenu(false);
                }}
              >
                <TrendingUp className="w-3.5 h-3.5" /> New Forecast
              </button>
              <button
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => {
                  navigate('/data/gl-upload');
                  setShowCreateMenu(false);
                }}
              >
                <Upload className="w-3.5 h-3.5" /> Upload GL Data
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            className="p-2 rounded-md transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            aria-haspopup="menu"
            aria-expanded={showNotifMenu}
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ background: 'var(--negative)' }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifMenu && (
            <div
              className="absolute top-full right-0 mt-1 w-72 rounded-md shadow-lg z-50 py-2"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <p
                className="px-4 py-1 text-xs font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Notifications
              </p>
              <div className="max-h-64 overflow-y-auto">
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-2 text-xs ${!n.isRead ? '' : ''}`}
                    style={{
                      background: !n.isRead ? 'var(--bg-hover)' : 'transparent',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {n.title}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            className="flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="User menu"
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ background: 'var(--accent-primary)' }}
            >
              {user ? user.firstName[0] + user.lastName[0] : 'U'}
            </div>
            <ChevronDown
              className="w-3 h-3 hidden sm:block"
              style={{ color: 'var(--text-muted)' }}
              aria-hidden="true"
            />
          </button>
          {showUserMenu && (
            <div
              className="absolute top-full right-0 mt-1 w-48 rounded-md shadow-lg z-50 py-1"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {user?.email}
                </p>
              </div>
              <button
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => {
                  navigate('/profile');
                  setShowUserMenu(false);
                }}
              >
                <User className="w-3.5 h-3.5" /> Profile
              </button>
              <button
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => {
                  navigate('/settings');
                  setShowUserMenu(false);
                }}
              >
                <Settings className="w-3.5 h-3.5" /> Settings
              </button>
              <button
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => {
                  navigate('/help');
                  setShowUserMenu(false);
                }}
              >
                <HelpCircle className="w-3.5 h-3.5" /> Help
              </button>
              <div className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs"
                  style={{ color: 'var(--negative)' }}
                  onClick={() => {
                    useAuthStore.getState().logout();
                    setShowUserMenu(false);
                    navigate('/login');
                  }}
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});
Navbar.displayName = 'Navbar';
