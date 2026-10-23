// =============================================================================
// PDF RUNTIME LOADER
// =============================================================================
// Historically the export engines read a `window.jsPDF` global that nothing in
// the application ever assigned, so every PDF export threw
// "jsPDF not loaded — include jsPDF script before exporting" at runtime.
//
// This module owns jsPDF acquisition for the whole app:
//   1. If a host page (or a test) installed `window.jsPDF`, that wins — this
//      preserves the existing test doubles and any embed scenario.
//   2. Otherwise jsPDF is dynamically imported from the bundled dependency and
//      the `jspdf-autotable` plugin is applied once, so `doc.autoTable(...)`
//      used by ExportEngine / ProfessionalExportEngine / ExportTemplateEngine
//      is available.
//
// The import is dynamic so jsPDF (~600KB) stays in the lazy `pdf-vendor` chunk
// and never lands in the initial bundle.
// =============================================================================

/** Minimal structural type for a jsPDF constructor. */
export type JsPDFConstructorLike = new (options?: Record<string, unknown>) => unknown;

interface WindowWithJsPDF {
  jsPDF?: JsPDFConstructorLike;
}

let cached: JsPDFConstructorLike | null = null;
let inflight: Promise<JsPDFConstructorLike> | null = null;

function windowCtor(): JsPDFConstructorLike | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as WindowWithJsPDF).jsPDF;
}

/**
 * Resolve the jsPDF constructor, loading the bundled module (plus the autoTable
 * plugin) on first use. Safe to call concurrently — the load is de-duplicated.
 */
export async function loadJsPDF(): Promise<JsPDFConstructorLike> {
  const injected = windowCtor();
  if (injected) return injected;
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    // applyPlugin augments jsPDF.API with `autoTable`, `lastAutoTable`, etc.
    const applyPlugin = (autoTableModule as { applyPlugin?: (ctor: unknown) => void }).applyPlugin;
    if (typeof applyPlugin === 'function') applyPlugin(jsPDF);
    cached = jsPDF as unknown as JsPDFConstructorLike;
    return cached;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/**
 * Synchronous accessor for code paths that cannot await. Returns `null` until
 * {@link loadJsPDF} has resolved at least once (or a host injected the global).
 */
export function getLoadedJsPDF(): JsPDFConstructorLike | null {
  return windowCtor() ?? cached;
}

/** Test-only: drop the memoized constructor. */
export function resetPdfRuntime(): void {
  cached = null;
  inflight = null;
}
