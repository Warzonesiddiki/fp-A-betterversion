import { memo, useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronLeft, ChevronRight, HelpCircle, Search, X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from '@/context/ThemeContext';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { isItemActive, type NavItem, type NavSection } from '@/types/navigation';

function NavItemLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const location = useLocation();
  const active = isItemActive(location.pathname, item.path);
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className="fp-nav-item"
      data-active={active ? 'true' : undefined}
      title={item.label}
    >
      <span className="fp-nav-item__label">{item.label}</span>
    </NavLink>
  );
}

function SidebarSection({
  section,
  expanded,
  collapsed,
  onToggle,
  onNavigate,
}: {
  section: NavSection;
  expanded: boolean;
  /** Icon-rail mode: the visible label is hidden, so the name moves to sr-only. */
  collapsed: boolean;
  onToggle: (id: string) => void;
  onNavigate: () => void;
}) {
  const Icon = section.icon;
  const panelId = `fp-nav-section-${section.id}`;
  return (
    <li className="fp-nav-section">
      <button
        type="button"
        className="fp-nav-section__trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        title={section.label}
        onClick={() => onToggle(section.id)}
      >
        <Icon className="fp-nav-section__icon" aria-hidden="true" />
        {/* W-A11Y-002 M1: collapsed CSS hides `.fp-nav-section__label` with
            display:none, which also deletes the name from the a11y tree.
            Swapping this one span to sr-only keeps exactly one accessible
            name per trigger without touching the stylesheet. */}
        <span className={collapsed ? 'sr-only' : 'fp-nav-section__label'}>{section.label}</span>
        <ChevronDown
          className="fp-nav-section__chevron"
          data-expanded={expanded ? 'true' : undefined}
          aria-hidden="true"
        />
      </button>
      {expanded && (
        <div id={panelId} className="fp-nav-section__panel">
          {section.groups.map((group, index) => (
            <div key={group.label ?? `group-${index}`} className="fp-nav-group">
              {group.label && <p className="fp-nav-group__label">{group.label}</p>}
              <ul className="fp-nav-group__items">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavItemLink item={item} onNavigate={onNavigate} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

export const Sidebar = memo(function Sidebar() {
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar, closeMobileSidebar, toggleCommandPalette } =
    useUIStore();
  const { theme, toggleTheme } = useTheme();
  const { sections, activeSectionId } = useAppNavigation();

  // Only the section owning the current route starts open — 190 destinations
  // expanded at once is a wall, not a navigation rail.
  const [expandedId, setExpandedId] = useState<string | undefined>(activeSectionId);

  // Follow the route when navigation happens from outside the rail (command
  // palette, deep link, breadcrumb) so the open section always matches.
  useEffect(() => {
    if (activeSectionId) setExpandedId(activeSectionId);
  }, [activeSectionId]);

  const handleToggleSection = useCallback(
    (id: string) => {
      // In the icon-only rail there is nowhere to render the section's items,
      // so picking one expands the rail and opens it rather than doing nothing.
      if (sidebarCollapsed) {
        toggleSidebar();
        setExpandedId(id);
        return;
      }
      setExpandedId((current) => (current === id ? undefined : id));
    },
    [sidebarCollapsed, toggleSidebar]
  );

  const handleNavClick = useCallback(() => {
    if (window.innerWidth < 768) closeMobileSidebar();
  }, [closeMobileSidebar]);

  return (
    <aside
      className="fp-sidebar"
      data-collapsed={sidebarCollapsed ? 'true' : undefined}
      aria-label={t('accessibility.skipToNav')}
    >
      <div className="fp-sidebar__brand">
        <div className="fp-sidebar__mark" aria-hidden="true">
          FP
        </div>
        {!sidebarCollapsed && <span className="fp-sidebar__name">{t('app.name')}</span>}
        <button
          type="button"
          className="fp-sidebar__close md:hidden"
          onClick={closeMobileSidebar}
          aria-label={t('accessibility.menuClose')}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="fp-sidebar__search">
        <button
          type="button"
          className="fp-sidebar__search-button"
          onClick={toggleCommandPalette}
          aria-label={t('sidebar.quickSearch')}
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          {!sidebarCollapsed && (
            <>
              <span className="fp-sidebar__search-label">{t('sidebar.quickSearch')}</span>
              <kbd className="fp-sidebar__kbd">Ctrl K</kbd>
            </>
          )}
        </button>
      </div>

      <nav className="fp-sidebar__nav" aria-label="Primary">
        <ul className="fp-sidebar__sections">
          {sections.map((section) => (
            <SidebarSection
              key={section.id}
              section={section}
              expanded={!sidebarCollapsed && expandedId === section.id}
              collapsed={sidebarCollapsed}
              onToggle={handleToggleSection}
              onNavigate={handleNavClick}
            />
          ))}
        </ul>
      </nav>

      <div className="fp-sidebar__footer">
        <NavLink
          to="/help"
          onClick={handleNavClick}
          className="fp-nav-item fp-nav-item--icon"
          title={t('nav.help')}
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          {/* W-A11Y-002 M1: this span used to unmount while collapsed, leaving
              an icon-only link with no accessible name. Keep one text carrier
              mounted; sr-only in the rail. title supplements it for sighted
              keyboard users but never carries the name alone. */}
          <span className={sidebarCollapsed ? 'sr-only' : undefined}>{t('nav.help')}</span>
        </NavLink>
        <button
          type="button"
          className="fp-nav-item fp-nav-item--icon"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode')}
        >
          <span className="text-base leading-none" aria-hidden="true">
            {theme === 'dark' ? '☀️' : '🌙'}
          </span>
          {!sidebarCollapsed && (
            <span>{theme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode')}</span>
          )}
        </button>
        <button
          type="button"
          className="fp-nav-item fp-nav-item--icon hidden md:flex"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? t('accessibility.expand') : t('sidebar.collapse')}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          ) : (
            <ChevronLeft className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          )}
          {!sidebarCollapsed && <span>{t('sidebar.collapse')}</span>}
        </button>
      </div>
    </aside>
  );
});
Sidebar.displayName = 'Sidebar';
