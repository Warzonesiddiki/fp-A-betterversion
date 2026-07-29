/**
 * Shared `lucide-react` test double (N-0001).
 *
 * ROOT CAUSE THIS FIXES
 * ---------------------
 * 26 test files mocked `lucide-react` with:
 *
 *     vi.mock('lucide-react', async (importOriginal) => {
 *       const actual = await importOriginal();
 *       return new Proxy(actual, { ... });
 *     });
 *
 * When a test ALSO mocks a large barrel such as `@/engines`, resolving
 * `importOriginal()` for lucide-react (≈1,600 icon modules) inside the mock
 * factory deadlocks Vitest's module resolver: the factory awaits the real
 * module graph while the resolver waits on the in-flight mock registration.
 * The file then produces NO output and hangs forever. That single class of
 * deadlock is what made the full suite non-terminating (audit N-0001,
 * `vitest run` exit 124 at 477/944 files).
 *
 * THE FIX
 * -------
 * Never touch the real module. Synthesize every icon lazily from a Proxy.
 * `ownKeys` + `getOwnPropertyDescriptor` are implemented so Vitest's
 * named-export validation ("No X export is defined on the mock") passes for
 * any icon name a component imports, without enumerating 1,600 names.
 *
 * USAGE
 * -----
 *     vi.mock('lucide-react', () => createLucideMock());
 */
import * as React from 'react';

/** Named exports of lucide-react that are NOT icon components. */
const NON_ICON_EXPORTS = new Set(['createLucideIcon', 'icons', 'default', 'Icon']);

type IconProps = {
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  'aria-hidden'?: boolean | 'true' | 'false';
  'aria-label'?: string;
};

function makeIcon(name: string) {
  const Icon = React.forwardRef<HTMLSpanElement, IconProps>((props, ref) => {
    const { className, 'aria-label': ariaLabel, 'aria-hidden': ariaHidden } = props;
    return React.createElement('span', {
      ref,
      'data-testid': 'mock-icon',
      'data-icon': name,
      className,
      'aria-label': ariaLabel,
      'aria-hidden': ariaHidden ?? (ariaLabel ? undefined : true),
    });
  });
  Icon.displayName = name;
  return Icon;
}

/**
 * Builds the mock module object. Every property access returns a stable
 * (cached) stub component, so `rerender` and identity comparisons behave.
 */
export function createLucideMock(): Record<string | symbol, unknown> {
  const cache = new Map<string, unknown>();

  const resolve = (prop: string): unknown => {
    if (!cache.has(prop)) {
      if (prop === 'createLucideIcon') {
        cache.set(prop, (name: string) => makeIcon(name ?? 'LucideIcon'));
      } else if (prop === 'icons') {
        cache.set(prop, {});
      } else {
        cache.set(prop, makeIcon(prop));
      }
    }
    return cache.get(prop);
  };

  return new Proxy({} as Record<string | symbol, unknown>, {
    get: (_target, prop) => {
      if (prop === '__esModule') return true;
      if (prop === 'then') return undefined; // never look thenable to the loader
      if (typeof prop === 'symbol') return undefined;
      return resolve(prop);
    },
    has: (_target, prop) => {
      if (typeof prop === 'symbol') return false;
      return prop === '__esModule' || true;
    },
    // Vitest validates named exports against ownKeys/descriptors. Reporting
    // the set of icons requested so far is sufficient and avoids enumerating
    // the real barrel (which is exactly what deadlocked).
    ownKeys: () => ['__esModule', ...NON_ICON_EXPORTS, ...cache.keys()],
    getOwnPropertyDescriptor: (_target, prop) => {
      if (typeof prop === 'symbol') return undefined;
      return {
        configurable: true,
        enumerable: true,
        value: prop === '__esModule' ? true : resolve(prop),
      };
    },
  });
}

export default createLucideMock;
