import { useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Command } from 'lucide-react';

/**
 * W0.5 slice 2 — five-pillar top navigation (BLUEPRINT §9.3).
 *
 * Pillars: PLAN / ANALYZE / REPORT / MODEL / ADMIN. Each pillar links to its
 * hub route; the active pillar is derived from the current location prefix.
 * Keyboard model: roving tabindex (ArrowLeft/ArrowRight/Home/End) per
 * WAI-ARIA Authoring Practices for a toolbar-like navigation bar.
 *
 * Tokens only: all colours come from CSS custom properties exposed by
 * src/index.css (`@theme inline` bridge); no hardcoded colors.
 */

export type PillarId = 'plan' | 'analyze' | 'report' | 'model' | 'admin';

export interface PillarDef {
  id: PillarId;
  label: string;
  hubPath: string;
}

export const PILLARS: readonly PillarDef[] = [
  { id: 'plan', label: 'Plan', hubPath: '/dashboard' },
  { id: 'analyze', label: 'Analyze', hubPath: '/analytics' },
  { id: 'report', label: 'Report', hubPath: '/reports' },
  { id: 'model', label: 'Model', hubPath: '/consolidation' },
  { id: 'admin', label: 'Admin', hubPath: '/settings' },
] as const;

export interface PillarNavProps {
  /** Badge counts per pillar id (e.g. pending approvals under Admin). */
  badgeCounts?: Partial<Record<PillarId, number>>;
  /** Called when the user activates the command-palette (⌘K) entry point. */
  onOpenPalette?: () => void;
}

function isActivePillar(pathname: string, hubPath: string): boolean {
  if (pathname === hubPath) return true;
  return pathname.startsWith(`${hubPath}/`);
}

export function PillarNav({ badgeCounts, onOpenPalette }: PillarNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const activeIndex = Math.max(
    0,
    PILLARS.findIndex((p) => isActivePillar(location.pathname, p.hubPath))
  );

  const focusItem = useCallback((index: number) => {
    const clamped = (index + PILLARS.length) % PILLARS.length;
    itemRefs.current[clamped]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          focusItem(index + 1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          focusItem(index - 1);
          break;
        case 'Home':
          event.preventDefault();
          focusItem(0);
          break;
        case 'End':
          event.preventDefault();
          focusItem(PILLARS.length - 1);
          break;
        default:
          break;
      }
    },
    [focusItem]
  );

  return (
    <nav aria-label="Pillars" className="flex items-center gap-1" data-testid="pillar-nav">
      {PILLARS.map((pillar, index) => {
        const active = index === activeIndex;
        const count = badgeCounts?.[pillar.id];
        return (
          <a
            key={pillar.id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            href={pillar.hubPath}
            onClick={(e) => {
              e.preventDefault();
              navigate(pillar.hubPath);
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabIndex={active ? 0 : -1}
            aria-current={active ? 'page' : undefined}
            data-pillar={pillar.id}
            data-active={active || undefined}
            data-testid={`pillar-${pillar.id}`}
            className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
              active ? 'font-semibold' : ''
            }`}
            style={{
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              background: active ? 'var(--bg-elevated)' : 'transparent',
              borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
            }}
          >
            {pillar.label}
            {count !== undefined && count > 0 && (
              <span
                data-testid={`pillar-badge-${pillar.id}`}
                aria-label={`${count} items`}
                className="inline-flex min-w-[1.25rem] justify-center rounded-full px-1 py-0.5 text-[10px] leading-none"
                style={{
                  background: 'var(--accent-primary)',
                  color: 'var(--text-on-accent)',
                }}
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </a>
        );
      })}
      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Open command palette"
        data-testid="pillar-nav-palette"
        className="ml-2 flex items-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2"
        style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
      >
        <Command className="h-3.5 w-3.5" aria-hidden="true" />
        <kbd style={{ fontFamily: 'inherit' }}>K</kbd>
      </button>
    </nav>
  );
}
