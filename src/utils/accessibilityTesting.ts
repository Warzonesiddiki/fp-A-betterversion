/**
 * Accessibility Testing Utilities
 * WCAG 2.1 AA compliance checking
 */

interface A11yIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  element?: string;
  line?: number;
}

interface A11yReport {
  score: number;
  issues: A11yIssue[];
  passed: number;
  failed: number;
  warnings: number;
}

export class AccessibilityTesting {
  /**
   * Check color contrast ratio
   */
  static checkContrast(
    foreground: string,
    background: string
  ): { ratio: number; passes: boolean; level: string } {
    const fgLum = this.getLuminance(foreground);
    const bgLum = this.getLuminance(background);
    const lighter = Math.max(fgLum, bgLum);
    const darker = Math.min(fgLum, bgLum);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    let level = 'AAA';
    let passes = true;
    if (ratio < 4.5) {
      level = 'AA';
      passes = true;
    }
    if (ratio < 3) {
      level = 'FAIL';
      passes = false;
    }

    return { ratio, passes, level };
  }

  /**
   * Check ARIA attributes on element
   */
  static checkAria(element: HTMLElement): A11yIssue[] {
    const issues: A11yIssue[] = [];
    const tag = element.tagName.toLowerCase();
    const role = element.getAttribute('role');

    // Interactive elements need accessible names
    if (['button', 'a', 'input', 'select', 'textarea'].includes(tag) || role === 'button') {
      const name = element.getAttribute('aria-label') || element.textContent?.trim();
      if (!name) {
        issues.push({
          type: 'error',
          rule: 'aria-name',
          message: `${tag} missing accessible name`,
          element: tag,
        });
      }
    }

    // Images need alt text
    if (tag === 'img' && !element.getAttribute('alt')) {
      issues.push({
        type: 'error',
        rule: 'img-alt',
        message: 'Image missing alt attribute',
        element: 'img',
      });
    }

    // Form inputs need labels
    if (['input', 'select', 'textarea'].includes(tag)) {
      const id = element.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel =
        element.getAttribute('aria-label') || element.getAttribute('aria-labelledby');
      if (!hasLabel && !hasAriaLabel) {
        issues.push({
          type: 'error',
          rule: 'form-label',
          message: `${tag} missing label`,
          element: tag,
        });
      }
    }

    return issues;
  }

  /**
   * Check keyboard navigation
   */
  static checkKeyboardNavigation(): A11yIssue[] {
    const issues: A11yIssue[] = [];
    const focusable = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Check for positive tabindex (anti-pattern)
    focusable.forEach((el) => {
      const tabindex = el.getAttribute('tabindex');
      if (tabindex && parseInt(tabindex) > 0) {
        issues.push({
          type: 'warning',
          rule: 'tabindex-positive',
          message: `Positive tabindex (${tabindex}) found on ${el.tagName.toLowerCase()}`,
          element: el.tagName.toLowerCase(),
        });
      }
    });

    return issues;
  }

  /**
   * Run full accessibility audit on page
   */
  static auditPage(): A11yReport {
    const issues: A11yIssue[] = [];

    // Check all interactive elements
    const interactive = document.querySelectorAll('button, a, input, select, textarea');
    interactive.forEach((el) => {
      issues.push(...this.checkAria(el as HTMLElement));
    });

    // Check keyboard navigation
    issues.push(...this.checkKeyboardNavigation());

    // Check skip links
    const skipLink = document.querySelector('a[href="#main-content"]');
    if (!skipLink) {
      issues.push({ type: 'warning', rule: 'skip-link', message: 'No skip-to-content link found' });
    }

    // Check heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach((h) => {
      const level = parseInt(h.tagName[1]);
      if (level > lastLevel + 1) {
        issues.push({
          type: 'warning',
          rule: 'heading-hierarchy',
          message: `Heading h${level} follows h${lastLevel} (skipped level)`,
        });
      }
      lastLevel = level;
    });

    const passed = issues.filter((i) => i.type === 'error').length === 0 ? 1 : 0;
    const failed = issues.filter((i) => i.type === 'error').length;
    const warnings = issues.filter((i) => i.type === 'warning').length;

    return {
      score: Math.max(0, 100 - failed * 10 - warnings * 2),
      issues,
      passed,
      failed,
      warnings,
    };
  }

  // Private helpers

  private static getLuminance(color: string): number {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }
}
