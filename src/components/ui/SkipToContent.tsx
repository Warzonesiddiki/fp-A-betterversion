import { useTranslation } from 'react-i18next';

export interface SkipToContentProps {
  /** CSS id of the target landmark element. Defaults to 'main-content'. */
  targetId?: string;
}

/**
 * WCAG 2.1 AA skip-navigation link. Visually hidden until focused via keyboard.
 * Allows keyboard/screen-reader users to bypass repeated navigation blocks
 * and jump directly to the main content landmark.
 *
 * Tab order (W-A11Y-001 m-minor): deliberately NO tabIndex attribute. A native
 * `<a href>` is already focusable via Tab, so it works as the first stop for
 * keyboard users (WCAG 2.4.1 Bypass Blocks) without pinning anything extra
 * into the tab order; the sr-only → focus:not-sr-only pattern keeps it
 * invisible to pointer users, so it never disrupts mouse flow. Do not add
 * tabIndex={-1} (that would remove it from keyboard reach) or tabIndex={0}
 * (redundant for an anchor with href).
 */
export function SkipToContent({ targetId = 'main-content' }: SkipToContentProps) {
  const { t } = useTranslation();

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[var(--accent-primary)] focus:text-[var(--text-on-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      {t('accessibility.skipToContent', 'Skip to main content')}
    </a>
  );
}
