const CRASH_LOG_KEY = 'finplan_crash_logs';
const MAX_LOGS = 50;

interface CrashLog {
  id: string;
  timestamp: string;
  type: 'error' | 'unhandledrejection' | 'warning';
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  url?: string;
  component?: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStoredLogs(): CrashLog[] {
  try {
    const raw = localStorage.getItem(CRASH_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeLog(log: CrashLog): void {
  const logs = getStoredLogs();
  logs.push(log);
  // Keep only the most recent logs
  while (logs.length > MAX_LOGS) {
    logs.shift();
  }
  try {
    localStorage.setItem(CRASH_LOG_KEY, JSON.stringify(logs));
  } catch {
    // Storage full — drop oldest silently
    while (logs.length > 10) {
      logs.shift();
    }
    try {
      localStorage.setItem(CRASH_LOG_KEY, JSON.stringify(logs));
    } catch {
      // Last resort — give up
    }
  }
}

function handleError(event: ErrorEvent): void {
  // Prevent default browser error handling
  event.preventDefault();

  const log: CrashLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: 'error',
    message: event.message || String(event.error),
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error instanceof Error ? event.error.stack : undefined,
  };

  storeLog(log);

  // Log to console for dev tools
  console.error('[CrashReporter] Captured error:', log.message, log);
}

function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  event.preventDefault();

  const reason = event.reason;
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : JSON.stringify(reason);

  const log: CrashLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: 'unhandledrejection',
    message,
    stack: reason instanceof Error ? reason.stack : undefined,
  };

  storeLog(log);

  console.error('[CrashReporter] Captured unhandled rejection:', log.message, log);
}

/**
 * Initialize the JS crash reporter.
 * Sets up global error handlers to capture uncaught errors
 * and unhandled promise rejections. Logs are persisted to
 * localStorage for offline-first debugging.
 */
export function initCrashReporter(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  console.log('[CrashReporter] Initialized. Logging to localStorage.');
}

/**
 * Retrieve stored crash logs.
 * Useful for support/debugging views.
 */
export function getCrashLogs(): readonly CrashLog[] {
  return getStoredLogs();
}

/**
 * Clear all stored crash logs.
 */
export function clearCrashLogs(): void {
  localStorage.removeItem(CRASH_LOG_KEY);
}

/**
 * Export crash logs as a JSON string.
 */
export function exportCrashLogs(): string {
  return JSON.stringify(getStoredLogs(), null, 2);
}
