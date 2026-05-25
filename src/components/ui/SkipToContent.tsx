import { useTranslation } from 'react-i18next';

export interface SkipToContentProps {
  /** CSS id of the target landmark element. Defaults to 'main-content'. */
  targetId?: string;
}

/**
 * WCAG 2.1 AA skip-navigation link. Visually hidden until focused via keyboard.
 * Allows keyboard/screen-reader users to bypass repeated navigation blocks
 * and jump directly to the main content landmark.
 */
export function SkipToContent({ targetId = 'main-content' }: SkipToContentProps) {
  const { t } = useTranslation();

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      style={{
        background: 'var(--accent-primary)',
        color: 'var(--text-on-accent, #fff)',
      }}
    >
      {t('accessibility.skipToContent', 'Skip to main content')}
    </a>
  );
}
